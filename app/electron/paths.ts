import { app } from 'electron'
import path from 'node:path'

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
export const YANDEX_FOLDER = 'REST INFO'
export const BOOTSTRAP_ADMIN_EMAIL = 'kostya.alone18@yandex.ru'

export type DepartmentId =
  | 'support'
  | 'lawyers'
  | 'managers'
  | 'spp'
  | 'templates'

export type UserRole = 'user' | 'editor' | 'admin'

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

export function getUserDataRoot(): string {
  return path.join(app.getPath('userData'), 'REST-INFO')
}

export function getMediaDir(): string {
  return path.join(getUserDataRoot(), 'media')
}

/** Topic images: media/{topicId}/images */
export function getTopicImagesDir(topicId: number | string): string {
  return path.join(getMediaDir(), String(topicId), 'images')
}

/** Draft images before topic has an id: media/_draft/{draftId}/images */
export function getDraftImagesDir(draftId: string): string {
  const safe = draftId.replace(/[^a-zA-Z0-9_-]/g, '')
  return path.join(getMediaDir(), '_draft', safe, 'images')
}

/** Relative POSIX path under userData root, e.g. media/12/images/a.jpg */
export function topicImageRelativePath(topicId: number | string, fileName: string): string {
  return `media/${topicId}/images/${fileName}`
}

export function draftImageRelativePath(draftId: string, fileName: string): string {
  const safe = draftId.replace(/[^a-zA-Z0-9_-]/g, '')
  return `media/_draft/${safe}/images/${fileName}`
}

export function getSeedDataDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'data')
  }
  return path.join(__dirname, '../resources/data')
}

export function departmentById(id: DepartmentId): Department {
  const dept = DEPARTMENTS.find((d) => d.id === id)
  if (!dept) throw new Error(`Неизвестный отдел: ${id}`)
  return dept
}
