import { query } from '../db/pool.js'

const LOCK_TTL_MS = 5 * 60 * 1000

export type SettingsOrderKind = 'sections' | 'emails' | 'phones'

const KIND_LABEL: Record<SettingsOrderKind, string> = {
  sections: 'разделов',
  emails: 'почт',
  phones: 'телефонов',
}

export function parseSettingsOrderKind(value: unknown): SettingsOrderKind | null {
  if (value === 'sections' || value === 'emails' || value === 'phones') return value
  return null
}

/** One lock per list. Phones of one department do not block emails or another department. */
export function settingsOrderLockKey(kind: SettingsOrderKind, departmentId: string): string {
  return `${kind}:${departmentId}`
}

export function settingsOrderLockedMessage(kind: SettingsOrderKind, lockedByName: string): string {
  const name = lockedByName.trim()
  if (name) return `Порядок ${KIND_LABEL[kind]} уже редактирует: ${name}`
  return `Порядок ${KIND_LABEL[kind]} уже редактируется в другом окне или приложении`
}

function normalizeOrderClientId(clientId: string | undefined | null): string {
  return typeof clientId === 'string' ? clientId.trim().slice(0, 128) : ''
}

type LockRow = { locked_by: string; locked_by_name: string; client_id: string | null }

function sameHolder(lock: LockRow, userId: string, clientId: string): boolean {
  return lock.locked_by === userId && (lock.client_id || '') === clientId
}

export async function acquireSettingsOrderLock(
  lockKey: string,
  userId: string,
  userName: string,
  clientId?: string | null,
): Promise<{ ok: true } | { ok: false; lockedBy: string; lockedByName: string }> {
  const cid = normalizeOrderClientId(clientId)
  await query('DELETE FROM settings_order_locks WHERE expires_at < NOW()')

  const existing = await query<LockRow>(
    `SELECT locked_by, locked_by_name, client_id FROM settings_order_locks
     WHERE lock_key = $1 AND expires_at > NOW()`,
    [lockKey],
  )
  const lock = existing.rows[0]
  if (lock && !sameHolder(lock, userId, cid)) {
    return { ok: false, lockedBy: lock.locked_by, lockedByName: lock.locked_by_name }
  }

  const expiresAt = new Date(Date.now() + LOCK_TTL_MS).toISOString()
  await query(
    `INSERT INTO settings_order_locks (lock_key, locked_by, locked_by_name, client_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (lock_key)
     DO UPDATE SET
       locked_by = $2,
       locked_by_name = $3,
       client_id = $4,
       locked_at = NOW(),
       expires_at = $5
     WHERE (
         settings_order_locks.locked_by = $2
         AND COALESCE(settings_order_locks.client_id, '') = $4
       )
       OR settings_order_locks.expires_at < NOW()`,
    [lockKey, userId, userName, cid, expiresAt],
  )

  const check = await query<LockRow>(
    `SELECT locked_by, locked_by_name, client_id FROM settings_order_locks WHERE lock_key = $1`,
    [lockKey],
  )
  const current = check.rows[0]
  if (current && !sameHolder(current, userId, cid)) {
    return { ok: false, lockedBy: current.locked_by, lockedByName: current.locked_by_name }
  }
  return { ok: true }
}

export async function releaseSettingsOrderLock(
  lockKey: string,
  userId: string,
  clientId?: string | null,
): Promise<void> {
  const cid = normalizeOrderClientId(clientId)
  if (cid) {
    await query(
      `DELETE FROM settings_order_locks
       WHERE lock_key = $1 AND locked_by = $2 AND (client_id = $3 OR client_id = '' OR client_id IS NULL)`,
      [lockKey, userId, cid],
    )
    return
  }
  await query(
    `DELETE FROM settings_order_locks WHERE lock_key = $1 AND locked_by = $2`,
    [lockKey, userId],
  )
}

export async function renewSettingsOrderLock(
  lockKey: string,
  userId: string,
  clientId?: string | null,
): Promise<void> {
  const cid = normalizeOrderClientId(clientId)
  const expiresAt = new Date(Date.now() + LOCK_TTL_MS).toISOString()
  if (cid) {
    await query(
      `UPDATE settings_order_locks SET expires_at = $2, locked_at = NOW()
       WHERE lock_key = $1 AND locked_by = $3
         AND (client_id = $4 OR client_id = '' OR client_id IS NULL)`,
      [lockKey, expiresAt, userId, cid],
    )
    return
  }
  await query(
    `UPDATE settings_order_locks SET expires_at = $2, locked_at = NOW()
     WHERE lock_key = $1 AND locked_by = $3`,
    [lockKey, expiresAt, userId],
  )
}

/** Caller must already hold the lock (reorder of sections). */
export async function requireSettingsOrderLock(
  lockKey: string,
  userId: string,
  clientId?: string | null,
): Promise<{ ok: true } | { ok: false; lockedByName: string }> {
  const cid = normalizeOrderClientId(clientId)
  await query('DELETE FROM settings_order_locks WHERE expires_at < NOW()')
  const existing = await query<LockRow>(
    `SELECT locked_by, locked_by_name, client_id FROM settings_order_locks
     WHERE lock_key = $1 AND expires_at > NOW()`,
    [lockKey],
  )
  const lock = existing.rows[0]
  if (!lock) return { ok: false, lockedByName: '' }
  if (lock.locked_by !== userId) return { ok: false, lockedByName: lock.locked_by_name }
  if (cid && lock.client_id && lock.client_id !== cid) {
    return { ok: false, lockedByName: lock.locked_by_name }
  }
  return { ok: true }
}

/** True when another person or another app window holds this list. */
export async function foreignSettingsOrderBlock(
  lockKey: string,
  userId: string,
  clientId?: string | null,
): Promise<{ blocked: false } | { blocked: true; lockedByName: string }> {
  const cid = normalizeOrderClientId(clientId)
  await query('DELETE FROM settings_order_locks WHERE expires_at < NOW()')
  const existing = await query<LockRow>(
    `SELECT locked_by, locked_by_name, client_id FROM settings_order_locks
     WHERE lock_key = $1 AND expires_at > NOW()`,
    [lockKey],
  )
  const lock = existing.rows[0]
  if (!lock) return { blocked: false }
  if (lock.locked_by === userId && (!cid || !lock.client_id || lock.client_id === cid)) {
    return { blocked: false }
  }
  return { blocked: true, lockedByName: lock.locked_by_name }
}
