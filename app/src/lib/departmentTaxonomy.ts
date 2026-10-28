import type { DepartmentId, DepartmentSubsection, SupportTopicSection } from '../types'
import {
  SUPPORT_PARTIES,
  SUPPORT_PARTY_LABELS,
  deptTopicSectionIdsForDepartment,
  isSupportParty,
} from '../types'
import { deptTopLevelSections } from './deptTopicSections'

/** Отдел использует модель «раздел (party) + подраздел», как техподдержка. */
export function departmentUsesPartyTopicModel(
  departmentId: DepartmentId,
  subsections: DepartmentSubsection[],
  _supportSections: SupportTopicSection[] = [],
): boolean {
  if (departmentId === 'support') return true
  return deptTopLevelSections(subsections, departmentId).length > 0
}

/** Id фильтров sidebar (без all/archive). */
export function departmentTopicSectionFilterIds(
  departmentId: DepartmentId,
  subsections: DepartmentSubsection[],
  supportSections: SupportTopicSection[] = [],
): string[] {
  if (departmentId === 'support') {
    if (supportSections.length > 0) {
      return supportSections.map((s) => s.id)
    }
    return [...SUPPORT_PARTIES]
  }
  return deptTopicSectionIdsForDepartment(departmentId, subsections)
}

/** Опции select «Раздел» в редакторе. */
export function departmentTopicSectionSelectOptions(
  departmentId: DepartmentId,
  subsections: DepartmentSubsection[],
  supportSections: SupportTopicSection[] = [],
  currentSectionId?: string | null,
): Array<{ id: string; label: string }> {
  if (departmentId === 'support') {
    const sorted =
      supportSections.length > 0
        ? [...supportSections].sort(
            (a, b) =>
              a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'ru'),
          )
        : SUPPORT_PARTIES.map((id) => ({
            id,
            label: SUPPORT_PARTY_LABELS[id],
            sortOrder: 0,
          }))
    const ids = new Set(sorted.map((s) => s.id))
    const out = sorted.map(({ id, label }) => ({ id, label }))
    const extra = typeof currentSectionId === 'string' ? currentSectionId.trim() : ''
    if (extra && !ids.has(extra) && isSupportParty(extra)) {
      out.push({ id: extra, label: SUPPORT_PARTY_LABELS[extra] })
    }
    return out.filter((o) => o.id !== 'archive')
  }
  return deptTopLevelSections(subsections, departmentId).map((s) => ({
    id: s.id,
    label: s.label,
  }))
}
