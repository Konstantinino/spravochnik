import { useEffect, useMemo, useRef, useState } from 'react'
import type { DepartmentId, GuideItem, SupportParty } from '../types'
import { DEPARTMENTS, SUPPORT_PARTIES, SUPPORT_PARTY_LABELS } from '../types'
import { filterItemsByParty, getItemParty } from '../lib/data'
import { ParentTopicField } from './ParentTopicField'

interface TopicEditorModalProps {
  open: boolean
  mode: 'add' | 'edit'
  departmentId: DepartmentId
  /** When adding a subtopic — parent id; null for root */
  parentId: number | null
  items: GuideItem[]
  /** Default Поставщик/Заказчик from sidebar filter (support only) */
  defaultParty?: SupportParty
  initial?: GuideItem | null
  onClose: () => void
  onSave: (payload: {
    departmentId: DepartmentId
    question: string
    answer: string
    parent_id: number | null
    party?: SupportParty
    id?: number
  }) => Promise<void>
}

export function TopicEditorModal({
  open,
  mode,
  departmentId,
  parentId,
  items,
  defaultParty = 'supplier',
  initial,
  onClose,
  onSave,
}: TopicEditorModalProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [targetDept, setTargetDept] = useState<DepartmentId>(departmentId)
  const [party, setParty] = useState<SupportParty>(defaultParty)
  const [attachParent, setAttachParent] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showParty = targetDept === 'support' || (mode === 'edit' && departmentId === 'support')

  const parentChoices = useMemo(() => {
    if (!showParty) return items
    return filterItemsByParty(items, party)
  }, [items, party, showParty])

  useEffect(() => {
    if (!open) return
    setQuestion(initial?.question ?? '')
    setAnswer(initial?.answer ?? '')
    setTargetDept(departmentId)
    const initialParent =
      mode === 'edit' ? (initial?.parent_id ?? null) : parentId
    setSelectedParentId(initialParent)
    setAttachParent(initialParent != null)
    setParty(
      mode === 'edit' && initial
        ? getItemParty(initial)
        : defaultParty,
    )
    setError(null)
    setSaving(false)
  }, [open, initial, departmentId, parentId, mode, defaultParty])

  if (!open) return null

  function handlePartyChange(next: SupportParty) {
    setParty(next)
    if (selectedParentId != null) {
      const parent = items.find((i) => i.id === selectedParentId)
      if (parent && getItemParty(parent) !== next) {
        setSelectedParentId(null)
        setAttachParent(false)
      }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) {
      setError('Укажите название темы')
      return
    }
    if (attachParent && selectedParentId == null) {
      setError('Выберите родительскую тему или снимите галочку')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        departmentId: targetDept,
        question: question.trim(),
        answer,
        parent_id: attachParent ? selectedParentId : null,
        party: showParty ? party : undefined,
        id: initial?.id,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
      setSaving(false)
    }
  }

  const title =
    mode === 'edit'
      ? 'Редактирование'
      : attachParent && selectedParentId != null
        ? 'Новая подтема'
        : 'Новая тема'

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
          <h2 id="topic-modal-title">{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <form className="modal__body" onSubmit={(e) => void handleSubmit(e)}>
          {mode === 'add' && !attachParent && (
            <label className="field">
              <span>Отдел</span>
              <select
                value={targetDept}
                onChange={(e) => {
                  const next = e.target.value as DepartmentId
                  setTargetDept(next)
                  if (next !== 'support') {
                    setSelectedParentId(null)
                    setAttachParent(false)
                  }
                }}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showParty && (
            <label className="field">
              <span>Поставщик / Заказчик</span>
              <select
                value={party}
                onChange={(e) => handlePartyChange(e.target.value as SupportParty)}
              >
                {SUPPORT_PARTIES.map((p) => (
                  <option key={p} value={p}>
                    {SUPPORT_PARTY_LABELS[p]}
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

          <ParentTopicField
            items={parentChoices}
            excludeId={mode === 'edit' ? initial?.id ?? null : null}
            attach={attachParent}
            onAttachChange={setAttachParent}
            parentId={selectedParentId}
            onParentIdChange={setSelectedParentId}
          />

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
            <button type="button" className="btn btn-secondary" onClick={() => void insertPhoto()}>
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
