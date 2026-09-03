import { useEffect, useRef, useState } from 'react'
import type { DepartmentId, PublicUser, SyncStatus, UpdateInfo, UserRole } from '../types'
import { DEPARTMENTS, ROLE_LABELS, isStaffRole } from '../types'

interface HeaderProps {
  departmentId: DepartmentId
  onDepartmentChange: (id: DepartmentId) => void
  onOpenSettings: () => void
  user: PublicUser
  syncStatus: SyncStatus
  canEdit: boolean
  onLogout: () => void
  onPush: () => void
  pushing: boolean
  interactionLocked?: boolean
}

export function Header({
  departmentId,
  onDepartmentChange,
  onOpenSettings,
  user,
  syncStatus,
  canEdit,
  onLogout,
  onPush,
  pushing,
  interactionLocked = false,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    let cancelled = false
    void window.spravochnik.getUpdateStatus().then((info) => {
      if (!cancelled) setUpdateInfo(info)
    })
    void window.spravochnik.checkForUpdates().then((info) => {
      if (!cancelled) setUpdateInfo(info)
    })
    const off = window.spravochnik.onUpdateStatus((info) => {
      setUpdateInfo(info)
    })
    return () => {
      cancelled = true
      off()
    }
  }, [])

  const showSync = canEdit && syncStatus.hasPendingChanges && !pushing && !interactionLocked
  const updateAvailable = Boolean(
    updateInfo?.available && updateInfo.remoteSetupPath,
  )

  async function handleDownloadUpdate() {
    if (!updateAvailable || downloading || interactionLocked) return
    setDownloading(true)
    try {
      const result = await window.spravochnik.downloadUpdate()
      if (result.canceled) return
      if (!result.ok && result.error) {
        window.alert(result.error)
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <header className={`app-header${interactionLocked ? ' app-header--locked' : ''}`}>
      <div className="app-header__brand">REST INFO</div>

      <div className="app-header__sync" title={syncStatus.detail || syncStatus.label}>
        <span className="app-header__sync-label">{syncStatus.label}</span>
        {showSync && (
          <button
            type="button"
            className="btn btn-header-sync"
            onClick={onPush}
            title="Отправить изменения на сервер"
          >
            Синхронизировать
          </button>
        )}
      </div>

      <label className="app-header__dept">
        <span className="visually-hidden">Отдел</span>
        {isStaffRole(user.role) ? (
          <select
            value={departmentId}
            onChange={(e) => onDepartmentChange(e.target.value as DepartmentId)}
            aria-label="Отдел"
            disabled={interactionLocked}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="app-header__dept-label" aria-label="Отдел">
            {DEPARTMENTS.find((d) => d.id === user.departmentId)?.label ??
              DEPARTMENTS.find((d) => d.id === departmentId)?.label ??
              'Отдел'}
          </span>
        )}
      </label>

      <div className="app-header__actions">
        {isStaffRole(user.role) && (
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenSettings}
            title="Настройки"
            aria-label="Настройки"
            disabled={interactionLocked}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.12.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.82 14.6a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.5.41 1.05.73 1.63.94l.36 2.54c.05.24.26.42.5.42h3.8c.24 0 .45-.18.5-.42l.36-2.54c.58-.22 1.12-.53 1.63-.94l2.39.96c.25.1.54 0 .68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"
              />
            </svg>
          </button>
        )}

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="icon-btn user-menu__trigger"
            onClick={() => {
              if (interactionLocked) return
              setMenuOpen((v) => !v)
            }}
            title="Профиль"
            aria-label="Профиль"
            disabled={interactionLocked}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"
              />
            </svg>
            {updateAvailable && (
              <span className="user-menu__badge" aria-label="Доступно обновление" />
            )}
          </button>
          {menuOpen && (
            <div className="user-menu__popup">
              <div className="user-menu__name">{user.name}</div>
              <div className="user-menu__email">{user.email}</div>
              <div className="user-menu__role">{ROLE_LABELS[user.role as UserRole]}</div>
              <button type="button" className="btn btn-secondary user-menu__logout" onClick={onLogout}>
                Выйти
              </button>
              {updateAvailable && (
                <button
                  type="button"
                  className="btn btn-primary user-menu__update"
                  onClick={() => void handleDownloadUpdate()}
                  disabled={downloading}
                  title={
                    updateInfo?.version
                      ? `Обновить до версии ${updateInfo.version}`
                      : 'Обновить приложение'
                  }
                >
                  {downloading ? 'Скачивание…' : 'Обновить'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
