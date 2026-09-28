import fs from 'node:fs'
import path from 'node:path'
import { getUserDataRoot } from './paths.js'

export const LOST_DEPARTMENT_ID = 'lost'
export const TEMPLATES_DEPARTMENT_ID = 'templates'

export const DEPARTMENTS_CONFIG_FILE = 'departments.json'

export interface StoredDepartment {
  id: string
  label: string
  fileName: string
  listKey: 'questions' | 'templates'
  sortOrder: number
  systemLocked?: boolean
}

export const DEFAULT_DEPARTMENTS: StoredDepartment[] = [
  {
    id: 'support',
    label: 'Тех. поддержка',
    fileName: 'guide.json',
    listKey: 'questions',
    sortOrder: 10,
  },
  {
    id: 'lawyers',
    label: 'Юристы',
    fileName: 'guide_lawyers.json',
    listKey: 'questions',
    sortOrder: 20,
  },
  {
    id: 'managers',
    label: 'Менеджеры',
    fileName: 'guide_managers.json',
    listKey: 'questions',
    sortOrder: 30,
  },
  {
    id: 'spp',
    label: 'СПП',
    fileName: 'guide_spp.json',
    listKey: 'questions',
    sortOrder: 40,
  },
  {
    id: 'templates',
    label: 'Шаблоны',
    fileName: 'templates.json',
    listKey: 'templates',
    sortOrder: 50,
    systemLocked: true,
  },
]

export function departmentFileName(id: string): string {
  if (id === 'support') return 'guide.json'
  if (id === TEMPLATES_DEPARTMENT_ID) return 'templates.json'
  return `guide_${id}.json`
}

function departmentsConfigPath(): string {
  return path.join(getUserDataRoot(), DEPARTMENTS_CONFIG_FILE)
}

function sortDepartments(list: StoredDepartment[]): StoredDepartment[] {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
}

export function readStoredDepartments(): StoredDepartment[] {
  const filePath = departmentsConfigPath()
  if (!fs.existsSync(filePath)) {
    return sortDepartments([...DEFAULT_DEPARTMENTS])
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
      departments?: StoredDepartment[]
    }
    if (!Array.isArray(raw.departments) || raw.departments.length === 0) {
      return sortDepartments([...DEFAULT_DEPARTMENTS])
    }
    const normalized = raw.departments.map((d) => ({
      id: String(d.id),
      label: String(d.label),
      fileName: departmentFileName(String(d.id)),
      listKey: d.listKey === 'templates' ? 'templates' : 'questions',
      sortOrder: Number.isFinite(d.sortOrder) ? Number(d.sortOrder) : 0,
      ...(d.systemLocked ? { systemLocked: true } : {}),
    })) as StoredDepartment[]
    return sortDepartments(normalized)
  } catch {
    return sortDepartments([...DEFAULT_DEPARTMENTS])
  }
}

export function writeStoredDepartments(departments: StoredDepartment[]): void {
  const root = getUserDataRoot()
  fs.mkdirSync(root, { recursive: true })
  const sorted = sortDepartments(
    departments.map((d) => ({
      ...d,
      fileName: departmentFileName(d.id),
    })),
  )
  fs.writeFileSync(
    departmentsConfigPath(),
    JSON.stringify({ departments: sorted }, null, 2),
    'utf8',
  )
}

export function getActiveDepartments(): StoredDepartment[] {
  return readStoredDepartments()
}

export function departmentById(id: string): StoredDepartment {
  const dept = getActiveDepartments().find((d) => d.id === id)
  if (!dept) throw new Error(`Неизвестный отдел: ${id}`)
  return dept
}

export function isLostDepartmentId(id: string): boolean {
  return id === LOST_DEPARTMENT_ID
}

export function ensureGuideFileForDepartment(dept: StoredDepartment): void {
  const filePath = path.join(getUserDataRoot(), dept.fileName)
  if (fs.existsSync(filePath)) return
  const empty: Record<string, unknown[]> = {
    [dept.listKey]: [],
  }
  fs.writeFileSync(filePath, JSON.stringify(empty, null, 2), 'utf8')
}

export type SyncDepartmentPayload = {
  id: string
  label: string
  listKey: 'questions' | 'templates'
  sortOrder: number
  systemLocked?: boolean
}

export function mergeDepartmentPatch(row: SyncDepartmentPayload): StoredDepartment[] {
  const current = readStoredDepartments()
  const idx = current.findIndex((d) => d.id === row.id)
  const next: StoredDepartment = {
    id: row.id,
    label: row.label,
    fileName: departmentFileName(row.id),
    listKey: row.listKey === 'templates' ? 'templates' : 'questions',
    sortOrder: row.sortOrder,
    ...(row.systemLocked ? { systemLocked: true } : {}),
  }
  ensureGuideFileForDepartment(next)
  const list =
    idx >= 0
      ? current.map((d, i) => (i === idx ? { ...d, ...next } : d))
      : [...current, next]
  writeStoredDepartments(list)
  return list
}

export function applyDepartmentsFromSync(rows: SyncDepartmentPayload[]): StoredDepartment[] {
  if (!rows.length) return getActiveDepartments()
  const mapped: StoredDepartment[] = rows.map((d) => ({
    id: d.id,
    label: d.label,
    fileName: departmentFileName(d.id),
    listKey: d.listKey === 'templates' ? 'templates' : 'questions',
    sortOrder: d.sortOrder,
    ...(d.systemLocked ? { systemLocked: true } : {}),
  }))
  for (const dept of mapped) {
    ensureGuideFileForDepartment(dept)
  }
  writeStoredDepartments(mapped)
  return mapped
}
