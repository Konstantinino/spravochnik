import { query } from '../db/pool.js'

export const LOST_DEPARTMENT_ID = 'lost'
export const TEMPLATES_DEPARTMENT_ID = 'templates'

export type DepartmentListKey = 'questions' | 'templates'

export interface DepartmentRecord {
  id: string
  label: string
  listKey: DepartmentListKey
  sortOrder: number
  systemLocked: boolean
}

const ID_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/

export function isDepartmentIdSlug(value: string): boolean {
  return ID_PATTERN.test(value)
}

export function isLostDepartmentId(id: string): boolean {
  return id === LOST_DEPARTMENT_ID
}

export function isTemplatesDepartmentId(id: string): boolean {
  return id === TEMPLATES_DEPARTMENT_ID
}

const LEGACY_DEPARTMENT_ORDER = [
  'support',
  'lawyers',
  'managers',
  'spp',
  'templates',
  LOST_DEPARTMENT_ID,
] as const

function legacySortOrder(id: string, index: number): number {
  const preset = LEGACY_DEPARTMENT_ORDER.indexOf(id as (typeof LEGACY_DEPARTMENT_ORDER)[number])
  if (preset >= 0) return (preset + 1) * 10
  return 100 + index * 10
}

function isMissingDepartmentsColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /sort_order|system_locked|column .* does not exist/i.test(msg)
}

async function listDepartmentsLegacy(): Promise<DepartmentRecord[]> {
  const result = await query<{
    id: string
    label: string
    list_key: DepartmentListKey
  }>(`SELECT id, label, list_key FROM departments ORDER BY id ASC`)
  return result.rows.map((row, index) => ({
    id: row.id,
    label: row.label,
    listKey: row.list_key,
    sortOrder: legacySortOrder(row.id, index),
    systemLocked: row.id === TEMPLATES_DEPARTMENT_ID || row.id === LOST_DEPARTMENT_ID,
  }))
}

export async function listDepartments(): Promise<DepartmentRecord[]> {
  try {
    const result = await query<{
      id: string
      label: string
      list_key: DepartmentListKey
      sort_order: number
      system_locked: boolean
    }>(
      `SELECT id, label, list_key, sort_order, system_locked
         FROM departments
        ORDER BY sort_order ASC, id ASC`,
    )
    return result.rows.map((row) => ({
      id: row.id,
      label: row.label,
      listKey: row.list_key,
      sortOrder: row.sort_order,
      systemLocked: row.system_locked,
    }))
  } catch (err) {
    if (!isMissingDepartmentsColumnError(err)) throw err
    return listDepartmentsLegacy()
  }
}

export async function getDepartmentById(id: string): Promise<DepartmentRecord | null> {
  const rows = await listDepartments()
  return rows.find((d) => d.id === id) ?? null
}

export async function isValidDepartmentId(id: string): Promise<boolean> {
  const dept = await getDepartmentById(id)
  return dept != null
}

export function isWorkDepartmentRecord(dept: DepartmentRecord): boolean {
  return dept.listKey === 'questions' && !isLostDepartmentId(dept.id)
}

export async function listWorkDepartmentIds(): Promise<string[]> {
  const rows = await listDepartments()
  return rows.filter(isWorkDepartmentRecord).map((d) => d.id)
}

export function normalizeWorkDepartmentIdFromList(
  value: unknown,
  workIds: readonly string[],
): string {
  if (typeof value === 'string' && workIds.includes(value)) return value
  if (workIds.includes('support')) return 'support'
  return workIds[0] ?? 'support'
}

/** Departments shown in settings (exclude system «Потерялись»). */
export function isEditableInSettings(dept: DepartmentRecord): boolean {
  return !isLostDepartmentId(dept.id)
}

export async function nextDepartmentSortOrder(): Promise<number> {
  try {
    const result = await query<{ max: string | null }>(
      `SELECT MAX(sort_order) AS max FROM departments WHERE id <> $1`,
      [LOST_DEPARTMENT_ID],
    )
    const max = result.rows[0]?.max != null ? parseInt(String(result.rows[0].max), 10) : 0
    return Number.isFinite(max) ? max + 10 : 100
  } catch (err) {
    if (!isMissingDepartmentsColumnError(err)) throw err
    const rows = await listDepartmentsLegacy()
    const max = rows.reduce((acc, row) => Math.max(acc, row.sortOrder), 0)
    return max + 10
  }
}
