export type DepartmentId = string

export const LOST_DEPARTMENT_ID = 'lost'
export const TEMPLATES_DEPARTMENT_ID = 'templates'

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

/** Home department for users / whitelist — excludes «Шаблоны» and «Потерялись» */
export type WorkDepartmentId = string

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

/** All roles can switch departments in the header (templates — only admin/owner). */
export function canSwitchDepartment(role: string | undefined | null): boolean {
  return role === 'user' || role === 'editor' || isStaffRole(role)
}

export function isLostDepartmentId(id: string): boolean {
  return id === LOST_DEPARTMENT_ID
}

export function departmentsForUser(
  role: string | undefined | null,
  departments: Department[] = DEPARTMENTS,
  options?: { showLost?: boolean },
): Department[] {
  const showLost = options?.showLost ?? false
  const base = isStaffRole(role)
    ? departments.filter((d) => d.id !== LOST_DEPARTMENT_ID || showLost)
    : departments.filter(
        (d) => d.id !== TEMPLATES_DEPARTMENT_ID && (d.id !== LOST_DEPARTMENT_ID || showLost),
      )
  if (!showLost) {
    return base.filter((d) => d.id !== LOST_DEPARTMENT_ID)
  }
  return base
}

export function workDepartmentsFrom(departments: Department[]): Department[] {
  return departments.filter(
    (d) =>
      d.listKey === 'questions' &&
      d.id !== TEMPLATES_DEPARTMENT_ID &&
      d.id !== LOST_DEPARTMENT_ID,
  )
}

export function canEditDepartment(
  role: string | undefined | null,
  userDepartmentId: WorkDepartmentId | DepartmentId | undefined,
  targetDepartmentId: DepartmentId,
): boolean {
  if (!canEditContent(role)) return false
  if (isLostDepartmentId(targetDepartmentId)) return false
  if (isStaffRole(role)) return true
  return normalizeWorkDepartmentId(userDepartmentId) === normalizeWorkDepartmentId(targetDepartmentId)
}

