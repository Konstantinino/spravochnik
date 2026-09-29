import path from 'node:path'
import os from 'node:os'
import { createRequire } from 'node:module'
import {
  getActiveDepartments,
  departmentById as lookupDepartmentById,
  LOST_DEPARTMENT_ID as LOST_ID,
  TEMPLATES_DEPARTMENT_ID as TEMPLATES_ID,
} from './departments-store.js'

const require = createRequire(import.meta.url)

export const DATA_FILES = [
  'guide.json',
  'guide_lawyers.json',
  'guide_managers.json',
  'guide_spp.json',
  'templates.json',
] as const

export const ACCOUNTS_FILE = 'accounts.json'
export const SETTINGS_FILE = 'settings.json'
export const SESSION_FILE = 'session.json'
export const PENDING_MEDIA_FILE = 'pending-media.json'
export const PENDING_OPERATIONS_FILE = 'pending-operations.json'
export const SYNC_LOCK_FILE = 'sync.lock.json'
export const APP_UPDATE_FILE = 'app-update.json'
export const YANDEX_FOLDER = 'REST INFO'
export const BOOTSTRAP_ADMIN_EMAIL = 'kostya.alone18@yandex.ru'

export type DepartmentId = string

export type WorkDepartmentId = string

export const LOST_DEPARTMENT_ID = 'lost'
export const TEMPLATES_DEPARTMENT_ID = 'templates'

export type UserRole = 'user' | 'editor' | 'admin' | 'owner'

export const STAFF_ROLES: UserRole[] = ['admin', 'owner']
export const CONTENT_EDITOR_ROLES: UserRole[] = ['editor', 'admin', 'owner']

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
  role: UserRole | undefined,
  userDepartmentId: unknown,
  targetDepartmentId: DepartmentId,
): boolean {
  if (!role || role === 'user') return false
  if (targetDepartmentId === LOST_ID) return false
  if (isStaffRole(role)) return true
  return normalizeWorkDepartmentId(userDepartmentId) === normalizeWorkDepartmentId(targetDepartmentId)
}

export function canManageTopicSectionsForDepartment(
  role: UserRole | undefined,
  userDepartmentId: unknown,
  targetDepartmentId: string,
  opts?: { isOwner?: boolean },
): boolean {
  if (opts?.isOwner || isOwnerRole(role)) return true
  if (role === 'admin') {
    return (
      normalizeWorkDepartmentId(userDepartmentId) ===
      normalizeWorkDepartmentId(targetDepartmentId)
    )
  }
  return false
}

export function isOwnerRole(role: string | undefined | null): boolean {
  return role === 'owner'
}

export interface Department {
  id: DepartmentId
  label: string
  fileName: string
  listKey: 'questions' | 'templates'
}

export function getDepartments(): Department[] {
  return getActiveDepartments()
}

/** @deprecated use getDepartments() — kept for legacy imports */
export const DEPARTMENTS: Department[] = getActiveDepartments()

export function getWorkDepartments(): Department[] {
  return getActiveDepartments().filter(
    (d) => d.id !== TEMPLATES_ID && d.id !== LOST_ID && d.listKey === 'questions',
  )
}

export const WORK_DEPARTMENTS: Department[] = getWorkDepartments()

const WORK_DEPT_ID_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/

export function isWorkDepartmentId(value: unknown): value is WorkDepartmentId {
  if (typeof value !== 'string') return false
  if (value === TEMPLATES_ID || value === LOST_ID) return false
  return WORK_DEPT_ID_PATTERN.test(value)
}

export function normalizeWorkDepartmentId(value: unknown): WorkDepartmentId {
  return isWorkDepartmentId(value) ? value : 'support'
}

export function getUserDataRoot(): string {
  try {
    const { app } = require('electron') as typeof import('electron')
    if (typeof app?.getPath === 'function') {
      return path.join(app.getPath('userData'), 'REST-INFO')
    }
  } catch {
    /* CLI / non-Electron */
  }
  const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming')
  return path.join(appData, 'rest-info', 'REST-INFO')
}

export function getMediaDir(): string {
  return path.join(getUserDataRoot(), 'media')
}

/** Topic images: media/{departmentId}/{topicId}/images */
export function getTopicImagesDir(
  departmentId: DepartmentId,
  topicId: number | string,
): string {
  return path.join(getMediaDir(), departmentId, String(topicId), 'images')
}

/** Draft images before topic has an id: media/_draft/{draftId}/images */
export function getDraftImagesDir(draftId: string): string {
  const safe = draftId.replace(/[^a-zA-Z0-9_-]/g, '')
  return path.join(getMediaDir(), '_draft', safe, 'images')
}

/** Topic attachments: media/{departmentId}/{topicId}/files */
export function getTopicFilesDir(
  departmentId: DepartmentId,
  topicId: number | string,
): string {
  return path.join(getMediaDir(), departmentId, String(topicId), 'files')
}

/** Draft attachments before topic has an id: media/_draft/{draftId}/files */
export function getDraftFilesDir(draftId: string): string {
  const safe = draftId.replace(/[^a-zA-Z0-9_-]/g, '')
  return path.join(getMediaDir(), '_draft', safe, 'files')
}

/** Relative POSIX path under userData root, e.g. media/support/12/images/a.jpg */
export function topicImageRelativePath(
  departmentId: DepartmentId,
  topicId: number | string,
  fileName: string,
): string {
  return `media/${departmentId}/${topicId}/images/${fileName}`
}

export function draftImageRelativePath(draftId: string, fileName: string): string {
  const safe = draftId.replace(/[^a-zA-Z0-9_-]/g, '')
  return `media/_draft/${safe}/images/${fileName}`
}

export function topicFileRelativePath(
  departmentId: DepartmentId,
  topicId: number | string,
  fileName: string,
): string {
  return `media/${departmentId}/${topicId}/files/${fileName}`
}

export function draftFileRelativePath(draftId: string, fileName: string): string {
  const safe = draftId.replace(/[^a-zA-Z0-9_-]/g, '')
  return `media/_draft/${safe}/files/${fileName}`
}

export function getSeedDataDir(): string {
  try {
    const { app } = require('electron') as typeof import('electron')
    if (app?.isPackaged) {
      return path.join(process.resourcesPath, 'data')
    }
  } catch {
    /* CLI */
  }
  return path.join(__dirname, '../resources/data')
}

export function departmentById(id: DepartmentId): Department {
  return lookupDepartmentById(id)
}
