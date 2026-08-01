interface SearchProps {
  value: string
  onChange: (value: string) => void
  canAdd?: boolean
  onAdd?: () => void
}

export function Search({ value, onChange, canAdd, onAdd }: SearchProps) {
  return (
    <div className="search">
      <div className="search__field">
        <input
          type="text"
          placeholder="Поиск по названиям..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Поиск по названиям"
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
  )
}
