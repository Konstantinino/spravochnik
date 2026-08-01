import type { DepartmentId } from '../types'
import { DEPARTMENTS } from '../types'

const KEY_PREFIX = 'rest-info:department:'
const REMEMBER_KEY = 'rest-info:remember-logins'
/** Legacy single-account key */
const REMEMBER_KEY_LEGACY = 'rest-info:remember-login'

function isDepartmentId(value: string): value is DepartmentId {
  return DEPARTMENTS.some((d) => d.id === value)
}

export function loadSavedDepartment(userId: string): DepartmentId | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + userId)
    if (raw && isDepartmentId(raw)) return raw
  } catch {
    /* ignore */
  }
  return null
}

export function saveDepartment(userId: string, departmentId: DepartmentId): void {
  try {
    localStorage.setItem(KEY_PREFIX + userId, departmentId)
  } catch {
    /* ignore */
  }
}

export interface RememberedLogin {
  email: string
  password: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function writeLogins(list: RememberedLogin[]): void {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify(list))
}

/** All saved login accounts (newest first). Migrates legacy single entry. */
export function loadRememberedLogins(): RememberedLogin[] {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (raw) {
      const data = JSON.parse(raw) as unknown
      if (Array.isArray(data)) {
        return data.filter(
          (item): item is RememberedLogin =>
            item &&
            typeof item === 'object' &&
            typeof (item as RememberedLogin).email === 'string' &&
            typeof (item as RememberedLogin).password === 'string' &&
            Boolean((item as RememberedLogin).email.trim()),
        )
      }
    }

    const legacy = localStorage.getItem(REMEMBER_KEY_LEGACY)
    if (legacy) {
      const data = JSON.parse(legacy) as Partial<RememberedLogin>
      if (typeof data.email === 'string' && typeof data.password === 'string' && data.email) {
        const list = [{ email: data.email, password: data.password }]
        writeLogins(list)
        localStorage.removeItem(REMEMBER_KEY_LEGACY)
        return list
      }
    }
  } catch {
    /* ignore */
  }
  return []
}

/** Add or update account; moves it to the front of the list. */
export function upsertRememberedLogin(email: string, password: string): void {
  try {
    const normalized = normalizeEmail(email)
    if (!normalized) return
    const prev = loadRememberedLogins().filter((item) => normalizeEmail(item.email) !== normalized)
    writeLogins([{ email: email.trim(), password }, ...prev])
  } catch {
    /* ignore */
  }
}

export function findRememberedLogin(email: string): RememberedLogin | null {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  return loadRememberedLogins().find((item) => normalizeEmail(item.email) === normalized) ?? null
}

/** @deprecated use loadRememberedLogins / upsertRememberedLogin */
export function loadRememberedLogin(): RememberedLogin | null {
  return loadRememberedLogins()[0] ?? null
}

/** @deprecated */
export function saveRememberedLogin(email: string, password: string): void {
  upsertRememberedLogin(email, password)
}

/** @deprecated — do not wipe all accounts on guest login */
export function clearRememberedLogin(): void {
  /* kept for compatibility; no longer clears the list */
}