/** Настройки «Разделы тем»: владелец — все отделы, admin — только свой отдел. */
export function canManageTopicSectionsForDepartment(
  role: string | undefined | null,
  userDepartmentId: WorkDepartmentId | DepartmentId | undefined,
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

/** Только для отдела «Тех. поддержка»: Поставщик / Заказчик / Ошибки / Администратор */
export type SupportParty = 'supplier' | 'customer' | 'errors' | 'additional'

/** Sidebar list filter (support: built-in + custom section ids from support_topic_sections) */
export type TopicViewFilter = 'all' | 'archive' | string

/** @deprecated use TopicViewFilter */
export type SupportPartyFilter = TopicViewFilter

export const SUPPORT_PARTY_LABELS: Record<SupportParty, string> = {
  supplier: 'Поставщик',
  customer: 'Заказчик',
  errors: 'Ошибки',
  additional: 'Администратор',
}

export const TOPIC_VIEW_FILTER_LABELS: Record<TopicViewFilter, string> = {
  all: 'Все',
  supplier: 'Поставщик',
  customer: 'Заказчик',
  errors: 'Ошибки',
  additional: 'Администратор',
  archive: 'Архив',
}

export const SUPPORT_PARTIES: SupportParty[] = ['supplier', 'customer', 'errors', 'additional']

/** Техподдержка: Все / Поставщик / Заказчик / Ошибки / Администратор (+ Архив для editor/admin) */
export const SUPPORT_VIEW_FILTERS: TopicViewFilter[] = [
  'all',
  'supplier',
  'customer',
  'errors',
  'additional',
]

/** Остальные отделы: Все (+ Архив для editor/admin) */
export const DEPT_VIEW_FILTERS: TopicViewFilter[] = ['all']

export function isSupportParty(value: unknown): value is SupportParty {
  return (
    value === 'supplier' ||
    value === 'customer' ||
    value === 'errors' ||
    value === 'additional'
  )
}

export function isTopicViewFilter(value: unknown): value is TopicViewFilter {
  if (value === 'all' || value === 'archive') return true
  return typeof value === 'string' && value.trim().length > 0
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
  /** Changes when remote topics/media were applied — UI reloads the list. */
  lastPulledAt?: string
}

export interface ConflictResolution {
  fileName: string
  id: number
  choice: 'local' | 'remote'
}

export type SessionLogLevel = 'info' | 'warn' | 'error'

export interface SessionLogEntry {
  id: number
  at: string
  level: SessionLogLevel
  tag: string
  message: string
}

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  version: string | null
  /** Download path or URL */
  remoteSetupPath: string | null
  downloadUrl?: string | null
  error?: string
  source?: 'server' | null
  phase?: UpdatePhase
  progress?: number | null
  downloaded?: boolean
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
  /** Техподдержка: поставщик, заказчик или ошибки. Старые темы без поля = supplier */
  party?: string
  /** Корневая тема: id раздела (группировка тем внутри отдела) */
  subsection_id?: string | null
  /** Archived topics hidden from «Все»; visible only in Архив for editor/admin */
  archived?: boolean
  /** Custom order among siblings (same parent_id). Lower = higher in list. */
  sort_index?: number
  /** Техподдержка, категория «Администратор»: id клиентской темы (Поставщик/Заказчик/Ошибки). */
  client_topic_id?: number | null
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

export interface DepartmentSubsection {
  id: string
  departmentId: string
  label: string
  sortOrder: number
  /** Раздел (party) в отделе техподдержки; иначе null */
  party?: string | null
  /** Подраздел «Потерянные» в архиве (только техподдержка) */
  isArchiveLost?: boolean
  /** Подраздел «Архивированные» в архиве (ручная архивация) */
  isArchiveArchived?: boolean
}

export interface SupportTopicSection {
  id: string
  label: string
  sortOrder: number
  systemLocked?: boolean
}

export function buildTopicViewFilterLabels(
  sections: SupportTopicSection[],
  deptSubsections: DepartmentSubsection[] = [],
): Record<string, string> {
  const out: Record<string, string> = { ...TOPIC_VIEW_FILTER_LABELS }
  for (const section of sections) {
    out[section.id] = section.label
  }
  for (const sub of deptSubsections) {
    if (sub.isArchiveLost || sub.isArchiveArchived || sub.party) continue
    out[sub.id] = sub.label
  }
  return out
}

export function deptTopicSectionIdsForDepartment(
  departmentId: string,
  subsections: DepartmentSubsection[],
): string[] {
  return subsections
    .filter(
      (s) =>
        s.departmentId === departmentId &&
        !s.party &&
        !s.isArchiveLost &&
        !s.isArchiveArchived,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'ru'))
    .map((s) => s.id)
}

/** Опции «Раздел» в редакторе темы (встроенные + пользовательские разделы). */
export function supportPartySelectOptions(
  sections: SupportTopicSection[],
  currentPartyId?: string | null,
): Array<{ id: string; label: string }> {
  const sorted =
    sections.length > 0
      ? [...sections].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'ru'),
        )
      : SUPPORT_PARTIES.map((id) => ({
          id,
          label: SUPPORT_PARTY_LABELS[id],
          sortOrder: 0,
        }))
  const ids = new Set(sorted.map((s) => s.id))
  const extra = typeof currentPartyId === 'string' ? currentPartyId.trim() : ''
  const options = sorted.map(({ id, label }) => ({ id, label }))
  if (extra && !ids.has(extra)) {
    options.push({ id: extra, label: extra })
  }
  return options
}

export interface AdminDepartment {
  id: string
  label: string
  listKey: 'questions' | 'templates'
  sortOrder: number
  systemLocked?: boolean
  subsections?: DepartmentSubsection[]
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

export const WORK_DEPARTMENTS = workDepartmentsFrom(DEPARTMENTS)

export function isWorkDepartmentId(value: unknown): value is WorkDepartmentId {
  if (typeof value !== 'string') return false
  if (value === TEMPLATES_DEPARTMENT_ID || value === LOST_DEPARTMENT_ID) return false
  return /^[a-z][a-z0-9_-]{0,47}$/.test(value)
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
