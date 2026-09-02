import { Router } from 'express'
import { query } from '../db/pool.js'
import {
  generateSalt,
  hashPassword,
  isOwnerEmail,
  normalizeEmail,
  resolveRoleForEmail,
  verifyPassword,
} from '../lib/auth-utils.js'
import { authMiddleware, signToken, type AuthRequest } from '../middleware/auth.js'

const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'kostya.alone18@yandex.ru'

export const authRouter = Router()

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

authRouter.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body.email ?? ''))
    const password = String(req.body.password ?? '')

    const result = await query<{
      id: string
      name: string
      email: string
      role: string
      password_hash: string
      salt: string
    }>('SELECT id, name, email, role, password_hash, salt FROM users WHERE email = $1', [email])

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
      role: publicUser.role as 'user' | 'editor' | 'admin',
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

    const wl = await query('SELECT email FROM whitelist WHERE email = $1', [email])
    if (wl.rowCount === 0) {
      res.status(403).json({ error: 'Эта почта не в списке разрешённых для регистрации' })
      return
    }

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
    const role = resolveRoleForEmail(email, BOOTSTRAP_ADMIN_EMAIL)
    const result = await query<{ id: string; name: string; email: string; role: string }>(
      `INSERT INTO users (name, email, password_hash, salt, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [name, email, hashPassword(password, salt), salt, role],
    )

    const user = result.rows[0]
    const publicUser = toPublicUser(user)
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: publicUser.role as 'user' | 'editor' | 'admin',
    })

    res.status(201).json({ token, user: publicUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка регистрации' })
  }
})

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query<{ id: string; name: string; email: string; role: string }>(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user!.id],
    )
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

// Seed bootstrap whitelist on startup
export async function ensureBootstrapWhitelist(): Promise<void> {
  const email = normalizeEmail(BOOTSTRAP_ADMIN_EMAIL)
  await query(
    `INSERT INTO whitelist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
    [email],
  )
}
