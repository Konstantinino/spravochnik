import { useEffect, useRef, useState } from 'react'
import type { PublicUser, SyncStatus } from '../types'
import {
  loadRememberedLogins,
  removeRememberedLogin,
  upsertRememberedLogin,
  type RememberedLogin,
} from '../lib/prefs'

interface AuthScreenProps {
  onAuthenticated: (user: PublicUser) => void
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="btn btn-ghost password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {visible ? 'Скрыть' : 'Показать'}
        </button>
      </div>
    </label>
  )
}

function ServerUrlForm({
  onSaved,
  compact,
}: {
  onSaved: () => void
  compact?: boolean
}) {
  const [serverUrl, setServerUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)

  useEffect(() => {
    void window.spravochnik.getServerUrl().then((r) => setServerUrl(r.serverUrl))
    void window.spravochnik.getSyncStatus().then(setSyncStatus)
    return window.spravochnik.onSyncStatus(setSyncStatus)
  }, [])

  async function saveUrl() {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await window.spravochnik.setServerUrl(serverUrl)
      setInfo('Адрес сервера сохранён')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={compact ? 'auth-token-panel' : 'auth-token-setup'}>
      {!compact && (
        <>
          <p className="auth-token-setup__lead">
            Укажите адрес REST INFO сервера (например https://restinfo.example.com).
            Без него нельзя войти — данные и аккаунты хранятся на сервере.
          </p>
          {syncStatus && (
            <div className="auth-sync" title={syncStatus.detail || syncStatus.label}>
              {syncStatus.label}
            </div>
          )}
        </>
      )}
      {compact && (
        <p className="muted">Можно изменить адрес сервера.</p>
      )}
      <label className="field">
        <span>URL сервера</span>
        <input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="https://restinfo.example.com"
          autoComplete="off"
          autoFocus={!compact}
        />
      </label>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => void saveUrl()}
        disabled={busy || !serverUrl.trim()}
      >
        {busy ? 'Сохранение…' : 'Сохранить'}
      </button>
      {error && <div className="form-error">{error}</div>}
      {info && <div className="form-info">{info}</div>}
    </div>
  )
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'server' | 'auth'>('loading')
  const [serverPanelOpen, setServerPanelOpen] = useState(false)

  const [savedLogins, setSavedLogins] = useState<RememberedLogin[]>(() => loadRememberedLogins())
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [emailMenuOpen, setEmailMenuOpen] = useState(false)
  const emailWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const { hasServer } = await window.spravochnik.hasServer()
        if (!cancelled) setPhase(hasServer ? 'auth' : 'server')
      } catch {
        if (!cancelled) setPhase('server')
      }
    })()
    void window.spravochnik.getSyncStatus().then(setSyncStatus)
    const unsub = window.spravochnik.onSyncStatus(setSyncStatus)
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!emailWrapRef.current?.contains(e.target as Node)) {
        setEmailMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  function handleEmailChange(value: string) {
    setEmail(value)
    if (!value.trim()) {
      setPassword('')
      setPasswordConfirm('')
      setEmailMenuOpen(savedLogins.length > 0)
    } else {
      setEmailMenuOpen(false)
    }
  }

  function pickSavedLogin(item: RememberedLogin) {
    setEmail(item.email)
    setPassword(item.password)
    setEmailMenuOpen(false)
    setRememberMe(true)
  }

  function forgetSavedLogin(item: RememberedLogin, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    removeRememberedLogin(item.email)
    const next = loadRememberedLogins()
    setSavedLogins(next)
    if (email.trim().toLowerCase() === item.email.trim().toLowerCase()) {
      setEmail('')
      setPassword('')
      setPasswordConfirm('')
    }
    if (next.length === 0) setEmailMenuOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') {
        const user = await window.spravochnik.login({
          email,
          password,
          rememberMe,
        })
        if (rememberMe) {
          upsertRememberedLogin(email.trim(), password)
          setSavedLogins(loadRememberedLogins())
        }
        onAuthenticated(user)
      } else {
        const user = await window.spravochnik.register({
          name,
          email,
          password,
          passwordConfirm,
          rememberMe,
        })
        if (rememberMe) {
          upsertRememberedLogin(email.trim(), password)
          setSavedLogins(loadRememberedLogins())
        }
        onAuthenticated(user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'loading') {
    return <div className="boot-screen">Загрузка…</div>
  }

  if (phase === 'server') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-card__brand">REST INFO</div>
          <p className="auth-card__sub">Подключение к серверу</p>
          <ServerUrlForm onSaved={() => setPhase('auth')} />
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__top">
          <button
            type="button"
            className="auth-gear"
            onClick={() => {
              setServerPanelOpen((v) => !v)
              setError(null)
            }}
            title="Адрес сервера"
            aria-label="Адрес сервера"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.12.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.82 14.6a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.5.41 1.05.73 1.63.94l.36 2.54c.05.24.26.42.5.42h3.8c.24 0 .45-.18.5-.42l.36-2.54c.58-.22 1.12-.53 1.63-.94l2.39.96c.25.1.54 0 .68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"
              />
            </svg>
          </button>
        </div>

        <div className="auth-card__brand">REST INFO</div>
        <p className="auth-card__sub">Корпоративный справочник</p>

        {syncStatus && (
          <div className="auth-sync" title={syncStatus.detail || syncStatus.label}>
            {syncStatus.label}
          </div>
        )}

        {serverPanelOpen && (
          <ServerUrlForm
            compact
            onSaved={() => {
              setServerPanelOpen(false)
            }}
          />
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => {
              setMode('register')
              setError(null)
            }}
          >
            Регистрация
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="field">
              <span>Имя</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          <div className="field auth-email-field" ref={emailWrapRef}>
            <span>Почта</span>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onFocus={() => {
                if (!email.trim() && savedLogins.length > 0) setEmailMenuOpen(true)
              }}
              onClick={() => {
                if (!email.trim() && savedLogins.length > 0) setEmailMenuOpen(true)
              }}
              autoComplete="off"
              required
              placeholder={savedLogins.length ? 'Выберите или введите почту' : undefined}
            />
            {emailMenuOpen && savedLogins.length > 0 && (
              <ul className="auth-email-menu" role="listbox">
                {savedLogins.map((item) => (
                  <li key={item.email} className="auth-email-menu__row">
                    <button
                      type="button"
                      className="auth-email-menu__item"
                      onClick={() => pickSavedLogin(item)}
                    >
                      {item.email}
                    </button>
                    <button
                      type="button"
                      className="auth-email-menu__remove"
                      onClick={(e) => forgetSavedLogin(item, e)}
                      aria-label={`Удалить сохранённый вход ${item.email}`}
                      title="Удалить сохранение"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <PasswordField
            id="password"
            label="Пароль"
            value={password}
            onChange={setPassword}
            autoComplete="off"
          />

          {mode === 'register' && (
            <PasswordField
              id="passwordConfirm"
              label="Подтверждение пароля"
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              autoComplete="new-password"
            />
          )}

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <label className="auth-remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Запомнить меня</span>
        </label>

        {mode === 'register' && (
          <p className="auth-hint">
            Зарегистрироваться можно только с почтой из белого списка на сервере.
          </p>
        )}
      </div>
    </div>
  )
}
