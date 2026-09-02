import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtUser, UserRole } from '../lib/auth-utils.js'

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

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Требуется авторизация' })
    return
  }
  try {
    req.user = verifyToken(header.slice(7))
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

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice(7))
    } catch {
      // ignore invalid token
    }
  }
  next()
}
