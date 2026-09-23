import {
  DEPARTMENTS,
  type DepartmentId,
  type GuideFile,
  type GuideItem,
  type PublicUser,
} from '@app/types'

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

const guides = new Map<DepartmentId, GuideFile>()
let cachedUsers: PublicUser[] = []
let ownerEmail = ''
let lastPulledAt: string | undefined

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

export function departmentGuide(deptId: DepartmentId): GuideFile {
  const existing = guides.get(deptId)
  if (existing) return structuredClone(existing)
  const dept = DEPARTMENTS.find((d) => d.id === deptId)
  if (!dept) return {}
  return { [dept.listKey]: [] }
}

export function setDepartmentGuide(deptId: DepartmentId, data: GuideFile): GuideFile {
  const dept = DEPARTMENTS.find((d) => d.id === deptId)
  if (!dept) return data
  const listKey = dept.listKey
  const list = (data[listKey] as GuideItem[] | undefined) ?? []
  const normalized: GuideFile = {
    [listKey]: reconcileHasChildren(list.map((item) => ({ ...item }))),
  }
  guides.set(deptId, normalized)
  return structuredClone(normalized)
}

export function applyFullSync(topicsByDept: Record<string, unknown[]>): void {
  for (const dept of DEPARTMENTS) {
    const raw = topicsByDept[dept.id] ?? []
    setDepartmentGuide(dept.id, {
      [dept.listKey]: raw as GuideItem[],
    })
  }
}

export function applyDepartmentPayload(
  deptId: DepartmentId,
  payload: Record<string, unknown>,
): GuideFile {
  const dept = DEPARTMENTS.find((d) => d.id === deptId)
  if (!dept) return departmentGuide(deptId)
  const list = (payload[dept.listKey] as GuideItem[] | undefined) ?? []
  return setDepartmentGuide(deptId, { [dept.listKey]: list })
}

export function upsertTopicInGuide(deptId: DepartmentId, topic: GuideItem): GuideFile {
  const dept = DEPARTMENTS.find((d) => d.id === deptId)
  if (!dept) return departmentGuide(deptId)
  const data = departmentGuide(deptId)
  const list = [...((data[dept.listKey] as GuideItem[] | undefined) ?? [])]
  const idx = list.findIndex((t) => t.id === topic.id)
  if (idx >= 0) list[idx] = { ...list[idx], ...topic }
  else list.push(topic)
  return setDepartmentGuide(deptId, { [dept.listKey]: list })
}

export function removeTopicFromGuide(deptId: DepartmentId, id: number): GuideFile {
  const dept = DEPARTMENTS.find((d) => d.id === deptId)
  if (!dept) return departmentGuide(deptId)
  const data = departmentGuide(deptId)
  const list = ((data[dept.listKey] as GuideItem[] | undefined) ?? []).filter((t) => t.id !== id)
  return setDepartmentGuide(deptId, { [dept.listKey]: list })
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
}
