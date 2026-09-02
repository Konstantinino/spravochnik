import { Router } from 'express'
import type pg from 'pg'
import { query, withTransaction, bumpGlobalVersion } from '../db/pool.js'
import {
  acquireTopicLock,
  DEPARTMENTS,
  isValidDepartment,
  refreshHasChildren,
  releaseTopicLock,
  renewTopicLock,
  rowToGuideItem,
  type TopicRow,
} from '../lib/topics.js'
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js'

export const topicsRouter = Router()

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value
}

topicsRouter.get('/:dept/topics', async (req, res) => {
  try {
    const dept = param(req.params.dept)
    if (!isValidDepartment(dept)) {
      res.status(404).json({ error: 'Неизвестный отдел' })
      return
    }

    const result = await query<TopicRow>(
      `SELECT * FROM topics WHERE department_id = $1 AND deleted_at IS NULL ORDER BY id`,
      [dept],
    )

    const listKey = DEPARTMENTS[dept].listKey
    const items = result.rows.map(rowToGuideItem)
    res.json({ [listKey]: items, listKey, departmentId: dept })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

topicsRouter.post(
  '/:dept/topics/lock/:topicId',
  authMiddleware,
  requireRole('editor', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const dept = param(req.params.dept)
      const topicId = parseInt(param(req.params.topicId), 10)
      if (!isValidDepartment(dept) || !Number.isFinite(topicId)) {
        res.status(400).json({ error: 'Некорректные параметры' })
        return
      }

      const lock = await acquireTopicLock(dept, topicId, req.user!.id, req.user!.name)
      if (!lock.ok) {
        res.status(423).json({
          error: 'Тема редактируется другим пользователем',
          lockedBy: lock.lockedBy,
          lockedByName: lock.lockedByName,
        })
        return
      }
      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка' })
    }
  },
)

topicsRouter.post(
  '/:dept/topics/unlock/:topicId',
  authMiddleware,
  requireRole('editor', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const dept = param(req.params.dept)
      const topicId = parseInt(param(req.params.topicId), 10)
      await releaseTopicLock(dept, topicId, req.user!.id)
      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка' })
    }
  },
)

topicsRouter.post(
  '/:dept/topics/renew-lock/:topicId',
  authMiddleware,
  requireRole('editor', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const dept = param(req.params.dept)
      const topicId = parseInt(param(req.params.topicId), 10)
      await renewTopicLock(dept, topicId, req.user!.id)
      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка' })
    }
  },
)

topicsRouter.post(
  '/:dept/topics',
  authMiddleware,
  requireRole('editor', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const dept = param(req.params.dept)
      if (!isValidDepartment(dept)) {
        res.status(404).json({ error: 'Неизвестный отдел' })
        return
      }

      const item = req.body.item ?? req.body
      const question = String(item.question ?? '').trim()
      const answer = String(item.answer ?? '')
      const parentId =
        item.parent_id === null || item.parent_id === undefined
          ? null
          : parseInt(String(item.parent_id), 10)
      const party = dept === 'support' ? (item.party === 'customer' ? 'customer' : 'supplier') : null

      const topic = await withTransaction(async (client) => {
        const idRes = await client.query<{ next_id: number }>(
          `UPDATE topic_id_counters SET next_id = next_id + 1
           WHERE department_id = $1 RETURNING next_id - 1 AS next_id`,
          [dept],
        )
        const newId = idRes.rows[0]?.next_id ?? 1

        await client.query(
          `INSERT INTO topics (
             department_id, id, question, answer, parent_id, has_children, party,
             archived, image_display, photos, documents, version, updated_by
           ) VALUES ($1, $2, $3, $4, $5, false, $6, false, $7, $8, $9, 1, $10)`,
          [
            dept,
            newId,
            question,
            answer,
            parentId,
            party,
            item.image_display ? JSON.stringify(item.image_display) : null,
            JSON.stringify(item.photos ?? []),
            JSON.stringify(item.documents ?? []),
            req.user!.id,
          ],
        )

        await refreshHasChildren(dept, client)
        await bumpGlobalVersion(client)

        const result = await client.query<TopicRow>(
          `SELECT * FROM topics WHERE department_id = $1 AND id = $2`,
          [dept, newId],
        )
        return result.rows[0]
      })

      res.status(201).json({ topic: rowToGuideItem(topic) })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка создания темы' })
    }
  },
)

