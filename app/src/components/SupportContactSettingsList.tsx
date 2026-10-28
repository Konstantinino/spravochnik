import { useRef, useState } from 'react'
import type { SupportEmailLine } from '../lib/supportEmails'
import { normalizeSupportEmail } from '../lib/supportEmails'
import type { SupportPhoneLine } from '../lib/supportPhones'
import {
  formatSupportPhoneDisplay,
  normalizeTelDigits,
} from '../lib/supportPhones'
import { moveArrayItem } from '../lib/moveArrayItem'

type SupportContactSettingsListProps =
  | {
      kind: 'email'
      scopeKey: string
      rows: SupportEmailLine[]
      reorderMode: boolean
      onReorder: (next: SupportEmailLine[]) => void
      onUpdate: (index: number, patch: Partial<SupportEmailLine>) => void
      onRemove: (index: number) => void
    }
  | {
      kind: 'phone'
      scopeKey: string
      rows: SupportPhoneLine[]
      reorderMode: boolean
      onReorder: (next: SupportPhoneLine[]) => void
      onUpdate: (index: number, patch: Partial<SupportPhoneLine>) => void
      onRemove: (index: number) => void
    }

export function SupportContactSettingsList(props: SupportContactSettingsListProps) {
  const { kind, rows, reorderMode, onRemove } = props
  const dragFromRef = useRef<number | null>(null)
  const rowKeysRef = useRef<string[]>([])
  const scopeRef = useRef(props.scopeKey)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Assign row keys during render so the first keystroke does not change React keys
  // (useEffect ran after paint and remounted inputs on the next update).
  if (scopeRef.current !== props.scopeKey) {
    scopeRef.current = props.scopeKey
    rowKeysRef.current = []
  }
  const rowKeys = rowKeysRef.current
  while (rowKeys.length < rows.length) {
    rowKeys.push(`${kind}-${crypto.randomUUID()}`)
  }
  if (rowKeys.length > rows.length) {
    rowKeys.splice(rows.length)
  }

  function commitReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    rowKeysRef.current = moveArrayItem(rowKeysRef.current, fromIndex, toIndex)
    if (props.kind === 'email') {
      props.onReorder(moveArrayItem(props.rows, fromIndex, toIndex))
    } else {
      props.onReorder(moveArrayItem(props.rows, fromIndex, toIndex))
    }
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    if (!reorderMode) return
    dragFromRef.current = index
    setDraggingIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  function handleDragEnd() {
    dragFromRef.current = null
    setDraggingIndex(null)
    setDragOverIndex(null)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    if (!reorderMode || dragFromRef.current == null) return
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDrop(e: React.DragEvent, index: number) {
    if (!reorderMode) return
    e.preventDefault()
    const from = dragFromRef.current
    dragFromRef.current = null
    setDragOverIndex(null)
    if (from == null) return
    commitReorder(from, index)
  }

  return (
    <ul
      className={`support-phones-settings${reorderMode ? ' support-phones-settings--reorder' : ''}`}
    >
      {rows.map((row, index) => {
        const dragging = reorderMode && draggingIndex === index
        const dragOver = reorderMode && dragOverIndex === index
        return (
          <li
            key={rowKeys[index]}
            className={`support-phones-settings__row${dragging ? ' is-dragging' : ''}${
              dragOver ? ' is-drag-over' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={() => {
              if (dragOverIndex === index) setDragOverIndex(null)
            }}
            onDrop={(e) => handleDrop(e, index)}
          >
            {reorderMode ? (
              <button
                type="button"
                className="support-phones-settings__drag"
                draggable
                title="Перетащите для изменения порядка"
                aria-label="Перетащите строку"
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
              >
                ⋮⋮
              </button>
            ) : null}
            <label className="support-phones-settings__field">
              <span className="support-phones-settings__label">Название</span>
              <input
                type="text"
                value={row.label}
                disabled={reorderMode}
                onChange={(e) => props.onUpdate(index, { label: e.target.value })}
              />
            </label>
            {kind === 'email' ? (
              <label className="support-phones-settings__field">
                <span className="support-phones-settings__label">E-mail</span>
                <input
                  type="email"
                  value={(row as SupportEmailLine).email}
                  disabled={reorderMode}
                  onChange={(e) =>
                    props.onUpdate(index, { email: normalizeSupportEmail(e.target.value) })
                  }
                  placeholder="support@r-est.ru"
                  autoComplete="off"
                />
              </label>
            ) : (
              <label className="support-phones-settings__field">
                <span className="support-phones-settings__label">Номер (цифры)</span>
                <input
                  type="text"
                  value={(row as SupportPhoneLine).tel}
                  disabled={reorderMode}
                  onChange={(e) =>
                    props.onUpdate(index, {
                      tel: normalizeTelDigits(e.target.value),
                      display: formatSupportPhoneDisplay(e.target.value),
                    } as Partial<SupportPhoneLine>)
                  }
                  inputMode="numeric"
                  placeholder="83472468072"
                />
              </label>
            )}
            <button
              type="button"
              className="btn btn-ghost support-phones-settings__remove"
              onClick={() => onRemove(index)}
              disabled={reorderMode}
              title="Удалить строку"
            >
              Удалить
            </button>
          </li>
        )
      })}
    </ul>
  )
}
