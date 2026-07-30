interface SearchProps {
  value: string
  onChange: (value: string) => void
}

export function Search({ value, onChange }: SearchProps) {
  return (
    <div className="search">
      <input
        type="search"
        placeholder="Поиск по темам..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Поиск"
      />
    </div>
  )
}
