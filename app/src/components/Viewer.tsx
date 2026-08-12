import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DepartmentId, GuideItem, ImageDisplayMap, SupportParty } from '../types'
import { SUPPORT_PARTIES, SUPPORT_PARTY_LABELS } from '../types'
import { filterItemsByParty, getChildren, getItemParty } from '../lib/data'
import { applyFindHighlights, clearFindHighlights } from '../lib/findHighlight'
import {
  IMAGE_SCALE_DEFAULT,
  getImageScale,
  normalizeImageDisplayKey,
  withImageScale,
} from '../lib/imageDisplay'
import { mediaSrcFromMarkdownUrl, isAllowedMarkdownImageSrc } from '../lib/markdown'
import { focusCursor, insertAtCursor } from '../lib/textInsert'
import { ImageScaleDialog } from './ImageScaleDialog'
import { ParentTopicField } from './ParentTopicField'

interface ViewerProps {
  item: GuideItem | null
  items: GuideItem[]
  departmentId: DepartmentId
  canEdit: boolean
  isAdmin: boolean
  onSelect: (id: number) => void
  onSave: (payload: {
    question: string
    answer: string
    parent_id: number | null
    party?: SupportParty
  }) => Promise<void>
  onSaveImageDisplay: (image_display: ImageDisplayMap | undefined) => Promise<void>
  onDelete: () => Promise<void>
  onToggleArchive?: () => void
  onAddSubtopic: () => void
}

type ImgMenuState = {
  x: number
  y: number
  markdownKey: string
  resolvedSrc: string
}

type ScaleEditorState = {
  markdownKey: string
  left: number
  top: number
  draftScale: number
}

