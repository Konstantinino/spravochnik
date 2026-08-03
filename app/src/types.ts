export type DepartmentId =
  | 'support'
  | 'lawyers'
  | 'managers'
  | 'spp'
  | 'templates'

export type UserRole = 'user' | 'editor' | 'admin'

/** Только для отдела «Тех. поддержка»: Поставщик / Заказчик */
export type SupportParty = 'supplier' | 'customer'

export const SUPPORT_PARTY_LABELS: Record<SupportParty, string> = {
  supplier: 'Поставщик',
  customer: 'Заказчик',
}

export const SUPPORT_PARTIES: SupportParty[] = ['supplier', 'customer']

export function isSupportParty(value: unknown): value is SupportParty {
  return value === 'supplier' || value === 'customer'
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
  /** Owner account — role cannot be changed */
  isOwner?: boolean
}

export type SyncStatusCode =
  | 'idle'
  | 'no_token'
  | 'connecting'
  | 'syncing'
  | 'uploading'
  | 'up_to_date'
  | 'pending'
  | 'busy'
  | 'conflict'
  | 'error'

export interface SyncConflictInfo {
  fileName: string
  listKey: 'questions' | 'templates'
  id: number
  title: string
  localPreview: string
  remotePreview: string
}

export interface SyncStatus {
  code: SyncStatusCode
  label: string
  detail?: string
  hasPendingChanges: boolean
  retryAfterSec?: number
  lockBy?: string
  conflicts?: SyncConflictInfo[]
}

export interface ConflictResolution {
  fileName: string
  id: number
  choice: 'local' | 'remote'
}

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version: string | null
  /** Path on Yandex Disk, e.g. updates/REST-INFO-Setup-1.1.4.exe */
  remoteSetupPath: string | null
  error?: string
  source?: 'yandex' | 'local' | null
}

export interface GuideDocument {
  file_id: string
  file_name: string
}

/** Display scale % for markdown image src keys (e.g. images/a.png → 80). Synced with guide JSON. */
export type ImageDisplayMap = Record<string, number>

export interface GuideItem {
  id: number
  question: string
  answer: string
  parent_id?: number | null
  has_children?: boolean
  /** Техподдержка: поставщик или заказчик. Старые темы без поля = supplier */
  party?: SupportParty
  photo?: string
  photos?: string[]
  documents?: GuideDocument[]
  /** Per-image display scale (10–200). Does not change files or markdown. */
  image_display?: ImageDisplayMap
}

export interface GuideFile {
  questions?: GuideItem[]
  templates?: GuideItem[]
}

export interface Department {
  id: DepartmentId
  label: string
  fileName: string
  listKey: 'questions' | 'templates'
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'support',
    label: 'Тех. поддержка',
    fileName: 'guide.json',
    listKey: 'questions',
  },
  {
    id: 'lawyers',
    label: 'Юристы',
    fileName: 'guide_lawyers.json',
    listKey: 'questions',
  },
  {
    id: 'managers',
    label: 'Менеджеры',
    fileName: 'guide_managers.json',
    listKey: 'questions',
  },
  {
    id: 'spp',
    label: 'СПП',
    fileName: 'guide_spp.json',
    listKey: 'questions',
  },
  {
    id: 'templates',
    label: 'Шаблоны',
    fileName: 'templates.json',
    listKey: 'templates',
  },
]

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Читатель',
  editor: 'Редактор',
  admin: 'Админ',
}
