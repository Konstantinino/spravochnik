export type DepartmentId =
  | 'support'
  | 'lawyers'
  | 'managers'
  | 'spp'
  | 'templates'

export interface StorageKindBytes {
  photoBytes: number
  fileBytes: number
  totalBytes: number
}

export interface DepartmentStorageStats {
  id: DepartmentId
  label: string
  textBytes: number
  photoBytes: number
  fileBytes: number
  totalBytes: number
}

export interface StorageStats {
  totalBytes: number
  departments: DepartmentStorageStats[]
  unassigned?: StorageKindBytes
}

/** Home department for users / whitelist — excludes «Шаблоны» */
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

/** Только для отдела «Тех. поддержка»: Поставщик / Заказчик */
export type SupportParty = 'supplier' | 'customer'

/** Sidebar list filter (support has parties; all depts have archive for editors) */
export type TopicViewFilter = SupportParty | 'all' | 'archive'

/** @deprecated use TopicViewFilter */
export type SupportPartyFilter = TopicViewFilter

export const SUPPORT_PARTY_LABELS: Record<SupportParty, string> = {
  supplier: 'Поставщик',
  customer: 'Заказчик',
}

export const TOPIC_VIEW_FILTER_LABELS: Record<TopicViewFilter, string> = {
  all: 'Все',
  supplier: 'Поставщик',
  customer: 'Заказчик',
  archive: 'Архив',
}

export const SUPPORT_PARTIES: SupportParty[] = ['supplier', 'customer']

/** Техподдержка: Все / Поставщик / Заказчик (+ Архив для editor/admin) */
export const SUPPORT_VIEW_FILTERS: TopicViewFilter[] = ['all', 'supplier', 'customer']

/** Остальные отделы: Все (+ Архив для editor/admin) */
export const DEPT_VIEW_FILTERS: TopicViewFilter[] = ['all']

export function isSupportParty(value: unknown): value is SupportParty {
  return value === 'supplier' || value === 'customer'
}

export function isTopicViewFilter(value: unknown): value is TopicViewFilter {
  return value === 'all' || value === 'archive' || isSupportParty(value)
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
  departmentId: WorkDepartmentId
  /** Owner account — only the owner can edit/delete this user */
  isOwner?: boolean
}

export interface WhitelistEntry {
  email: string
  departmentId: WorkDepartmentId
}

export type SyncStatusCode =
  | 'idle'
  | 'no_server'
  | 'no_token'
  | 'connecting'
  | 'syncing'
  | 'uploading'
  | 'up_to_date'
  | 'pending'
  | 'offline_pending'
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
  localFull?: Record<string, unknown>
  remoteFull?: Record<string, unknown>
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
  /** Download path or URL */
  remoteSetupPath: string | null
  downloadUrl?: string | null
  error?: string
  source?: 'server' | null
}

export interface LatestReleaseInfo {
  version: string | null
  downloadUrl: string | null
  remoteSetupPath: string | null
  notes?: string | null
  error?: string
  source?: 'server' | null
}

export interface ExportManifest {
  exportedAt: string
  sourceRoot: string
  topics: Record<string, number>
  templates: number
  users: number
  whitelist: number
  mediaFiles: number
  warnings: string[]
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
  /** Archived topics hidden from «Все»; visible only in Архив for editor/admin */
  archived?: boolean
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

export const WORK_DEPARTMENTS = DEPARTMENTS.filter(
  (d): d is Department & { id: WorkDepartmentId } => d.id !== 'templates',
)

export const WORK_DEPARTMENT_IDS: WorkDepartmentId[] = [
  'support',
  'lawyers',
  'managers',
  'spp',
]

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

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Читатель',
  editor: 'Редактор',
  admin: 'Админ',
  owner: 'Владелец',
}
