import path from 'node:path'
import os from 'node:os'
import { createRequire } from 'node:module'

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

export type DepartmentId =
  | 'support'
  | 'lawyers'
  | 'managers'
  | 'spp'
  | 'templates'

export type WorkDepartmentId = Exclude<DepartmentId, 'templates'>

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

export function isOwnerRole(role: string | undefined | null): boolean {
  return role === 'owner'
}

export interface Department {
  id: DepartmentId
  label: string
  fileName: string
  listKey: 'questions' | 'templates'
}

export const DEPARTMENTS: Department[] = [
  { id: 'support', label: 'Тех. поддержка', fileName: 'guide.json', listKey: 'questions' },
  { id: 'lawyers', label: 'Юристы', fileName: 'guide_lawyers.json', listKey: 'questions' },
  { id: 'managers', label: 'Менеджеры', fileName: 'guide_managers.json', listKey: 'questions' },
  { id: 'spp', label: 'СПП', fileName: 'guide_spp.json', listKey: 'questions' },
  { id: 'templates', label: 'Шаблоны', fileName: 'templates.json', listKey: 'templates' },
]

export const WORK_DEPARTMENTS: Department[] = DEPARTMENTS.filter(
  (d): d is Department & { id: WorkDepartmentId } => d.id !== 'templates',
)

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
  const dept = DEPARTMENTS.find((d) => d.id === id)
  if (!dept) throw new Error(`Неизвестный отдел: ${id}`)
  return dept
}
