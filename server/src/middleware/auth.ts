import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db/pool.js'
import {
  parseUserRole,
  type JwtUser,
  type UserRole,
} from '../lib/auth-utils.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'
const JWT_EXPIRES = '7d'

export interface AuthRequest extends Request {
  user?: JwtUser
}

export function signToken(user: JwtUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token: string): JwtUser {
  return jwt.verify(token, JWT_SECRET) as JwtUser
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Требуется авторизация' })
    return
  }
  try {
    const tokenUser = verifyToken(header.slice(7))
    const result = await query<{
      id: string
      email: string
      name: string
      role: string
    }>('SELECT id, email, name, role FROM users WHERE id = $1', [tokenUser.id])
    const row = result.rows[0]
    if (!row) {
      res.status(401).json({ error: 'Пользователь не найден' })
      return
    }
    req.user = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: parseUserRole(row.role),
    }
    next()
  } catch {
    res.status(401).json({ error: 'Недействительный токен' })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Недостаточно прав' })
      return
    }
    next()
  }
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next()
    return
  }
  try {
    const tokenUser = verifyToken(header.slice(7))
    const result = await query<{
      id: string
      email: string
      name: string
      role: string
    }>('SELECT id, email, name, role FROM users WHERE id = $1', [tokenUser.id])
    const row = result.rows[0]
    if (row) {
      req.user = {
        id: row.id,
        email: row.email,
        name: row.name,
        role: parseUserRole(row.role),
      }
    }
  } catch {
    // ignore invalid token
  }
  next()
}
