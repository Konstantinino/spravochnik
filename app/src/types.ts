export type DepartmentId =
  | 'support'
  | 'lawyers'
  | 'managers'
  | 'spp'
  | 'templates'

export type UserRole = 'user' | 'editor' | 'admin'

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export type SyncStatusCode =
  | 'idle'
  | 'no_token'
  | 'connecting'
  | 'syncing'
  | 'uploading'
  | 'up_to_date'
  | 'pending'
  | 'error'

export interface SyncStatus {
  code: SyncStatusCode
  label: string
  detail?: string
  hasPendingChanges: boolean
}

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version: string | null
  downloadUrl: string | null
  error?: string
}

export interface GuideDocument {
  file_id: string
  file_name: string
}

export interface GuideItem {
  id: number
  question: string
  answer: string
  parent_id?: number | null
  has_children?: boolean
  photo?: string
  photos?: string[]
  documents?: GuideDocument[]
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
