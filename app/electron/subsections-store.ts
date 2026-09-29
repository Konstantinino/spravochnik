import fs from 'node:fs'
import path from 'node:path'
import { getUserDataRoot } from './paths.js'
function normalizePartyField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export const SUBSECTIONS_CONFIG_FILE = 'subsections.json'

export interface StoredSubsection {
  id: string
  departmentId: string
  label: string
  sortOrder: number
  party?: string | null
  isArchiveLost?: boolean
  isArchiveArchived?: boolean
}

export type SyncSubsectionPayload = StoredSubsection

function subsectionsConfigPath(): string {
  return path.join(getUserDataRoot(), SUBSECTIONS_CONFIG_FILE)
}

function normalizeStoredSubsection(s: StoredSubsection): StoredSubsection {
  const partyRaw = s.party
  const party = normalizePartyField(partyRaw)
  return {
    id: String(s.id),
    departmentId: String(s.departmentId),
    label: String(s.label),
    sortOrder: Number.isFinite(s.sortOrder) ? Number(s.sortOrder) : 0,
    party,
    isArchiveLost: Boolean(s.isArchiveLost) || String(s.id) === 'support__archive__lost',
    isArchiveArchived:
      Boolean(s.isArchiveArchived) || String(s.id) === 'support__archive__archived',
  }
}

export function readStoredSubsections(): StoredSubsection[] {
  const filePath = subsectionsConfigPath()
  if (!fs.existsSync(filePath)) return []
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { subsections?: StoredSubsection[] }
    if (!Array.isArray(raw.subsections)) return []
    return raw.subsections.map(normalizeStoredSubsection).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
    )
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

function mergeSubsectionRecords(
  primary: StoredSubsection,
  extra: StoredSubsection,
): StoredSubsection {
  const a = normalizeStoredSubsection(primary)
  const b = normalizeStoredSubsection(extra)
  return normalizeStoredSubsection({
    ...a,
    ...b,
    party: b.party ?? a.party,
    isArchiveLost: b.isArchiveLost || a.isArchiveLost,
    isArchiveArchived: b.isArchiveArchived || a.isArchiveArchived,
  })
}

export function mergeSubsectionsLists(
  primary: StoredSubsection[],
  extra: StoredSubsection[],
): StoredSubsection[] {
  const byId = new Map<string, StoredSubsection>()
  for (const row of primary) byId.set(row.id, normalizeStoredSubsection(row))
  for (const row of extra) {
    const id = String(row.id)
    const prev = byId.get(id)
    byId.set(id, prev ? mergeSubsectionRecords(prev, row) : normalizeStoredSubsection(row))
  }
  return [...byId.values()].sort(
    (a, b) =>
      a.departmentId.localeCompare(b.departmentId) ||
      a.sortOrder - b.sortOrder ||
      a.id.localeCompare(b.id),
  )
}

export function applySubsectionsFromSync(rows: SyncSubsectionPayload[]): StoredSubsection[] {
  if (!rows.length) {
    return readStoredSubsections()
  }
  const merged = mergeSubsectionsLists(
    readStoredSubsections(),
    rows.map((s) => normalizeStoredSubsection(s)),
  )
  writeStoredSubsections(merged)
  return merged
}

/** Полная замена списка подразделов (принудительная синхронизация с сервера). */
export function replaceSubsectionsFromSync(rows: SyncSubsectionPayload[]): StoredSubsection[] {
  const mapped = rows.map((s) => normalizeStoredSubsection(s))
  writeStoredSubsections(mapped)
  return mapped
}

export function mergeSubsectionPatch(row: SyncSubsectionPayload): StoredSubsection[] {
  const current = readStoredSubsections()
  const idx = current.findIndex((s) => s.id === row.id)
  const next = normalizeStoredSubsection(row)
  const list = idx >= 0 ? current.map((s, i) => (i === idx ? next : s)) : [...current, next]
  writeStoredSubsections(list)
  return list
}

export function removeSubsectionLocal(id: string): StoredSubsection[] {
  const list = readStoredSubsections().filter((s) => s.id !== id)
  writeStoredSubsections(list)
  return list
}
