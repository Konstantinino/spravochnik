import { useEffect, useMemo, useRef, useState } from 'react'
import type { GuideItem } from '../types'
import { compareTopicsByTitle, topicLabelWithPath } from '../lib/data'

export type TopicLinkPickerState = {
  mode: 'insert' | 'wrap'
  start: number
  end: number
  query: string
  left: number
  top: number
}

interface TopicLinkPickerProps {
  open: TopicLinkPickerState | null
  items: GuideItem[]
  excludeId?: number | null
  onPick: (item: GuideItem) => void
  onClose: () => void
  onQueryChange?: (query: string) => void
}

export function TopicLinkPicker({
  open,
  items,
  excludeId = null,
  onPick,
  onClose,
  onQueryChange,
}: TopicLinkPickerProps) {
  const [active, setActive] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const options = useMemo(() => {
    if (!open) return []
    const q = open.query.trim().toLowerCase()
    return items
      .filter((item) => item.id !== excludeId)
      .filter((item) => {
        if (!q) return true
        const label = topicLabelWithPath(items, item).toLowerCase()
        return label.includes(q) || item.question.toLowerCase().includes(q)
      })
      .sort(compareTopicsByTitle)
      .slice(0, 60)
  }, [items, excludeId, open])

  useEffect(() => {
    setActive(0)
  }, [open?.query, open?.start, open?.mode])

  useEffect(() => {
    if (!open || open.mode !== 'wrap') return
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [open?.mode, open?.start])

  useEffect(() => {
    if (!open || !rootRef.current) return
    const activeEl = rootRef.current.querySelector('.topic-link-picker__option.is-active')
    if (activeEl instanceof HTMLElement) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [active, open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (options.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => (i + 1) % options.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i - 1 + options.length) % options.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = options[active]
        if (item) onPick(item)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, options, active, onClose, onPick])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (target?.closest('.topic-link-picker')) return
      onClose()
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={rootRef}
      className="topic-link-picker topic-link-picker--floating"
      role="listbox"
      aria-label="Ссылка на тему"
      style={{ left: open.left, top: open.top }}
    >
      <div className="topic-link-picker__head">
        Ссылка на тему
        <span className="muted">↑↓ Enter · Esc</span>
      </div>
      {open.mode === 'wrap' && (
        <input
          ref={searchRef}
          type="search"
          className="topic-link-picker__search"
          value={open.query}
          placeholder="Поиск темы…"
          aria-label="Поиск темы для ссылки"
          onChange={(e) => onQueryChange?.(e.target.value)}
        />
      )}
      <ul className="topic-link-picker__list">
        {options.length === 0 ? (
          <li className="muted topic-link-picker__empty">Ничего не найдено</li>
        ) : (
          options.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                className={`topic-link-picker__option${index === active ? ' is-active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => onPick(item)}
              >
                {topicLabelWithPath(items, item)}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
