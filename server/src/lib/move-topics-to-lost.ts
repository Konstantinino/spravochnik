import type pg from 'pg'
import { LOST_DEPARTMENT_ID } from './departments.js'

type Client = pg.PoolClient

interface TopicMoveRow {
  id: number
  question: string
  answer: string
  parent_id: number | null
  client_topic_id: number | null
  has_children: boolean
  party: string | null
  archived: boolean
  sort_index: number | null
  image_display: Record<string, number> | null
  photos: unknown
  documents: unknown
  version: number
  updated_by: string | null
}

export async function moveDepartmentTopicsToLost(
  client: Client,
  fromDepartmentId: string,
): Promise<number> {
  const topicsRes = await client.query<TopicMoveRow>(
    `SELECT id, question, answer, parent_id, client_topic_id, has_children, party, archived,
            sort_index, image_display, photos, documents, version, updated_by
       FROM topics
      WHERE department_id = $1 AND deleted_at IS NULL
      ORDER BY id ASC`,
    [fromDepartmentId],
  )
  if (topicsRes.rows.length === 0) return 0

  const conflictRes = await client.query<{ id: number }>(
    `SELECT t.id FROM topics t
      WHERE t.department_id = $1
        AND EXISTS (
          SELECT 1 FROM topics l
           WHERE l.department_id = $2 AND l.id = t.id AND l.deleted_at IS NULL
        )`,
    [fromDepartmentId, LOST_DEPARTMENT_ID],
  )
  const needsRemap = conflictRes.rows.length > 0

  if (!needsRemap) {
    await client.query(
      `UPDATE topics SET department_id = $2, updated_at = NOW()
        WHERE department_id = $1 AND deleted_at IS NULL`,
      [fromDepartmentId, LOST_DEPARTMENT_ID],
    )
    await client.query(`UPDATE media_files SET department_id = $2 WHERE department_id = $1`, [
      fromDepartmentId,
      LOST_DEPARTMENT_ID,
    ])
    return topicsRes.rows.length
  }

  const maxRes = await client.query<{ max: string | null }>(
    `SELECT MAX(id) AS max FROM topics WHERE department_id = $1`,
    [LOST_DEPARTMENT_ID],
  )
  let nextId = maxRes.rows[0]?.max != null ? parseInt(String(maxRes.rows[0].max), 10) + 1 : 1
  const idMap = new Map<number, number>()
  for (const row of topicsRes.rows) {
    idMap.set(row.id, nextId++)
  }

  for (const row of topicsRes.rows) {
    const newId = idMap.get(row.id)!
    let parentId = row.parent_id
    if (parentId != null && idMap.has(parentId)) {
      parentId = idMap.get(parentId)!
    }

    await client.query(
      `INSERT INTO topics (
         department_id, id, question, answer, parent_id, client_topic_id, has_children,
         party, archived, sort_index, image_display, photos, documents, version, updated_by, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
       )`,
      [
        LOST_DEPARTMENT_ID,
        newId,
        row.question,
        row.answer,
        parentId,
        row.client_topic_id,
        row.has_children,
        row.party,
        row.archived,
        row.sort_index,
        row.image_display,
        row.photos,
        row.documents,
        row.version,
        row.updated_by,
      ],
    )

    await client.query(
      `UPDATE media_files SET department_id = $1, topic_id = $2
        WHERE department_id = $3 AND topic_id = $4`,
      [LOST_DEPARTMENT_ID, newId, fromDepartmentId, row.id],
    )
  }

  await client.query(`DELETE FROM topics WHERE department_id = $1`, [fromDepartmentId])
  return topicsRes.rows.length
}
