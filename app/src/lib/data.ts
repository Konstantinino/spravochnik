import type { GuideItem, SupportParty, TopicViewFilter } from '../types'
import { isSupportParty } from '../types'

export function getItems(data: { questions?: GuideItem[]; templates?: GuideItem[] }): GuideItem[] {
  return data.questions ?? data.templates ?? []
}

/** Legacy topics without party are treated as supplier. */
export function getItemParty(item: GuideItem): SupportParty {
  return isSupportParty(item.party) ? item.party : 'supplier'
}

export function isArchived(item: GuideItem): boolean {
  return Boolean(item.archived)
}

/**
 * Filter sidebar list.
 * - archive: only archived
 * - all / supplier / customer / errors / additional: exclude archived; party filter for support
 */
export function filterItemsByView(items: GuideItem[], filter: TopicViewFilter): GuideItem[] {
  if (filter === 'archive') {
    return items.filter((item) => isArchived(item))
  }
  const active = items.filter((item) => !isArchived(item))
  if (filter === 'all') return active
  return active.filter((item) => getItemParty(item) === filter)
}

/** @deprecated use filterItemsByView */
export function filterItemsByParty(items: GuideItem[], party: TopicViewFilter): GuideItem[] {
  return filterItemsByView(items, party)
}

export function compareTopicsByTitle(a: GuideItem, b: GuideItem): number {
  return (a.question || '').localeCompare(b.question || '', 'ru', { sensitivity: 'base' })
}

function hasSortIndex(item: GuideItem): boolean {
  return item.sort_index != null && Number.isFinite(item.sort_index)
}

/** List order: sort_index first, then title for ties / legacy topics. */
export function compareTopicsForList(a: GuideItem, b: GuideItem): number {
  const aHas = hasSortIndex(a)
  const bHas = hasSortIndex(b)
  if (aHas && bHas) {
    const byIndex = a.sort_index! - b.sort_index!
    if (byIndex !== 0) return byIndex
  } else if (aHas) {
    return -1
  } else if (bHas) {
    return 1
  }
  return compareTopicsByTitle(a, b)
}

export function buildTree(items: GuideItem[]): GuideItem[] {
  return items
    .filter((item) => item.parent_id == null)
    .sort(compareTopicsForList)
}

export function getChildren(items: GuideItem[], parentId: number): GuideItem[] {
  return items
    .filter((item) => item.parent_id === parentId)
    .sort(compareTopicsForList)
}

/** Assign sort_index 0..n-1 within each sibling group (keeps current list order). */
export function ensureSortIndexes(items: GuideItem[]): GuideItem[] {
  const byParent = new Map<string, GuideItem[]>()
  for (const item of items) {
    const key = item.parent_id == null ? 'root' : String(item.parent_id)
    const group = byParent.get(key) ?? []
    group.push(item)
    byParent.set(key, group)
  }

  const updates = new Map<number, number>()
  for (const group of byParent.values()) {
    const ordered = [...group].sort(compareTopicsForList)
    ordered.forEach((item, index) => updates.set(item.id, index))
  }

  return items.map((item) => {
    const next = updates.get(item.id)
    if (next === undefined || item.sort_index === next) return item
    return { ...item, sort_index: next }
  })
}

export type ReorderSiblingScope = {
  /** Reorder only among siblings matching this predicate; others keep their slots. */
  matchSibling: (item: GuideItem) => boolean
}

/** Scope for root-level reorder in the current sidebar filter (party / archive / all). */
export function resolveReorderSiblingScope(
  listFilter: TopicViewFilter,
  parentId: number | null,
  allItems: GuideItem[],
  draggedId: number,
): ReorderSiblingScope | undefined {
  if (parentId != null) return undefined

  if (listFilter === 'archive') {
    return { matchSibling: isArchived }
  }
  if (isSupportParty(listFilter)) {
    const party = listFilter
    return {
      matchSibling: (item) => !isArchived(item) && getItemParty(item) === party,
    }
  }
  if (listFilter === 'all') {
    const dragged = allItems.find((item) => item.id === draggedId)
    if (!dragged) return undefined
    const party = getItemParty(dragged)
    return {
      matchSibling: (item) => !isArchived(item) && getItemParty(item) === party,
    }
  }
  return undefined
}

