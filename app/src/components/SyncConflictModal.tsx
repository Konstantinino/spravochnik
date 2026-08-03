import { useMemo, useState } from 'react'
import type { ConflictResolution, SyncConflictInfo } from '../types'

interface SyncConflictModalProps {
  conflicts: SyncConflictInfo[]
  onResolve: (resolutions: ConflictResolution[]) => Promise<void>
  onClose: () => void
}

export function SyncConflictModal({ conflicts, onResolve, onClose }: SyncConflictModalProps) {
  const [choices, setChoices] = useState<Record<string, 'local' | 'remote'>>(() => {
    const init: Record<string, 'local' | 'remote'> = {}
    for (const c of conflicts) init[`${c.fileName}:${c.id}`] = 'local'
    return init
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChosen = useMemo(
    () => conflicts.every((c) => choices[`${c.fileName}:${c.id}`]),
    [conflicts, choices],
  )

  async function handleApply() {
    setSaving(true)
    setError(null)
    try {
      const resolutions: ConflictResolution[] = conflicts.map((c) => ({
        fileName: c.fileName,
        id: c.id,
        choice: choices[`${c.fileName}:${c.id}`] ?? 'local',
      }))
      await onResolve(resolutions)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось применить')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sync-conflict-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-conflict-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="sync-conflict-title">Сводка конфликтов</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="modal__body">
          <p className="muted">
            Одни и те же темы изменены и у вас, и на Диске. Выберите версию для каждой.
          </p>
          <ul className="sync-conflict-list">
            {conflicts.map((c) => {
              const key = `${c.fileName}:${c.id}`
              return (
                <li key={key} className="sync-conflict-item">
                  <div className="sync-conflict-item__title">{c.title}</div>
                  <div className="sync-conflict-item__file">{c.fileName}</div>
                  <label className="sync-conflict-choice">
                    <input
                      type="radio"
                      name={key}
                      checked={choices[key] === 'local'}
                      onChange={() => setChoices((prev) => ({ ...prev, [key]: 'local' }))}
                    />
                    <span>
                      <strong>Оставить свою</strong>
                      <small>{c.localPreview}</small>
                    </span>
                  </label>
                  <label className="sync-conflict-choice">
                    <input
                      type="radio"
                      name={key}
                      checked={choices[key] === 'remote'}
                      onChange={() => setChoices((prev) => ({ ...prev, [key]: 'remote' }))}
                    />
                    <span>
                      <strong>Взять с Диска</strong>
                      <small>{c.remotePreview}</small>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="modal__actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Позже
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || !allChosen}
            onClick={() => void handleApply()}
          >
            {saving ? 'Применение…' : 'Применить и синхронизировать'}
          </button>
        </div>
      </div>
    </div>
  )
}
