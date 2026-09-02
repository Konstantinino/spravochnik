export interface TopicRow {
  department_id: string
  id: number
  question: string
  answer: string
  parent_id: number | null
  has_children: boolean
  party: string | null
  archived: boolean
  image_display: Record<string, number> | null
  photos: unknown[]
  documents: unknown[]
  version: number
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
}

export function rowToGuideItem(row: TopicRow): Record<string, unknown> {
  const item: Record<string, unknown> = {
    id: row.id,
    question: row.question,
    answer: row.answer,
    parent_id: row.parent_id,
    has_children: row.has_children,
  }
  if (row.party) item.party = row.party
  if (row.archived) item.archived = true
  if (row.image_display && Object.keys(row.image_display).length > 0) {
    item.image_display = row.image_display
  }
  if (Array.isArray(row.photos) && row.photos.length > 0) item.photos = row.photos
  if (Array.isArray(row.documents) && row.documents.length > 0) item.documents = row.documents
  item.version = row.version
  item.updated_at = row.updated_at
  return item
}

export const DEPARTMENTS: Record<
  string,
  { label: string; listKey: 'questions' | 'templates' }
> = {
  support: { label: 'Тех. поддержка', listKey: 'questions' },
  lawyers: { label: 'Юристы', listKey: 'questions' },
  managers: { label: 'Менеджеры', listKey: 'questions' },
  spp: { label: 'СПП', listKey: 'questions' },
  templates: { label: 'Шаблоны', listKey: 'templates' },
}

export function isValidDepartment(id: string): boolean {
  return id in DEPARTMENTS
}

export async function refreshHasChildren(
  departmentId: string,
  client?: import('pg').PoolClient,
): Promise<void> {
  const q = client ? client.query.bind(client) : (await import('../db/pool.js')).query
  await q(
    `UPDATE topics t SET has_children = EXISTS (
       SELECT 1 FROM topics c
       WHERE c.department_id = t.department_id
         AND c.parent_id = t.id
         AND c.deleted_at IS NULL
     )
     WHERE t.department_id = $1 AND t.deleted_at IS NULL`,
    [departmentId],
  )
}

const LOCK_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function acquireTopicLock(
  departmentId: string,
  topicId: number,
  userId: string,
  userName: string,
): Promise<{ ok: true } | { ok: false; lockedBy: string; lockedByName: string }> {
  const { query } = await import('../db/pool.js')

  // Clean expired locks
  await query('DELETE FROM topic_locks WHERE expires_at < NOW()')

  const existing = await query<{
    locked_by: string
    locked_by_name: string
  }>(
    `SELECT locked_by, locked_by_name FROM topic_locks
     WHERE department_id = $1 AND topic_id = $2 AND expires_at > NOW()`,
    [departmentId, topicId],
  )

  const lock = existing.rows[0]
  if (lock && lock.locked_by !== userId) {
    return { ok: false, lockedBy: lock.locked_by, lockedByName: lock.locked_by_name }
  }

  const expiresAt = new Date(Date.now() + LOCK_TTL_MS).toISOString()
  await query(
    `INSERT INTO topic_locks (department_id, topic_id, locked_by, locked_by_name, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (department_id, topic_id)
     DO UPDATE SET locked_by = $3, locked_by_name = $4, locked_at = NOW(), expires_at = $5
     WHERE topic_locks.locked_by = $3 OR topic_locks.expires_at < NOW()`,
    [departmentId, topicId, userId, userName, expiresAt],
  )

  // Re-check
  const check = await query<{ locked_by: string; locked_by_name: string }>(
    `SELECT locked_by, locked_by_name FROM topic_locks
     WHERE department_id = $1 AND topic_id = $2`,
    [departmentId, topicId],
  )
  const current = check.rows[0]
  if (current && current.locked_by !== userId) {
    return { ok: false, lockedBy: current.locked_by, lockedByName: current.locked_by_name }
  }

  return { ok: true }
}

export async function releaseTopicLock(
  departmentId: string,
  topicId: number,
  userId: string,
): Promise<void> {
  const { query } = await import('../db/pool.js')
  await query(
    `DELETE FROM topic_locks WHERE department_id = $1 AND topic_id = $2 AND locked_by = $3`,
    [departmentId, topicId, userId],
  )
}

export async function renewTopicLock(
  departmentId: string,
  topicId: number,
  userId: string,
): Promise<void> {
  const { query } = await import('../db/pool.js')
  const expiresAt = new Date(Date.now() + LOCK_TTL_MS).toISOString()
  await query(
    `UPDATE topic_locks SET expires_at = $4, locked_at = NOW()
     WHERE department_id = $1 AND topic_id = $2 AND locked_by = $3`,
    [departmentId, topicId, userId, expiresAt],
  )
}
