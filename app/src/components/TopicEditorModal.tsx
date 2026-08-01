import { useEffect, useRef, useState } from 'react'
import type { DepartmentId, GuideItem } from '../types'
import { DEPARTMENTS } from '../types'

interface TopicEditorModalProps {
  open: boolean
  mode: 'add' | 'edit'
  departmentId: DepartmentId
  /** When adding a subtopic — parent id; null for root */
  parentId: number | null
  initial?: GuideItem | null
  onClose: () => void
  onSave: (payload: {
    departmentId: DepartmentId
    question: string
    answer: string
    parent_id: number | null
    id?: number
  }) => Promise<void>
}

export function TopicEditorModal({
  open,
  mode,
  departmentId,
  parentId,
  initial,
  onClose,
  onSave,
}: TopicEditorModalProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [targetDept, setTargetDept] = useState<DepartmentId>(departmentId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setQuestion(initial?.question ?? '')
    setAnswer(initial?.answer ?? '')
    setTargetDept(departmentId)
    setError(null)
    setSaving(false)
  }, [open, initial, departmentId])

  if (!open) return null

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
        parent_id: mode === 'add' ? parentId : (initial?.parent_id ?? null),
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
          <h2 id="topic-modal-title">
            {mode === 'add' ? (parentId != null ? 'Новая подтема' : 'Новая тема') : 'Редактирование'}
          </h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          {mode === 'add' && parentId == null && (
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
