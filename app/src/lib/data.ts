import type { GuideItem, SupportParty } from '../types'
import { isSupportParty } from '../types'

export function getItems(data: { questions?: GuideItem[]; templates?: GuideItem[] }): GuideItem[] {
  return data.questions ?? data.templates ?? []
}

/** Legacy topics without party are treated as supplier. */
export function getItemParty(item: GuideItem): SupportParty {
  return isSupportParty(item.party) ? item.party : 'supplier'
}

export function filterItemsByParty(items: GuideItem[], party: SupportParty): GuideItem[] {
  return items.filter((item) => getItemParty(item) === party)
}

export function buildTree(items: GuideItem[]): GuideItem[] {
  return items
    .filter((item) => item.parent_id == null)
    .sort((a, b) => a.id - b.id)
}

export function getChildren(items: GuideItem[], parentId: number): GuideItem[] {
  return items
    .filter((item) => item.parent_id === parentId)
    .sort((a, b) => a.id - b.id)
}

export function getItemPath(items: GuideItem[], itemId: number): string[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const path: string[] = []
  let current = byId.get(itemId)
  while (current) {
    path.unshift(current.question)
    if (current.parent_id == null) break
    current = byId.get(current.parent_id)
  }
  return path
}

export function getFolders(items: GuideItem[]): GuideItem[] {
  return items
    .filter((item) => item.has_children)
    .sort((a, b) => a.question.localeCompare(b.question, 'ru'))
}

/** All descendant ids of rootId (not including rootId itself). */
export function getDescendantIds(items: GuideItem[], rootId: number): Set<number> {
  const byParent = new Map<number, number[]>()
  for (const item of items) {
    if (item.parent_id == null) continue
    const list = byParent.get(item.parent_id) ?? []
    list.push(item.id)
    byParent.set(item.parent_id, list)
  }
  const out = new Set<number>()
  const stack = [...(byParent.get(rootId) ?? [])]
  while (stack.length) {
    const id = stack.pop()!
    if (out.has(id)) continue
    out.add(id)
    for (const child of byParent.get(id) ?? []) stack.push(child)
  }
  return out
}

/** Whether parentId can be set for itemId (null itemId = new topic). */
export function isValidParent(
  items: GuideItem[],
  itemId: number | null,
  parentId: number | null,
): boolean {
  if (parentId == null) return true
  if (!items.some((i) => i.id === parentId)) return false
  if (itemId == null) return true
  if (parentId === itemId) return false
  return !getDescendantIds(items, itemId).has(parentId)
}

export function topicLabelWithPath(items: GuideItem[], item: GuideItem): string {
  const path = getItemPath(items, item.id)
  if (path.length <= 1) return item.question
  return path.join(' → ')
}

export function nextId(items: GuideItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
