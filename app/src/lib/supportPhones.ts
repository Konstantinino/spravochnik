import { normalizeWorkDepartmentId } from '../types'

export interface SupportPhoneLine {
  label: string
  display: string
  tel: string
}

/** Телефоны по отделам (ключ — id отдела из шапки). */
export type SupportPhonesByDepartment = Record<string, SupportPhoneLine[]>

export const DEFAULT_SUPPORT_PHONES: SupportPhoneLine[] = [
  { label: 'Основной', display: '8 (347) 246-80-72', tel: '83472468072' },
  { label: 'Исходящий Битрикс24', display: '7 (967) 555-93-06', tel: '79675559306' },
  { label: 'Входящий Битрикс24', display: '8 (800) 302-65-72', tel: '88003026572' },
]

export function normalizeTelDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Форматирование для полоски и копирования (из цифр tel). */
export function formatSupportPhoneDisplay(tel: string): string {
  const d = normalizeTelDigits(tel)
  if (!d) return ''

  if (d.length === 11 && d.startsWith('8')) {
    return `8 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`
  }

  if (d.length === 11 && d.startsWith('7')) {
    return `7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`
  }

  if (d.length === 10) {
    return `8 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`
  }

  return d
}

export function normalizeSupportPhoneLines(
  raw: unknown,
  opts?: { fallbackToDefault?: boolean },
): SupportPhoneLine[] {
  const fallback = opts?.fallbackToDefault !== false
  if (!Array.isArray(raw)) return fallback ? [...DEFAULT_SUPPORT_PHONES] : []
  const out: SupportPhoneLine[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const label = String((item as SupportPhoneLine).label ?? '').trim()
    const tel = normalizeTelDigits(
      String((item as SupportPhoneLine).tel ?? (item as SupportPhoneLine).display ?? ''),
    )
    if (!label || tel.length < 3) continue
    if (out.length >= 6) break
    out.push({ label, tel, display: formatSupportPhoneDisplay(tel) })
  }
  if (out.length > 0) return out
  return fallback ? [...DEFAULT_SUPPORT_PHONES] : []
}

export function normalizeSupportPhones(raw: unknown): SupportPhonesByDepartment {
  if (Array.isArray(raw)) {
    return { support: normalizeSupportPhoneLines(raw) }
  }
  if (!raw || typeof raw !== 'object') {
    return { support: [...DEFAULT_SUPPORT_PHONES] }
  }
  let source = raw as Record<string, unknown>
  if (
    source.byDepartment &&
    typeof source.byDepartment === 'object' &&
    !Array.isArray(source.byDepartment)
  ) {
    source = source.byDepartment as Record<string, unknown>
  }
  const out: SupportPhonesByDepartment = {}
  for (const [key, value] of Object.entries(source)) {
    if (key === 'byDepartment' || !Array.isArray(value)) continue
    const deptId = normalizeWorkDepartmentId(key)
    const lines = normalizeSupportPhoneLines(value, { fallbackToDefault: false })
    if (lines.length > 0) out[deptId] = lines
  }
  return Object.keys(out).length > 0 ? out : {}
}

export function supportPhonesForDepartment(
  store: SupportPhonesByDepartment,
  departmentId: string,
): SupportPhoneLine[] {
  return store[normalizeWorkDepartmentId(departmentId)] ?? []
}
