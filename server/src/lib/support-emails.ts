import { query } from '../db/pool.js'

export const SUPPORT_EMAILS_SYNC_KEY = 'support_emails'

export interface SupportEmailLine {
  label: string
  email: string
}

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

export function normalizeSupportEmails(raw: unknown): SupportEmailLine[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SUPPORT_EMAILS]
  const out: SupportEmailLine[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const label = String((item as SupportEmailLine).label ?? '').trim()
    const email = normalizeSupportEmail(String((item as SupportEmailLine).email ?? ''))
    if (!label || !isPlausibleSupportEmail(email)) continue
    if (out.length >= 8) break
    out.push({ label, email })
  }
  return out.length > 0 ? out : [...DEFAULT_SUPPORT_EMAILS]
}

export async function readSupportEmailsFromDb(): Promise<SupportEmailLine[]> {
  const result = await query<{ value: string }>(
    'SELECT value FROM sync_state WHERE key = $1',
    [SUPPORT_EMAILS_SYNC_KEY],
  )
  const row = result.rows[0]
  if (!row?.value) return [...DEFAULT_SUPPORT_EMAILS]
  try {
    return normalizeSupportEmails(JSON.parse(row.value))
  } catch {
    return [...DEFAULT_SUPPORT_EMAILS]
  }
}

export async function writeSupportEmailsToDb(
  emails: SupportEmailLine[],
): Promise<SupportEmailLine[]> {
  const normalized = normalizeSupportEmails(emails)
  await query(
    `INSERT INTO sync_state (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [SUPPORT_EMAILS_SYNC_KEY, JSON.stringify(normalized)],
  )
  return normalized
}
