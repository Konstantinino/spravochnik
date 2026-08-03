import type { GuideItem } from '../types'
import { getItemPath } from './data'

export interface SearchHit {
  item: GuideItem
  pathLabel: string
  /** Matched in answer body (when searchInBody is on) */
  matchedInBody?: boolean
}

export function searchItems(
  items: GuideItem[],
  query: string,
  options?: { searchInBody?: boolean },
): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const searchInBody = Boolean(options?.searchInBody)
  const hits: SearchHit[] = []

  for (const item of items) {
    const inTitle = item.question.toLowerCase().includes(q)
    const inBody = searchInBody && (item.answer ?? '').toLowerCase().includes(q)
    if (!inTitle && !inBody) continue
    hits.push({
      item,
      pathLabel: getItemPath(items, item.id).slice(0, -1).join(' / '),
      matchedInBody: !inTitle && Boolean(inBody),
    })
  }

  return hits
}


/** In-topic content search (Ctrl+F style). */
export function findInText(text: string, query: string): number[] {
  const q = query.trim().toLowerCase()
  if (!q || !text) return []
  const hay = text.toLowerCase()
  const indexes: number[] = []
  let from = 0
  while (from < hay.length) {
    const idx = hay.indexOf(q, from)
    if (idx < 0) break
    indexes.push(idx)
    from = idx + Math.max(q.length, 1)
  }
  return indexes
}
