import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  Department,
  DepartmentId,
  DepartmentSubsection,
  GuideItem,
  SupportTopicSection,
} from '../types'
import { DEPARTMENTS, supportPartySelectOptions, workDepartmentsFrom } from '../types'
import {
  filterTopicsForClientLinkPicker,
  filterTopicsForLinkPicker,
  filterTopicsForParentPicker,
  getItemParty,
} from '../lib/data'
import {
  editorSubsectionsForDepartment,
  isEditableRootTopic,
  sectionRequiredErrorMessage,
} from '../lib/topicSectionPickers'
import {
  formatFileMarkdownLink,
  formatSharedImageMarkdown,
  parseImageRefFromClipboard,
} from '../lib/markdown'
import {
  focusCursor,
  insertAtCursor,
  insertPastedImageReferenceAsync,
  wrapSelectionWithTopicLink,
} from '../lib/textInsert'
import { usePreserveTextareaFocus } from '../hooks/usePreserveTextareaFocus'
import { useTopicLinkPicker } from '../hooks/useTopicLinkPicker'
import { ParentTopicField } from './ParentTopicField'
import { TextareaWithNbspButton } from './TextareaWithNbspButton'
import { TopicLinkPicker } from './TopicLinkPicker'

interface TopicEditorModalProps {
  open: boolean
  mode: 'add' | 'edit'
  departmentId: DepartmentId
  departments?: Department[]
  subsections?: DepartmentSubsection[]
  supportSections?: SupportTopicSection[]
  /** When adding a subtopic — parent id; null for root */
  parentId: number | null
  items: GuideItem[]
  /** Default Поставщик/Заказчик from sidebar filter (support only) */
  defaultParty?: string
  /** Раздел темы из фильтра sidebar (СПП, юристы и т.д.) */
  defaultSubsectionId?: string
  initial?: GuideItem | null
  onClose: () => void
  onSave: (payload: {
    departmentId: DepartmentId
    question: string
    answer: string
    parent_id: number | null
    client_topic_id?: number | null
    party?: string
    subsection_id?: string | null
    id?: number
    draftId?: string
  }) => Promise<void>
}

