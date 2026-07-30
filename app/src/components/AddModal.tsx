import { useEffect, useRef, useState } from 'react'
import type { GuideItem } from '../types'
import { getFolders } from '../lib/data'

interface AddModalProps {
  open: boolean
  items: GuideItem[]
  onClose: () => void
  onSave: (payload: {
    question: string
    answer: string
    parent_id: number | null
  }) => Promise<void>
}

export function AddModal({ open, items, onClose, onSave }: AddModalProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setQuestion('')
      setAnswer('')
      setParentId('')
      setError(null)
      setSaving(false)
    }
  }, [open])

  if (!open) return null

  const folders = getFolders(items)

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
        question: question.trim(),
        answer,
        parent_id: parentId ? Number(parentId) : null,
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
        aria-labelledby="add-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="add-modal-title">Новая тема</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
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
            <span>Папка (необязательно)</span>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">Корень отдела</option>
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
