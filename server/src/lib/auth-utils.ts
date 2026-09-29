import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export type UserRole = 'user' | 'editor' | 'admin' | 'owner'

export const STAFF_ROLES: UserRole[] = ['admin', 'owner']
export const CONTENT_EDITOR_ROLES: UserRole[] = ['editor', 'admin', 'owner']

export type WorkDepartmentId = string

export const LOST_DEPARTMENT_ID = 'lost'
export const TEMPLATES_DEPARTMENT_ID = 'templates'

export interface JwtUser {
  id: string
  email: string
  name: string
  role: UserRole
  departmentId: WorkDepartmentId
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

export function canEditDepartment(
  role: string | undefined | null,
  userDepartmentId: WorkDepartmentId | string | undefined | null,
  targetDepartmentId: string,
): boolean {
  if (!canEditContent(role)) return false
  if (isStaffRole(role)) return true
  return normalizeWorkDepartmentId(userDepartmentId) === normalizeWorkDepartmentId(targetDepartmentId)
}

export function isOwnerRole(role: string | undefined | null): boolean {
  return role === 'owner'
}

/** Разделы тем в настройках: владелец — любой отдел, admin — только свой. */
export function canManageTopicSectionsForDepartment(
  role: string | undefined | null,
  userDepartmentId: WorkDepartmentId | string | undefined | null,
  targetDepartmentId: string,
): boolean {
  if (isOwnerRole(role)) return true
  if (role === 'admin') {
    return (
      normalizeWorkDepartmentId(userDepartmentId) ===
      normalizeWorkDepartmentId(targetDepartmentId)
    )
  }
  return false
}

const WORK_DEPT_ID_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/

export function isWorkDepartmentId(value: unknown): value is WorkDepartmentId {
  if (typeof value !== 'string') return false
  if (value === TEMPLATES_DEPARTMENT_ID || value === LOST_DEPARTMENT_ID) return false
  return WORK_DEPT_ID_PATTERN.test(value)
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
