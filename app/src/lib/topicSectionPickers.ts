import type { DepartmentId, DepartmentSubsection } from '../types'

export function sortSubsectionsForEditor(
  subs: DepartmentSubsection[],
): DepartmentSubsection[] {
  return [...subs].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'ru'),
  )
}

/** Корневая тема (без родителя) — для неё обязателен выбор раздела / подраздела. */
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
  return sortSubsectionsForEditor(scoped)
}

export function sectionRequiredErrorMessage(
  departmentId: DepartmentId,
  hasSubsectionLevel: boolean,
): string {
  if (departmentId === 'support' && hasSubsectionLevel) return 'Выберите подраздел'
  return 'Выберите раздел'
}