export function Viewer({
  item,
  items,
  departmentId,
  canEdit,
  isAdmin,
  onSelect,
  onSave,
  onSaveImageDisplay,
  onDelete,
  onToggleArchive,
  onAddSubtopic,
}: ViewerProps) {
  const [editing, setEditing] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [parentId, setParentId] = useState<number | null>(null)
  const [attachParent, setAttachParent] = useState(false)
  const [party, setParty] = useState<SupportParty>('supplier')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [findIndex, setFindIndex] = useState(0)
  const [findCount, setFindCount] = useState(0)
  const findInputRef = useRef<HTMLInputElement>(null)
  /** Includes subtopic titles + answer body for Ctrl+F */
  const findRootRef = useRef<HTMLDivElement>(null)

  const [imgMenu, setImgMenu] = useState<ImgMenuState | null>(null)
  const [scaleEditor, setScaleEditor] = useState<ScaleEditorState | null>(null)
  const [localDisplay, setLocalDisplay] = useState<ImageDisplayMap | undefined>(undefined)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const displayDirtyRef = useRef(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        if (editing) return
        e.preventDefault()
        setFindOpen(true)
      }
      if (e.key === 'Escape') {
        setImgMenu(null)
        setLightboxSrc(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  useEffect(() => {
    setEditing(false)
    setError(null)
    setDeleting(false)
    setSaving(false)
    setFindOpen(false)
    setFindQuery('')
    setFindIndex(0)
    setFindCount(0)
    setImgMenu(null)
    setScaleEditor(null)
    setLightboxSrc(null)
    displayDirtyRef.current = false
    if (item) {
      setQuestion(item.question)
      setAnswer(item.answer ?? '')
      setParentId(item.parent_id ?? null)
      setAttachParent(item.parent_id != null)
      setParty(getItemParty(item))
      setLocalDisplay(item.image_display)
    } else {
      setLocalDisplay(undefined)
    }
  }, [item?.id])

  useEffect(() => {
    if (!item || displayDirtyRef.current || scaleEditor) return
    setLocalDisplay(item.image_display)
  }, [item?.image_display, item, scaleEditor])

  useEffect(() => {
    if (!imgMenu) return
    function close() {
      setImgMenu(null)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [imgMenu])

  const showParty = departmentId === 'support'

  const parentChoices = useMemo(() => {
    if (!showParty) return items
    return filterItemsByParty(items, party)
  }, [items, party, showParty])

  const children = useMemo(
    () => (item ? getChildren(items, item.id) : []),
    [item, items],
  )

  useEffect(() => {
    if (!findOpen) return
    requestAnimationFrame(() => findInputRef.current?.focus())
  }, [findOpen])

  useEffect(() => {
    setFindIndex(0)
  }, [findQuery, item?.id])

  useEffect(() => {
    const root = findRootRef.current
    if (!root || editing || !findOpen) {
      if (root) clearFindHighlights(root)
      setFindCount(0)
      return
    }

    const frame = requestAnimationFrame(() => {
      const count = applyFindHighlights(root, findQuery, findIndex)
      setFindCount(count)
    })
    return () => cancelAnimationFrame(frame)
  }, [findOpen, findQuery, findIndex, editing, item?.id, item?.answer, localDisplay, children])

  if (!item) {
    return (
      <div className="viewer viewer--empty">
        <p>Выберите тему слева, чтобы увидеть ответ</p>
      </div>
    )
  }

  const current = item

  const localLegacy = [
    ...(current.photo ? [current.photo] : []),
    ...(current.photos ?? []),
  ].filter((p) => p.startsWith('media/') || p.startsWith('spravochnik://') || /^https?:\/\//i.test(p))

  async function handleSave() {
    if (!question.trim()) {
      setError('Укажите название темы')
      return
    }
    if (attachParent && parentId == null) {
      setError('Выберите родительскую тему или снимите галочку')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        question: question.trim(),
        answer,
        parent_id: attachParent ? parentId : null,
        party: showParty ? party : undefined,
      })
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Удалить тему «${current.question}»? Подтемы тоже будут удалены.`)) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    } finally {
      setDeleting(false)
    }
  }

  async function insertPhoto() {
    setError(null)
    try {
      const result = await window.spravochnik.saveTopicImage({ topicId: current.id })
      if (!result) return
      const markdown = `\n\n![](${result.markdownPath})\n\n`
      const { next, cursor } = insertAtCursor(answer, markdown, textareaRef.current)
      setAnswer(next)
      focusCursor(textareaRef.current, cursor)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить фото')
    }
  }

  async function handleAnswerPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasteItems = e.clipboardData?.items
    if (!pasteItems) return
    let hasImage = false
    for (const pasteItem of Array.from(pasteItems)) {
      if (pasteItem.type.startsWith('image/')) {
        hasImage = true
        break
      }
    }
    if (!hasImage) return
    e.preventDefault()
    setError(null)
    try {
      const result = await window.spravochnik.saveTopicImageFromClipboard({
        topicId: current.id,
      })
      if (!result) {
        setError('В буфере нет изображения')
        return
      }
      const markdown = `\n\n![](${result.markdownPath})\n\n`
      const { next, cursor } = insertAtCursor(answer, markdown, textareaRef.current)
      setAnswer(next)
      focusCursor(textareaRef.current, cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось вставить фото из буфера')
    }
  }

  function openFind() {
    setFindOpen(true)
  }

  function closeFind() {
    setFindOpen(false)
    setFindQuery('')
    setFindIndex(0)
    setFindCount(0)
    if (findRootRef.current) clearFindHighlights(findRootRef.current)
  }

  function findNext(dir: 1 | -1) {
    if (findCount === 0) return
    setFindIndex((i) => (i + dir + findCount) % findCount)
  }

  function openImageMenu(e: React.MouseEvent, markdownKey: string, resolvedSrc: string) {
    e.preventDefault()
    e.stopPropagation()
    setImgMenu({
      x: e.clientX,
      y: e.clientY,
      markdownKey: normalizeImageDisplayKey(markdownKey),
      resolvedSrc,
    })
  }

  function applyDraftScale(nextScale: number) {
    if (!scaleEditor) return
    displayDirtyRef.current = true
    setScaleEditor({ ...scaleEditor, draftScale: nextScale })
    setLocalDisplay((prev) => withImageScale(prev, scaleEditor.markdownKey, nextScale))
  }

  async function persistDisplay(map: ImageDisplayMap | undefined) {
    try {
      await onSaveImageDisplay(map)
      displayDirtyRef.current = false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить размер')
    }
  }

  async function closeScaleEditor(persist: boolean) {
    if (!scaleEditor || !item) return
    if (!persist) {
      setLocalDisplay(item.image_display)
      displayDirtyRef.current = false
      setScaleEditor(null)
      return
    }
    const map = withImageScale(localDisplay, scaleEditor.markdownKey, scaleEditor.draftScale)
    setLocalDisplay(map)
    setScaleEditor(null)
    await persistDisplay(map)
  }

  function renderTopicImage(rawSrc: string, alt: string) {
    const key = normalizeImageDisplayKey(rawSrc)
    const resolved = mediaSrcFromMarkdownUrl(rawSrc, current.id)
    const scale = getImageScale(localDisplay, key)
    const scaled = scale !== IMAGE_SCALE_DEFAULT
    return (
      <img
        src={resolved}
        alt={alt}
        className="viewer__image"
        loading="lazy"
        style={
          scaled
            ? { width: `${scale}%`, maxWidth: 'none', height: 'auto' }
            : undefined
        }
        onContextMenu={(e) => openImageMenu(e, key, resolved)}
      />
    )
  }

  return (
    <article className="viewer">
      <div className="viewer__header">
        {!editing && (
          <div className="viewer__actions">
            <button
              type="button"
              className="icon-btn--light"
              onClick={() => (findOpen ? closeFind() : openFind())}
              title="Поиск по содержимому"
              aria-label="Поиск по содержимому"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                />
              </svg>
            </button>

            {canEdit && (
              <>
                <button type="button" className="btn btn-secondary" onClick={onAddSubtopic}>
                  Добавить подтему
                </button>
                {onToggleArchive && (
                  <button type="button" className="btn btn-secondary" onClick={onToggleArchive}>
                    {current.archived ? 'Из архива' : 'В архив'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    closeFind()
                    setEditing(true)
                  }}
                >
                  Изменить
                </button>
              </>
            )}

            {isAdmin && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? 'Удаление…' : 'Удалить'}
              </button>
            )}
          </div>
        )}

        {findOpen && !editing && (
          <div className="viewer-find">
            <input
              ref={findInputRef}
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  findNext(e.shiftKey ? -1 : 1)
                }
                if (e.key === 'Escape') closeFind()
              }}
              placeholder="Найти в тексте…"
              aria-label="Поиск в тексте темы"
            />
            <span className="viewer-find__count">
              {findQuery.trim()
                ? findCount
                  ? `${findIndex + 1}/${findCount}`
                  : '0/0'
                : ''}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => findNext(-1)}
              title="Назад"
            >
              ↑
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => findNext(1)}
              title="Далее"
            >
              ↓
            </button>
            <button type="button" className="search__clear" onClick={closeFind} aria-label="Закрыть поиск">
              ✕
            </button>
          </div>
        )}

        {editing ? (
          <input
            className="viewer__title-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            aria-label="Название темы"
          />
        ) : (
          <h1 className="viewer__title">{current.question}</h1>
        )}
      </div>

      <div ref={findRootRef} className="viewer__find-root">
        {children.length > 0 && !editing && (
          <ul className="viewer-children">
            {children.map((child) => (
              <li key={child.id}>
                <button
                  type="button"
                  className={`viewer-children__item${child.id === current.id ? ' is-selected' : ''}`}
                  onClick={() => onSelect(child.id)}
                >
                  {child.question || 'Без названия'}
                </button>
              </li>
            ))}
          </ul>
        )}

        {editing ? (
          <div className="viewer__editor">
            {showParty && (
              <label className="field">
                <span>Поставщик / Заказчик</span>
                <select
                  value={party}
                  onChange={(e) => {
                    const next = e.target.value as SupportParty
                    setParty(next)
                    if (parentId != null) {
                      const parent = items.find((i) => i.id === parentId)
                      if (parent && getItemParty(parent) !== next) {
                        setParentId(null)
                        setAttachParent(false)
                      }
                    }
                  }}
                >
                  {SUPPORT_PARTIES.map((p) => (
                    <option key={p} value={p}>
                      {SUPPORT_PARTY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <ParentTopicField
              items={parentChoices}
              excludeId={current.id}
              attach={attachParent}
              onAttachChange={setAttachParent}
              parentId={parentId}
              onParentIdChange={setParentId}
            />
            <textarea
              ref={textareaRef}
              className="viewer__textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onPaste={(e) => void handleAnswerPaste(e)}
              rows={16}
              placeholder="Текст ответа (Markdown). Можно вставлять фото кнопкой или Ctrl+V."
            />
            <div className="viewer__editor-toolbar">
              <button type="button" className="btn btn-secondary" onClick={() => void insertPhoto()}>
                Вставить фото
              </button>
              <div className="viewer__editor-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditing(false)
                    setQuestion(current.question)
                    setAnswer(current.answer ?? '')
                    setParentId(current.parent_id ?? null)
                    setAttachParent(current.parent_id != null)
                    setParty(getItemParty(current))
                    setError(null)
                  }}
                  disabled={saving}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
          </div>
        ) : (
          <div className="viewer__body markdown-body">
            {current.answer?.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ src, alt }) => {
                    const raw = src ?? ''
                    if (!isAllowedMarkdownImageSrc(raw)) {
                      return null
                    }
                    return renderTopicImage(raw, alt || '')
                  },
                  a: ({ href, children: linkChildren }) => (
                    <a href={href}>{linkChildren}</a>
                  ),
                }}
              >
                {current.answer}
              </ReactMarkdown>
            ) : (
              <p className="muted">Текст ответа пока пуст</p>
            )}

            {localLegacy.length > 0 && (
              <div className="viewer__legacy-photos">
                {localLegacy.map((src) => (
                  <span key={src}>{renderTopicImage(src, '')}</span>
                ))}
              </div>
            )}

            {error && <div className="form-error">{error}</div>}
          </div>
        )}
      </div>

      {imgMenu && (
        <div
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
                const scale = getImageScale(localDisplay, imgMenu.markdownKey)
                setScaleEditor({
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
            onClick={() => {
              setLightboxSrc(imgMenu.resolvedSrc)
              setImgMenu(null)
            }}
          >
            Открыть фото на весь экран
          </button>
        </div>
      )}

      {scaleEditor && canEdit && (
        <ImageScaleDialog
          scale={scaleEditor.draftScale}
          initialLeft={scaleEditor.left}
          initialTop={scaleEditor.top}
          onScaleChange={applyDraftScale}
          onReset={() => applyDraftScale(IMAGE_SCALE_DEFAULT)}
          onApply={() => void closeScaleEditor(true)}
          onClose={() => void closeScaleEditor(true)}
        />
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
    </article>
  )
}
