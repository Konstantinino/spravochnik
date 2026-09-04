import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import {
  formatFileMarkdownLink,
  formatTopicMarkdownLink,
  mediaSrcFromMarkdownUrl,
  isAllowedMarkdownImageSrc,
  parseFileAttachmentHref,
  parseTopicLinkHref,
} from '../lib/markdown'
import {
  focusCursor,
  insertAtCursor,
  wrapSelectionWithTopicLink,
} from '../lib/textInsert'
import { useTopicLinkPicker } from '../hooks/useTopicLinkPicker'
import { ImageScaleDialog } from './ImageScaleDialog'
import { ParentTopicField } from './ParentTopicField'
import { TopicLinkPicker } from './TopicLinkPicker'

interface ViewerProps {
  item: GuideItem | null
  items: GuideItem[]
  allItems: GuideItem[]
  departmentId: DepartmentId
  canEdit: boolean
  isAdmin: boolean
  canGoBack: boolean
  onBack: () => void
  onClose: () => void
  onNavigateToTopic: (id: number) => void
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

function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (typeof node === 'object' && node !== null && 'props' in node) {
    return nodeText((node as { props?: { children?: ReactNode } }).props?.children)
  }
  return ''
}

function fileExtLabel(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop() : ''
  return ext ? ext.toUpperCase() : 'ФАЙЛ'
}

