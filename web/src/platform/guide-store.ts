import {
  DEPARTMENTS,
  type AdminDepartment,
  type Department,
  type DepartmentId,
  type GuideFile,
  type GuideItem,
  type PublicUser,
  type SupportParty,
} from '@app/types'

export interface StoredSubsection {
  id: string
  departmentId: string
  label: string
  sortOrder: number
  party?: SupportParty | null
  isArchiveLost?: boolean
  isArchiveArchived?: boolean
}

export interface StoredSupportSection {
  id: string
  label: string
  sortOrder: number
  systemLocked?: boolean
}

function reconcileHasChildren(items: GuideItem[]): GuideItem[] {
  const childCounts = new Map<number, number>()
  for (const item of items) {
    if (item.parent_id == null || item.archived) continue
    childCounts.set(item.parent_id, (childCounts.get(item.parent_id) ?? 0) + 1)
  }
  return items.map((item) => ({
    ...item,
    has_children: (childCounts.get(item.id) ?? 0) > 0,
  }))
}

function departmentFileName(id: string): string {
  if (id === 'support') return 'guide.json'
  if (id === 'templates') return 'templates.json'
  return `guide_${id}.json`
}

const guides = new Map<DepartmentId, GuideFile>()
let cachedUsers: PublicUser[] = []
let ownerEmail = ''
let lastPulledAt: string | undefined
let cachedDepartments: Department[] = DEPARTMENTS.map((d) => ({ ...d }))
let cachedSubsections: StoredSubsection[] = []
let cachedSupportSections: StoredSupportSection[] = []

export function getOwnerEmail(): string {
  return ownerEmail
}

export function getCachedUsers(): PublicUser[] {
  return cachedUsers
}

export function getLastPulledAt(): string | undefined {
  return lastPulledAt
}

export function setLastPulledAt(iso: string | undefined): void {
  lastPulledAt = iso
}

export function getCachedDepartments(): Department[] {
  return cachedDepartments.map((d) => ({ ...d }))
}

export function setCachedDepartments(
  rows: Array<{
    id: string
    label: string
    listKey?: 'questions' | 'templates'
    sortOrder?: number
    systemLocked?: boolean
  }>,
): void {
  if (!Array.isArray(rows) || rows.length === 0) return
  cachedDepartments = [...rows]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id.localeCompare(b.id))
    .map((d) => ({
      id: d.id,
      label: d.label,
      fileName: departmentFileName(d.id),
      listKey: d.listKey === 'templates' ? 'templates' : 'questions',
    }))
}

export function getCachedSubsections(): StoredSubsection[] {
  return cachedSubsections.map((s) => ({ ...s }))
}

export function setCachedSubsections(rows: StoredSubsection[]): void {
  cachedSubsections = Array.isArray(rows) ? rows.map((s) => ({ ...s })) : []
}

export function getCachedSupportSections(): StoredSupportSection[] {
  return cachedSupportSections.map((s) => ({ ...s }))
}

export function setCachedSupportSections(rows: StoredSupportSection[]): void {
  cachedSupportSections = Array.isArray(rows) ? rows.map((s) => ({ ...s })) : []
}

export function listKeyForDept(deptId: DepartmentId): 'questions' | 'templates' {
  return (
    cachedDepartments.find((d) => d.id === deptId)?.listKey ??
    DEPARTMENTS.find((d) => d.id === deptId)?.listKey ??
    'questions'
  )
}

export function departmentGuide(deptId: DepartmentId): GuideFile {
  const existing = guides.get(deptId)
  if (existing) return structuredClone(existing)
  const listKey = listKeyForDept(deptId)
  return { [listKey]: [] }
}

export function setDepartmentGuide(deptId: DepartmentId, data: GuideFile): GuideFile {
  const listKey = listKeyForDept(deptId)
  const list = (data[listKey] as GuideItem[] | undefined) ?? []
  const normalized: GuideFile = {
    [listKey]: reconcileHasChildren(list.map((item) => ({ ...item }))),
  }
  guides.set(deptId, normalized)
  return structuredClone(normalized)
}

