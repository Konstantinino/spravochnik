import { Router, type Response } from 'express'
import path from 'node:path'
import type pg from 'pg'
import { query, bumpGlobalVersion, withTransaction } from '../db/pool.js'
import { fixMediaPaths } from '../lib/fix-media-paths.js'
import {
  generateSalt,
  hashPassword,
  isOwnerRole,
  isWorkDepartmentId,
  normalizeEmail,
  canManageTopicSectionsForDepartment,
  normalizeWorkDepartmentId,
  parseUserRole,
  type UserRole,
  type WorkDepartmentId,
} from '../lib/auth-utils.js'
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js'
import {
  getDepartmentById,
  isDepartmentIdSlug,
  isEditableInSettings,
  isLostDepartmentId,
  isTemplatesDepartmentId,
  listDepartments,
  nextDepartmentSortOrder,
} from '../lib/departments.js'
import { moveDepartmentTopicsToLost } from '../lib/move-topics-to-lost.js'
import {
  allocateSubsectionId,
  getSubsectionById,
  listSubsections,
  nextSubsectionSortOrder,
  subsectionToClient,
} from '../lib/subsections.js'
import {
  normalizeSupportPhones,
  readSupportPhonesFromDb,
  writeSupportPhonesToDb,
} from '../lib/support-phones.js'
import { requireCurrentClientVersion } from '../middleware/min-client-version.js'
import {
  moveTopicsToArchiveLostByParty,
} from '../lib/archive-lost.js'
import {
  allocateSupportSectionId,
  getSupportSectionById,
  listSupportSections,
  nextSupportSectionSortOrder,
  supportSectionToClient,
} from '../lib/support-sections.js'
import { isKnownSupportParty } from '../lib/support-sections.js'
import type { SupportParty } from '../lib/topics.js'

const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'kostya.alone18@yandex.ru'

export const adminRouter = Router()
adminRouter.use(authMiddleware, requireRole('admin', 'owner'))
adminRouter.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next()
    return
  }
  if (req.method === 'POST' && /\/releases\/?$/.test(req.path)) {
    next()
    return
  }
  void requireCurrentClientVersion(req, res, next)
})

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value
}

function denyTopicSectionsUnlessAllowed(
  req: AuthRequest,
  res: Response,
  departmentId: string,
): boolean {
  const user = req.user
  if (!user) {
    res.status(401).json({ error: 'Требуется авторизация' })
    return false
  }
  if (!canManageTopicSectionsForDepartment(user.role, user.departmentId, departmentId)) {
    res.status(403).json({
      error: 'Администратор может настраивать разделы только своего отдела',
    })
    return false
  }
  return true
}

function toPublicUser(row: {
  id: string
  name: string
  email: string
  role: string
  department_id?: string | null
}): {
  id: string
  name: string
  email: string
  role: UserRole
  departmentId: WorkDepartmentId
  isOwner?: boolean
} {
  const role = parseUserRole(row.role)
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    departmentId: normalizeWorkDepartmentId(row.department_id),
    ...(isOwnerRole(role) ? { isOwner: true } : {}),
  }
}

type WhitelistRow = { email: string; department_id: string }

function toWhitelistEntry(row: WhitelistRow): { email: string; departmentId: WorkDepartmentId } {
  return {
    email: row.email,
    departmentId: normalizeWorkDepartmentId(row.department_id),
  }
}

async function fetchWhitelist(): Promise<{ email: string; departmentId: WorkDepartmentId }[]> {
  const result = await query<WhitelistRow>(
    'SELECT email, department_id FROM whitelist ORDER BY email',
  )
  return result.rows.map(toWhitelistEntry)
}

async function fetchUsers() {
  const all = await query<{
    id: string
    name: string
    email: string
    role: string
    department_id: string
  }>('SELECT id, name, email, role, department_id FROM users ORDER BY created_at')
  return all.rows.map(toPublicUser)
}

