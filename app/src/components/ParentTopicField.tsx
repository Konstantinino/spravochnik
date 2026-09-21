import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GuideItem } from '../types'
import {
  compareTopicsForList,
  getDescendantIds,
  isValidParent,
  topicDisplayLabel,
  topicMatchesQuery,
} from '../lib/data'

interface ParentTopicFieldProps {
  items: GuideItem[]
  /** Topic being edited (exclude self + descendants). Null when creating. */
  excludeId?: number | null
  attach: boolean
  onAttachChange: (attach: boolean) => void
  parentId: number | null
  onParentIdChange: (parentId: number | null) => void
}

const NOT_SELECTED_LABEL = 'не выбрано'

export function ParentTopicField({
  items,
  excludeId = null,
  attach,
  onAttachChange,
  parentId,
  onParentIdChange,
}: ParentTopicFieldProps) {
  const [inputText, setInputText] = useState('')
  const [open, setOpen] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimerRef = useRef<number | null>(null)
  const ignoreBlurRef = useRef(false)

  const excluded = useMemo(() => {
    if (excludeId == null) return new Set<number>()
    const set = getDescendantIds(items, excludeId)
    set.add(excludeId)
    return set
  }, [items, excludeId])

  const validOptions = useMemo(() => {
    return items
      .filter((item) => !excluded.has(item.id))
      .filter((item) => isValidParent(items, excludeId, item.id))
      .sort(compareTopicsForList)
  }, [items, excluded, excludeId])

  const filteredOptions = useMemo(() => {
    if (!attach) return []
    return validOptions.filter((item) => topicMatchesQuery(items, item, inputText))
  }, [attach, validOptions, items, inputText])

  const syncInputFromParent = useCallback(
    (id: number | null) => {
      if (id == null) {
        setInputText('')
        return
      }
      const item = items.find((i) => i.id === id)
      setInputText(item ? topicDisplayLabel(item) : '')
    },
    [items],
  )

  useEffect(() => {
    if (!attach) {
      setOpen(false)
      return
    }
    if (parentId != null) {
      syncInputFromParent(parentId)
    }
  }, [attach, parentId, excludeId, syncInputFromParent])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      const target = e.target
      if (target instanceof Node && comboboxRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [open])

  useEffect(() => {
    return () => {
      if (blurTimerRef.current != null) window.clearTimeout(blurTimerRef.current)
    }
  }, [])

  function setAttached(next: boolean) {
    onAttachChange(next)
    if (!next) {
      onParentIdChange(null)
      setInputText('')
      setOpen(false)
    }
  }

  function pick(id: number) {
    if (blurTimerRef.current != null) {
      window.clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
    ignoreBlurRef.current = true
    const item = items.find((i) => i.id === id)
    const label = item ? topicDisplayLabel(item) : ''
    onParentIdChange(id)
    setInputText(label)
    setOpen(false)
  }

  function openDropdown() {
    if (!attach) return
    setOpen(true)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!attach) return
    const next = e.target.value
    setInputText(next)
    setOpen(true)
    if (parentId != null) {
      const selected = items.find((i) => i.id === parentId)
      if (!selected || topicDisplayLabel(selected) !== next) {
        onParentIdChange(null)
      }
    }
  }

  function resolveBlurSelection(text: string) {
    const trimmed = text.trim()
    if (!trimmed) {
      onParentIdChange(null)
      setInputText('')
      return
    }

    const exactMatches = validOptions.filter(
      (item) => topicDisplayLabel(item).toLowerCase() === trimmed.toLowerCase(),
    )
    if (exactMatches.length === 1) {
      pick(exactMatches[0].id)
      return
    }

    if (parentId != null) {
      const selected = items.find((i) => i.id === parentId)
      if (selected && topicDisplayLabel(selected).toLowerCase() === trimmed.toLowerCase()) {
        return
      }
    }

    onParentIdChange(null)
    setInputText('')
  }

  function handleBlur() {
    if (!attach) return
    blurTimerRef.current = window.setTimeout(() => {
      blurTimerRef.current = null
      setOpen(false)
      if (ignoreBlurRef.current) {
        ignoreBlurRef.current = false
        return
      }
      resolveBlurSelection(inputText)
    }, 150)
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

      <div
        ref={comboboxRef}
        className={`parent-topic-field__combobox${attach ? '' : ' is-inactive'}`}
      >
        <input
          ref={inputRef}
          type="text"
          className="parent-topic-field__input"
          value={attach ? inputText : NOT_SELECTED_LABEL}
          readOnly={!attach}
          tabIndex={attach ? 0 : -1}
          aria-disabled={!attach}
          aria-expanded={attach && open}
          aria-haspopup="listbox"
          aria-label="Родительская тема"
          placeholder={attach ? 'Поиск темы…' : undefined}
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={handleInputChange}
          onBlur={handleBlur}
        />
        {attach && open ? (
          <ul className="parent-topic-field__dropdown" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="muted parent-topic-field__empty">Ничего не найдено</li>
            ) : (
              filteredOptions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="parent-topic-field__option"
                    role="option"
                    aria-selected={item.id === parentId}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      ignoreBlurRef.current = true
                    }}
                    onClick={() => pick(item.id)}
                  >
                    {topicDisplayLabel(item)}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
