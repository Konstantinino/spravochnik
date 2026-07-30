import { useEffect, useRef, useState } from 'react'
import type { DepartmentId, GuideItem } from '../types'
import { DEPARTMENTS } from '../types'
import { getFolders } from '../lib/data'

interface TopicEditorModalProps {
  open: boolean
  mode: 'add' | 'edit'
  items: GuideItem[]
  departmentId: DepartmentId
  initial?: GuideItem | null
  onClose: () => void
  onSave: (payload: {
    departmentId: DepartmentId
    question: string
    answer: string
    parent_id: number | null
    id?: number
  }) => Promise<void>
  onDepartmentPreview: (id: DepartmentId) => Promise<GuideItem[]>
}

export function TopicEditorModal({
  open,
  mode,
  items,
  departmentId,
  initial,
  onClose,
  onSave,
  onDepartmentPreview,
}: TopicEditorModalProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [targetDept, setTargetDept] = useState<DepartmentId>(departmentId)
  const [folderItems, setFolderItems] = useState<GuideItem[]>(items)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setQuestion(initial?.question ?? '')
    setAnswer(initial?.answer ?? '')
    setParentId(initial?.parent_id != null ? String(initial.parent_id) : '')
    setTargetDept(departmentId)
    setFolderItems(items)
    setError(null)
    setSaving(false)
  }, [open, initial, departmentId, items])

  useEffect(() => {
    if (!open || mode === 'edit') return
    let cancelled = false
    void (async () => {
      try {
        const next = await onDepartmentPreview(targetDept)
        if (!cancelled) {
          setFolderItems(next)
          setParentId('')
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [targetDept, open, mode, onDepartmentPreview])

  if (!open) return null

  const folders = getFolders(folderItems)
  const deptLabel =
    DEPARTMENTS.find((d) => d.id === targetDept)?.label ?? 'Отдел'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) {
      setError('Укажите название темы')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        departmentId: targetDept,
        question: question.trim(),
        answer,
        parent_id: parentId ? Number(parentId) : null,
        id: initial?.id,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="topic-modal-title">{mode === 'add' ? 'Новая тема' : 'Редактирование'}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          {mode === 'add' && (
            <label className="field">
              <span>Отдел</span>
              <select
                value={targetDept}
                onChange={(e) => setTargetDept(e.target.value as DepartmentId)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Название</span>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Тема / вопрос"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Размещение</span>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">{deptLabel}</option>
              {folders.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.question}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Текст ответа (Markdown)</span>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={12}
              placeholder="Текст ответа. Можно вставлять фото кнопкой ниже."
            />
          </label>

          <div className="modal__toolbar">
            <button type="button" className="btn btn-secondary" onClick={insertPhoto}>
              Вставить фото
            </button>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
