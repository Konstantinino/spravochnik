import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import type { DepartmentId, GuideItem, ImageDisplayMap } from '../types'
import { getImageScaleForTopicImage, normalizeImageDisplayKey } from '../lib/imageDisplay'
import { formatSharedImageMarkdown, formatTopicMarkdownLink } from '../lib/markdown'

type ImgMenuState = {
  x: number
  y: number
  markdownKey: string
  resolvedSrc: string
  downloadSrc: string
}

type TopicMenuState = {
  x: number
  y: number
}

export type ViewerOverlayHandle = {
  openImageMenu: (
    e: MouseEvent,
    markdownKey: string,
    displaySrc: string,
    downloadSrc: string,
  ) => void
  openTopicMenu: (e: MouseEvent<HTMLButtonElement>) => void
  openLightbox: (resolvedSrc: string) => void
  closeMenus: () => void
  closeAll: () => void
  closeLightbox: () => void
  hasLightbox: () => boolean
  hasContextMenu: () => boolean
}

type ScaleEditorRequest = {
  markdownKey: string
  left: number
  top: number
  draftScale: number
}

interface ViewerOverlaysProps {
  canEdit: boolean
  topic: GuideItem
  departmentId: DepartmentId
  localDisplay: ImageDisplayMap | undefined
  onRequestScaleEditor: (payload: ScaleEditorRequest) => void
  onDownloadImage: (resolvedSrc: string, suggestedName?: string) => void
}

export const ViewerOverlays = forwardRef<ViewerOverlayHandle, ViewerOverlaysProps>(
  function ViewerOverlays(
    { canEdit, topic, departmentId, localDisplay, onRequestScaleEditor, onDownloadImage },
    ref,
  ) {
    const [imgMenu, setImgMenu] = useState<ImgMenuState | null>(null)
    const [topicMenu, setTopicMenu] = useState<TopicMenuState | null>(null)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
    const imgMenuRef = useRef<HTMLDivElement>(null)
    const topicMenuRef = useRef<HTMLDivElement>(null)

    const closeMenus = useCallback(() => {
      setImgMenu(null)
      setTopicMenu(null)
    }, [])

    const closeAll = useCallback(() => {
      closeMenus()
      setLightboxSrc(null)
    }, [closeMenus])

    const closeLightbox = useCallback(() => {
      setLightboxSrc(null)
    }, [])

    useImperativeHandle(
      ref,
      (): ViewerOverlayHandle => ({
        openImageMenu(e, markdownKey, displaySrc, downloadSrc) {
          e.preventDefault()
          e.stopPropagation()
          setTopicMenu(null)
          setImgMenu({
            x: e.clientX,
            y: e.clientY,
            markdownKey: normalizeImageDisplayKey(markdownKey),
            resolvedSrc: displaySrc,
            downloadSrc,
          })
        },
        openTopicMenu(e) {
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          setImgMenu(null)
          setTopicMenu((prev) =>
            prev
              ? null
              : {
                  x: Math.min(rect.left, window.innerWidth - 230),
                  y: rect.bottom + 4,
                },
          )
        },
        openLightbox(resolvedSrc) {
          setLightboxSrc(resolvedSrc)
          setImgMenu(null)
        },
        closeMenus,
        closeAll,
        closeLightbox,
        hasLightbox: () => lightboxSrc != null,
        hasContextMenu: () => imgMenu != null || topicMenu != null,
      }),
      [closeMenus, closeAll, closeLightbox, lightboxSrc, imgMenu, topicMenu],
    )

    useEffect(() => {
      if (!imgMenu && !topicMenu) return
      function close(e: globalThis.MouseEvent) {
        if (e.button !== 0) return
        const target = e.target
        if (target instanceof Node) {
          if (imgMenuRef.current?.contains(target)) return
          if (topicMenuRef.current?.contains(target)) return
        }
        setImgMenu(null)
        setTopicMenu(null)
      }
      window.addEventListener('mousedown', close)
      return () => window.removeEventListener('mousedown', close)
    }, [imgMenu, topicMenu])

    async function copyImageLink(rawSrc: string) {
      setImgMenu(null)
      const canonical = /^https?:\/\//i.test(rawSrc.trim())
        ? rawSrc.trim()
        : await window.spravochnik.resolveImageStorageRef({
            departmentId,
            ref: rawSrc,
            contextTopicId: topic.id,
          })
      const snippet = formatSharedImageMarkdown(canonical)
      try {
        await navigator.clipboard.writeText(snippet)
      } catch {
        const el = document.createElement('textarea')
        el.value = snippet
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        el.remove()
      }
    }

    async function copyTopicLink() {
      setTopicMenu(null)
      const snippet = formatTopicMarkdownLink(topic.id, topic.question)
      try {
        await navigator.clipboard.writeText(snippet)
      } catch {
        const el = document.createElement('textarea')
        el.value = snippet
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        el.remove()
      }
    }

    return (
      <>
        {topicMenu && (
          <div
            ref={topicMenuRef}
            className="image-ctx-menu"
            style={{ left: topicMenu.x, top: topicMenu.y }}
            role="menu"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="image-ctx-menu__item"
              role="menuitem"
              onClick={() => void copyTopicLink()}
            >
              Скопировать ссылку
            </button>
          </div>
        )}

        {imgMenu && (
          <div
            ref={imgMenuRef}
            className="image-ctx-menu"
            style={{ left: imgMenu.x, top: imgMenu.y }}
            role="menu"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {canEdit && (
              <button
                type="button"
                className="image-ctx-menu__item"
                role="menuitem"
                onClick={() => {
                  const scale = getImageScaleForTopicImage(
                    localDisplay,
                    imgMenu.markdownKey,
                    topic.id,
                    departmentId,
                  )
                  onRequestScaleEditor({
                    markdownKey: imgMenu.markdownKey,
                    left: Math.min(imgMenu.x, window.innerWidth - 280),
                    top: Math.min(imgMenu.y, window.innerHeight - 160),
                    draftScale: scale,
                  })
                  setImgMenu(null)
                }}
              >
                Регулировка размера
              </button>
            )}
            <button
              type="button"
              className="image-ctx-menu__item"
              role="menuitem"
              onClick={() => void copyImageLink(imgMenu.markdownKey)}
            >
              Скопировать ссылку на фото
            </button>
            <button
              type="button"
              className="image-ctx-menu__item"
              role="menuitem"
              onClick={() => {
                setLightboxSrc(imgMenu.resolvedSrc)
                setImgMenu(null)
              }}
            >
              Открыть фото на весь экран
            </button>
            <button
              type="button"
              className="image-ctx-menu__item"
              role="menuitem"
              onClick={() => {
                setImgMenu(null)
                onDownloadImage(imgMenu.downloadSrc)
              }}
            >
              Скачать
            </button>
          </div>
        )}

        {lightboxSrc && (
          <div
            className="image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Просмотр фото"
            onClick={() => setLightboxSrc(null)}
          >
            <button
              type="button"
              className="image-lightbox__close"
              onClick={() => setLightboxSrc(null)}
              aria-label="Закрыть"
            >
              ✕
            </button>
            <img
              src={lightboxSrc}
              alt=""
              className="image-lightbox__img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    )
  },
)
