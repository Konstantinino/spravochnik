import { useEffect, useMemo, useState } from 'react'
import type { GuideItem } from '../types'
import { compareTopicsByTitle, getDescendantIds, isValidParent, topicLabelWithPath } from '../lib/data'

interface ParentTopicFieldProps {
  items: GuideItem[]
  /** Topic being edited (exclude self + descendants). Null when creating. */
  excludeId?: number | null
  attach: boolean
  onAttachChange: (attach: boolean) => void
  parentId: number | null
  onParentIdChange: (parentId: number | null) => void
}

export function ParentTopicField({
  items,
  excludeId = null,
  attach,
  onAttachChange,
  parentId,
  onParentIdChange,
}: ParentTopicFieldProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    setQuery('')
  }, [excludeId, attach])

  const excluded = useMemo(() => {
    if (excludeId == null) return new Set<number>()
    const set = getDescendantIds(items, excludeId)
    set.add(excludeId)
    return set
  }, [items, excludeId])

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((item) => !excluded.has(item.id))
      .filter((item) => isValidParent(items, excludeId, item.id))
      .filter((item) => {
        if (!q) return true
        const label = topicLabelWithPath(items, item).toLowerCase()
        return label.includes(q) || item.question.toLowerCase().includes(q)
      })
      .sort(compareTopicsByTitle)
      .slice(0, 80)
  }, [items, excluded, excludeId, query])

  const selected = parentId != null ? items.find((i) => i.id === parentId) : null

  function setAttached(next: boolean) {
    onAttachChange(next)
    if (!next) {
      onParentIdChange(null)
      setQuery('')
    }
  }

  function pick(id: number) {
    onParentIdChange(id)
    setQuery('')
  }

  return (
    <div className="parent-topic-field">
      <label className="parent-topic-field__check">
        <input
          type="checkbox"
          checked={attach}
          onChange={(e) => setAttached(e.target.checked)}
        />
        <span>Сделать подтемой другой темы</span>
      </label>

      {attach && (
        <div className="parent-topic-field__picker">
          {selected ? (
            <div className="parent-topic-field__selected">
              <span className="muted">Родитель:</span> {topicLabelWithPath(items, selected)}
              <button
                type="button"
                className="btn btn-ghost parent-topic-field__clear"
                onClick={() => onParentIdChange(null)}
              >
                Сбросить
              </button>
            </div>
          ) : (
            <>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск темы…"
                aria-label="Поиск родительской темы"
              />
              <ul className="parent-topic-field__list" role="listbox">
                {options.length === 0 ? (
                  <li className="muted parent-topic-field__empty">Ничего не найдено</li>
                ) : (
                  options.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="parent-topic-field__option"
                        onClick={() => pick(item.id)}
                      >
                        {topicLabelWithPath(items, item)}
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <p className="form-error parent-topic-field__hint">Выберите родительскую тему</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
