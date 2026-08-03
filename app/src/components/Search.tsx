import type { SupportParty } from '../types'
import { SUPPORT_PARTIES, SUPPORT_PARTY_LABELS } from '../types'

interface SearchProps {
  value: string
  onChange: (value: string) => void
  canAdd?: boolean
  onAdd?: () => void
  /** Техподдержка: фильтр Поставщик / Заказчик */
  partyFilter?: SupportParty
  onPartyFilterChange?: (party: SupportParty) => void
  showPartyFilter?: boolean
  searchInBody?: boolean
  onSearchInBodyChange?: (value: boolean) => void
}

export function Search({
  value,
  onChange,
  canAdd,
  onAdd,
  partyFilter,
  onPartyFilterChange,
  showPartyFilter,
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
      {showPartyFilter && partyFilter && onPartyFilterChange ? (
        <label className="party-filter">
          <span className="visually-hidden">Поставщик или заказчик</span>
          <select
            value={partyFilter}
            onChange={(e) => onPartyFilterChange(e.target.value as SupportParty)}
            aria-label="Поставщик или заказчик"
          >
            {SUPPORT_PARTIES.map((p) => (
              <option key={p} value={p}>
                {SUPPORT_PARTY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  )
}
