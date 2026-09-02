import { Router } from 'express'
import { query, getGlobalVersion } from '../db/pool.js'
import { DEPARTMENTS, rowToGuideItem, type TopicRow } from '../lib/topics.js'
import { authMiddleware, optionalAuth, type AuthRequest } from '../middleware/auth.js'

export const syncRouter = Router()

syncRouter.get('/changes', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const since = req.query.since ? String(req.query.since) : null
    const full = req.query.full === 'true' || !since

    const globalVersion = await getGlobalVersion()

    if (full) {
      const topicsResult = await query<TopicRow>(
        `SELECT * FROM topics WHERE deleted_at IS NULL ORDER BY department_id, id`,
      )
      const deletedResult = await query<{ department_id: string; id: number; deleted_at: string }>(
        `SELECT department_id, id, deleted_at FROM topics WHERE deleted_at IS NOT NULL`,
      )
      const mediaResult = await query<{
        relative_path: string
        sha256: string | null
        size_bytes: string | null
        updated_at: string
      }>(
        `SELECT relative_path, sha256, size_bytes, updated_at FROM media_files WHERE deleted_at IS NULL`,
      )

      const topicsByDept: Record<string, Record<string, unknown>[]> = {}
      for (const dept of Object.keys(DEPARTMENTS)) {
        topicsByDept[dept] = []
      }
      for (const row of topicsResult.rows) {
        topicsByDept[row.department_id]?.push(rowToGuideItem(row))
      }

      let users: unknown[] = []
      let whitelist: string[] = []
      if (req.user) {
        const usersRes = await query(
          'SELECT id, name, email, role, created_at FROM users ORDER BY created_at',
        )
        users = usersRes.rows
        const wlRes = await query<{ email: string }>('SELECT email FROM whitelist ORDER BY email')
        whitelist = wlRes.rows.map((r) => r.email)
      }

      res.json({
        full: true,
        globalVersion,
        syncedAt: new Date().toISOString(),
        topicsByDept,
        deletedTopics: deletedResult.rows,
        media: mediaResult.rows,
        users,
        whitelist,
      })
      return
    }

    const sinceDate = new Date(since!)
    if (Number.isNaN(sinceDate.getTime())) {
      res.status(400).json({ error: 'Некорректный параметр since' })
      return
    }

    const changedTopics = await query<TopicRow>(
      `SELECT * FROM topics WHERE updated_at > $1 ORDER BY department_id, id`,
      [sinceDate.toISOString()],
    )
    const deletedTopics = await query<{ department_id: string; id: number; deleted_at: string }>(
      `SELECT department_id, id, deleted_at FROM topics WHERE deleted_at > $1`,
      [sinceDate.toISOString()],
    )
    const changedMedia = await query<{
      relative_path: string
      sha256: string | null
      size_bytes: string | null
      updated_at: string
      deleted_at: string | null
    }>(
      `SELECT relative_path, sha256, size_bytes, updated_at, deleted_at FROM media_files WHERE updated_at > $1`,
      [sinceDate.toISOString()],
    )

    const topicsByDept: Record<string, Record<string, unknown>[]> = {}
    const deletedByDept: Record<string, Record<string, unknown>[]> = {}
    for (const dept of Object.keys(DEPARTMENTS)) {
      topicsByDept[dept] = []
      deletedByDept[dept] = []
    }

    for (const row of changedTopics.rows) {
      if (row.deleted_at) {
        deletedByDept[row.department_id]?.push({
          id: row.id,
          deleted_at: row.deleted_at,
        })
      } else {
        topicsByDept[row.department_id]?.push(rowToGuideItem(row))
      }
    }

    let users: unknown[] = []
    let whitelist: string[] = []
    if (req.user) {
      const usersRes = await query(
        'SELECT id, name, email, role, created_at FROM users WHERE created_at > $1',
        [sinceDate.toISOString()],
      )
      users = usersRes.rows
      // Whitelist changes are rare — return full list for authenticated admin sync
      if ((req as AuthRequest).user?.role === 'admin') {
        const wlRes = await query<{ email: string }>('SELECT email FROM whitelist ORDER BY email')
        whitelist = wlRes.rows.map((r) => r.email)
      }
    }

    res.json({
      full: false,
      globalVersion,
      syncedAt: new Date().toISOString(),
      topicsByDept,
      deletedTopics: deletedTopics.rows,
      media: changedMedia.rows,
      users,
      whitelist,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка синхронизации' })
  }
})

syncRouter.get('/status', authMiddleware, async (_req, res) => {
  try {
    const globalVersion = await getGlobalVersion()
    res.json({ globalVersion, serverTime: new Date().toISOString() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})
