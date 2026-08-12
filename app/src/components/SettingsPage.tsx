import { useEffect, useState } from 'react'
import type { PublicUser, SyncStatus, UserRole } from '../types'
import { ROLE_LABELS } from '../types'

/** Roles that can be assigned in settings (owner/admin is locked). */
const ASSIGNABLE_ROLES: UserRole[] = ['user', 'editor']

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
  const [ownerEmail, setOwnerEmail] = useState('')

  const [editUser, setEditUser] = useState<PublicUser | null>(null)
  const [editLogin, setEditLogin] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

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
    setOwnerEmail(s.ownerEmail)
    setSyncStatus(sync)
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
    return window.spravochnik.onSyncStatus((status) => {
      setSyncStatus(status)
      if (status.code === 'up_to_date' || status.code === 'pending') {
        void window.spravochnik.listUsers().then(setUsers).catch(() => undefined)
        void window.spravochnik.getWhitelist().then(setWhitelist).catch(() => undefined)
      }
    })
  }, [])

  async function changeRole(userId: string, role: UserRole) {
    setError(null)
    setInfo(null)
    try {
      const next = await window.spravochnik.setUserRole({ userId, role })
      setUsers(next)
      setInfo('Роль обновлена и отправлена на Яндекс.Диск.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function removeUser(userId: string, name: string) {
    if (!window.confirm(`Удалить пользователя «${name}»?`)) return
    setError(null)
    setInfo(null)
    try {
      const next = await window.spravochnik.deleteUser(userId)
      setUsers(next)
      setInfo('Пользователь удалён и изменения отправлены на Диск.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  function openEdit(u: PublicUser) {
    setEditUser(u)
    setEditLogin(u.email)
    setEditPassword('')
    setEditError(null)
  }

  function closeEdit() {
    if (editSaving) return
    setEditUser(null)
    setEditLogin('')
    setEditPassword('')
    setEditError(null)
  }

  async function applyEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setEditSaving(true)
    setEditError(null)
    setError(null)
    setInfo(null)
    try {
      const next = await window.spravochnik.updateUser({
        userId: editUser.id,
        email: editLogin,
        password: editPassword.trim() || undefined,
      })
      setUsers(next)
      setInfo('Данные пользователя обновлены и отправлены на Диск.')
      setEditUser(null)
      setEditLogin('')
      setEditPassword('')
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setEditSaving(false)
    }
  }

  async function addEmail() {
    setError(null)
    setInfo(null)
    try {
      const next = await window.spravochnik.addWhitelist(newEmail)
      setWhitelist(next)
      setNewEmail('')
      setInfo('Почта добавлена в белый список и отправлена на Диск.')
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.isOwner || u.role === 'admin' ? (
                      <span className="settings-role-locked" title="Роль владельца нельзя изменить">
                        {ROLE_LABELS.admin}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => void changeRole(u.id, e.target.value as UserRole)}
                        aria-label={`Роль ${u.name}`}
                      >
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="settings-table__actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => openEdit(u)}
                    >
                      Изменить
                    </button>
                    {!u.isOwner && u.role !== 'admin' && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void removeUser(u.id, u.name)}
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
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
            <button type="button" className="btn btn-secondary" onClick={() => void addEmail()}>
              Добавить
            </button>
          </div>
          <ul className="whitelist">
            {whitelist.map((email) => {
              const isOwner =
                ownerEmail && email.trim().toLowerCase() === ownerEmail.trim().toLowerCase()
              return (
                <li key={email}>
                  <span>{email}</span>
                  {!isOwner && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void removeEmail(email)}
                    >
                      Удалить
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {editUser && (
        <div className="modal-backdrop" role="presentation" onClick={closeEdit}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="modal__header">
              <h2 id="edit-user-title">Изменить аккаунт</h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeEdit}
                aria-label="Закрыть"
                disabled={editSaving}
              >
                ✕
              </button>
            </div>
            <form className="modal__body" onSubmit={(ev) => void applyEdit(ev)}>
              <p className="muted" style={{ marginTop: 0 }}>
                {editUser.name}
              </p>
              <label className="field">
                <span>Логин (почта)</span>
                <input
                  type="email"
                  value={editLogin}
                  onChange={(ev) => setEditLogin(ev.target.value)}
                  autoComplete="off"
                  required
                  disabled={editUser.isOwner || editSaving}
                />
              </label>
              <label className="field">
                <span>Пароль</span>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(ev) => setEditPassword(ev.target.value)}
                  autoComplete="new-password"
                  placeholder="Оставьте пустым, чтобы не менять"
                  disabled={editSaving}
                />
              </label>
              {editError && <div className="form-error">{editError}</div>}
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeEdit}
                  disabled={editSaving}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? 'Сохранение…' : 'Применить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
