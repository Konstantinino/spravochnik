import type pg from 'pg'
import { query } from '../db/pool.js'
import {
  LEGACY_SUPPORT_ARCHIVE_ARCHIVED,
  LEGACY_SUPPORT_ARCHIVE_LOST,
  archiveArchivedSubsectionId,
  archiveLostSubsectionId,
  ensureArchiveArchivedSubsection as ensureDeptArchiveArchived,
  ensureArchiveLostSubsection as ensureDeptArchiveLost,
  isAnyArchiveSubsectionId,
  moveTopicsToArchiveLostByParty as moveTopicsToArchiveLostByPartyDept,
} from './department-archive.js'

export const ARCHIVE_LOST_SUBSECTION_ID = LEGACY_SUPPORT_ARCHIVE_LOST
export const ARCHIVE_ARCHIVED_SUBSECTION_ID = LEGACY_SUPPORT_ARCHIVE_ARCHIVED

export function isSupportArchiveSubsectionId(subsectionId: unknown): boolean {
  return isAnyArchiveSubsectionId(subsectionId)
}

type Client = pg.PoolClient

export async function ensureArchiveArchivedSubsection(client?: Client): Promise<string> {
  return ensureDeptArchiveArchived('support', client)
}

export function resolveSupportArchiveSubsectionId(
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

export async function ensureArchiveLostSubsection(client?: Client): Promise<string> {
  return ensureDeptArchiveLost('support', client)
}

export { archiveArchivedSubsectionId, archiveLostSubsectionId }

export async function moveTopicsToArchiveLostBySubsection(
  departmentId: string,
  subsectionId: string,
  client: Client,
): Promise<number> {
  const lostId = await ensureDeptArchiveLost(departmentId, client)
  const res = await client.query(
    `UPDATE topics SET archived = true, subsection_id = $3
      WHERE department_id = $1 AND subsection_id = $2 AND deleted_at IS NULL`,
    [departmentId, subsectionId, lostId],
  )
  return res.rowCount ?? 0
}

export async function moveTopicsToArchiveLostByParty(
  departmentId: string,
  party: string,
  client: Client,
): Promise<number> {
  return moveTopicsToArchiveLostByPartyDept(departmentId, party, client)
}
