import fs from 'node:fs'
import path from 'node:path'
import { getUserDataRoot } from './paths.js'

export const SUBSECTIONS_CONFIG_FILE = 'subsections.json'

export interface StoredSubsection {
  id: string
  departmentId: string
  label: string
  sortOrder: number
}

export type SyncSubsectionPayload = StoredSubsection

function subsectionsConfigPath(): string {
  return path.join(getUserDataRoot(), SUBSECTIONS_CONFIG_FILE)
}

export function readStoredSubsections(): StoredSubsection[] {
  const filePath = subsectionsConfigPath()
  if (!fs.existsSync(filePath)) return []
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { subsections?: StoredSubsection[] }
    if (!Array.isArray(raw.subsections)) return []
    return raw.subsections
      .map((s) => ({
        id: String(s.id),
        departmentId: String(s.departmentId),
        label: String(s.label),
        sortOrder: Number.isFinite(s.sortOrder) ? Number(s.sortOrder) : 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  } catch {
    return []
  }
}

export function writeStoredSubsections(subsections: StoredSubsection[]): void {
  const root = getUserDataRoot()
  fs.mkdirSync(root, { recursive: true })
  const sorted = [...subsections].sort(
    (a, b) =>
      a.departmentId.localeCompare(b.departmentId) ||
      a.sortOrder - b.sortOrder ||
      a.id.localeCompare(b.id),
  )
  fs.writeFileSync(
    subsectionsConfigPath(),
    JSON.stringify({ subsections: sorted }, null, 2),
    'utf8',
  )
}

export function getSubsectionsForDepartment(departmentId: string): StoredSubsection[] {
  return readStoredSubsections().filter((s) => s.departmentId === departmentId)
}

export function applySubsectionsFromSync(rows: SyncSubsectionPayload[]): StoredSubsection[] {
  if (!rows.length) return readStoredSubsections()
  const mapped = rows.map((s) => ({
    id: s.id,
    departmentId: s.departmentId,
    label: s.label,
    sortOrder: s.sortOrder,
  }))
  writeStoredSubsections(mapped)
  return mapped
}

export function mergeSubsectionPatch(row: SyncSubsectionPayload): StoredSubsection[] {
  const current = readStoredSubsections()
  const idx = current.findIndex((s) => s.id === row.id)
  const next: StoredSubsection = {
    id: row.id,
    departmentId: row.departmentId,
    label: row.label,
    sortOrder: row.sortOrder,
  }
  const list =
    idx >= 0
      ? current.map((s, i) => (i === idx ? next : s))
      : [...current, next]
  writeStoredSubsections(list)
  return list
}

export function removeSubsectionLocal(id: string): StoredSubsection[] {
  const list = readStoredSubsections().filter((s) => s.id !== id)
  writeStoredSubsections(list)
  return list
}
