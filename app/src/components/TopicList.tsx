import { useState } from 'react'
import type { GuideItem } from '../types'
import { getChildren } from '../lib/data'
import type { SearchHit } from '../lib/search'

interface TopicListProps {
  items: GuideItem[]
  selectedId: number | null
  onSelect: (id: number) => void
  searchHits: SearchHit[] | null
}

function TreeNode({
  item,
  items,
  selectedId,
  onSelect,
  depth,
}: {
  item: GuideItem
  items: GuideItem[]
  selectedId: number | null
  onSelect: (id: number) => void
  depth: number
}) {
  const children = getChildren(items, item.id)
  const isFolder = item.has_children || children.length > 0
  const [open, setOpen] = useState(depth < 1)

  return (
    <li>
      <div
        className={`topic-item${selectedId === item.id ? ' is-selected' : ''}${isFolder ? ' is-folder' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {isFolder ? (
          <button
            type="button"
            className="topic-item__toggle"
            aria-label={open ? 'Свернуть' : 'Развернуть'}
            onClick={() => setOpen((v) => !v)}
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
          {item.question || 'Без названия'}
        </button>
      </div>
      {isFolder && open && (
        <ul className="topic-tree">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              items={items}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function TopicList({ items, selectedId, onSelect, searchHits }: TopicListProps) {
  if (searchHits) {
    if (searchHits.length === 0) {
      return <div className="empty-hint">Ничего не найдено</div>
    }
    return (
      <ul className="topic-list topic-list--flat">
        {searchHits.map(({ item, pathLabel }) => (
          <li key={item.id}>
            <button
              type="button"
              className={`topic-item topic-item--flat${selectedId === item.id ? ' is-selected' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="topic-item__title">{item.question}</span>
              {pathLabel ? <span className="topic-item__path">{pathLabel}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  const roots = items
    .filter((item) => item.parent_id == null)
    .sort((a, b) => a.id - b.id)

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
        />
      ))}
    </ul>
  )
}
