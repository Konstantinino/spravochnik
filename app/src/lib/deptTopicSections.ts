import type { DepartmentSubsection, GuideItem, TopicViewFilter } from '../types'

export function isDeptTopLevelSection(sub: DepartmentSubsection): boolean {
  return !sub.party && !sub.isArchiveLost && !sub.isArchiveArchived
}

export function deptTopLevelSections(
  subsections: DepartmentSubsection[],
  departmentId: string,
): DepartmentSubsection[] {
  return subsections.filter((s) => s.departmentId === departmentId && isDeptTopLevelSection(s))
}

/** Подразделы внутри раздела (party = id корневого раздела отдела). */
export function deptNestedSubsections(
  subsections: DepartmentSubsection[],
  departmentId: string,
  sectionId: string,
): DepartmentSubsection[] {
  const sid = sectionId.trim()
  if (!sid) return []
  return subsections.filter(
    (s) => s.departmentId === departmentId && (s.party ?? null) === sid,
  )
}

export function departmentHasNestedSubsections(
  subsections: DepartmentSubsection[],
  departmentId: string,
): boolean {
  return subsections.some(
    (s) => s.departmentId === departmentId && Boolean(s.party?.trim()),
  )
}

export function deptSectionIdForTopicSubsection(
  subsectionId: string | null | undefined,
  subsections: DepartmentSubsection[],
): string | null {
  const sid = typeof subsectionId === 'string' ? subsectionId.trim() : ''
  if (!sid) return null
  const sub = subsections.find((s) => s.id === sid)
  if (!sub) return sid
  if (!sub.party) return sid
  return sub.party.trim() || null
}

export function topicMatchesDeptSection(
  item: GuideItem,
  sectionId: string,
  subsections: DepartmentSubsection[],
): boolean {
  const sid = String(item.subsection_id ?? '').trim()
  if (!sid) return false
  if (sid === sectionId) return true
  const sub = subsections.find((s) => s.id === sid)
  return (sub?.party ?? null) === sectionId
}

/** Раздел темы или любого предка (подтемы часто без subsection_id). */
export function topicInDeptSectionView(
  item: GuideItem,
  sectionId: string,
  subsections: DepartmentSubsection[],
  activeItems: GuideItem[],
): boolean {
  if (topicMatchesDeptSection(item, sectionId, subsections)) return true
  const byId = new Map(activeItems.map((row) => [row.id, row]))
  let parentId = item.parent_id ?? null
  while (parentId != null) {
    const parent = byId.get(parentId)
    if (!parent) break
    if (topicMatchesDeptSection(parent, sectionId, subsections)) return true
    parentId = parent.parent_id ?? null
  }
  return false
}

export function isDeptTopLevelSectionFilter(
  value: TopicViewFilter,
  departmentId: string,
  subsections: DepartmentSubsection[],
): boolean {
  if (departmentId === 'support' || value === 'all' || value === 'archive') return false
  return deptTopLevelSections(subsections, departmentId).some((s) => s.id === value)
}

/** Варианты для редактора корневой темы (раздел / подраздел). */
export function assignableSubsectionsForDeptEditor(
  subsections: DepartmentSubsection[],
  departmentId: string,
  sectionId: string | null,
): DepartmentSubsection[] {
  const top = deptTopLevelSections(subsections, departmentId)
  const hasNested = departmentHasNestedSubsections(subsections, departmentId)
  if (!sectionId) {
    if (hasNested) return []
    return top
  }
  const nested = deptNestedSubsections(subsections, departmentId, sectionId)
  if (nested.length > 0) return nested
  // У раздела нет подразделов — тема привязывается к id раздела, не показываем его в «Подраздел».
  return []
}

export function deptSectionHasNestedSubsections(
  subsections: DepartmentSubsection[],
  departmentId: string,
  sectionId: string,
): boolean {
  return deptNestedSubsections(subsections, departmentId, sectionId).length > 0
}

/** Top-level section id for reorder / grouping (empty = unassigned). */
export function deptReorderSectionKey(
  item: GuideItem,
  subsections: DepartmentSubsection[],
): string {
  const sid = String(item.subsection_id ?? '').trim()
  if (!sid) return ''
  return deptSectionIdForTopicSubsection(sid, subsections) ?? sid
}
