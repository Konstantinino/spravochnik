import { useEffect, useState } from 'react'
import type { PublicUser, UserRole } from '../types'
import { ROLE_LABELS } from '../types'

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [users, setUsers] = useState<PublicUser[]>([])
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [token, setToken] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function reload() {
    const [u, w, s] = await Promise.all([
      window.spravochnik.listUsers(),
      window.spravochnik.getWhitelist(),
      window.spravochnik.getAdminSettings(),
    ])
    setUsers(u)
    setWhitelist(w)
    setToken(s.yandexToken)
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
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

  async function saveToken() {
    setBusy(true)
    setError(null)
    try {
      await window.spravochnik.setYandexToken(token)
      setInfo('Токен сохранён, запущена синхронизация')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
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
          <h2>Яндекс.Диск</h2>
          <p className="muted">
            OAuth-токен для папки <strong>REST INFO</strong>. После сохранения приложение
            синхронизирует данные в фоне.
          </p>
          <label className="field">
            <span>Токен</span>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="y0_..."
              autoComplete="off"
            />
          </label>
          <button type="button" className="btn btn-primary" onClick={saveToken} disabled={busy}>
            {busy ? 'Сохранение…' : 'Сохранить токен'}
          </button>
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
