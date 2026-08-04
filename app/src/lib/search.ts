import type { GuideItem } from '../types'
import { getItemPath } from './data'

export interface SearchHit {
  item: GuideItem
  pathLabel: string
  /** Matched in answer body (when searchInBody is on) */
  matchedInBody?: boolean
}

export interface TopicSearchMatch {
  inTitle: boolean
  inBody: boolean
}

export interface TopicSearchFilter {
  query: string
  /** Non-empty lowercased tokens; all must match (AND). */
  tokens: string[]
  visibleIds: Set<number>
  matchById: Map<number, TopicSearchMatch>
}

/** Split query into AND-tokens. One word → same as before; spaces add extra filters. */
export function splitSearchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

export function textHasAllTokens(text: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false
  const lower = text.toLowerCase()
  return tokens.every((t) => lower.includes(t))
}

export function searchItems(
  items: GuideItem[],
  query: string,
  options?: { searchInBody?: boolean },
): SearchHit[] {
  const tokens = splitSearchTokens(query)
  if (tokens.length === 0) return []

  const searchInBody = Boolean(options?.searchInBody)
  const hits: SearchHit[] = []

  for (const item of items) {
    const inTitle = textHasAllTokens(item.question, tokens)
    const inBody =
      searchInBody &&
      textHasAllTokens(`${item.question}\n${item.answer ?? ''}`, tokens)
    if (!inTitle && !inBody) continue
    hits.push({
      item,
      pathLabel: getItemPath(items, item.id).slice(0, -1).join(' / '),
      matchedInBody: !inTitle && Boolean(inBody),
    })
  }

  return hits
}

/** Tree filter: matching topics plus their ancestors (keeps hierarchy). */
export function buildTopicSearchFilter(
  items: GuideItem[],
  query: string,
  options?: { searchInBody?: boolean },
): TopicSearchFilter | null {
  const tokens = splitSearchTokens(query)
  if (tokens.length === 0) return null

  const searchInBody = Boolean(options?.searchInBody)
  const byId = new Map(items.map((i) => [i.id, i]))
  const visibleIds = new Set<number>()
  const matchById = new Map<number, TopicSearchMatch>()

  for (const item of items) {
    const inTitle = textHasAllTokens(item.question, tokens)
    const combinedOk =
      searchInBody &&
      textHasAllTokens(`${item.question}\n${item.answer ?? ''}`, tokens)
    const inBody = Boolean(combinedOk) && !inTitle
    if (!inTitle && !combinedOk) continue

    matchById.set(item.id, { inTitle, inBody })
    let current: GuideItem | undefined = item
    while (current) {
      visibleIds.add(current.id)
      current = current.parent_id != null ? byId.get(current.parent_id) : undefined
    }
  }

  return { query: query.trim(), tokens, visibleIds, matchById }
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