async function fetchOwner(): Promise<{ id: string; email: string } | null> {
  const result = await query<{ id: string; email: string }>(
    'SELECT id, email FROM users WHERE role = $1 LIMIT 1',
    ['owner'],
  )
  return result.rows[0] ?? null
}

async function transferOwnershipInTx(
  client: pg.PoolClient,
  currentOwnerId: string,
  successorId: string,
): Promise<void> {
  if (currentOwnerId === successorId) {
    throw Object.assign(new Error('Нельзя передать владение самому себе'), { status: 400 })
  }
  const successor = await client.query<{ id: string; email: string; department_id: string }>(
    'SELECT id, email, department_id FROM users WHERE id = $1',
    [successorId],
  )
  if (!successor.rows[0]) {
    throw Object.assign(new Error('Пользователь для передачи владения не найден'), { status: 404 })
  }
  await client.query(`UPDATE users SET role = 'admin' WHERE id = $1 AND role = 'owner'`, [
    currentOwnerId,
  ])
  await client.query(`UPDATE users SET role = 'owner' WHERE id = $1`, [successorId])
  await client.query(
    `INSERT INTO whitelist (email, department_id) VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [
      normalizeEmail(successor.rows[0].email),
      normalizeWorkDepartmentId(successor.rows[0].department_id),
    ],
  )
}

adminRouter.get('/users', async (_req, res) => {
  try {
    res.json({ users: await fetchUsers() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.put('/users/:userId/role', async (req: AuthRequest, res) => {
  try {
    const actor = req.user!
    const userId = param(req.params.userId)
    const role = parseUserRole(req.body.role)
    const requested = String(req.body.role ?? '')

    if (requested === 'owner' || role === 'owner') {
      res.status(400).json({ error: 'Владение передаётся отдельным действием' })
      return
    }
    if (requested !== 'user' && requested !== 'editor' && requested !== 'admin') {
      res.status(400).json({ error: 'Недопустимая роль' })
      return
    }

    const userRes = await query<{ id: string; email: string; role: string }>(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId],
    )
    const user = userRes.rows[0]
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }
    if (isOwnerRole(user.role)) {
      res.status(400).json({ error: 'Нельзя менять роль владельца' })
      return
    }
    if (role === 'admin' && !isOwnerRole(actor.role)) {
      res.status(403).json({ error: 'Назначить админа может только владелец' })
      return
    }
    if (user.role === 'admin' && role !== 'admin' && !isOwnerRole(actor.role)) {
      res.status(403).json({ error: 'Снять роль админа может только владелец' })
      return
    }

    await query('UPDATE users SET role = $1 WHERE id = $2', [role, userId])
    await bumpGlobalVersion()

    res.json({ users: await fetchUsers() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.post('/transfer-ownership', async (req: AuthRequest, res) => {
  try {
    const actor = req.user!
    if (!isOwnerRole(actor.role)) {
      res.status(403).json({ error: 'Передать владение может только владелец' })
      return
    }
    const successorId = String(req.body.userId ?? req.body.successorId ?? '').trim()
    if (!successorId) {
      res.status(400).json({ error: 'Укажите пользователя, которому передаёте владение' })
      return
    }

    await withTransaction(async (client) => {
      await transferOwnershipInTx(client, actor.id, successorId)
      await bumpGlobalVersion(client)
    })

    res.json({ users: await fetchUsers() })
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 400 || status === 404) {
      res.status(status).json({ error: (err as Error).message })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.put('/users/:userId', async (req: AuthRequest, res) => {
  try {
    const actor = req.user!
    const userId = param(req.params.userId)
    const nameRaw = req.body.name
    const passwordRaw = req.body.password
    const departmentRaw = req.body.departmentId ?? req.body.department_id

    const userRes = await query<{ id: string; email: string; role: string }>(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId],
    )
    const user = userRes.rows[0]
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }
    if (isOwnerRole(user.role) && actor.id !== user.id) {
      res.status(403).json({ error: 'Владельца может изменить только он сам' })
      return
    }

    const updates: string[] = []
    const params: unknown[] = []
    let paramIdx = 1

    if (nameRaw !== undefined) {
      const name = String(nameRaw).trim()
      if (!name) {
        res.status(400).json({ error: 'Укажите имя' })
        return
      }
      updates.push(`name = $${paramIdx++}`)
      params.push(name)
    }

    if (passwordRaw !== undefined && String(passwordRaw).length > 0) {
      const password = String(passwordRaw)
      if (password.length < 6) {
        res.status(400).json({ error: 'Пароль не короче 6 символов' })
        return
      }
      const salt = generateSalt()
      updates.push(`password_hash = $${paramIdx++}`)
      params.push(hashPassword(password, salt))
      updates.push(`salt = $${paramIdx++}`)
      params.push(salt)
    }

    if (departmentRaw !== undefined) {
      if (!isWorkDepartmentId(departmentRaw)) {
        res.status(400).json({ error: 'Недопустимый отдел' })
        return
      }
      updates.push(`department_id = $${paramIdx++}`)
      params.push(departmentRaw)
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Нечего обновлять' })
      return
    }

    params.push(userId)
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params)

    if (departmentRaw !== undefined && isWorkDepartmentId(departmentRaw)) {
      const email = normalizeEmail(user.email)
      await query(
        `INSERT INTO whitelist (email, department_id) VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id`,
        [email, departmentRaw],
      )
      console.log(`[admin] user ${userId} department -> ${departmentRaw}`)
    }

    await bumpGlobalVersion()

    res.json({ users: await fetchUsers(), whitelist: await fetchWhitelist() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.delete('/users/:userId', async (req: AuthRequest, res) => {
  try {
    const actor = req.user!
    const userId = param(req.params.userId)
    const successorId = String(req.body?.successorId ?? '').trim()
    const userRes = await query<{ id: string; email: string; role: string }>(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId],
    )
    const user = userRes.rows[0]
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }

    if (isOwnerRole(user.role)) {
      if (actor.id !== user.id) {
        res.status(403).json({ error: 'Удалить владельца может только он сам' })
        return
      }
      if (!successorId) {
        res.status(400).json({
          error: 'Сначала назначьте другого пользователя владельцем',
        })
        return
      }
      const email = normalizeEmail(user.email)
      await withTransaction(async (client) => {
        await transferOwnershipInTx(client, user.id, successorId)
        await client.query('DELETE FROM users WHERE id = $1', [userId])
        await client.query(
          'INSERT INTO removed_emails (email) VALUES ($1) ON CONFLICT DO NOTHING',
          [email],
        )
        await bumpGlobalVersion(client)
      })
      res.json({ users: await fetchUsers() })
      return
    }

    const email = normalizeEmail(user.email)
    await query('DELETE FROM users WHERE id = $1', [userId])
    await query('INSERT INTO removed_emails (email) VALUES ($1) ON CONFLICT DO NOTHING', [email])
    await bumpGlobalVersion()

    res.json({ users: await fetchUsers() })
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 400 || status === 404) {
      res.status(status).json({ error: (err as Error).message })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.get('/whitelist', async (_req, res) => {
  try {
    res.json({ whitelist: await fetchWhitelist() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.put('/whitelist', async (req, res) => {
  try {
    const raw = Array.isArray(req.body.emails)
      ? req.body.emails
      : Array.isArray(req.body.whitelist)
        ? req.body.whitelist
        : []

    const byEmail = new Map<string, WorkDepartmentId>()
    for (const item of raw) {
      if (typeof item === 'string') {
        const email = normalizeEmail(item)
        if (email.includes('@')) byEmail.set(email, 'support')
        continue
      }
      if (item && typeof item === 'object') {
        const email = normalizeEmail(String((item as { email?: unknown }).email ?? ''))
        if (!email.includes('@')) continue
        byEmail.set(
          email,
          normalizeWorkDepartmentId((item as { departmentId?: unknown }).departmentId),
        )
      }
    }

    const owner = await fetchOwner()
    const mustKeep = owner ? normalizeEmail(owner.email) : normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
    if (!byEmail.has(mustKeep)) {
      byEmail.set(mustKeep, 'support')
    }

    await query('DELETE FROM whitelist')
    for (const [email, departmentId] of byEmail) {
      await query(
        'INSERT INTO whitelist (email, department_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [email, departmentId],
      )
    }
    await bumpGlobalVersion()

    res.json({ whitelist: await fetchWhitelist() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.post('/whitelist', async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body.email ?? ''))
    if (!email.includes('@')) {
      res.status(400).json({ error: 'Некорректная почта' })
      return
    }
    const departmentId = normalizeWorkDepartmentId(req.body.departmentId)
    await query(
      `INSERT INTO whitelist (email, department_id) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id`,
      [email, departmentId],
    )
    await bumpGlobalVersion()
    res.json({ whitelist: await fetchWhitelist() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.delete('/whitelist/:email', async (req, res) => {
  try {
    const email = normalizeEmail(decodeURIComponent(param(req.params.email)))
    const owner = await fetchOwner()
    const protectedEmail = owner
      ? normalizeEmail(owner.email)
      : normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
    if (email === protectedEmail) {
      res.status(400).json({ error: 'Нельзя удалить почту владельца' })
      return
    }
    await query('DELETE FROM whitelist WHERE email = $1', [email])
    await bumpGlobalVersion()
    res.json({ whitelist: await fetchWhitelist() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.post('/releases', async (req, res) => {
  try {
    const version = String(req.body.version ?? '').trim()
    const setupFilename = String(req.body.setupFilename ?? '').trim()
    const notes = String(req.body.notes ?? '').trim()

    if (!version || !setupFilename) {
      res.status(400).json({ error: 'Укажите version и setupFilename' })
      return
    }

    await query(
      `INSERT INTO app_releases (version, setup_filename, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (version) DO UPDATE SET setup_filename = $2, notes = $3, published_at = NOW()`,
      [version, setupFilename, notes],
    )

    res.json({ ok: true, version, setupFilename })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

function toByteCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n)) return Math.max(0, Math.round(n))
  }
  return 0
}

adminRouter.get('/storage-stats', requireRole('owner'), async (_req, res) => {
  try {
    const textResult = await query<{ department_id: string; bytes: string | number }>(
      `SELECT department_id,
              COALESCE(SUM(
                octet_length(COALESCE(question, '')) + octet_length(COALESCE(answer, ''))
              ), 0) AS bytes
         FROM topics
        WHERE deleted_at IS NULL
        GROUP BY department_id`,
    )

    const mediaResult = await query<{
      department_id: string | null
      kind: 'photos' | 'files'
      bytes: string | number
    }>(
      `WITH parsed AS (
         SELECT
           COALESCE(m.size_bytes, 0) AS size_bytes,
           CASE
             WHEN m.relative_path ~ '(^|/)images/' THEN 'photos'
             WHEN m.relative_path ~* '\\.(png|jpe?g|gif|webp|bmp)$' THEN 'photos'
             ELSE 'files'
           END AS kind,
           COALESCE(
             NULLIF((regexp_match(m.relative_path, '^media/(support|lawyers|managers|spp|templates)/'))[1], ''),
             NULLIF(m.department_id, ''),
             'support'
           ) AS department_id
         FROM media_files m
         WHERE m.deleted_at IS NULL
           AND m.relative_path NOT LIKE 'media/_draft/%'
           AND m.relative_path NOT LIKE 'updates/%'
       )
       SELECT department_id, kind, SUM(size_bytes) AS bytes
         FROM parsed
        GROUP BY department_id, kind`,
    )

    const departmentRows = await listDepartments()
    const byId = new Map(
      departmentRows.map((d) => [
        d.id,
        {
          id: d.id,
          label: d.label,
          textBytes: 0,
          photoBytes: 0,
          fileBytes: 0,
          totalBytes: 0,
        },
      ]),
    )

    let unassignedPhotoBytes = 0
    let unassignedFileBytes = 0

    for (const row of textResult.rows) {
      const entry = byId.get(row.department_id)
      if (entry) entry.textBytes = toByteCount(row.bytes)
    }

    for (const row of mediaResult.rows) {
      const bytes = toByteCount(row.bytes)
      const entry = row.department_id
        ? byId.get(row.department_id)
        : undefined
      if (entry) {
        if (row.kind === 'photos') entry.photoBytes += bytes
        else entry.fileBytes += bytes
      } else if (row.kind === 'photos') {
        unassignedPhotoBytes += bytes
      } else {
        unassignedFileBytes += bytes
      }
    }

    const departments = departmentRows.map((d) => {
      const entry = byId.get(d.id)!
      entry.totalBytes = entry.textBytes + entry.photoBytes + entry.fileBytes
      return entry
    })

    const totalBytes =
      departments.reduce((sum, d) => sum + d.totalBytes, 0) +
      unassignedPhotoBytes +
      unassignedFileBytes

    res.json({
      totalBytes,
      departments,
      ...(unassignedPhotoBytes + unassignedFileBytes > 0
        ? {
            unassigned: {
              photoBytes: unassignedPhotoBytes,
              fileBytes: unassignedFileBytes,
              totalBytes: unassignedPhotoBytes + unassignedFileBytes,
            },
          }
        : {}),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка расчёта места' })
  }
})

adminRouter.get('/support-phones', async (_req, res) => {
  try {
    const phones = await readSupportPhonesFromDb()
    res.json({ phones })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка чтения телефонов' })
  }
})

adminRouter.put('/support-phones', async (req: AuthRequest, res) => {
  try {
    const phones = normalizeSupportPhones(req.body?.phones)
    const saved = await writeSupportPhonesToDb(phones)
    res.json({ phones: saved })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка сохранения телефонов' })
  }
})

function departmentToClient(d: Awaited<ReturnType<typeof listDepartments>>[number]) {
  return {
    id: d.id,
    label: d.label,
    listKey: d.listKey,
    sortOrder: d.sortOrder,
    systemLocked: d.systemLocked,
  }
}

adminRouter.get('/departments', async (_req, res) => {
  try {
    const rows = await listDepartments()
    const subsections = await listSubsections()
    const subsByDept = new Map<string, ReturnType<typeof subsectionToClient>[]>()
    for (const sub of subsections) {
      const list = subsByDept.get(sub.departmentId) ?? []
      list.push(subsectionToClient(sub))
      subsByDept.set(sub.departmentId, list)
    }
    res.json({
      departments: rows.filter(isEditableInSettings).map((d) => ({
        ...departmentToClient(d),
        subsections: subsByDept.get(d.id) ?? [],
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка загрузки отделов' })
  }
})

adminRouter.post('/departments', async (req: AuthRequest, res) => {
  try {
    const id = String(req.body?.id ?? '')
      .trim()
      .toLowerCase()
    const label = String(req.body?.label ?? '').trim()
    if (!isDepartmentIdSlug(id)) {
      res.status(400).json({
        error: 'Идентификатор: латиница, цифры, дефис; начинается с буквы (до 48 символов)',
      })
      return
    }
    if (isLostDepartmentId(id) || isTemplatesDepartmentId(id)) {
      res.status(400).json({ error: 'Этот идентификатор зарезервирован' })
      return
    }
    if (!label) {
      res.status(400).json({ error: 'Укажите название отдела' })
      return
    }
    const existing = await getDepartmentById(id)
    if (existing) {
      res.status(409).json({ error: 'Отдел с таким идентификатором уже есть' })
      return
    }
    const sortOrder = await nextDepartmentSortOrder()
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO departments (id, label, list_key, sort_order, system_locked)
         VALUES ($1, $2, 'questions', $3, false)`,
        [id, label, sortOrder],
      )
      await client.query(
        `INSERT INTO topic_id_counters (department_id, next_id) VALUES ($1, 1)
         ON CONFLICT (department_id) DO NOTHING`,
        [id],
      )
      await bumpGlobalVersion(client)
    })
    const created = await getDepartmentById(id)
    res.status(201).json({ department: created ? departmentToClient(created) : { id, label } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка создания отдела' })
  }
})

