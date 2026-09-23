import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db/pool.js'
import {
  normalizeWorkDepartmentId,
  parseUserRole,
  type JwtUser,
  type UserRole,
} from '../lib/auth-utils.js'
import { SESSION_COOKIE } from '../lib/web-session.js'

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

/** Bearer header (Electron) or httpOnly session cookie (web). */
export function readAuthToken(req: Request): string | null {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)
  const cookies = req.cookies as Record<string, string | undefined> | undefined
  const fromParser = cookies?.[SESSION_COOKIE]
  if (fromParser) return fromParser
  const raw = req.headers.cookie
  if (!raw) return null
  const prefix = `${SESSION_COOKIE}=`
  for (const part of raw.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length))
    }
  }
  return null
}

async function attachUserFromToken(req: AuthRequest, token: string): Promise<boolean> {
  try {
    const tokenUser = verifyToken(token)
    const result = await query<{
      id: string
      email: string
      name: string
      role: string
      department_id: string
    }>('SELECT id, email, name, role, department_id FROM users WHERE id = $1', [tokenUser.id])
    const row = result.rows[0]
    if (!row) return false
    req.user = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: parseUserRole(row.role),
      departmentId: normalizeWorkDepartmentId(row.department_id),
    }
    return true
  } catch {
    return false
  }
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = readAuthToken(req)
  if (!token) {
    res.status(401).json({ error: 'Требуется авторизация' })
    return
  }
  const ok = await attachUserFromToken(req, token)
  if (!ok) {
    res.status(401).json({ error: 'Недействительный токен' })
    return
  }
  next()
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
  const token = readAuthToken(req)
  if (token) {
    await attachUserFromToken(req, token)
  }
  next()
}
