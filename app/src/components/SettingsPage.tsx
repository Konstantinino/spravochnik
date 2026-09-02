import { useEffect, useState } from 'react'
import type { LatestReleaseInfo, PublicUser, SyncStatus, UserRole } from '../types'
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
  const [ownerEmail, setOwnerEmail] = useState('')
  const [latestRelease, setLatestRelease] = useState<LatestReleaseInfo | null>(null)
  const [downloadingLatest, setDownloadingLatest] = useState(false)
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('')
  const [savingUser, setSavingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null)
  const [deletingUserInProgress, setDeletingUserInProgress] = useState(false)

  async function reload() {
    const [u, w, s, sync] = await Promise.all([
      window.spravochnik.listUsers(),
      window.spravochnik.getWhitelist(),
      window.spravochnik.getAdminSettings(),
      window.spravochnik.getSyncStatus(),
    ])
    setUsers(u)
    setWhitelist(w)
    setOwnerEmail(s.ownerEmail)
    setSyncStatus(sync)
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
    void window.spravochnik.getLatestRelease().then(setLatestRelease).catch(() => undefined)
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
      setInfo('Роль обновлена на сервере.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  function openDeleteUser(user: PublicUser) {
    setError(null)
    setInfo(null)
    setDeletingUser(user)
  }

  function closeDeleteUser() {
    setDeletingUser(null)
  }

  async function confirmDeleteUser() {
    if (!deletingUser) return
    setDeletingUserInProgress(true)
    setError(null)
    setInfo(null)
    try {
      const next = await window.spravochnik.deleteUser(deletingUser.id)
      setUsers(next)
      setInfo('Пользователь удалён на сервере.')
      closeDeleteUser()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setDeletingUserInProgress(false)
    }
  }

  function openEditUser(user: PublicUser) {
    setError(null)
    setInfo(null)
    setEditingUser(user)
    setEditName(user.name)
    setEditPassword('')
    setEditPasswordConfirm('')
  }

  function closeEditUser() {
    setEditingUser(null)
    setEditName('')
    setEditPassword('')
    setEditPasswordConfirm('')
  }

  async function saveEditedUser() {
    if (!editingUser) return
    const name = editName.trim()
    if (!name) {
      setError('Укажите имя')
      return
    }
    if (editPassword && editPassword.length < 6) {
      setError('Пароль не короче 6 символов')
      return
    }
    if (editPassword && editPassword !== editPasswordConfirm) {
      setError('Пароли не совпадают')
      return
    }

    setError(null)
    setInfo(null)
    setSavingUser(true)
    try {
      const next = await window.spravochnik.updateUser({
        userId: editingUser.id,
        name,
        ...(editPassword ? { password: editPassword } : {}),
      })
      setUsers(next)
      setInfo('Данные пользователя обновлены.')
      closeEditUser()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSavingUser(false)
    }
  }

  async function addEmail() {
    setError(null)
    setInfo(null)
    try {
      const next = await window.spravochnik.addWhitelist(newEmail)
      setWhitelist(next)
      setNewEmail('')
      setInfo('Почта добавлена в белый список на сервере.')
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

  const canDownloadLatest = Boolean(latestRelease?.downloadUrl || latestRelease?.remoteSetupPath)

  async function handleDownloadLatest() {
    if (!canDownloadLatest || downloadingLatest) return
    setError(null)
    setInfo(null)
    setDownloadingLatest(true)
    try {
      const result = await window.spravochnik.downloadLatestRelease()
      if (result.canceled) return
      if (!result.ok && result.error) {
        setError(result.error)
      } else if (result.ok) {
        setInfo('Установщик сохранён.')
      }
    } finally {
      setDownloadingLatest(false)
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
          </p>
          <p className="muted settings-section__hint">
            Адрес сервера задаётся на экране входа (шестерёнка в углу). Данные синхронизируются с
            вашим REST INFO сервером.
          </p>
        </section>

        <section className="settings-section">
          <h2>Приложение</h2>
          <p className="settings-app-download">
            Скачать последнюю версию приложения{' '}
            <button
              type="button"
              className="btn btn-primary settings-app-download__btn"
              onClick={() => void handleDownloadLatest()}
              disabled={downloadingLatest || !canDownloadLatest}
              title={
                latestRelease?.version
                  ? `Скачать REST INFO ${latestRelease.version}`
                  : 'Скачать установщик'
              }
            >
              {downloadingLatest ? 'Скачивание…' : 'Скачать'}
            </button>
          </p>
          {latestRelease?.version && (
            <p className="muted settings-section__hint">
              Последняя версия на сервере: {latestRelease.version}
            </p>
          )}
          {latestRelease?.error && !canDownloadLatest && (
            <p className="muted settings-section__hint">{latestRelease.error}</p>
          )}
        </section>

        <section className="settings-section">
          <h2>Пользователи и роли</h2>
          <p className="muted settings-section__hint">
            Владельцу роль админа закреплена. Остальным можно назначить читателя или редактора.
          </p>
          <table className="settings-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Почта</th>
                <th className="settings-table__controls-head">Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td className="settings-table__controls">
                    <div className="settings-table__controls-inner">
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
                      <button
                        type="button"
                        className="btn btn-ghost settings-table__edit-btn"
                        onClick={() => openEditUser(u)}
                      >
                        Изменить
                      </button>
                      {!u.isOwner && u.role !== 'admin' && (
                        <button
                          type="button"
                          className="btn btn-danger settings-table__delete-btn"
                          onClick={() => openDeleteUser(u)}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
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

      {deletingUser && (
        <div className="modal-backdrop" role="presentation" onClick={closeDeleteUser}>
          <div
            className="modal settings-user-delete-modal"
            role="dialog"
            aria-labelledby="settings-user-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2 id="settings-user-delete-title">Удалить пользователя?</h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeDeleteUser}
                disabled={deletingUserInProgress}
              >
                ✕
              </button>
            </div>
            <div className="modal__body">
              <p>
                Пользователь <strong>{deletingUser.name}</strong> ({deletingUser.email}) будет
                удалён. Это действие нельзя отменить.
              </p>
              <div className="settings-user-delete-modal__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDeleteUser}
                  disabled={deletingUserInProgress}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-danger settings-user-delete-modal__confirm"
                  onClick={() => void confirmDeleteUser()}
                  disabled={deletingUserInProgress}
                >
                  {deletingUserInProgress ? 'Удаление…' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-backdrop" role="presentation" onClick={closeEditUser}>
          <div
            className="modal settings-user-edit-modal"
            role="dialog"
            aria-labelledby="settings-user-edit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2 id="settings-user-edit-title">Изменить пользователя</h2>
              <button type="button" className="btn btn-ghost" onClick={closeEditUser}>
                ✕
              </button>
            </div>
            <div className="modal__body">
              <p className="muted settings-user-edit-modal__email">{editingUser.email}</p>
              <label className="field">
                <span>Имя</span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="field">
                <span>Новый пароль</span>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Оставьте пустым, если не меняете"
                  autoComplete="new-password"
                />
              </label>
              {editPassword && (
                <label className="field">
                  <span>Повтор пароля</span>
                  <input
                    type="password"
                    value={editPasswordConfirm}
                    onChange={(e) => setEditPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
              )}
              <div className="settings-user-edit-modal__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditUser}
                  disabled={savingUser}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void saveEditedUser()}
                  disabled={savingUser}
                >
                  {savingUser ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
