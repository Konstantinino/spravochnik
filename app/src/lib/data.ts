import type { GuideItem } from '../types'

export function getItems(data: { questions?: GuideItem[]; templates?: GuideItem[] }): GuideItem[] {
  return data.questions ?? data.templates ?? []
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

export function nextId(items: GuideItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
