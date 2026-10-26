import type { DepartmentId, DepartmentSubsection } from '../types'
import { normalizeSubsectionLabelInput } from './subsectionDividerLabel'

export function sortSubsectionsForEditor(
  subs: DepartmentSubsection[],
): DepartmentSubsection[] {
  return [...subs].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'ru'),
  )
}

/** Значение `<select>`: тема на уровне раздела (party/отдела), без подраздела. */
export const SUBSECTION_NONE_SELECT_VALUE = ''

export const SUBSECTION_NONE_OPTION_LABEL = '- без подраздела - '

/** Значение для выпадающего списка при редактировании корневой темы. */
export function rootSubsectionSelectValueFromTopic(
  subsectionId: string | null | undefined,
  subs: DepartmentSubsection[],
): string {
  const sid = typeof subsectionId === 'string' ? subsectionId.trim() : ''
  if (sid && subs.some((s) => s.id === sid)) return sid
  return SUBSECTION_NONE_SELECT_VALUE
}

/** `null` — явно без подраздела (корень раздела). */
export function rootSubsectionIdForSave(selectValue: string): string | null {
  const id = selectValue.trim()
  return id ? id : null
}

/** Корневая тема (без родителя) — для неё показывается выбор подраздела, если они настроены. */
export function isEditableRootTopic(
  attachParent: boolean,
  mode: 'add' | 'edit',
  initialParentId: number | null | undefined,
): boolean {
  if (mode === 'add') return !attachParent
  return initialParentId == null && !attachParent
}

export function editorSubsectionsForDepartment(
  subsections: DepartmentSubsection[],
  departmentId: DepartmentId,
  party: string,
): DepartmentSubsection[] {
  const forDept = subsections.filter((s) => s.departmentId === departmentId)
  const scoped =
    departmentId === 'support'
      ? forDept.filter(
          (s) =>
            s.party === party && !s.isArchiveLost && !s.isArchiveArchived,
        )
      : forDept.filter(
          (s) => !s.party && !s.isArchiveLost && !s.isArchiveArchived,
        )
  return sortSubsectionsForEditor(scoped).map((s) => ({
    ...s,
    label: normalizeSubsectionLabelInput(s.label),
  }))
}

export function sectionRequiredErrorMessage(
  departmentId: DepartmentId,
  hasSubsectionLevel: boolean,
): string {
  if (departmentId === 'support' && hasSubsectionLevel) return 'Выберите подраздел'
  return 'Выберите раздел'
}
