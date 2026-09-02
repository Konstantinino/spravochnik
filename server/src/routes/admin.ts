import { Router } from 'express'
import { query, bumpGlobalVersion } from '../db/pool.js'
import { generateSalt, hashPassword, isOwnerEmail, normalizeEmail } from '../lib/auth-utils.js'
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js'

const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'kostya.alone18@yandex.ru'

export const adminRouter = Router()
adminRouter.use(authMiddleware, requireRole('admin'))

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value
}

function toPublicUser(row: {
  id: string
  name: string
  email: string
  role: string
}): {
  id: string
  name: string
  email: string
  role: string
  isOwner?: boolean
} {
  const owner = isOwnerEmail(row.email, BOOTSTRAP_ADMIN_EMAIL)
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: owner ? 'admin' : row.role,
    ...(owner ? { isOwner: true } : {}),
  }
}

adminRouter.get('/users', async (_req, res) => {
  try {
    const result = await query<{ id: string; name: string; email: string; role: string }>(
      'SELECT id, name, email, role FROM users ORDER BY created_at',
    )
    res.json({ users: result.rows.map(toPublicUser) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.put('/users/:userId/role', async (req: AuthRequest, res) => {
  try {
    const userId = param(req.params.userId)
    const role = String(req.body.role ?? '')

    if (role === 'admin') {
      res.status(400).json({ error: 'Роль админа закреплена за владельцем' })
      return
    }
    if (role !== 'user' && role !== 'editor') {
      res.status(400).json({ error: 'Недопустимая роль' })
      return
    }

    const userRes = await query<{ email: string }>('SELECT email FROM users WHERE id = $1', [
      userId,
    ])
    const user = userRes.rows[0]
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }
    if (isOwnerEmail(user.email, BOOTSTRAP_ADMIN_EMAIL)) {
      res.status(400).json({ error: 'Нельзя менять роль владельца' })
      return
    }

    await query('UPDATE users SET role = $1 WHERE id = $2', [role, userId])
    await bumpGlobalVersion()

    const all = await query<{ id: string; name: string; email: string; role: string }>(
      'SELECT id, name, email, role FROM users ORDER BY created_at',
    )
    res.json({ users: all.rows.map(toPublicUser) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.put('/users/:userId', async (req: AuthRequest, res) => {
  try {
    const userId = param(req.params.userId)
    const nameRaw = req.body.name
    const passwordRaw = req.body.password

    const userRes = await query<{ email: string }>('SELECT email FROM users WHERE id = $1', [
      userId,
    ])
    const user = userRes.rows[0]
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' })
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

    if (updates.length === 0) {
      res.status(400).json({ error: 'Нечего обновлять' })
      return
    }

    params.push(userId)
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`, params)
    await bumpGlobalVersion()

    const all = await query<{ id: string; name: string; email: string; role: string }>(
      'SELECT id, name, email, role FROM users ORDER BY created_at',
    )
    res.json({ users: all.rows.map(toPublicUser) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.delete('/users/:userId', async (req: AuthRequest, res) => {
  try {
    const userId = param(req.params.userId)
    const userRes = await query<{ email: string }>('SELECT email FROM users WHERE id = $1', [
      userId,
    ])
    const user = userRes.rows[0]
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }
    if (isOwnerEmail(user.email, BOOTSTRAP_ADMIN_EMAIL)) {
      res.status(400).json({ error: 'Нельзя удалить владельца' })
      return
    }

    const email = normalizeEmail(user.email)
    await query('DELETE FROM users WHERE id = $1', [userId])
    await query('INSERT INTO removed_emails (email) VALUES ($1) ON CONFLICT DO NOTHING', [email])
    await bumpGlobalVersion()

    const all = await query<{ id: string; name: string; email: string; role: string }>(
      'SELECT id, name, email, role FROM users ORDER BY created_at',
    )
    res.json({ users: all.rows.map(toPublicUser) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.get('/whitelist', async (_req, res) => {
  try {
    const result = await query<{ email: string }>('SELECT email FROM whitelist ORDER BY email')
    res.json({ whitelist: result.rows.map((r) => r.email) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.put('/whitelist', async (req, res) => {
  try {
    const emails = Array.isArray(req.body.emails) ? req.body.emails : []
    const cleaned = Array.from(
      new Set(
        emails
          .map((e: unknown) => String(e).trim().toLowerCase())
          .filter((e: string) => e && e.includes('@')),
      ),
    )
    if (!cleaned.includes(normalizeEmail(BOOTSTRAP_ADMIN_EMAIL))) {
      cleaned.push(normalizeEmail(BOOTSTRAP_ADMIN_EMAIL))
    }

    await query('DELETE FROM whitelist')
    for (const email of cleaned) {
      await query('INSERT INTO whitelist (email) VALUES ($1) ON CONFLICT DO NOTHING', [email])
    }
    await bumpGlobalVersion()

    res.json({ whitelist: cleaned })
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
    await query('INSERT INTO whitelist (email) VALUES ($1) ON CONFLICT DO NOTHING', [email])
    await bumpGlobalVersion()
    const result = await query<{ email: string }>('SELECT email FROM whitelist ORDER BY email')
    res.json({ whitelist: result.rows.map((r) => r.email) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

adminRouter.delete('/whitelist/:email', async (req, res) => {
  try {
    const email = normalizeEmail(decodeURIComponent(req.params.email))
    if (email === normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)) {
      res.status(400).json({ error: 'Нельзя удалить почту основного админа' })
      return
    }
    await query('DELETE FROM whitelist WHERE email = $1', [email])
    await bumpGlobalVersion()
    const result = await query<{ email: string }>('SELECT email FROM whitelist ORDER BY email')
    res.json({ whitelist: result.rows.map((r) => r.email) })
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
