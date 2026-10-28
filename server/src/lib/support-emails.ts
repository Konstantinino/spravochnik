import { query } from '../db/pool.js'
import { normalizeWorkDepartmentId } from './auth-utils.js'

export const SUPPORT_EMAILS_SYNC_KEY = 'support_emails'

export interface SupportEmailLine {
  label: string
  email: string
}

export type SupportEmailsByDepartment = Record<string, SupportEmailLine[]>

export const DEFAULT_SUPPORT_EMAILS: SupportEmailLine[] = [
  { label: 'Общий', email: 'support@r-est.ru' },
]

export function normalizeSupportEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isPlausibleSupportEmail(email: string): boolean {
  const normalized = normalizeSupportEmail(email)
  return normalized.includes('@') && normalized.length >= 5 && !/\s/.test(normalized)
}

export function normalizeSupportEmailLines(
  raw: unknown,
  opts?: { fallbackToDefault?: boolean },
): SupportEmailLine[] {
  const fallback = opts?.fallbackToDefault !== false
  if (!Array.isArray(raw)) return fallback ? [...DEFAULT_SUPPORT_EMAILS] : []
  const out: SupportEmailLine[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const label = String((item as SupportEmailLine).label ?? '').trim()
    const email = normalizeSupportEmail(String((item as SupportEmailLine).email ?? ''))
    if (!label || !isPlausibleSupportEmail(email)) continue
    if (out.length >= 6) break
    out.push({ label, email })
  }
  if (out.length > 0) return out
  return fallback ? [...DEFAULT_SUPPORT_EMAILS] : []
}

export function normalizeSupportEmails(raw: unknown): SupportEmailsByDepartment {
  if (Array.isArray(raw)) {
    return { support: normalizeSupportEmailLines(raw) }
  }
  if (!raw || typeof raw !== 'object') {
    return { support: [...DEFAULT_SUPPORT_EMAILS] }
  }
  let source = raw as Record<string, unknown>
  if (
    source.byDepartment &&
    typeof source.byDepartment === 'object' &&
    !Array.isArray(source.byDepartment)
  ) {
    source = source.byDepartment as Record<string, unknown>
  }
  const out: SupportEmailsByDepartment = {}
  for (const [key, value] of Object.entries(source)) {
    if (key === 'byDepartment' || !Array.isArray(value)) continue
    const deptId = normalizeWorkDepartmentId(key)
    const lines = normalizeSupportEmailLines(value, { fallbackToDefault: false })
    if (lines.length > 0) out[deptId] = lines
  }
  return Object.keys(out).length > 0 ? out : {}
}

export async function readSupportEmailsFromDb(): Promise<SupportEmailsByDepartment> {
  const result = await query<{ value: string }>(
    'SELECT value FROM sync_state WHERE key = $1',
    [SUPPORT_EMAILS_SYNC_KEY],
  )
  const row = result.rows[0]
  if (!row?.value) return { support: [...DEFAULT_SUPPORT_EMAILS] }
  try {
    const parsed = normalizeSupportEmails(JSON.parse(row.value))
    return Object.keys(parsed).length > 0 ? parsed : { support: [...DEFAULT_SUPPORT_EMAILS] }
  } catch {
    return { support: [...DEFAULT_SUPPORT_EMAILS] }
  }
}

export async function writeSupportEmailsToDb(
  emails: SupportEmailsByDepartment,
): Promise<SupportEmailsByDepartment> {
  const normalized = normalizeSupportEmails(emails)
  await query(
    `INSERT INTO sync_state (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [SUPPORT_EMAILS_SYNC_KEY, JSON.stringify(normalized)],
  )
  return normalized
}