function newDraftId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export function TopicEditorModal({
  open,
  mode,
  departmentId,
  departments = workDepartmentsFrom(DEPARTMENTS),
  subsections = [],
  supportSections = [],
  parentId,
  items,
  defaultParty = 'supplier',
  defaultSubsectionId,
  initial,
  onClose,
  onSave,
}: TopicEditorModalProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [targetDept, setTargetDept] = useState<DepartmentId>(departmentId)
  const [targetSubsectionId, setTargetSubsectionId] = useState('')
  const [party, setParty] = useState(defaultParty)
  const [attachParent, setAttachParent] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)
  const [attachClientLink, setAttachClientLink] = useState(false)
  const [selectedClientTopicId, setSelectedClientTopicId] = useState<number | null>(null)
  const [draftId, setDraftId] = useState(() => newDraftId())
  const [saving, setSaving] = useState(false)
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

  usePreserveTextareaFocus(open, textareaRef)

  const showParty = targetDept === 'support' || (mode === 'edit' && departmentId === 'support')

  const isRootTopic = isEditableRootTopic(
    attachParent,
    mode,
    mode === 'edit' ? initial?.parent_id : null,
  )

  const targetDeptSubsections = useMemo(
    () => editorSubsectionsForDepartment(subsections, targetDept, party),
    [subsections, targetDept, party],
  )

  const showPartyPicker = showParty && isRootTopic
  const showSubsectionPicker = targetDeptSubsections.length > 0 && isRootTopic

  const partySelectOptions = useMemo(
    () => supportPartySelectOptions(supportSections, party),
    [supportSections, party],
  )

  const linkPickerItems = useMemo(() => filterTopicsForLinkPicker(items), [items])

  const parentPickerItems = useMemo(() => {
    if (!showParty) return linkPickerItems
    return filterTopicsForParentPicker(items, party)
  }, [items, showParty, party, linkPickerItems])

  const clientLinkPickerItems = useMemo(
    () =>
      filterTopicsForClientLinkPicker(items, mode === 'edit' ? (initial?.id ?? null) : null),
    [items, mode, initial?.id],
  )

  useEffect(() => {
    if (!open) return
    setQuestion(initial?.question ?? '')
    setAnswer(initial?.answer ?? '')
    setTargetDept(departmentId)
    const initialParty =
      mode === 'edit' && initial ? getItemParty(initial) : defaultParty
    const subsForDept = editorSubsectionsForDepartment(
      subsections,
      departmentId,
      initialParty,
    )
    const initialSub =
      mode === 'edit' && initial?.subsection_id
        ? initial.subsection_id
        : defaultSubsectionId && subsForDept.some((s) => s.id === defaultSubsectionId)
          ? defaultSubsectionId
          : subsForDept[0]?.id ?? ''
    setTargetSubsectionId(initialSub)
    const initialParent =
      mode === 'edit' ? (initial?.parent_id ?? null) : parentId
    setSelectedParentId(initialParent)
    setAttachParent(initialParent != null)
    const initialClient =
      mode === 'edit' ? (initial?.client_topic_id ?? null) : null
    setSelectedClientTopicId(initialClient)
    setAttachClientLink(initialClient != null)
    setParty(
      mode === 'edit' && initial
        ? getItemParty(initial)
        : defaultParty,
    )
    if (mode === 'add') setDraftId(newDraftId())
    setError(null)
    clearPicker()
    setSaving(false)
  }, [
    open,
    initial,
    departmentId,
    parentId,
    mode,
    defaultParty,
    defaultSubsectionId,
    clearPicker,
    subsections,
  ])

  if (!open) return null

  function imageOwnerPayload(): { topicId?: number; draftId?: string; departmentId: DepartmentId } {
    const dept = mode === 'edit' ? departmentId : targetDept
    if (mode === 'edit' && initial?.id != null) return { topicId: initial.id, departmentId: dept }
    return { draftId, departmentId: targetDept }
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

  function handlePartyChange(next: string) {
    setParty(next)
    setAttachParent(false)
    setSelectedParentId(null)
    const nextSubs = editorSubsectionsForDepartment(subsections, targetDept, next)
    setTargetSubsectionId(nextSubs[0]?.id ?? '')
    if (next !== 'additional') {
      setAttachClientLink(false)
      setSelectedClientTopicId(null)
    }
  }

  function handleParentIdChange(id: number | null) {
    setSelectedParentId(id)
    if (id != null && showParty) {
      const parent = linkPickerItems.find((i) => i.id === id)
      if (parent) setParty(getItemParty(parent))
    }
  }

  async function insertPhoto() {
    setError(null)
    try {
      const result = await window.spravochnik.saveTopicImage(imageOwnerPayload())
      if (!result) return
      const markdown = `\n\n![](${result.markdownPath})`
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
      const result = await window.spravochnik.saveTopicFile(imageOwnerPayload())
      if (!result) return
      const markdown = `\n\n${formatFileMarkdownLink(result.originalName, result.markdownPath)}\n\n`
      const { next, cursor } = insertAtCursor(answer, markdown, textareaRef.current)
      setAnswer(next)
      focusCursor(textareaRef.current, cursor)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить файл')
    }
  }

  function handleAnswerCopy(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget
    const selected = ta.value.slice(ta.selectionStart, ta.selectionEnd)
    if (!selected.trim()) return
    const raw = parseImageRefFromClipboard(selected)
    if (!raw) return
    e.preventDefault()
    const topicIdForCopy = mode === 'edit' && initial?.id != null ? initial.id : 0
    const deptForCopy = mode === 'edit' ? departmentId : targetDept
    void (async () => {
      const canonical = /^https?:\/\//i.test(raw)
        ? raw
        : await window.spravochnik.resolveImageStorageRef({
            departmentId: deptForCopy,
            ref: raw,
            contextTopicId: topicIdForCopy,
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
    })()
  }

  async function handleAnswerPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pastedText = e.clipboardData?.getData('text/plain') ?? ''
    const wrapped = wrapSelectionWithTopicLink(answer, pastedText, textareaRef.current)
    if (wrapped) {
      e.preventDefault()
      setAnswer(wrapped.next)
      clearPicker()
      focusCursor(textareaRef.current, wrapped.cursor)
      return
    }
    const topicIdForPaste = mode === 'edit' && initial?.id != null ? initial.id : 0
    const deptForPaste = mode === 'edit' ? departmentId : targetDept
    const pastedImage = await insertPastedImageReferenceAsync(
      answer,
      pastedText,
      topicIdForPaste,
      deptForPaste,
      textareaRef.current,
    )
    if (pastedImage) {
      e.preventDefault()
      setAnswer(pastedImage.next)
      clearPicker()
      focusCursor(textareaRef.current, pastedImage.cursor)
      return
    }
    const pasteItems = e.clipboardData?.items
    if (!pasteItems) return
    let hasImage = false
    for (const item of Array.from(pasteItems)) {
      if (item.type.startsWith('image/')) {
        hasImage = true
        break
      }
    }
    if (!hasImage) return
    e.preventDefault()
    setError(null)
    try {
      const result = await window.spravochnik.saveTopicImageFromClipboard(imageOwnerPayload())
      if (!result) {
        setError('В буфере нет изображения')
        return
      }
      const markdown = `\n\n![](${result.markdownPath})`
      const { next, cursor } = insertAtCursor(answer, markdown, textareaRef.current)
      setAnswer(next)
      clearPicker()
      focusCursor(textareaRef.current, cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось вставить фото из буфера')
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
    if (showParty && party === 'additional' && attachClientLink && selectedClientTopicId == null) {
      setError('Выберите клиентскую тему или снимите галочку')
      return
    }
    if (showSubsectionPicker && !targetSubsectionId) {
      setError(
        sectionRequiredErrorMessage(targetDept, targetDeptSubsections.length > 0),
      )
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
        ...(showSubsectionPicker ? { subsection_id: targetSubsectionId } : {}),
        client_topic_id:
          showParty && party === 'additional'
            ? attachClientLink
              ? selectedClientTopicId
              : null
            : undefined,
        party: showParty ? party : undefined,
        id: initial?.id,
        draftId: mode === 'add' ? draftId : undefined,
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
          {mode === 'add' && (
            <label className={`field${attachParent ? ' is-inactive' : ''}`}>
              <span>Отдел</span>
              <select
                value={targetDept}
                disabled={attachParent}
                onChange={(e) => {
                  const next = e.target.value as DepartmentId
                  setTargetDept(next)
                  const nextSubs = editorSubsectionsForDepartment(subsections, next, party)
                  setTargetSubsectionId(nextSubs[0]?.id ?? '')
                  if (next !== 'support') {
                    setSelectedParentId(null)
                    setAttachParent(false)
                  }
                }}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showPartyPicker && (
            <label className="field">
              <span>Раздел</span>
              <select
                value={party}
                required
                onChange={(e) => handlePartyChange(e.target.value)}
              >
                {partySelectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showSubsectionPicker && (
            <label className="field">
              <span>{targetDept === 'support' ? 'Подраздел' : 'Раздел'}</span>
              <select
                value={targetSubsectionId}
                required
                onChange={(e) => setTargetSubsectionId(e.target.value)}
              >
                {targetDeptSubsections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
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
            items={parentPickerItems}
            excludeId={mode === 'edit' ? initial?.id ?? null : null}
            attach={attachParent}
            onAttachChange={setAttachParent}
            parentId={selectedParentId}
            onParentIdChange={handleParentIdChange}
          />

          {showParty && party === 'additional' && (
            <ParentTopicField
              items={clientLinkPickerItems}
              excludeId={mode === 'edit' ? initial?.id ?? null : null}
              attach={attachClientLink}
              onAttachChange={setAttachClientLink}
              parentId={selectedClientTopicId}
              onParentIdChange={setSelectedClientTopicId}
              checkboxLabel="Сделать админ частью другой темы"
              comboboxAriaLabel="Клиентская тема"
              pickAnyTopic
            />
          )}

          <label className="field">
            <span>Текст ответа (Markdown)</span>
            <TextareaWithNbspButton
              value={answer}
              onValueChange={setAnswer}
              textareaRef={textareaRef}
            >
              <textarea
                ref={textareaRef}
                className="viewer__textarea"
                value={answer}
                onChange={handleAnswerChange}
                onKeyDown={handleAnswerKeyDown}
                onSelect={(e) => syncLinkPickerFromTextarea(answer, e.currentTarget)}
                onClick={(e) => syncLinkPickerFromTextarea(answer, e.currentTarget)}
                onPaste={(e) => void handleAnswerPaste(e)}
                onCopy={handleAnswerCopy}
                rows={10}
                placeholder="Текст ответа. «+» — ссылка на тему. Фото и файлы (до 10 МБ) — кнопки ниже."
              />
            </TextareaWithNbspButton>
          </label>
          <TopicLinkPicker
            open={linkPicker}
            items={linkPickerItems}
            excludeId={mode === 'edit' ? initial?.id ?? null : null}
            onPick={pickTopicForLink}
            onClose={closePicker}
            onQueryChange={setPickerQuery}
          />

          <div className="modal__toolbar">
            <button type="button" className="btn btn-secondary" onClick={() => void insertPhoto()}>
              Вставить фото
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void insertFile()}>
              Вставить файл
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
