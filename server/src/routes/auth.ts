import { Router } from 'express'
import { query } from '../db/pool.js'
import {
  generateSalt,
  hashPassword,
  isOwnerEmail,
  isOwnerRole,
  normalizeEmail,
  normalizeWorkDepartmentId,
  parseUserRole,
  verifyPassword,
  type UserRole,
  type WorkDepartmentId,
} from '../lib/auth-utils.js'
import { DEPARTMENTS } from '../lib/topics.js'
import { authMiddleware, signToken, type AuthRequest } from '../middleware/auth.js'

const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'kostya.alone18@yandex.ru'

export const authRouter = Router()

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

authRouter.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body.email ?? ''))
    const password = String(req.body.password ?? '')

    const result = await query<{
      id: string
      name: string
      email: string
      role: string
      department_id: string
      password_hash: string
      salt: string
    }>(
      'SELECT id, name, email, role, department_id, password_hash, salt FROM users WHERE email = $1',
      [email],
    )

    const user = result.rows[0]
    if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
      res.status(401).json({ error: 'Неверная почта или пароль' })
      return
    }

    const publicUser = toPublicUser(user)
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: publicUser.role,
    })

    res.json({ token, user: publicUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка входа' })
  }
})

authRouter.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name ?? '').trim()
    const email = normalizeEmail(String(req.body.email ?? ''))
    const password = String(req.body.password ?? '')

    if (!name) {
      res.status(400).json({ error: 'Укажите имя' })
      return
    }
    if (!email.includes('@')) {
      res.status(400).json({ error: 'Укажите корректную почту' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Пароль не короче 6 символов' })
      return
    }

    const wl = await query<{ email: string; department_id: string }>(
      'SELECT email, department_id FROM whitelist WHERE email = $1',
      [email],
    )
    if (wl.rowCount === 0) {
      res.status(403).json({ error: 'Эта почта не в списке разрешённых для регистрации' })
      return
    }

    const departmentId = normalizeWorkDepartmentId(wl.rows[0].department_id)

    const removed = await query('SELECT email FROM removed_emails WHERE email = $1', [email])
    if (removed.rowCount && removed.rowCount > 0) {
      res.status(403).json({ error: 'Эта почта была удалена администратором' })
      return
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rowCount && existing.rowCount > 0) {
      res.status(409).json({ error: 'Пользователь с такой почтой уже зарегистрирован' })
      return
    }

    const salt = generateSalt()
    const ownerRes = await query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['owner'])
    const role: UserRole =
      (!ownerRes.rowCount || ownerRes.rowCount === 0) && isOwnerEmail(email, BOOTSTRAP_ADMIN_EMAIL)
        ? 'owner'
        : 'user'
    const result = await query<{
      id: string
      name: string
      email: string
      role: string
      department_id: string
    }>(
      `INSERT INTO users (name, email, password_hash, salt, role, department_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, department_id`,
      [name, email, hashPassword(password, salt), salt, role, departmentId],
    )

    const user = result.rows[0]
    const publicUser = toPublicUser(user)
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: publicUser.role,
    })

    res.status(201).json({ token, user: publicUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка регистрации' })
  }
})

/** Public lookup for registration UI — department assigned to a whitelisted email. */
authRouter.get('/registration-department', async (req, res) => {
  try {
    const email = normalizeEmail(String(req.query.email ?? ''))
    if (!email.includes('@')) {
      res.status(400).json({ error: 'Укажите корректную почту' })
      return
    }

    const wl = await query<{ department_id: string }>(
      'SELECT department_id FROM whitelist WHERE email = $1',
      [email],
    )
    if (wl.rowCount === 0) {
      res.status(404).json({ error: 'Почта не в белом списке' })
      return
    }

    const departmentId = normalizeWorkDepartmentId(wl.rows[0].department_id)
    const label = DEPARTMENTS[departmentId]?.label ?? departmentId
    res.json({ departmentId, label })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query<{
      id: string
      name: string
      email: string
      role: string
      department_id: string
    }>('SELECT id, name, email, role, department_id FROM users WHERE id = $1', [req.user!.id])
    const user = result.rows[0]
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' })
      return
    }
    res.json({ user: toPublicUser(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

export async function ensureBootstrapWhitelist(): Promise<void> {
  const email = normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
  await query(
    `INSERT INTO whitelist (email, department_id) VALUES ($1, 'support')
     ON CONFLICT (email) DO NOTHING`,
    [email],
  )
}

/** Promote bootstrap account to owner when no owner exists yet (legacy admin → owner). */
export async function ensureOwnerRole(): Promise<void> {
  const existing = await query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['owner'])
  if (existing.rowCount && existing.rowCount > 0) return
  await query(`UPDATE users SET role = 'owner' WHERE lower(email) = lower($1)`, [
    BOOTSTRAP_ADMIN_EMAIL,
  ])
}