/** Whether root-level drag targets must share the same party (support dept). */
export function rootReorderRequiresSameParty(
  departmentId: string,
  listFilter: TopicViewFilter,
): boolean {
  return departmentId === 'support' && listFilter !== 'archive'
}

/** Reorder siblings after drag-and-drop; returns changed { id, sort_index } pairs. */
export function reorderSiblingTopics(
  items: GuideItem[],
  parentId: number | null,
  draggedId: number,
  targetId: number,
  scope?: ReorderSiblingScope,
): { items: GuideItem[]; changes: Array<{ id: number; sort_index: number }> } {
  const siblings = items
    .filter((item) => (item.parent_id ?? null) === parentId)
    .sort(compareTopicsForList)

  let nextIds: number[]
  if (scope) {
    const scoped = siblings.filter(scope.matchSibling)
    const scopedIds = scoped.map((item) => item.id)
    const fromIdx = scopedIds.indexOf(draggedId)
    const toIdx = scopedIds.indexOf(targetId)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
      return { items, changes: [] }
    }

    const nextScopedIds = [...scopedIds]
    nextScopedIds.splice(fromIdx, 1)
    nextScopedIds.splice(toIdx, 0, draggedId)

    const scopedIdSet = new Set(scopedIds)
    const scopedQueue = [...nextScopedIds]
    nextIds = siblings.map((item) => {
      if (!scopedIdSet.has(item.id)) return item.id
      return scopedQueue.shift()!
    })
  } else {
    const ids = siblings.map((item) => item.id)
    const fromIdx = ids.indexOf(draggedId)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
      return { items, changes: [] }
    }

    nextIds = [...ids]
    nextIds.splice(fromIdx, 1)
    nextIds.splice(toIdx, 0, draggedId)
  }

  const siblingIds = new Set(siblings.map((item) => item.id))
  const indexById = new Map<number, number>()
  nextIds.forEach((id, index) => indexById.set(id, index))

  const changes: Array<{ id: number; sort_index: number }> = []
  const nextItems = items.map((item) => {
    if (!siblingIds.has(item.id)) return item
    const sortIndex = indexById.get(item.id)!
    if (item.sort_index === sortIndex) return item
    changes.push({ id: item.id, sort_index: sortIndex })
    return { ...item, sort_index: sortIndex }
  })

  return { items: nextItems, changes }
}

/** Recompute has_children from actual non-archived children (fixes stale flags). */
export function reconcileHasChildren(items: GuideItem[]): GuideItem[] {
  const childCounts = new Map<number, number>()
  for (const item of items) {
    if (item.parent_id == null || isArchived(item)) continue
    childCounts.set(item.parent_id, (childCounts.get(item.parent_id) ?? 0) + 1)
  }
  return items.map((item) => ({
    ...item,
    has_children: (childCounts.get(item.id) ?? 0) > 0,
  }))
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

/** Folder ids that must be open to reveal itemId in the tree (root → parent). */
export function getAncestorIds(items: GuideItem[], itemId: number): number[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const ids: number[] = []
  let current = byId.get(itemId)
  while (current?.parent_id != null) {
    ids.unshift(current.parent_id)
    current = byId.get(current.parent_id)
  }
  return ids
}

export function getFolders(items: GuideItem[]): GuideItem[] {
  return items
    .filter((item) => item.has_children)
    .sort(compareTopicsForList)
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

export function filterTopicsForLinkPicker(items: GuideItem[]): GuideItem[] {
  return items.filter((item) => !isArchived(item))
}

/** Parent picker: same party only (support dept); excludes archive. */
export function filterTopicsForParentPicker(
  items: GuideItem[],
  party: SupportParty,
): GuideItem[] {
  return filterTopicsForLinkPicker(items).filter((item) => getItemParty(item) === party)
}

export function topicDisplayLabel(item: GuideItem): string {
  return item.question?.trim() || 'Без названия'
}

export function topicLabelWithPath(items: GuideItem[], item: GuideItem): string {
  const path = getItemPath(items, item.id)
  if (path.length <= 1) return topicDisplayLabel(item)
  return path.join(' → ')
}

/** Picker search: all query tokens must appear in the topic title only (not parent path). */
export function topicMatchesQuery(_items: GuideItem[], item: GuideItem, query: string): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return true
  const title = topicDisplayLabel(item).toLowerCase()
  return tokens.every((token) => title.includes(token))
}

export function nextId(items: GuideItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
