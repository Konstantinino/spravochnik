import type pg from 'pg'
import { query } from '../db/pool.js'

type Client = pg.PoolClient

export const LEGACY_SUPPORT_ARCHIVE_LOST = 'support__archive__lost'
export const LEGACY_SUPPORT_ARCHIVE_ARCHIVED = 'support__archive__archived'

export function archiveLostSubsectionId(departmentId: string): string {
  if (departmentId === 'support') return LEGACY_SUPPORT_ARCHIVE_LOST
  return `${departmentId}__archive__lost`
}

export function archiveArchivedSubsectionId(departmentId: string): string {
  if (departmentId === 'support') return LEGACY_SUPPORT_ARCHIVE_ARCHIVED
  return `${departmentId}__archive__archived`
}

export function isDeptArchiveSubsectionId(
  departmentId: string,
  subsectionId: unknown,
): boolean {
  const sid = String(subsectionId ?? '').trim()
  if (!sid) return false
  return (
    sid === archiveLostSubsectionId(departmentId) ||
    sid === archiveArchivedSubsectionId(departmentId)
  )
}

export function isAnyArchiveSubsectionId(subsectionId: unknown): boolean {
  const sid = String(subsectionId ?? '').trim()
  if (!sid) return false
  if (sid === LEGACY_SUPPORT_ARCHIVE_LOST || sid === LEGACY_SUPPORT_ARCHIVE_ARCHIVED) {
    return true
  }
  return /__archive__(lost|archived)$/.test(sid)
}

export async function ensureArchiveArchivedSubsection(
  departmentId: string,
  client?: Client,
): Promise<string> {
  const id = archiveArchivedSubsectionId(departmentId)
  const q = client ? client.query.bind(client) : query
  await q(
    `INSERT INTO department_subsections (id, department_id, label, sort_order, party, is_archive_lost, is_archive_archived)
     VALUES ($1, $2, 'Архивированные', 9998, NULL, false, true)
     ON CONFLICT (id) DO UPDATE SET
       label = 'Архивированные',
       department_id = EXCLUDED.department_id,
       is_archive_archived = true,
       is_archive_lost = false`,
    [id, departmentId],
  )
  return id
}

export async function ensureArchiveLostSubsection(
  departmentId: string,
  client?: Client,
): Promise<string> {
  const id = archiveLostSubsectionId(departmentId)
  const q = client ? client.query.bind(client) : query
  await q(
    `INSERT INTO department_subsections (id, department_id, label, sort_order, party, is_archive_lost, is_archive_archived)
     VALUES ($1, $2, 'Потерянные', 9999, NULL, true, false)
     ON CONFLICT (id) DO UPDATE SET
       label = 'Потерянные',
       department_id = EXCLUDED.department_id,
       is_archive_lost = true,
       is_archive_archived = false`,
    [id, departmentId],
  )
  return id
}

export async function ensureDepartmentArchiveSubsections(
  departmentId: string,
  client?: Client,
): Promise<void> {
  await ensureArchiveArchivedSubsection(departmentId, client)
  await ensureArchiveLostSubsection(departmentId, client)
}

export function resolveArchiveSubsectionId(
  departmentId: string,
  archived: boolean,
  wasArchived: boolean,
  currentSubsectionId: string | null,
  resolvedSubsectionId: string | null,
  archivedBucketId: string,
): string | null {
  if (archived && !wasArchived) return archivedBucketId
  if (!archived && wasArchived) return resolvedSubsectionId
  return resolvedSubsectionId
}

export async function moveTopicsToArchiveLostByParty(
  departmentId: string,
  party: string,
  client: Client,
): Promise<number> {
  const lostId = await ensureArchiveLostSubsection(departmentId, client)
  const res = await client.query(
    `UPDATE topics SET archived = true, subsection_id = $3, party = $4
      WHERE department_id = $1 AND party = $2 AND deleted_at IS NULL`,
    [departmentId, party, lostId, party],
  )
  return res.rowCount ?? 0
}