adminRouter.put('/departments/:id', async (req: AuthRequest, res) => {
  try {
    const id = param(req.params.id)
    const dept = await getDepartmentById(id)
    if (!dept || !isEditableInSettings(dept)) {
      res.status(404).json({ error: 'Отдел не найден' })
      return
    }
    if (isLostDepartmentId(id)) {
      res.status(403).json({ error: 'Этот отдел нельзя редактировать' })
      return
    }
    const label = String(req.body?.label ?? '').trim()
    if (!label) {
      res.status(400).json({ error: 'Укажите название отдела' })
      return
    }
    await withTransaction(async (client) => {
      await client.query(`UPDATE departments SET label = $2 WHERE id = $1`, [id, label])
      await bumpGlobalVersion(client)
    })
    const updated = await getDepartmentById(id)
    res.json({ department: updated ? departmentToClient(updated) : { id, label } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка сохранения отдела' })
  }
})

adminRouter.delete('/departments/:id', async (req: AuthRequest, res) => {
  try {
    const id = param(req.params.id)
    const dept = await getDepartmentById(id)
    if (!dept || !isEditableInSettings(dept)) {
      res.status(404).json({ error: 'Отдел не найден' })
      return
    }
    if (isTemplatesDepartmentId(id) || isLostDepartmentId(id)) {
      res.status(403).json({ error: 'Этот отдел нельзя удалить' })
      return
    }
    let movedTopics = 0
    await withTransaction(async (client) => {
      movedTopics = await moveDepartmentTopicsToLost(client, id)
      await client.query(
        `UPDATE users SET department_id = 'support' WHERE department_id = $1`,
        [id],
      )
      await client.query(`UPDATE whitelist SET department_id = 'support' WHERE department_id = $1`, [
        id,
      ])
      await client.query(`DELETE FROM topic_id_counters WHERE department_id = $1`, [id])
      await client.query(`DELETE FROM departments WHERE id = $1`, [id])
      await bumpGlobalVersion(client)
    })
    res.json({ ok: true, movedTopics })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка удаления отдела' })
  }
})

adminRouter.post('/departments/:deptId/subsections', async (req: AuthRequest, res) => {
  try {
    const departmentId = param(req.params.deptId)
    if (!denyTopicSectionsUnlessAllowed(req, res, departmentId)) return
    const dept = await getDepartmentById(departmentId)
    if (!dept || !isEditableInSettings(dept)) {
      res.status(404).json({ error: 'Отдел не найден' })
      return
    }
    if (isTemplatesDepartmentId(departmentId) || isLostDepartmentId(departmentId)) {
      res.status(403).json({ error: 'В этот отдел нельзя добавить раздел тем' })
      return
    }
    const label = String(req.body?.label ?? '').trim()
    if (!label) {
      res.status(400).json({ error: 'Укажите название подраздела' })
      return
    }
    let party: string | null = null
    if (departmentId === 'support') {
      const rawParty = typeof req.body?.party === 'string' ? req.body.party.trim() : ''
      if (!rawParty || !(await isKnownSupportParty(rawParty))) {
        res.status(400).json({ error: 'Укажите раздел' })
        return
      }
      party = rawParty
    } else if (req.body?.party != null && String(req.body.party).trim()) {
      res.status(400).json({ error: 'Подразделы привязаны только к отделу техподдержки' })
      return
    }
    let createdId: string | null = null
    await withTransaction(async (client) => {
      const id = await allocateSubsectionId(departmentId, label, client)
      const sortOrder = await nextSubsectionSortOrder(
        departmentId,
        party as SupportParty | null,
        client,
      )
      try {
        await client.query(
          `INSERT INTO department_subsections (id, department_id, label, sort_order, party)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, departmentId, label, sortOrder, party],
        )
      } catch (insertErr) {
        const code =
          typeof insertErr === 'object' && insertErr !== null && 'code' in insertErr
            ? (insertErr as { code: string }).code
            : ''
        if (code === '42703') {
          await client.query(
            `INSERT INTO department_subsections (id, department_id, label, sort_order)
             VALUES ($1, $2, $3, $4)`,
            [id, departmentId, label, sortOrder],
          )
        } else {
          throw insertErr
        }
      }
      await bumpGlobalVersion(client)
      createdId = id
    })
    const row = createdId ? await getSubsectionById(createdId) : null
    res.status(201).json({ subsection: row ? subsectionToClient(row) : null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка создания раздела' })
  }
})

adminRouter.put('/subsections/:id', async (req: AuthRequest, res) => {
  try {
    const id = param(req.params.id)
    const existing = await getSubsectionById(id)
    if (!existing) {
      res.status(404).json({ error: 'Раздел не найден' })
      return
    }
    if (!denyTopicSectionsUnlessAllowed(req, res, existing.departmentId)) return
    const label = String(req.body?.label ?? '').trim()
    if (!label) {
      res.status(400).json({ error: 'Укажите название раздела' })
      return
    }
    await withTransaction(async (client) => {
      await client.query(`UPDATE department_subsections SET label = $2 WHERE id = $1`, [id, label])
      await bumpGlobalVersion(client)
    })
    const updated = await getSubsectionById(id)
    res.json({ subsection: updated ? subsectionToClient(updated) : { id, label } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка сохранения раздела' })
  }
})

adminRouter.get('/support-sections', async (_req: AuthRequest, res) => {
  try {
    const sections = await listSupportSections()
    res.json({ sections: sections.map(supportSectionToClient) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка загрузки разделов' })
  }
})

adminRouter.post('/support-sections', async (req: AuthRequest, res) => {
  try {
    if (!denyTopicSectionsUnlessAllowed(req, res, 'support')) return
    const label = String(req.body?.label ?? '').trim()
    if (!label) {
      res.status(400).json({ error: 'Укажите название раздела' })
      return
    }
    let createdId: string | null = null
    await withTransaction(async (client) => {
      const id = await allocateSupportSectionId(label, client)
      if (id === 'all' || id === 'archive') {
        const err = new Error('Зарезервированный идентификатор раздела')
        ;(err as Error & { status: number }).status = 400
        throw err
      }
      const sortOrder = await nextSupportSectionSortOrder(client)
      await client.query(
        `INSERT INTO support_topic_sections (id, label, sort_order, system_locked)
         VALUES ($1, $2, $3, false)`,
        [id, label, sortOrder],
      )
      await bumpGlobalVersion(client)
      createdId = id
    })
    const row = createdId ? await getSupportSectionById(createdId) : null
    res.status(201).json({ section: row ? supportSectionToClient(row) : null })
  } catch (err) {
    console.error(err)
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status: number }).status) || 500
        : 500
    res.status(status).json({
      error: err instanceof Error ? err.message : 'Ошибка создания раздела',
    })
  }
})

adminRouter.put('/support-sections/:id', async (req: AuthRequest, res) => {
  try {
    if (!denyTopicSectionsUnlessAllowed(req, res, 'support')) return
    const id = param(req.params.id)
    if (id === 'all' || id === 'archive') {
      res.status(403).json({ error: 'Этот раздел нельзя изменить' })
      return
    }
    const existing = await getSupportSectionById(id)
    if (!existing) {
      res.status(404).json({ error: 'Раздел не найден' })
      return
    }
    const label = String(req.body?.label ?? '').trim()
    if (!label) {
      res.status(400).json({ error: 'Укажите название раздела' })
      return
    }
    await withTransaction(async (client) => {
      await client.query(`UPDATE support_topic_sections SET label = $2 WHERE id = $1`, [id, label])
      await bumpGlobalVersion(client)
    })
    const updated = await getSupportSectionById(id)
    res.json({ section: updated ? supportSectionToClient(updated) : { id, label } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка сохранения раздела' })
  }
})

adminRouter.delete('/support-sections/:id', async (req: AuthRequest, res) => {
  try {
    if (!denyTopicSectionsUnlessAllowed(req, res, 'support')) return
    const id = param(req.params.id)
    if (id === 'all' || id === 'archive') {
      res.status(403).json({ error: 'Этот раздел нельзя удалить' })
      return
    }
    const existing = await getSupportSectionById(id)
    if (!existing) {
      res.status(404).json({ error: 'Раздел не найден' })
      return
    }
    let movedTopics = 0
    await withTransaction(async (client) => {
      movedTopics = await moveTopicsToArchiveLostByParty('support', id, client)
      await client.query(
        `DELETE FROM department_subsections
          WHERE department_id = 'support' AND party IS NOT DISTINCT FROM $1 AND NOT is_archive_lost`,
        [id],
      )
      await client.query(`DELETE FROM support_topic_sections WHERE id = $1`, [id])
      await bumpGlobalVersion(client)
    })
    res.json({ ok: true, movedTopics })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка удаления раздела' })
  }
})

adminRouter.delete('/subsections/:id', async (req: AuthRequest, res) => {
  try {
    const id = param(req.params.id)
    const existing = await getSubsectionById(id)
    if (!existing) {
      res.status(404).json({ error: 'Раздел не найден' })
      return
    }
    if (!denyTopicSectionsUnlessAllowed(req, res, existing.departmentId)) return
    let movedTopics = 0
    await withTransaction(async (client) => {
      if (existing.isArchiveLost) {
        const err = new Error('Системный подраздел «Потерянные» нельзя удалить')
        ;(err as Error & { status: number }).status = 403
        throw err
      }
      if (existing.isArchiveArchived) {
        const err = new Error('Системный подраздел «Архивированные» нельзя удалить')
        ;(err as Error & { status: number }).status = 403
        throw err
      }
      if (existing.departmentId === 'support') {
        const res = await client.query(
          `UPDATE topics SET subsection_id = NULL
            WHERE department_id = $1 AND subsection_id = $2 AND deleted_at IS NULL`,
          [existing.departmentId, id],
        )
        movedTopics = res.rowCount ?? 0
      } else {
        const others = await client.query<{ id: string }>(
          `SELECT id FROM department_subsections
            WHERE department_id = $1 AND id <> $2 AND party IS NULL
            ORDER BY sort_order ASC, id ASC
            LIMIT 1`,
          [existing.departmentId, id],
        )
        const fallbackId = others.rows[0]?.id ?? null
        if (fallbackId) {
          await client.query(
            `UPDATE topics SET subsection_id = $3
              WHERE department_id = $1 AND subsection_id = $2 AND deleted_at IS NULL`,
            [existing.departmentId, id, fallbackId],
          )
        } else {
          await client.query(
            `UPDATE topics SET subsection_id = NULL
              WHERE department_id = $1 AND subsection_id = $2 AND deleted_at IS NULL`,
            [existing.departmentId, id],
          )
        }
      }
      await client.query(`DELETE FROM department_subsections WHERE id = $1`, [id])
      await bumpGlobalVersion(client)
    })
    res.json({ ok: true, movedTopics })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка удаления раздела' })
  }
})

/** One-time maintenance: reconcile media_files paths with files on disk (owner only). */
adminRouter.post('/fix-media-paths', requireRole('owner'), async (req: AuthRequest, res) => {
  try {
    const apply = Boolean(req.body?.apply)
    const mediaDir = process.env.MEDIA_DIR ?? path.join(process.cwd(), 'data', 'media')
    const result = await fixMediaPaths({ mediaDir, apply })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка исправления путей медиа' })
  }
})
