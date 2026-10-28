import {
  LEGACY_SUPPORT_ARCHIVE_ARCHIVED,
  LEGACY_SUPPORT_ARCHIVE_LOST,
  applyDeptArchiveSubsectionToRow,
  archiveArchivedSubsectionId,
  archiveLostSubsectionId,
  isAnyArchiveSubsectionId,
} from './departmentArchive'

export const ARCHIVE_LOST_SUBSECTION_ID = LEGACY_SUPPORT_ARCHIVE_LOST
export const ARCHIVE_ARCHIVED_SUBSECTION_ID = LEGACY_SUPPORT_ARCHIVE_ARCHIVED

export function isSupportArchiveSubsectionId(subsectionId: unknown): boolean {
  return isAnyArchiveSubsectionId(subsectionId)
}

export { archiveArchivedSubsectionId, archiveLostSubsectionId }

export function applySupportArchiveSubsectionToRow(
  row: Record<string, unknown>,
  nextArchived: boolean,
  wasArchived: boolean,
): void {
  applyDeptArchiveSubsectionToRow('support', row, nextArchived, wasArchived)
}

export function moveGuideTopicsToDeptArchiveLost(
  list: Array<Record<string, unknown>>,
  departmentId: string,
  match: (row: Record<string, unknown>) => boolean,
): number {
  const lostId = archiveLostSubsectionId(departmentId)
  let n = 0
  for (const row of list) {
    if (!match(row)) continue
    row.archived = true
    row.subsection_id = lostId
    n += 1
  }
  return n
}

export function moveGuideTopicsToArchiveLost(
  list: Array<Record<string, unknown>>,
  match: (row: Record<string, unknown>) => boolean,
): number {
  return moveGuideTopicsToDeptArchiveLost(list, 'support', match)
}

/** Убрать привязку к подразделу — темы остаются в том же разделе (party). */
export function clearGuideTopicSubsectionId(
  list: Array<Record<string, unknown>>,
  match: (row: Record<string, unknown>) => boolean,
): number {
  let n = 0
  for (const row of list) {
    if (!match(row)) continue
    delete row.subsection_id
    n += 1
  }
  return n
}
