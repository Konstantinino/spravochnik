import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DepartmentId, GuideItem, SupportParty } from '../types'
import { SUPPORT_PARTIES, SUPPORT_PARTY_LABELS } from '../types'
import { filterItemsByParty, getChildren, getItemParty } from '../lib/data'
import { applyFindHighlights, clearFindHighlights } from '../lib/findHighlight'
import { mediaSrcFromMarkdownUrl } from '../lib/markdown'
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
  onDelete: () => Promise<void>
  onAddSubtopic: () => void
}

export function Viewer({
  item,
  items,
  departmentId,
  canEdit,
  isAdmin,
  onSelect,
  onSave,
  onDelete,
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
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setFindOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setEditing(false)
    setError(null)
    setFindOpen(false)
    setFindQuery('')
    setFindIndex(0)
    setFindCount(0)
    if (item) {
      setQuestion(item.question)
      setAnswer(item.answer ?? '')
      setParentId(item.parent_id ?? null)
      setAttachParent(item.parent_id != null)
      setParty(getItemParty(item))
    }
  }, [item?.id])

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
    // Focus once when bar opens — do not steal focus on every keystroke
    requestAnimationFrame(() => findInputRef.current?.focus())
  }, [findOpen])

  useEffect(() => {
    setFindIndex(0)
  }, [findQuery, item?.id])

  // Highlight matches in rendered markdown (browser-like yellow marks)
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
  }, [findOpen, findQuery, findIndex, editing, item?.id, item?.answer])

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
      setDeleting(false)
    }
  }

  async function insertPhoto() {
    setError(null)
    try {
      const result = await window.spravochnik.pickAndSaveImage()
      if (!result) return
      const markdown = `\n\n![](${result.markdownPath})\n\n`
      const el = textareaRef.current
      if (el) {
        const start = el.selectionStart
        const end = el.selectionEnd
        const next = answer.slice(0, start) + markdown + answer.slice(end)
        setAnswer(next)
        requestAnimationFrame(() => {
          el.focus()
          const pos = start + markdown.length
          el.setSelectionRange(pos, pos)
        })
      } else {
        setAnswer((prev) => prev + markdown)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить фото')
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
    if (bodyRef.current) clearFindHighlights(bodyRef.current)
  }

  function findNext(dir: 1 | -1) {
    if (findCount === 0) return
    setFindIndex((i) => (i + dir + findCount) % findCount)
  }

  return (
    <article className="viewer">
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

          {canEdit && !editing && (
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              Изменить
            </button>
          )}

          {isAdmin && !editing && (
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

      {findOpen && (
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

      {canEdit && !editing && (
        <div className="viewer__subtopic-bar">
          <button type="button" className="btn btn-secondary" onClick={onAddSubtopic}>
            Добавить подтему
          </button>
        </div>
      )}

      {children.length > 0 && (
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
            rows={16}
            placeholder="Текст ответа (Markdown). Можно вставлять фото кнопкой ниже."
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
        <div className="viewer__body markdown-body" ref={bodyRef}>
          {current.answer?.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => {
                  const raw = src ?? ''
                  if (!raw.startsWith('media/') && !raw.startsWith('spravochnik://') && !/^https?:\/\//i.test(raw)) {
                    return null
                  }
                  const resolved = mediaSrcFromMarkdownUrl(raw)
                  return (
                    <img
                      src={resolved}
                      alt={alt || ''}
                      className="viewer__image"
                      loading="lazy"
                    />
                  )
                },
                a: ({ href, children: linkChildren }) => (
                  <a href={href} target="_blank" rel="noreferrer">
                    {linkChildren}
                  </a>
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
                <img
                  key={src}
                  src={mediaSrcFromMarkdownUrl(src)}
                  alt=""
                  className="viewer__image"
                />
              ))}
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
        </div>
      )}
    </article>
  )
}
