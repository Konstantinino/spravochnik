import fs from 'node:fs'
import path from 'node:path'
import { getUserDataRoot } from './paths.js'
const DEFAULT_SUPPORT_SECTIONS = [
  { id: 'supplier', label: 'Поставщик', sortOrder: 10, systemLocked: true },
  { id: 'customer', label: 'Заказчик', sortOrder: 20, systemLocked: true },
  { id: 'errors', label: 'Ошибки', sortOrder: 30, systemLocked: true },
  { id: 'additional', label: 'Администратор', sortOrder: 40, systemLocked: true },
] as const

export const SUPPORT_SECTIONS_CONFIG_FILE = 'support-sections.json'

export interface StoredSupportSection {
  id: string
  label: string
  sortOrder: number
  systemLocked?: boolean
}

export type SyncSupportSectionPayload = StoredSupportSection

function configPath(): string {
  return path.join(getUserDataRoot(), SUPPORT_SECTIONS_CONFIG_FILE)
}

export function defaultSupportSections(): StoredSupportSection[] {
  return DEFAULT_SUPPORT_SECTIONS.map((row) => ({ ...row }))
}

export function readStoredSupportSections(): StoredSupportSection[] {
  const filePath = configPath()
  if (!fs.existsSync(filePath)) return defaultSupportSections()
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
      sections?: StoredSupportSection[]
    }
    if (!Array.isArray(raw.sections) || raw.sections.length === 0) return defaultSupportSections()
    return raw.sections
      .map((s) => ({
        id: String(s.id),
        label: String(s.label),
        sortOrder: Number.isFinite(s.sortOrder) ? Number(s.sortOrder) : 0,
        systemLocked: Boolean(s.systemLocked),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  } catch {
    return defaultSupportSections()
  }
}

export function writeStoredSupportSections(sections: StoredSupportSection[]): void {
  const root = getUserDataRoot()
  fs.mkdirSync(root, { recursive: true })
  const sorted = [...sections].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  )
  fs.writeFileSync(configPath(), JSON.stringify({ sections: sorted }, null, 2), 'utf8')
}

export function applySupportSectionsFromSync(rows: SyncSupportSectionPayload[]): StoredSupportSection[] {
  if (!rows.length) return readStoredSupportSections()
  const mapped = rows.map((s) => ({
    id: s.id,
    label: s.label,
    sortOrder: s.sortOrder,
    systemLocked: Boolean(s.systemLocked),
  }))
  writeStoredSupportSections(mapped)
  return mapped
}

export function mergeSupportSectionPatch(row: SyncSupportSectionPayload): StoredSupportSection[] {
  const current = readStoredSupportSections()
  const idx = current.findIndex((s) => s.id === row.id)
  const next: StoredSupportSection = {
    id: row.id,
    label: row.label,
    sortOrder: row.sortOrder,
    systemLocked: Boolean(row.systemLocked),
  }
  const list = idx >= 0 ? current.map((s, i) => (i === idx ? next : s)) : [...current, next]
  writeStoredSupportSections(list)
  return list
}

export function removeSupportSectionLocal(id: string): StoredSupportSection[] {
  const list = readStoredSupportSections().filter((s) => s.id !== id)
  writeStoredSupportSections(list.length ? list : defaultSupportSections())
  return readStoredSupportSections()
}
