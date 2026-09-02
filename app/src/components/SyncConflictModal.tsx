import { useMemo, useState } from 'react'
import type { ConflictResolution, SyncConflictInfo } from '../types'

interface SyncConflictModalProps {
  conflicts: SyncConflictInfo[]
  onResolve: (resolutions: ConflictResolution[]) => Promise<void>
  onClose: () => void
}

function diffLines(a: string, b: string): { left: string[]; right: string[] } {
  const leftLines = a.split('\n')
  const rightLines = b.split('\n')
  return { left: leftLines, right: rightLines }
}

function ComparePane({ title, text }: { title: string; text: string }) {
  return (
    <div className="sync-conflict-compare-pane">
      <h3>{title}</h3>
      <pre className="sync-conflict-compare-text">{text || '(пусто)'}</pre>
    </div>
  )
}

export function SyncConflictModal({ conflicts, onResolve, onClose }: SyncConflictModalProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [choices, setChoices] = useState<Record<string, 'local' | 'remote'>>(() => {
    const init: Record<string, 'local' | 'remote'> = {}
    for (const c of conflicts) init[`${c.fileName}:${c.id}`] = 'local'
    return init
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)

  const active = conflicts[activeIdx]

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
    } finally {
      setSaving(false)
    }
  }

  const localFull = active?.localFull
    ? `${active.localFull.question ?? ''}\n\n${active.localFull.answer ?? ''}`
    : active?.localPreview ?? ''
  const remoteFull = active?.remoteFull
    ? `${active.remoteFull.question ?? ''}\n\n${active.remoteFull.answer ?? ''}`
    : active?.remotePreview ?? ''

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
          <h2 id="sync-conflict-title">Конфликт версий</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="modal__body">
          <p className="muted">
            Одни и те же темы изменены и у вас, и на сервере. Выберите итоговую версию для каждой.
          </p>
          <ul className="sync-conflict-list">
            {conflicts.map((c, idx) => {
              const key = `${c.fileName}:${c.id}`
              return (
                <li
                  key={key}
                  className={`sync-conflict-item${idx === activeIdx ? ' is-active' : ''}`}
                >
                  <button
                    type="button"
                    className="sync-conflict-item__select"
                    onClick={() => setActiveIdx(idx)}
                  >
                    <div className="sync-conflict-item__title">{c.title}</div>
                    <div className="sync-conflict-item__file">{c.fileName}</div>
                  </button>
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
                      <strong>Взять с сервера</strong>
                      <small>{c.remotePreview}</small>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>

          {active && (
            <div className="sync-conflict-compare-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCompareOpen((v) => !v)}
              >
                {compareOpen ? 'Скрыть сравнение' : 'Сравнить версии рядом'}
              </button>
            </div>
          )}

          {compareOpen && active && (
            <div className="sync-conflict-compare-grid">
              <ComparePane title="Ваша версия" text={localFull} />
              <ComparePane title="Версия на сервере" text={remoteFull} />
            </div>
          )}

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

// suppress unused helper
void diffLines
