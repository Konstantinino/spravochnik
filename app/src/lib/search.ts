import type { GuideItem } from '../types'
import { getItemPath } from './data'

export interface SearchHit {
  item: GuideItem
  pathLabel: string
}

export function searchItems(items: GuideItem[], query: string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return items
    .filter((item) => item.question.toLowerCase().includes(q))
    .map((item) => ({
      item,
      pathLabel: getItemPath(items, item.id).slice(0, -1).join(' / '),
    }))
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