export function Viewer({
  item,
  items,
  allItems,
  departmentId,
  canEdit,
  isAdmin,
  canGoBack,
  onBack,
  onClose,
  onNavigateToTopic,
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
  const {
    linkPicker,
    clearPicker,
    closePicker,
    syncLinkPickerFromTextarea,
    handleAnswerChange: onAnswerChange,
    handleAnswerKeyDown: onAnswerKeyDown,
    pickTopicForLink: onPickTopicLink,
    setPickerQuery,
  } = useTopicLinkPicker(textareaRef)

  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [findIndex, setFindIndex] = useState(0)
  const [findCount, setFindCount] = useState(0)
  const findInputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const [imgMenu, setImgMenu] = useState<ImgMenuState | null>(null)
  const [topicMenu, setTopicMenu] = useState<{ x: number; y: number } | null>(null)
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
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  useEffect(() => {
    if (!editing || !item) return

    let cancelled = false
    const lockId = item.id

    void (async () => {
      try {
        const result = await window.spravochnik.lockTopic({ departmentId, topicId: lockId })
        if (cancelled) return
        if (!result.ok) {
          setError(result.error || 'Тема редактируется другим пользователем')
          setEditing(false)
          return
        }
        setError(null)
      } catch (e) {
        if (!cancelled) {
          const raw = e instanceof Error ? e.message : ''
          const cleaned = raw.replace(/^Error invoking remote method '[^']+': (?:Error: )?/i, '')
          setError(cleaned || 'Тема редактируется другим пользователем')
          setEditing(false)
        }
      }
    })()

    const renew = window.setInterval(() => {
      void window.spravochnik.renewTopicLock({ departmentId, topicId: lockId }).catch(() => undefined)
    }, 60_000)

    return () => {
      cancelled = true
      window.clearInterval(renew)
      void window.spravochnik.unlockTopic({ departmentId, topicId: lockId }).catch(() => undefined)
    }
  }, [editing, item?.id, departmentId])

  useEffect(() => {
    setEditing(false)
    setError(null)
    setFindOpen(false)
    setFindQuery('')
    setFindIndex(0)
    setFindCount(0)
    setImgMenu(null)
    setTopicMenu(null)
    clearPicker()
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
    if (!editing) {
      setTopicMenu(null)
      clearPicker()
    }
  }, [editing, clearPicker])

  useEffect(() => {
    if (!item || displayDirtyRef.current || scaleEditor) return
    setLocalDisplay(item.image_display)
  }, [item?.image_display, item, scaleEditor])

  useEffect(() => {
    if (!imgMenu && !topicMenu) return
    function close() {
      setImgMenu(null)
      setTopicMenu(null)
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [imgMenu, topicMenu])

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
    const root = bodyRef.current
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
  }, [findOpen, findQuery, findIndex, editing, item?.id, item?.answer, localDisplay])

  function closeFind() {
    setFindOpen(false)
    setFindQuery('')
    setFindIndex(0)
    setFindCount(0)
    if (bodyRef.current) clearFindHighlights(bodyRef.current)
  }

  function cancelEditing() {
    if (!item) return
    setEditing(false)
    setQuestion(item.question)
    setAnswer(item.answer ?? '')
    setParentId(item.parent_id ?? null)
    setAttachParent(item.parent_id != null)
    setParty(getItemParty(item))
    setError(null)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (linkPicker || scaleEditor) return
      if (findOpen) {
        closeFind()
        return
      }
      if (lightboxSrc) {
        setLightboxSrc(null)
        return
      }
      if (imgMenu) {
        setImgMenu(null)
        return
      }
      if (topicMenu) {
        setTopicMenu(null)
        return
      }
      if (editing) {
        cancelEditing()
        return
      }
      if (canGoBack) {
        onBack()
        return
      }
      if (item) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    linkPicker,
    scaleEditor,
    findOpen,
    lightboxSrc,
    imgMenu,
    topicMenu,
    editing,
    canGoBack,
    onBack,
    onClose,
    item,
  ])

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
      const raw = e instanceof Error ? e.message : ''
      const cleaned = raw.replace(/^Error invoking remote method '[^']+': (?:Error: )?/i, '')
      setError(cleaned || 'Ошибка сохранения')
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
      setDeleting(false)
    }
  }

  async function insertPhoto() {
    setError(null)
    try {
      const result = await window.spravochnik.saveTopicImage({
        topicId: current.id,
        departmentId,
      })
      if (!result) return
      const markdown = `\n\n![](${result.markdownPath})\n\n`
      const { next, cursor } = insertAtCursor(answer, markdown, textareaRef.current)
      setAnswer(next)
      focusCursor(textareaRef.current, cursor)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить фото')
    }
  }

  async function insertFile() {
    setError(null)
    try {
      const result = await window.spravochnik.saveTopicFile({
        topicId: current.id,
        departmentId,
      })
      if (!result) return
      const markdown = `\n\n${formatFileMarkdownLink(result.originalName, result.markdownPath)}\n\n`
      const { next, cursor } = insertAtCursor(answer, markdown, textareaRef.current)
      setAnswer(next)
      focusCursor(textareaRef.current, cursor)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить файл')
    }
  }

  async function handleAnswerPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasteItems = e.clipboardData?.items
    const pastedText = e.clipboardData?.getData('text/plain') ?? ''
    const wrapped = wrapSelectionWithTopicLink(answer, pastedText, textareaRef.current)
    if (wrapped) {
      e.preventDefault()
      setAnswer(wrapped.next)
      clearPicker()
      focusCursor(textareaRef.current, wrapped.cursor)
      return
    }
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
        departmentId,
      })
      if (!result) {
        setError('В буфере нет изображения')
        return
      }
      const markdown = `\n\n![](${result.markdownPath})\n\n`
      const { next, cursor } = insertAtCursor(answer, markdown, textareaRef.current)
      setAnswer(next)
      clearPicker()
      focusCursor(textareaRef.current, cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось вставить фото из буфера')
    }
  }

  function handleAnswerChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onAnswerChange(e, setAnswer)
  }

  function handleAnswerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    onAnswerKeyDown(e)
  }

  function pickTopicForLink(item: GuideItem) {
    onPickTopicLink(item, answer, setAnswer)
  }

  function openFind() {
    setFindOpen(true)
  }

  function findNext(dir: 1 | -1) {
    if (findCount === 0) return
    setFindIndex((i) => (i + dir + findCount) % findCount)
  }

  function openImageMenu(e: React.MouseEvent, markdownKey: string, resolvedSrc: string) {
    e.preventDefault()
    e.stopPropagation()
    setTopicMenu(null)
    setImgMenu({
      x: e.clientX,
      y: e.clientY,
      markdownKey: normalizeImageDisplayKey(markdownKey),
      resolvedSrc,
    })
  }

  function openTopicMenu(e: React.MouseEvent<HTMLButtonElement>) {
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
  }

  async function copyTopicLink() {
    setTopicMenu(null)
    const snippet = formatTopicMarkdownLink(current.id, current.question)
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

  function openLightbox(resolvedSrc: string) {
    setLightboxSrc(resolvedSrc)
    setImgMenu(null)
  }

  async function downloadImage(resolvedSrc: string, suggestedName?: string) {
    setImgMenu(null)
    setError(null)
    try {
      const result = await window.spravochnik.downloadMediaImage(resolvedSrc, suggestedName)
      if (result.error && !result.canceled) {
        setError(result.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось скачать файл')
    }
  }

  async function openAttachedFile(resolvedSrc: string, displayName: string) {
    setError(null)
    try {
      const result = await window.spravochnik.openMediaFile(resolvedSrc)
      if (result.ok) return
      await downloadImage(resolvedSrc, displayName)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось открыть файл')
    }
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

  function renderTopicLink(href: string | undefined, linkChildren: ReactNode) {
    if (parseFileAttachmentHref(href)) {
      return renderTopicFile(href ?? '', nodeText(linkChildren))
    }
    const topicId = parseTopicLinkHref(href)
    if (topicId != null && allItems.some((entry) => entry.id === topicId)) {
      return (
        <a
          href={href}
          className="viewer-topic-link"
          onClick={(e) => {
            e.preventDefault()
            onNavigateToTopic(topicId)
          }}
        >
          {linkChildren}
        </a>
      )
    }
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {linkChildren}
      </a>
    )
  }

  function renderTopicFile(rawHref: string, displayName: string) {
    const parsed = parseFileAttachmentHref(rawHref)
    const name = displayName.trim() || parsed?.storedName || 'Файл'
    const resolved = mediaSrcFromMarkdownUrl(rawHref, current.id, departmentId)
    const ext = fileExtLabel(name)
    return (
      <span className="topic-file">
        <button
          type="button"
          className="topic-file__main"
          title={`Открыть «${name}»`}
          onClick={() => void openAttachedFile(resolved, name)}
        >
          <span className="topic-file__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2.5 3.5 3.5H14zM8 13h8v1.5H8zm0 3h8v1.5H8zM8 10h4v1.5H8z"
              />
            </svg>
          </span>
          <span className="topic-file__meta">
            <span className="topic-file__name">{name}</span>
            <span className="topic-file__ext">{ext}</span>
          </span>
        </button>
        <button
          type="button"
          className="topic-file__download"
          title="Скачать"
          aria-label={`Скачать «${name}»`}
          onClick={() => void downloadImage(resolved, name)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 3v10.2l3.3-3.3 1.4 1.4L12 16.4 7.3 11.3l1.4-1.4 3.3 3.3V3zM5 19h14v2H5z"
            />
          </svg>
        </button>
      </span>
    )
  }

  function renderTopicImage(rawSrc: string, alt: string) {
    const key = normalizeImageDisplayKey(rawSrc)
    const resolved = mediaSrcFromMarkdownUrl(rawSrc, current.id, departmentId)
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
        onClick={() => openLightbox(resolved)}
        onContextMenu={(e) => openImageMenu(e, key, resolved)}
      />
    )
  }

  return (
    <article className="viewer">
      {!editing && (
        <div className="viewer__toolbar">
          <div className="viewer__toolbar-start">
            {canGoBack && (
              <button type="button" className="btn btn-secondary" onClick={onBack}>
                ← Назад
              </button>
            )}
          </div>

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
                    setError(null)
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
        </div>
      )}

      {error && !editing && <div className="form-error viewer__notice">{error}</div>}

      <div className="viewer__header">
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
        {editing && (
          <button
            type="button"
            className="icon-btn--light viewer__topic-menu-btn"
            title="Действия с темой"
            aria-label="Действия с темой"
            aria-haspopup="menu"
            aria-expanded={topicMenu != null}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={openTopicMenu}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="5" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="19" r="2" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

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

      {children.length > 0 && !editing && (
        <ul className="viewer-children">
          {children.map((child) => (
            <li key={child.id}>
              <button
                type="button"
                className={`viewer-children__item${child.id === current.id ? ' is-selected' : ''}`}
                onClick={() => onNavigateToTopic(child.id)}
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
            onChange={handleAnswerChange}
            onKeyDown={handleAnswerKeyDown}
            onSelect={(e) => syncLinkPickerFromTextarea(answer, e.currentTarget)}
            onClick={(e) => syncLinkPickerFromTextarea(answer, e.currentTarget)}
            onPaste={(e) => void handleAnswerPaste(e)}
            rows={16}
            placeholder="Текст ответа (Markdown). «+» — ссылка на тему. Фото и файлы (до 10 МБ) — кнопки ниже."
          />
          <TopicLinkPicker
            open={linkPicker}
            items={items}
            excludeId={current.id}
            onPick={pickTopicForLink}
            onClose={closePicker}
            onQueryChange={setPickerQuery}
          />
          <div className="viewer__editor-toolbar">
            <div className="viewer__editor-insert">
              <button type="button" className="btn btn-secondary" onClick={() => void insertPhoto()}>
                Вставить фото
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => void insertFile()}>
                Вставить файл
              </button>
            </div>
            <div className="viewer__editor-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  cancelEditing()
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
        <div className="viewer__body markdown-body" ref={bodyRef}>
          {current.answer?.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => {
                  const raw = src ?? ''
                  if (parseFileAttachmentHref(raw)) {
                    return renderTopicFile(raw, alt || '')
                  }
                  if (!isAllowedMarkdownImageSrc(raw)) {
                    return null
                  }
                  return renderTopicImage(raw, alt || '')
                },
                a: ({ href, children: linkChildren }) => renderTopicLink(href, linkChildren),
              }}
            >
              {current.answer}
            </ReactMarkdown>
          ) : (
            <p className="muted">Нет текста в теме</p>
          )}

          {localLegacy.length > 0 && (
            <div className="viewer__legacy-photos">
              {localLegacy.map((src) => (
                <span key={src}>{renderTopicImage(src, '')}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {topicMenu && (
        <div
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
            onClick={() => openLightbox(imgMenu.resolvedSrc)}
          >
            Открыть фото на весь экран
          </button>
          <button
            type="button"
            className="image-ctx-menu__item"
            role="menuitem"
            onClick={() => void downloadImage(imgMenu.resolvedSrc)}
          >
            Скачать
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
