import { useState } from 'react'
import type { PublicUser } from '../types'

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

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') {
        const user = await window.spravochnik.login({ email, password })
        onAuthenticated(user)
      } else {
        const user = await window.spravochnik.register({
          name,
          email,
          password,
          passwordConfirm,
        })
        onAuthenticated(user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__brand">REST INFO</div>
        <p className="auth-card__sub">Корпоративный справочник</p>

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

          <label className="field">
            <span>Почта</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <PasswordField
            id="password"
            label="Пароль"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

        {mode === 'register' && (
          <p className="auth-hint">
            Зарегистрироваться можно только с почтой из белого списка. Админ выдаёт доступ в
            настройках.
          </p>
        )}
      </div>
    </div>
  )
}
