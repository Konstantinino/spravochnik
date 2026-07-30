import type { DepartmentId } from '../types'
import { DEPARTMENTS } from '../types'

interface HeaderProps {
  departmentId: DepartmentId
  onDepartmentChange: (id: DepartmentId) => void
  onAdd: () => void
}

export function Header({ departmentId, onDepartmentChange, onAdd }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">Справочник</div>
      <label className="app-header__dept">
        <span className="visually-hidden">Отдел</span>
        <select
          value={departmentId}
          onChange={(e) => onDepartmentChange(e.target.value as DepartmentId)}
          aria-label="Отдел"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        Добавить
      </button>
    </header>
  )
}