export function applyFullSync(topicsByDept: Record<string, unknown[]>): void {
  const deptIds = new Set<string>([
    ...cachedDepartments.map((d) => d.id),
    ...Object.keys(topicsByDept),
  ])
  for (const id of deptIds) {
    const raw = topicsByDept[id] ?? []
    const listKey = listKeyForDept(id)
    setDepartmentGuide(id, {
      [listKey]: raw as GuideItem[],
    })
  }
}

export function applyDepartmentPayload(
  deptId: DepartmentId,
  payload: Record<string, unknown>,
): GuideFile {
  const listKey = listKeyForDept(deptId)
  const list = (payload[listKey] as GuideItem[] | undefined) ?? []
  return setDepartmentGuide(deptId, { [listKey]: list })
}

export function upsertTopicInGuide(deptId: DepartmentId, topic: GuideItem): GuideFile {
  const listKey = listKeyForDept(deptId)
  const data = departmentGuide(deptId)
  const list = [...((data[listKey] as GuideItem[] | undefined) ?? [])]
  const idx = list.findIndex((t) => t.id === topic.id)
  if (idx >= 0) list[idx] = { ...list[idx], ...topic }
  else list.push(topic)
  return setDepartmentGuide(deptId, { [listKey]: list })
}

export function removeTopicFromGuide(deptId: DepartmentId, id: number): GuideFile {
  const listKey = listKeyForDept(deptId)
  const data = departmentGuide(deptId)
  const list = ((data[listKey] as GuideItem[] | undefined) ?? []).filter((t) => t.id !== id)
  return setDepartmentGuide(deptId, { [listKey]: list })
}

export function removeTopicsFromGuide(deptId: DepartmentId, ids: number[]): GuideFile {
  const idSet = new Set(ids)
  const listKey = listKeyForDept(deptId)
  const data = departmentGuide(deptId)
  const list = ((data[listKey] as GuideItem[] | undefined) ?? []).filter((t) => !idSet.has(t.id))
  return setDepartmentGuide(deptId, { [listKey]: list })
}

export function setUsersFromSync(users: unknown[]): void {
  if (!Array.isArray(users)) {
    cachedUsers = []
    ownerEmail = ''
    return
  }
  cachedUsers = users.map((user) => {
    const row = user as Record<string, unknown>
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: row.role as PublicUser['role'],
      departmentId: (row.departmentId ?? row.department_id ?? 'support') as PublicUser['departmentId'],
      ...(row.role === 'owner' || row.isOwner ? { isOwner: true } : {}),
    }
  })
  ownerEmail = cachedUsers.find((u) => u.role === 'owner')?.email ?? ''
}

export function clearGuideStore(): void {
  guides.clear()
  cachedUsers = []
  ownerEmail = ''
  lastPulledAt = undefined
  cachedDepartments = DEPARTMENTS.map((d) => ({ ...d }))
  cachedSubsections = []
  cachedSupportSections = []
}

export function toAdminDepartments(): AdminDepartment[] {
  const byDept = new Map<string, StoredSubsection[]>()
  for (const sub of cachedSubsections) {
    const arr = byDept.get(sub.departmentId) ?? []
    arr.push(sub)
    byDept.set(sub.departmentId, arr)
  }
  return cachedDepartments.map((d, index) => ({
    id: d.id,
    label: d.label,
    listKey: d.listKey,
    sortOrder: (index + 1) * 10,
    subsections: (byDept.get(d.id) ?? []).map((s) => ({
      id: s.id,
      departmentId: s.departmentId,
      label: s.label,
      sortOrder: s.sortOrder,
      party: s.party ?? null,
      isArchiveLost: s.isArchiveLost,
      isArchiveArchived: s.isArchiveArchived,
    })),
  }))
}
