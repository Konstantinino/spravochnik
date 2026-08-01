import { useEffect, useState } from 'react'
import type { PublicUser, SyncStatus, UserRole } from '../types'
import { ROLE_LABELS } from '../types'

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [users, setUsers] = useState<PublicUser[]>([])
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [hasToken, setHasToken] = useState(false)

  async function reload() {
    const [u, w, s, sync] = await Promise.all([
      window.spravochnik.listUsers(),
      window.spravochnik.getWhitelist(),
      window.spravochnik.getAdminSettings(),
      window.spravochnik.getSyncStatus(),
    ])
    setUsers(u)
    setWhitelist(w)
    setHasToken(s.hasToken)
    setSyncStatus(sync)
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
    return window.spravochnik.onSyncStatus(setSyncStatus)
  }, [])

  async function changeRole(userId: string, role: UserRole) {
    setError(null)
    try {
      const next = await window.spravochnik.setUserRole({ userId, role })
      setUsers(next)
      setInfo('Роль обновлена. Не забудьте отправить изменения на Диск.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function addEmail() {
    setError(null)
    try {
      const next = await window.spravochnik.addWhitelist(newEmail)
      setWhitelist(next)
      setNewEmail('')
      setInfo('Почта добавлена в белый список')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function removeEmail(email: string) {
    setError(null)
    try {
      const next = await window.spravochnik.removeWhitelist(email)
      setWhitelist(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-page__bar">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Назад
        </button>
        <h1>Настройки</h1>
      </div>

      <div className="settings-page__content">
        {error && <div className="form-error">{error}</div>}
        {info && <div className="form-info">{info}</div>}

        <section className="settings-section">
          <h2>Подключение</h2>
          <p className="settings-sync-status">
            Статус: <strong>{syncStatus?.label ?? '—'}</strong>
            {hasToken ? '' : ' · токен не задан'}
          </p>
          <p className="muted settings-section__hint">
            OAuth-токен Яндекс.Диска задаётся на экране входа (шестерёнка в углу). Без токена
            синхронизация недоступна.
          </p>
        </section>

        <section className="settings-section">
          <h2>Пользователи и роли</h2>
          <table className="settings-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Почта</th>
                <th>Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                    >
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    Пока никто не зарегистрировался
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="settings-section">
          <h2>Белый список регистрации</h2>
          <p className="muted">Только эти почты могут создать аккаунт.</p>
          <div className="whitelist-add">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@company.ru"
            />
            <button type="button" className="btn btn-secondary" onClick={addEmail}>
              Добавить
            </button>
          </div>
          <ul className="whitelist">
            {whitelist.map((email) => (
              <li key={email}>
                <span>{email}</span>
                <button type="button" className="btn btn-ghost" onClick={() => removeEmail(email)}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
