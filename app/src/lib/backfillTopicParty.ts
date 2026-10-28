import type { DepartmentSubsection, GuideItem } from '../types'
import { getItemParty } from './data'
import { deptSectionIdForTopicSubsection } from './deptTopicSections'

/** Проставить topics.party в локальном JSON (до/после sync с сервером). */
export function backfillTopicPartyInList(
  list: GuideItem[],
  departmentId: string,
  subsections: DepartmentSubsection[],
): boolean {
  if (departmentId === 'support') return false
  const byId = new Map(list.map((row) => [row.id, row]))
  let changed = false

  for (const item of list) {
    const existing =
      typeof item.party === 'string' && item.party.trim() ? item.party.trim() : ''
    if (existing) continue

    let party = ''
    if (item.parent_id != null) {
      const parent = byId.get(item.parent_id)
      if (parent) {
        party = getItemParty(parent, { departmentId, subsections })
      }
    } else {
      const sid =
        typeof item.subsection_id === 'string' ? item.subsection_id.trim() : ''
      if (sid) {
        party =
          deptSectionIdForTopicSubsection(sid, subsections) ??
          sid
      }
    }

    if (party) {
      item.party = party
      changed = true
    }
  }

  return changed
}
