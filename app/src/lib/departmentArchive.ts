export const LEGACY_SUPPORT_ARCHIVE_LOST = 'support__archive__lost'
export const LEGACY_SUPPORT_ARCHIVE_ARCHIVED = 'support__archive__archived'

export function archiveLostSubsectionId(departmentId: string): string {
  if (departmentId === 'support') return LEGACY_SUPPORT_ARCHIVE_LOST
  return `${departmentId}__archive__lost`
}

export function archiveArchivedSubsectionId(departmentId: string): string {
  if (departmentId === 'support') return LEGACY_SUPPORT_ARCHIVE_ARCHIVED
  return `${departmentId}__archive__archived`
}

export function isDeptArchiveSubsectionId(
  departmentId: string,
  subsectionId: unknown,
): boolean {
  const sid = String(subsectionId ?? '').trim()
  if (!sid) return false
  return (
    sid === archiveLostSubsectionId(departmentId) ||
    sid === archiveArchivedSubsectionId(departmentId)
  )
}

export function isAnyArchiveSubsectionId(subsectionId: unknown): boolean {
  const sid = String(subsectionId ?? '').trim()
  if (!sid) return false
  if (sid === LEGACY_SUPPORT_ARCHIVE_LOST || sid === LEGACY_SUPPORT_ARCHIVE_ARCHIVED) {
    return true
  }
  return /__archive__(lost|archived)$/.test(sid)
}

export function applyDeptArchiveSubsectionToRow(
  departmentId: string,
  row: Record<string, unknown>,
  nextArchived: boolean,
  wasArchived: boolean,
): void {
  if (nextArchived && !wasArchived) {
    row.archived = true
    row.subsection_id = archiveArchivedSubsectionId(departmentId)
    return
  }
  if (!nextArchived && wasArchived) {
    delete row.archived
    if (isAnyArchiveSubsectionId(row.subsection_id)) {
      delete row.subsection_id
    }
  }
}
