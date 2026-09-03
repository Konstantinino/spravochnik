import { useState, type ReactNode } from 'react'
import type { GuideItem } from '../types'
import { buildTree, getChildren } from '../lib/data'
import type { TopicSearchFilter } from '../lib/search'

/** Matches default `.topic-item` horizontal margin */
const BASE_MARGIN_X = 8
/** Inner pad before toggle on root rows only */
const ROOT_PAD = 12
const TOGGLE_W = 28
/** Gap between guide line and outer left edge of child row */
const GUIDE_GAP = 8

function rowMarginLeft(depth: number): number {
  if (depth <= 0) return BASE_MARGIN_X
  return guideX(depth - 1) + GUIDE_GAP
}

/** X of guide under the expand arrow of a row at `depth` */
function guideX(depth: number): number {
  if (depth <= 0) return BASE_MARGIN_X + ROOT_PAD + TOGGLE_W / 2
  return rowMarginLeft(depth) + TOGGLE_W / 2
}

function highlightTitle(text: string, tokens: string[]): ReactNode {
  if (tokens.length === 0) return text

  const lower = text.toLowerCase()
  const ranges: Array<{ start: number; end: number }> = []

  for (const token of tokens) {
    let from = 0
    while (from < text.length) {
      const idx = lower.indexOf(token, from)
      if (idx < 0) break
      ranges.push({ start: idx, end: idx + token.length })
      from = idx + Math.max(token.length, 1)
    }
  }

  if (ranges.length === 0) return text

  ranges.sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: Array<{ start: number; end: number }> = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end)
    } else {
      merged.push({ ...r })
    }
  }

  const parts: ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const r of merged) {
    if (r.start > cursor) parts.push(text.slice(cursor, r.start))
    parts.push(
      <mark key={key++} className="find-hit">
        {text.slice(r.start, r.end)}
      </mark>,
    )
    cursor = r.end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

interface TopicListProps {
  items: GuideItem[]
  selectedId: number | null
  onSelect: (id: number) => void
  searchFilter: TopicSearchFilter | null
}

function TreeNode({
  item,
  items,
  selectedId,
  onSelect,
  depth,
  searchFilter,
}: {
  item: GuideItem
  items: GuideItem[]
  selectedId: number | null
  onSelect: (id: number) => void
  depth: number
  searchFilter: TopicSearchFilter | null
}) {
  const allChildren = getChildren(items, item.id)
  const children = searchFilter
    ? allChildren.filter((c) => searchFilter.visibleIds.has(c.id))
    : allChildren
  const isFolder = searchFilter
    ? children.length > 0
    : item.has_children || allChildren.length > 0
  const [manualOpen, setManualOpen] = useState(depth < 1)
  const open = searchFilter ? children.length > 0 : manualOpen
  const match = searchFilter?.matchById.get(item.id)
  const title = item.question || 'Без названия'
  const label = (() => {
    if (!match || !searchFilter) return title
    const titleLower = title.toLowerCase()
    if (searchFilter.tokens.some((t) => titleLower.includes(t))) {
      return highlightTitle(title, searchFilter.tokens)
    }
    if (match.inBody) {
      return <mark className="find-hit">{title}</mark>
    }
    return title
  })()

  return (
    <li>
      <div
        className={`topic-item${selectedId === item.id ? ' is-selected' : ''}${isFolder ? ' is-folder' : ''}`}
        style={{
          marginLeft: `${rowMarginLeft(depth)}px`,
          paddingLeft: depth === 0 ? `${ROOT_PAD}px` : 0,
        }}
      >
        {isFolder ? (
          <button
            type="button"
            className="topic-item__toggle"
            aria-label={open ? 'Свернуть' : 'Развернуть'}
            onClick={() => {
              if (searchFilter) return
              setManualOpen((v) => !v)
            }}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="topic-item__spacer" />
        )}
        <button
          type="button"
          className="topic-item__label"
          onClick={() => onSelect(item.id)}
        >
          {label}
        </button>
      </div>
      {isFolder && open && children.length > 0 && (
        <ul
          className="topic-tree"
          style={{ ['--guide-x' as string]: `${guideX(depth)}px` }}
        >
          {children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              items={items}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
              searchFilter={searchFilter}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function TopicList({ items, selectedId, onSelect, searchFilter }: TopicListProps) {
  const roots = buildTree(items).filter(
    (item) => !searchFilter || searchFilter.visibleIds.has(item.id),
  )

  if (searchFilter && roots.length === 0) {
    return <div className="empty-hint">Ничего не найдено</div>
  }

  if (roots.length === 0) {
    return <div className="empty-hint">В этом отделе пока нет тем</div>
  }

  return (
    <ul className="topic-tree topic-list">
      {roots.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={0}
          searchFilter={searchFilter}
        />
      ))}
    </ul>
  )
}