topicsRouter.put(
  '/:dept/topics/:topicId',
  authMiddleware,
  requireRole('editor', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const dept = param(req.params.dept)
      const topicId = parseInt(param(req.params.topicId), 10)
      if (!isValidDepartment(dept) || !Number.isFinite(topicId)) {
        res.status(400).json({ error: 'Некорректные параметры' })
        return
      }

      const expectedVersion = parseInt(String(req.headers['if-match'] ?? req.body.version ?? '0'), 10)
      const item = req.body.item ?? req.body

      const existing = await query<TopicRow>(
        `SELECT * FROM topics WHERE department_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [dept, topicId],
      )
      const current = existing.rows[0]
      if (!current) {
        res.status(404).json({ error: 'Тема не найдена' })
        return
      }

      if (expectedVersion > 0 && current.version !== expectedVersion) {
        res.status(409).json({
          error: 'Конфликт версий',
          serverTopic: rowToGuideItem(current),
          serverVersion: current.version,
        })
        return
      }

      const lock = await acquireTopicLock(dept, topicId, req.user!.id, req.user!.name)
      if (!lock.ok) {
        res.status(423).json({
          error: 'Тема редактируется другим пользователем',
          lockedBy: lock.lockedBy,
          lockedByName: lock.lockedByName,
        })
        return
      }

      const question = item.question !== undefined ? String(item.question) : current.question
      const answer = item.answer !== undefined ? String(item.answer) : current.answer
      const parentId =
        item.parent_id !== undefined
          ? item.parent_id === null
            ? null
            : parseInt(String(item.parent_id), 10)
          : current.parent_id
      const archived = item.archived !== undefined ? Boolean(item.archived) : current.archived
      const party =
        dept === 'support'
          ? item.party === 'customer'
            ? 'customer'
            : item.party === 'supplier'
              ? 'supplier'
              : current.party
          : null

      const updated = await withTransaction(async (client) => {
        await client.query(
          `UPDATE topics SET
             question = $3, answer = $4, parent_id = $5, party = $6, archived = $7,
             image_display = $8, photos = $9, documents = $10,
             version = version + 1, updated_at = NOW(), updated_by = $11
           WHERE department_id = $1 AND id = $2 AND deleted_at IS NULL`,
          [
            dept,
            topicId,
            question,
            answer,
            parentId,
            party,
            archived,
            item.image_display !== undefined
              ? JSON.stringify(item.image_display)
              : current.image_display
                ? JSON.stringify(current.image_display)
                : null,
            JSON.stringify(item.photos ?? current.photos ?? []),
            JSON.stringify(item.documents ?? current.documents ?? []),
            req.user!.id,
          ],
        )

        // Archive descendants if needed
        if (archived && !current.archived) {
          await archiveDescendants(client, dept, topicId)
        } else if (!archived && current.archived) {
          await unarchiveDescendants(client, dept, topicId)
        }

        await refreshHasChildren(dept, client)
        await bumpGlobalVersion(client)

        const result = await client.query<TopicRow>(
          `SELECT * FROM topics WHERE department_id = $1 AND id = $2`,
          [dept, topicId],
        )
        return result.rows[0]
      })

      await releaseTopicLock(dept, topicId, req.user!.id)
      res.json({ topic: rowToGuideItem(updated), version: updated.version })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка обновления' })
    }
  },
)

topicsRouter.delete(
  '/:dept/topics/:topicId',
  authMiddleware,
  requireRole('admin'),
  async (req: AuthRequest, res) => {
    try {
      const dept = param(req.params.dept)
      const topicId = parseInt(param(req.params.topicId), 10)

      await withTransaction(async (client) => {
        const toDelete = await collectDescendantIds(client, dept, topicId)
        toDelete.add(topicId)

        for (const id of toDelete) {
          await client.query(
            `UPDATE topics SET deleted_at = NOW(), version = version + 1, updated_at = NOW(), updated_by = $3
             WHERE department_id = $1 AND id = $2`,
            [dept, id, req.user!.id],
          )
        }
        await refreshHasChildren(dept, client)
        await bumpGlobalVersion(client)
      })

      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка удаления' })
    }
  },
)

async function collectDescendantIds(
  client: pg.PoolClient,
  dept: string,
  rootId: number,
): Promise<Set<number>> {
  const all = await client.query<{ id: number; parent_id: number | null }>(
    `SELECT id, parent_id FROM topics WHERE department_id = $1 AND deleted_at IS NULL`,
    [dept],
  )
  const byParent = new Map<number, number[]>()
  for (const row of all.rows) {
    if (row.parent_id == null) continue
    const arr = byParent.get(row.parent_id) ?? []
    arr.push(row.id)
    byParent.set(row.parent_id, arr)
  }
  const seen = new Set<number>()
  const stack = [...(byParent.get(rootId) ?? [])]
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    for (const child of byParent.get(id) ?? []) stack.push(child)
  }
  return seen
}

async function archiveDescendants(
  client: pg.PoolClient,
  dept: string,
  rootId: number,
): Promise<void> {
  const ids = await collectDescendantIds(client, dept, rootId)
  for (const id of ids) {
    await client.query(
      `UPDATE topics SET archived = true, version = version + 1, updated_at = NOW()
       WHERE department_id = $1 AND id = $2`,
      [dept, id],
    )
  }
}

async function unarchiveDescendants(
  client: pg.PoolClient,
  dept: string,
  rootId: number,
): Promise<void> {
  const ids = await collectDescendantIds(client, dept, rootId)
  for (const id of ids) {
    await client.query(
      `UPDATE topics SET archived = false, version = version + 1, updated_at = NOW()
       WHERE department_id = $1 AND id = $2`,
      [dept, id],
    )
  }
}
