export const ARCHIVE_LOST_SUBSECTION_ID = 'support__archive__lost'
export const ARCHIVE_ARCHIVED_SUBSECTION_ID = 'support__archive__archived'

export function applySupportArchiveSubsectionToRow(
  row: Record<string, unknown>,
  nextArchived: boolean,
  wasArchived: boolean,
): void {
  if (nextArchived && !wasArchived) {
    row.archived = true
    row.subsection_id = ARCHIVE_ARCHIVED_SUBSECTION_ID
    return
  }
  if (!nextArchived && wasArchived) {
    delete row.archived
    const sid = String(row.subsection_id ?? '').trim()
    if (sid === ARCHIVE_ARCHIVED_SUBSECTION_ID || sid === ARCHIVE_LOST_SUBSECTION_ID) {
      delete row.subsection_id
    }
  }
}

export function moveGuideTopicsToArchiveLost(
  list: Array<Record<string, unknown>>,
  match: (row: Record<string, unknown>) => boolean,
): number {
  let n = 0
  for (const row of list) {
    if (!match(row)) continue
    row.archived = true
    row.subsection_id = ARCHIVE_LOST_SUBSECTION_ID
    n += 1
  }
  return n
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
