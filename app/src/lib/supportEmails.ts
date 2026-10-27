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
