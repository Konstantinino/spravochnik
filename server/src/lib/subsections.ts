import type pg from 'pg'
import { query } from '../db/pool.js'

export interface SubsectionRecord {
  id: string
  departmentId: string
  label: string
  sortOrder: number
}

type Client = pg.PoolClient

function slugifyLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return slug || 'part'
}

function isMissingSubsectionsTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '42P01'
  )
}

export async function listSubsections(departmentId?: string): Promise<SubsectionRecord[]> {
  try {
    const result = departmentId
      ? await query<{
          id: string
          department_id: string
          label: string
          sort_order: number
        }>(
          `SELECT id, department_id, label, sort_order
             FROM department_subsections
            WHERE department_id = $1
            ORDER BY sort_order ASC, id ASC`,
          [departmentId],
        )
      : await query<{
          id: string
          department_id: string
          label: string
          sort_order: number
        }>(
          `SELECT id, department_id, label, sort_order
             FROM department_subsections
            ORDER BY department_id ASC, sort_order ASC, id ASC`,
        )
    return result.rows.map((row) => ({
      id: row.id,
      departmentId: row.department_id,
      label: row.label,
      sortOrder: row.sort_order,
    }))
  } catch (err) {
    if (isMissingSubsectionsTable(err)) return []
    throw err
  }
}

export async function getSubsectionById(id: string): Promise<SubsectionRecord | null> {
  const result = await query<{
    id: string
    department_id: string
    label: string
    sort_order: number
  }>(
    `SELECT id, department_id, label, sort_order FROM department_subsections WHERE id = $1`,
    [id],
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    id: row.id,
    departmentId: row.department_id,
    label: row.label,
    sortOrder: row.sort_order,
  }
}

export async function nextSubsectionSortOrder(
  departmentId: string,
  client?: Client,
): Promise<number> {
  const q = client ? client.query.bind(client) : query
  const result = await q<{ max: string | null }>(
    `SELECT MAX(sort_order) AS max FROM department_subsections WHERE department_id = $1`,
    [departmentId],
  )
  const max = result.rows[0]?.max != null ? parseInt(String(result.rows[0].max), 10) : 0
  return Number.isFinite(max) ? max + 10 : 10
}

export async function allocateSubsectionId(
  departmentId: string,
  label: string,
  client?: Client,
): Promise<string> {
  const q = client ? client.query.bind(client) : query
  const base = `${departmentId}__${slugifyLabel(label)}`
  let candidate = base
  let n = 2
  while (true) {
    const exists = await q<{ id: string }>(
      `SELECT id FROM department_subsections WHERE id = $1`,
      [candidate],
    )
    if (exists.rows.length === 0) return candidate
    candidate = `${base}_${n}`
    n += 1
  }
}

export async function departmentHasSubsections(departmentId: string): Promise<boolean> {
  const rows = await listSubsections(departmentId)
  return rows.length > 0
}

export async function resolveTopicSubsectionId(
  departmentId: string,
  parentId: number | null,
  requested: unknown,
  client: Client,
): Promise<string | null> {
  const subs = await listSubsectionsForClient(client, departmentId)
  if (subs.length === 0) return null

  if (parentId != null) {
    const parentRes = await client.query<{ subsection_id: string | null }>(
      `SELECT subsection_id FROM topics
        WHERE department_id = $1 AND id = $2 AND deleted_at IS NULL`,
      [departmentId, parentId],
    )
    const inherited = parentRes.rows[0]?.subsection_id
    if (inherited && subs.some((s) => s.id === inherited)) return inherited
    return subs[0]!.id
  }

  const id = typeof requested === 'string' ? requested.trim() : ''
  if (!id || !subs.some((s) => s.id === id)) {
    const err = new Error('Выберите подраздел')
    ;(err as Error & { status: number }).status = 400
    throw err
  }
  return id
}

async function listSubsectionsForClient(
  client: Client,
  departmentId: string,
): Promise<SubsectionRecord[]> {
  const result = await client.query<{
    id: string
    department_id: string
    label: string
    sort_order: number
  }>(
    `SELECT id, department_id, label, sort_order
       FROM department_subsections
      WHERE department_id = $1
      ORDER BY sort_order ASC, id ASC`,
    [departmentId],
  )
  return result.rows.map((row) => ({
    id: row.id,
    departmentId: row.department_id,
    label: row.label,
    sortOrder: row.sort_order,
  }))
}

export function subsectionToClient(row: SubsectionRecord) {
  return {
    id: row.id,
    departmentId: row.departmentId,
    label: row.label,
    sortOrder: row.sortOrder,
  }
}
