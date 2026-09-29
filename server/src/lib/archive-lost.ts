import type pg from 'pg'
import { query } from '../db/pool.js'

export const ARCHIVE_LOST_SUBSECTION_ID = 'support__archive__lost'
export const ARCHIVE_ARCHIVED_SUBSECTION_ID = 'support__archive__archived'

type Client = pg.PoolClient

export async function ensureArchiveArchivedSubsection(client?: Client): Promise<string> {
  const q = client ? client.query.bind(client) : query
  try {
    await q(
      `INSERT INTO department_subsections (id, department_id, label, sort_order, party, is_archive_lost, is_archive_archived)
       VALUES ($1, 'support', 'Архивированные', 3, NULL, false, true)
       ON CONFLICT (id) DO UPDATE SET label = 'Архивированные', is_archive_archived = true`,
      [ARCHIVE_ARCHIVED_SUBSECTION_ID],
    )
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code: string }).code
        : ''
    if (code === '42703') {
      await q(
        `INSERT INTO department_subsections (id, department_id, label, sort_order, party)
         VALUES ($1, 'support', 'Архивированные', 3, NULL)
         ON CONFLICT (id) DO UPDATE SET label = 'Архивированные'`,
        [ARCHIVE_ARCHIVED_SUBSECTION_ID],
      )
    } else {
      throw err
    }
  }
  return ARCHIVE_ARCHIVED_SUBSECTION_ID
}

export function resolveSupportArchiveSubsectionId(
  archived: boolean,
  wasArchived: boolean,
  currentSubsectionId: string | null,
  resolvedSubsectionId: string | null,
  archivedBucketId: string,
): string | null {
  if (archived && !wasArchived) return archivedBucketId
  if (!archived && wasArchived) {
    const cur = currentSubsectionId?.trim() ?? ''
    if (cur === archivedBucketId || cur === ARCHIVE_LOST_SUBSECTION_ID) return null
  }
  return resolvedSubsectionId
}

export async function ensureArchiveLostSubsection(client?: Client): Promise<string> {
  const q = client ? client.query.bind(client) : query
  try {
    await q(
      `INSERT INTO department_subsections (id, department_id, label, sort_order, party, is_archive_lost)
       VALUES ($1, 'support', 'Потерянные', 5, NULL, true)
       ON CONFLICT (id) DO UPDATE SET label = 'Потерянные', is_archive_lost = true`,
      [ARCHIVE_LOST_SUBSECTION_ID],
    )
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code: string }).code
        : ''
    if (code === '42703') {
      await q(
        `INSERT INTO department_subsections (id, department_id, label, sort_order, party)
         VALUES ($1, 'support', 'Потерянные', 5, NULL)
         ON CONFLICT (id) DO UPDATE SET label = 'Потерянные'`,
        [ARCHIVE_LOST_SUBSECTION_ID],
      )
    } else {
      throw err
    }
  }
  return ARCHIVE_LOST_SUBSECTION_ID
}

export async function moveTopicsToArchiveLostBySubsection(
  departmentId: string,
  subsectionId: string,
  client: Client,
): Promise<number> {
  const lostId = await ensureArchiveLostSubsection(client)
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
  const lostId = await ensureArchiveLostSubsection(client)
  const res = await client.query(
    `UPDATE topics SET archived = true, subsection_id = $3
      WHERE department_id = $1 AND party = $2 AND deleted_at IS NULL`,
    [departmentId, party, lostId],
  )
  return res.rowCount ?? 0
}
