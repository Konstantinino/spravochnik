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
    .filter((item) => {
      const hay = `${item.question}\n${item.answer ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
    .map((item) => ({
      item,
      pathLabel: getItemPath(items, item.id).slice(0, -1).join(' / '),
    }))
}
