import type { TopicViewFilter } from '../types'
import { TOPIC_VIEW_FILTER_LABELS } from '../types'

interface SearchProps {
  value: string
  onChange: (value: string) => void
  canAdd?: boolean
  onAdd?: () => void
  listFilter?: TopicViewFilter
  onListFilterChange?: (filter: TopicViewFilter) => void
  filterOptions?: TopicViewFilter[]
  showListFilter?: boolean
  searchInBody?: boolean
  onSearchInBodyChange?: (value: boolean) => void
}

export function Search({
  value,
  onChange,
  canAdd,
  onAdd,
  listFilter,
  onListFilterChange,
  filterOptions = [],
  showListFilter,
  searchInBody = false,
  onSearchInBodyChange,
}: SearchProps) {
  return (
    <div className="search-block">
      <div className="search">
        <div className="search__field">
          <input
            type="text"
            placeholder={searchInBody ? 'Поиск по названиям и тексту…' : 'Поиск по названиям…'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Поиск"
          />
          {value ? (
            <button
              type="button"
              className="search__clear"
              onClick={() => onChange('')}
              aria-label="Очистить поиск"
              title="Очистить"
            >
              ✕
            </button>
          ) : null}
        </div>
        {canAdd && onAdd ? (
          <button
            type="button"
            className="search__add"
            onClick={onAdd}
            title="Добавить новую заметку"
            aria-label="Добавить новую заметку"
          >
            +
          </button>
        ) : null}
      </div>
      {onSearchInBodyChange ? (
        <label className="search-in-body">
          <input
            type="checkbox"
            checked={searchInBody}
            onChange={(e) => onSearchInBodyChange(e.target.checked)}
          />
          <span>Искать также в тексте тем</span>
        </label>
      ) : null}
      {showListFilter && listFilter && onListFilterChange && filterOptions.length > 0 ? (
        <label className="party-filter">
          <span className="visually-hidden">Фильтр тем</span>
          <select
            value={listFilter}
            onChange={(e) => onListFilterChange(e.target.value as TopicViewFilter)}
            aria-label="Фильтр тем"
          >
            {filterOptions.map((p) => (
              <option key={p} value={p}>
                {TOPIC_VIEW_FILTER_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  )
}
