import { useEffect, useState } from 'react'
import type {
  LatestReleaseInfo,
  PublicUser,
  StorageStats,
  SyncStatus,
  UserRole,
  WhitelistEntry,
  WorkDepartmentId,
} from '../types'
import { ROLE_LABELS, WORK_DEPARTMENTS, normalizeWorkDepartmentId, isOwnerRole } from '../types'

function assignableRoles(actorIsOwner: boolean): UserRole[] {
  return actorIsOwner ? ['user', 'editor', 'admin'] : ['user', 'editor']
}

function userIsOwner(u: PublicUser): boolean {
  return Boolean(u.isOwner) || isOwnerRole(u.role)
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Б'
  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const digits = unit === 0 ? 0 : value >= 10 ? 1 : 2
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: digits })} ${units[unit]}`
}

function coerceWhitelist(raw: unknown): WhitelistEntry[] {
  if (!Array.isArray(raw)) return []
  const out: WhitelistEntry[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      const email = item.trim().toLowerCase()
      if (email.includes('@')) out.push({ email, departmentId: 'support' })
      continue
    }
    if (item && typeof item === 'object' && 'email' in item) {
      const email = String((item as { email: unknown }).email ?? '')
        .trim()
        .toLowerCase()
      if (!email.includes('@')) continue
      out.push({
        email,
        departmentId: normalizeWorkDepartmentId(
          (item as { departmentId?: unknown }).departmentId,
        ),
      })
    }
  }
  return out
}

function coerceUsers(raw: unknown): PublicUser[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const u = item as PublicUser
    return {
      ...u,
      id: String(u.id ?? ''),
      name: String(u.name ?? ''),
      email: String(u.email ?? ''),
      role: u.role,
      departmentId: normalizeWorkDepartmentId(u.departmentId),
      ...(u.isOwner || u.role === 'owner' ? { isOwner: true } : {}),
    }
  })
}

interface SettingsPageProps {
  onBack: () => void
  currentUser: PublicUser
  onCurrentUserChange: (user: PublicUser | null) => void
}

export function SettingsPage({ onBack, currentUser, onCurrentUserChange }: SettingsPageProps) {
  const [users, setUsers] = useState<PublicUser[]>([])
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newDepartmentId, setNewDepartmentId] = useState<WorkDepartmentId>('support')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [latestRelease, setLatestRelease] = useState<LatestReleaseInfo | null>(null)
  const [downloadingLatest, setDownloadingLatest] = useState(false)
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editDepartmentId, setEditDepartmentId] = useState<WorkDepartmentId>('support')
  const [editPassword, setEditPassword] = useState('')
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('')
  const [savingUser, setSavingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null)
  const [deletingUserInProgress, setDeletingUserInProgress] = useState(false)
  const [successorId, setSuccessorId] = useState('')
  const [transferringUser, setTransferringUser] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [storageError, setStorageError] = useState<string | null>(null)
  const [storageLoading, setStorageLoading] = useState(false)

  const actorIsOwner = userIsOwner(currentUser)

  function deptLabel(id: WorkDepartmentId): string {
    return WORK_DEPARTMENTS.find((d) => d.id === id)?.label ?? id
  }

  async function reload() {
    const [u, w, s, sync] = await Promise.all([
      window.spravochnik.listUsers(),
      window.spravochnik.getWhitelist(),
      window.spravochnik.getAdminSettings(),
      window.spravochnik.getSyncStatus(),
    ])
    setUsers(coerceUsers(u))
    setWhitelist(coerceWhitelist(w))
    setOwnerEmail(s.ownerEmail)
    setSyncStatus(sync)
    if (actorIsOwner) {
      setStorageLoading(true)
      setStorageError(null)
      try {
        setStorageStats(await window.spravochnik.getStorageStats())
      } catch (e) {
        setStorageStats(null)
        const raw = e instanceof Error ? e.message : ''
        const cleaned = raw.replace(/^Error invoking remote method '[^']+': (?:Error: )?/i, '')
        setStorageError(cleaned || 'Не удалось загрузить статистику места')
      } finally {
        setStorageLoading(false)
      }
    }
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
    void window.spravochnik.getLatestRelease().then(setLatestRelease).catch(() => undefined)
    return window.spravochnik.onSyncStatus((status) => {
      setSyncStatus(status)
      if (status.code === 'up_to_date' || status.code === 'pending') {
        void window.spravochnik
          .listUsers()
          .then((next) => setUsers(coerceUsers(next)))
          .catch(() => undefined)
        void window.spravochnik
          .getWhitelist()
          .then((next) => setWhitelist(coerceWhitelist(next)))
          .catch(() => undefined)
      }
    })
  }, [])

  async function changeRole(userId: string, role: UserRole) {
    setError(null)
    setInfo(null)
    try {
      const next = await window.spravochnik.setUserRole({ userId, role })
      setUsers(coerceUsers(next))
      setInfo('Роль обновлена на сервере.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  function openDeleteUser(user: PublicUser) {
    setError(null)
    setInfo(null)
    setDeletingUser(user)
    setSuccessorId('')
  }

  function closeDeleteUser() {
    setDeletingUser(null)
    setSuccessorId('')
  }

  async function confirmDeleteUser() {
    if (!deletingUser) return
    if (userIsOwner(deletingUser) && !successorId) {
      setError('Назначьте другого пользователя владельцем')
      return
    }
    setDeletingUserInProgress(true)
    setError(null)
    setInfo(null)
    try {
      const deletingSelf = deletingUser.id === currentUser.id
      const next = await window.spravochnik.deleteUser(
        userIsOwner(deletingUser)
          ? { userId: deletingUser.id, successorId }
          : deletingUser.id,
      )
      setUsers(coerceUsers(next))
      setInfo('Пользователь удалён на сервере.')
      closeDeleteUser()
      if (deletingSelf) {
        onCurrentUserChange(null)
        return
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setDeletingUserInProgress(false)
    }
  }

  async function confirmTransferOwnership() {
    if (!successorId) {
      setError('Выберите пользователя, которому передаёте владение')
      return
    }
    setTransferringUser(true)
    setError(null)
    setInfo(null)
    try {
      const next = await window.spravochnik.transferOwnership({ userId: successorId })
      setUsers(coerceUsers(next))
      setInfo('Владение передано. Ваша роль теперь админ.')
      setSuccessorId('')
      setTransferOpen(false)
      const me = await window.spravochnik.getCurrentUser()
      if (me) onCurrentUserChange(me)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setTransferringUser(false)
    }
  }

  function openEditUser(user: PublicUser) {
    setError(null)
    setInfo(null)
    setEditingUser(user)
    setEditName(user.name)
    setEditDepartmentId(normalizeWorkDepartmentId(user.departmentId))
    setEditPassword('')
    setEditPasswordConfirm('')
  }

  function closeEditUser() {
    setEditingUser(null)
    setEditName('')
    setEditDepartmentId('support')
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
      const result = await window.spravochnik.updateUser({
        userId: editingUser.id,
        name,
        departmentId: editDepartmentId,
        ...(editPassword ? { password: editPassword } : {}),
      })
      const nextUsers = Array.isArray(result)
        ? result
        : (result as { users?: PublicUser[] }).users
      const nextWhitelist = Array.isArray(result)
        ? undefined
        : (result as { whitelist?: WhitelistEntry[] }).whitelist

      const patchedUsers = coerceUsers(
        Array.isArray(nextUsers) && nextUsers.length > 0 ? nextUsers : users,
      ).map((u) =>
        u.id === editingUser.id ||
        u.email.trim().toLowerCase() === editingUser.email.trim().toLowerCase()
          ? { ...u, name, departmentId: editDepartmentId }
          : u,
      )
      setUsers(patchedUsers)

      const targetEmail = editingUser.email.trim().toLowerCase()
      const baseWl = nextWhitelist ? coerceWhitelist(nextWhitelist) : whitelist
      const hasEntry = baseWl.some((e) => e.email.trim().toLowerCase() === targetEmail)
      const patchedWl = hasEntry
        ? baseWl.map((e) =>
            e.email.trim().toLowerCase() === targetEmail
              ? { ...e, departmentId: editDepartmentId }
              : e,
          )
        : [...baseWl, { email: targetEmail, departmentId: editDepartmentId }]
      setWhitelist(patchedWl)

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
      const next = await window.spravochnik.addWhitelist({
        email: newEmail,
        departmentId: newDepartmentId,
      })
      setWhitelist(coerceWhitelist(next))
      setNewEmail('')
      setNewDepartmentId('support')
      setInfo('Почта добавлена в белый список на сервере.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function removeEmail(email: string) {
    setError(null)
    try {
      const next = await window.spravochnik.removeWhitelist(email)
      setWhitelist(coerceWhitelist(next))
      setInfo('Почта удалена из белого списка на сервере.')
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
            {actorIsOwner
              ? 'Вы можете назначить админов, редакторов и читателей. Владельца может изменить или удалить только владелец; удаление возможно после передачи владения.'
              : 'Админ управляет читателями и редакторами. Владельца может изменить или удалить только он сам.'}
          </p>
          <table className="settings-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Почта</th>
                <th>Отдел</th>
                <th className="settings-table__controls-head">Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const targetIsOwner = userIsOwner(u)
                const canEditProfile = actorIsOwner || !targetIsOwner
                const canDelete =
                  targetIsOwner ? actorIsOwner : !targetIsOwner
                const roleOptions = assignableRoles(actorIsOwner)
                const lockRole =
                  targetIsOwner || (!actorIsOwner && u.role === 'admin')
                return (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{deptLabel(normalizeWorkDepartmentId(u.departmentId))}</td>
                  <td className="settings-table__controls">
                    <div className="settings-table__controls-inner">
                      {lockRole ? (
                        <span
                          className="settings-role-locked"
                          title={
                            targetIsOwner
                              ? 'Роль владельца нельзя изменить здесь — передайте владение'
                              : 'Назначить или снять админа может только владелец'
                          }
                        >
                          {ROLE_LABELS[u.role] ?? (targetIsOwner ? ROLE_LABELS.owner : ROLE_LABELS.admin)}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => void changeRole(u.id, e.target.value as UserRole)}
                          aria-label={`Роль ${u.name}`}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="settings-table__actions">
                        {targetIsOwner && actorIsOwner && (
                          <button
                            type="button"
                            className="btn btn-ghost settings-table__edit-btn"
                            onClick={() => {
                              setError(null)
                              setInfo(null)
                              setSuccessorId('')
                              setTransferringUser(false)
                              setDeletingUser(null)
                              setTransferOpen(true)
                            }}
                          >
                            Передать
                          </button>
                        )}
                        {canEditProfile && (
                          <button
                            type="button"
                            className="btn btn-ghost settings-table__edit-btn"
                            onClick={() => openEditUser(u)}
                          >
                            Изменить
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="btn btn-danger settings-table__delete-btn"
                            onClick={() => openDeleteUser(u)}
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                )
              })}
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
            <select
              value={newDepartmentId}
              onChange={(e) => setNewDepartmentId(e.target.value as WorkDepartmentId)}
              aria-label="Отдел"
            >
              {WORK_DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-secondary" onClick={() => void addEmail()}>
              Добавить
            </button>
          </div>
          <ul className="whitelist">
            {whitelist.map((entry) => {
              const ownerFromUsers = users.find(userIsOwner)
              const protectedEmail = (
                ownerFromUsers?.email || ownerEmail
              )
                .trim()
                .toLowerCase()
              const isOwnerEntry =
                protectedEmail && entry.email.trim().toLowerCase() === protectedEmail
              return (
                <li key={entry.email}>
                  <span className="whitelist__email">{entry.email}</span>
                  <span className="muted whitelist__dept">{deptLabel(entry.departmentId)}</span>
                  {!isOwnerEntry ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void removeEmail(entry.email)}
                    >
                      Удалить
                    </button>
                  ) : (
                    <span className="btn btn-ghost whitelist__actions-spacer" aria-hidden="true">
                      Удалить
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {actorIsOwner && (
          <section className="settings-section">
            <h2>Место на сервере</h2>
            <p className="muted">
              Сколько занимают данные справочника: текст тем, фото и прикреплённые файлы.
            </p>
            {storageLoading && <p className="muted settings-section__hint">Подсчёт…</p>}
            {storageError && !storageLoading && (
              <p className="form-error settings-section__hint">{storageError}</p>
            )}
            {storageStats && !storageLoading && (
              <>
                <p className="storage-total">
                  Всего: <strong>{formatBytes(storageStats.totalBytes)}</strong>
                </p>
                <ul className="storage-depts">
                  {storageStats.departments.map((dept) => {
                    const total = dept.totalBytes
                    return (
                      <li key={dept.id} className="storage-dept">
                        <div className="storage-dept__head">
                          <span className="storage-dept__name">{dept.label}</span>
                          <strong>{formatBytes(total)}</strong>
                        </div>
                        <div
                          className="storage-bar"
                          title={`Текст ${formatBytes(dept.textBytes)}, фото ${formatBytes(dept.photoBytes)}, файлы ${formatBytes(dept.fileBytes)}`}
                        >
                          {total > 0 ? (
                            <>
                              <span
                                className="storage-bar__seg storage-bar__seg--text"
                                style={{
                                  flexGrow: dept.textBytes,
                                  flexBasis: 0,
                                  minWidth: dept.textBytes > 0 ? 3 : 0,
                                }}
                              />
                              <span
                                className="storage-bar__seg storage-bar__seg--photos"
                                style={{
                                  flexGrow: dept.photoBytes,
                                  flexBasis: 0,
                                  minWidth: dept.photoBytes > 0 ? 3 : 0,
                                }}
                              />
                              <span
                                className="storage-bar__seg storage-bar__seg--files"
                                style={{
                                  flexGrow: dept.fileBytes,
                                  flexBasis: 0,
                                  minWidth: dept.fileBytes > 0 ? 3 : 0,
                                }}
                              />
                            </>
                          ) : (
                            <span className="storage-bar__seg storage-bar__seg--empty" />
                          )}
                        </div>
                        <ul className="storage-dept__kinds">
                          <li>
                            <span className="storage-dot storage-dot--text" />
                            Текст <span>{formatBytes(dept.textBytes)}</span>
                          </li>
                          <li>
                            <span className="storage-dot storage-dot--photos" />
                            Фото <span>{formatBytes(dept.photoBytes)}</span>
                          </li>
                          <li>
                            <span className="storage-dot storage-dot--files" />
                            Файлы <span>{formatBytes(dept.fileBytes)}</span>
                          </li>
                        </ul>
                      </li>
                    )
                  })}
                  {storageStats.unassigned && (
                    <li className="storage-dept">
                      <div className="storage-dept__head">
                        <span className="storage-dept__name">Без отдела</span>
                        <strong>{formatBytes(storageStats.unassigned.totalBytes)}</strong>
                      </div>
                      <ul className="storage-dept__kinds">
                        <li>
                          <span className="storage-dot storage-dot--photos" />
                          Фото <span>{formatBytes(storageStats.unassigned.photoBytes)}</span>
                        </li>
                        <li>
                          <span className="storage-dot storage-dot--files" />
                          Файлы <span>{formatBytes(storageStats.unassigned.fileBytes)}</span>
                        </li>
                      </ul>
                    </li>
                  )}
                </ul>
              </>
            )}
          </section>
        )}
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
              {userIsOwner(deletingUser) && (
                <label className="field">
                  <span>Новый владелец</span>
                  <select
                    value={successorId}
                    onChange={(e) => setSuccessorId(e.target.value)}
                    aria-label="Новый владелец"
                  >
                    <option value="">Выберите пользователя</option>
                    {users
                      .filter((u) => u.id !== deletingUser.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </label>
              )}
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
                  disabled={
                    deletingUserInProgress ||
                    (userIsOwner(deletingUser) && !successorId)
                  }
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
                <span>Отдел</span>
                <select
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value as WorkDepartmentId)}
                >
                  {WORK_DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
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

      {transferOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            if (!transferringUser) setTransferOpen(false)
          }}
        >
          <div
            className="modal settings-user-delete-modal"
            role="dialog"
            aria-labelledby="settings-transfer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2 id="settings-transfer-title">Передать владение</h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setTransferOpen(false)}
                disabled={transferringUser}
              >
                ✕
              </button>
            </div>
            <div className="modal__body">
              <p>
                Вы перестанете быть владельцем и получите роль админа. Новый владелец сможет
                назначать админов и управлять вашей учётной записью.
              </p>
              <label className="field">
                <span>Новый владелец</span>
                <select
                  value={successorId}
                  onChange={(e) => setSuccessorId(e.target.value)}
                  aria-label="Новый владелец"
                >
                  <option value="">Выберите пользователя</option>
                  {users
                    .filter((u) => u.id !== currentUser.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </label>
              <div className="settings-user-delete-modal__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setTransferOpen(false)}
                  disabled={transferringUser}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void confirmTransferOwnership()}
                  disabled={transferringUser || !successorId}
                >
                  {transferringUser ? 'Передача…' : 'Передать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
