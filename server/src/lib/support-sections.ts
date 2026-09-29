import type pg from 'pg'
import { query } from '../db/pool.js'

export interface SupportSectionRecord {
  id: string
  label: string
  sortOrder: number
  systemLocked: boolean
}

type Client = pg.PoolClient

function isMissingTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '42P01'
  )
}

function slugifyLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return slug || 'section'
}

export async function listSupportSections(): Promise<SupportSectionRecord[]> {
  try {
    const result = await query<{
      id: string
      label: string
      sort_order: number
      system_locked: boolean
    }>(
      `SELECT id, label, sort_order, system_locked
         FROM support_topic_sections
        ORDER BY sort_order ASC, id ASC`,
    )
    return result.rows.map((row) => ({
      id: row.id,
      label: row.label,
      sortOrder: row.sort_order,
      systemLocked: Boolean(row.system_locked),
    }))
  } catch (err) {
    if (isMissingTable(err)) return []
    throw err
  }
}

export async function getSupportSectionById(id: string): Promise<SupportSectionRecord | null> {
  const rows = await listSupportSections()
  return rows.find((r) => r.id === id) ?? null
}

export async function isKnownSupportParty(party: string): Promise<boolean> {
  const rows = await listSupportSections()
  return rows.some((r) => r.id === party)
}

export async function nextSupportSectionSortOrder(client?: Client): Promise<number> {
  const q = client ? client.query.bind(client) : query
  const result = await q<{ max: string | null }>(
    `SELECT MAX(sort_order) AS max FROM support_topic_sections`,
  )
  const max = result.rows[0]?.max != null ? parseInt(String(result.rows[0].max), 10) : 0
  return Number.isFinite(max) ? max + 10 : 50
}

export async function allocateSupportSectionId(label: string, client?: Client): Promise<string> {
  const q = client ? client.query.bind(client) : query
  const base = slugifyLabel(label)
  let candidate = base
  let n = 2
  while (true) {
    const exists = await q<{ id: string }>(
      `SELECT id FROM support_topic_sections WHERE id = $1`,
      [candidate],
    )
    if (exists.rows.length === 0) return candidate
    candidate = `${base}_${n}`
    n += 1
  }
}

export function supportSectionToClient(row: SupportSectionRecord) {
  return {
    id: row.id,
    label: row.label,
    sortOrder: row.sortOrder,
    systemLocked: row.systemLocked,
  }
}
