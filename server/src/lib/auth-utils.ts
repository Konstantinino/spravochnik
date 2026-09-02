import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export type UserRole = 'user' | 'editor' | 'admin'

export interface JwtUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const hash = hashPassword(password, salt)
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(expectedHash, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function generateSalt(): string {
  return randomBytes(16).toString('hex')
}

export function isOwnerEmail(email: string, bootstrapEmail: string): boolean {
  return normalizeEmail(email) === normalizeEmail(bootstrapEmail)
}

export function resolveRoleForEmail(email: string, bootstrapEmail: string): UserRole {
  return isOwnerEmail(email, bootstrapEmail) ? 'admin' : 'user'
}
