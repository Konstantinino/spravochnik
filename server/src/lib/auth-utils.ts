import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export type UserRole = 'user' | 'editor' | 'admin' | 'owner'

export const STAFF_ROLES: UserRole[] = ['admin', 'owner']
export const CONTENT_EDITOR_ROLES: UserRole[] = ['editor', 'admin', 'owner']

export type WorkDepartmentId = 'support' | 'lawyers' | 'managers' | 'spp'

export interface JwtUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export function isUserRole(value: unknown): value is UserRole {
  return value === 'user' || value === 'editor' || value === 'admin' || value === 'owner'
}

export function parseUserRole(value: unknown): UserRole {
  return isUserRole(value) ? value : 'user'
}

export function isStaffRole(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'owner'
}

export function canEditContent(role: string | undefined | null): boolean {
  return role === 'editor' || isStaffRole(role)
}

export function isOwnerRole(role: string | undefined | null): boolean {
  return role === 'owner'
}

export function isWorkDepartmentId(value: unknown): value is WorkDepartmentId {
  return (
    value === 'support' ||
    value === 'lawyers' ||
    value === 'managers' ||
    value === 'spp'
  )
}

export function normalizeWorkDepartmentId(value: unknown): WorkDepartmentId {
  return isWorkDepartmentId(value) ? value : 'support'
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
  return isOwnerEmail(email, bootstrapEmail) ? 'owner' : 'user'
}
