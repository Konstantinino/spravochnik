import type { DepartmentId, DepartmentSubsection, GuideItem } from '../types'
import {
  assignableSubsectionsForDeptEditor,
  departmentHasNestedSubsections,
  deptNestedSubsections,
  deptSectionHasNestedSubsections,
  deptSectionIdForTopicSubsection,
  deptTopLevelSections,
} from './deptTopicSections'
import { getItemParty } from './data'
import { isSupportArchiveSubsectionId } from './archiveLost'
import { normalizeSubsectionLabelInput } from './subsectionDividerLabel'

/** Значение «Раздел» в редакторе для архивных тем техподдержки (не поле party в JSON). */
export const SUPPORT_EDITOR_ARCHIVE_PARTY_ID = 'archive'

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
  options?: { deptSectionId?: string | null },
): string {
  const sid = typeof subsectionId === 'string' ? subsectionId.trim() : ''
  if (!sid) return SUBSECTION_NONE_SELECT_VALUE
  const sectionId = options?.deptSectionId?.trim() || null
  if (sectionId && sid === sectionId) return SUBSECTION_NONE_SELECT_VALUE
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

export function editorArchiveSectionActive(
  departmentId: DepartmentId,
  _topicArchived: boolean,
  partySelectValue?: string,
): boolean {
  if (departmentId !== 'support') return false
  return partySelectValue === SUPPORT_EDITOR_ARCHIVE_PARTY_ID
}

export function editorPartySelectValue(
  _departmentId: DepartmentId,
  item: Pick<GuideItem, 'archived' | 'party'> | null | undefined,
  fallbackParty = 'supplier',
): string {
  return item ? getItemParty(item) : fallbackParty
}

/** Снять архив при сохранении корневой темы с выбранным разделом / подразделом. */
export function shouldUnarchiveRootTopicOnSectionSave(
  departmentId: DepartmentId,
  wasArchived: boolean,
  parentId: number | null,
  params: {
    isRootTopic: boolean
    showParty: boolean
    party?: string
    subsection_id?: string | null
    dept_section_id?: string | null
    subsections: DepartmentSubsection[]
  },
): boolean {
  if (!wasArchived || !params.isRootTopic || parentId != null) return false
  if (params.showParty) {
    const p = params.party?.trim()
    return Boolean(p && p !== SUPPORT_EDITOR_ARCHIVE_PARTY_ID)
  }
  const forDept = params.subsections.filter((s) => s.departmentId === departmentId)
  if (deptTopLevelSections(forDept, departmentId).length === 0) return true
  const sid = String(
    params.subsection_id ?? params.dept_section_id ?? '',
  ).trim()
  return Boolean(sid && !isSupportArchiveSubsectionId(sid))
}

/** party в JSON темы; «archive» в select — только UI. */
export function editorPartyForSave(
  selectedParty: string,
  departmentId: DepartmentId,
  item: Pick<GuideItem, 'party'> | null | undefined,
  fallbackParty = 'supplier',
): string {
  if (departmentId !== 'support') return selectedParty
  if (selectedParty === SUPPORT_EDITOR_ARCHIVE_PARTY_ID) {
    return item ? getItemParty(item) : fallbackParty
  }
  return selectedParty
}

export function editorSubsectionsForDepartment(
  subsections: DepartmentSubsection[],
  departmentId: DepartmentId,
  party: string,
  options?: { archiveSection?: boolean; deptSectionId?: string | null },
): DepartmentSubsection[] {
  const forDept = subsections.filter((s) => s.departmentId === departmentId)
  const scoped =
    departmentId === 'support' && options?.archiveSection
      ? forDept.filter((s) => s.isArchiveLost || s.isArchiveArchived)
      : departmentId === 'support'
        ? forDept.filter(
            (s) =>
              s.party === party &&
              !s.isArchiveLost &&
              !s.isArchiveArchived,
          )
        : assignableSubsectionsForDeptEditor(
            forDept,
            departmentId,
            options?.deptSectionId ?? null,
          )
  return sortSubsectionsForEditor(scoped).map((s) => ({
    ...s,
    label: normalizeSubsectionLabelInput(s.label),
  }))
}

export function sectionRequiredErrorMessage(
  departmentId: DepartmentId,
  hasSubsectionLevel: boolean,
  hasNestedUnderSection?: boolean,
): string {
  if (departmentId === 'support' && hasSubsectionLevel) return 'Выберите подраздел'
  if (departmentId !== 'support' && hasNestedUnderSection) return 'Выберите подраздел'
  return 'Выберите раздел'
}

/** Раздел отдела для редактора (как в validateRootTopicSectionAssignment). */
/** Поле `dept_section_id` в теле API (корневая тема, не support). */
export function deptSectionIdForTopicApiPayload(params: {
  isRootTopic: boolean
  showParty: boolean
  editorDeptSectionId?: string | null
  defaultDeptSectionId?: string | null
  deptSectionSelectValue?: string
}): string | undefined {
  if (params.showParty || !params.isRootTopic) return undefined
  const id = effectiveDeptEditorSectionId(params)
  return id ?? undefined
}

export function effectiveDeptEditorSectionId(params: {
  editorDeptSectionId?: string | null
  defaultDeptSectionId?: string | null
  deptSectionSelectValue?: string
}): string | null {
  return (
    params.editorDeptSectionId?.trim() ||
    params.defaultDeptSectionId?.trim() ||
    params.deptSectionSelectValue?.trim() ||
    null
  )
}

/** Корневая тема в отделе (не support): итоговый subsection_id для сохранения. */
export function resolveDeptRootSubsectionIdForSave(
  departmentId: DepartmentId,
  subsections: DepartmentSubsection[],
  deptSectionId: string | null,
  selectValue: string,
): string | null {
  const forDept = subsections.filter((s) => s.departmentId === departmentId)
  const top = deptTopLevelSections(forDept, departmentId)
  if (top.length === 0) return rootSubsectionIdForSave(selectValue)

  const picked = rootSubsectionIdForSave(selectValue)
  const section = deptSectionId?.trim() || null

  if (departmentHasNestedSubsections(forDept, departmentId)) {
    if (!section) return picked
    const nested = deptNestedSubsections(forDept, departmentId, section)
    if (nested.length > 0) {
      if (picked && nested.some((s) => s.id === picked)) return picked
      // «- без подраздела -» → тема на уровне раздела (id раздела).
      return section
    }
    return section
  }
  return picked
}

/**
 * Итоговые поля раздела для API (корневая тема).
 * Support: только subsection_id (null = без подраздела).
 * Другие отделы: subsection_id + dept_section_id (как party + subsection у support).
 */
export function rootTopicSubsectionPayloadForSave(
  departmentId: DepartmentId,
  subsections: DepartmentSubsection[],
  params: {
    isRootTopic: boolean
    showParty: boolean
    hasSupportSubsectionPicker: boolean
    subsectionSelectValue: string
    editorDeptSectionId?: string | null
    defaultDeptSectionId?: string | null
    deptSectionSelectValue?: string
  },
): { subsection_id?: string | null; dept_section_id?: string } {
  if (!params.isRootTopic) return {}

  if (params.showParty) {
    if (!params.hasSupportSubsectionPicker) return {}
    return { subsection_id: rootSubsectionIdForSave(params.subsectionSelectValue) }
  }

  const forDept = subsections.filter((s) => s.departmentId === departmentId)
  if (deptTopLevelSections(forDept, departmentId).length === 0) return {}

  const sectionParams = {
    editorDeptSectionId: params.editorDeptSectionId,
    defaultDeptSectionId: params.defaultDeptSectionId,
    deptSectionSelectValue: params.deptSectionSelectValue,
  }
  const dept_section_id = effectiveDeptEditorSectionId(sectionParams) ?? undefined
  const subsection_id = resolveDeptRootSubsectionIdForSave(
    departmentId,
    subsections,
    dept_section_id ?? null,
    params.subsectionSelectValue,
  )
  return {
    subsection_id,
    ...(dept_section_id ? { dept_section_id } : {}),
  }
}

/** subsection_id корневой темы в отделе (не support); undefined — поле не трогать. */
export function deptRootSubsectionIdForSave(
  departmentId: DepartmentId,
  subsections: DepartmentSubsection[],
  params: {
    isRootTopic: boolean
    showParty: boolean
    editorDeptSectionId?: string | null
    defaultDeptSectionId?: string | null
    deptSectionSelectValue?: string
    subsectionSelectValue: string
  },
): string | null | undefined {
  if (params.showParty || !params.isRootTopic) return undefined
  const forDept = subsections.filter((s) => s.departmentId === departmentId)
  if (deptTopLevelSections(forDept, departmentId).length === 0) return undefined
  const sectionId = effectiveDeptEditorSectionId(params)
  return resolveDeptRootSubsectionIdForSave(
    departmentId,
    subsections,
    sectionId,
    params.subsectionSelectValue,
  )
}

export function validateRootTopicSectionAssignment(
  departmentId: DepartmentId,
  subsections: DepartmentSubsection[],
  params: {
    isRootTopic: boolean
    showParty: boolean
    party: string
    archiveSection?: boolean
    subsectionSelectValue: string
    deptSectionSelectValue: string
    defaultDeptSectionId?: string | null
    editorDeptSectionId?: string | null
  },
): string | null {
  if (!params.isRootTopic || params.showParty) return null

  const forDept = subsections.filter((s) => s.departmentId === departmentId)
  const top = deptTopLevelSections(forDept, departmentId)
  if (top.length === 0) return null

  const effectiveSection = effectiveDeptEditorSectionId({
    editorDeptSectionId: params.editorDeptSectionId,
    defaultDeptSectionId: params.defaultDeptSectionId,
    deptSectionSelectValue: params.deptSectionSelectValue,
  })
  const picked = rootSubsectionIdForSave(params.subsectionSelectValue)
  const hasNested = departmentHasNestedSubsections(forDept, departmentId)

  if (hasNested) {
    if (!effectiveSection || !top.some((s) => s.id === effectiveSection)) {
      return 'Выберите раздел'
    }
    if (deptSectionHasNestedSubsections(forDept, departmentId, effectiveSection)) {
      if (picked && picked !== effectiveSection && !deptNestedSubsections(forDept, departmentId, effectiveSection).some((s) => s.id === picked)) {
        return 'Выберите подраздел'
      }
      return null
    }
    return null
  }

  if (!picked || !top.some((s) => s.id === picked)) {
    return 'Выберите раздел'
  }
  return null
}

/** Синхронизация фильтра списка после сохранения (аналог party у support). */
export function deptSectionListFilterForSubsection(
  departmentId: DepartmentId,
  subsectionId: string | null | undefined,
  subsections: DepartmentSubsection[],
): string | null {
  if (departmentId === 'support') return null
  const sid = typeof subsectionId === 'string' ? subsectionId.trim() : ''
  if (!sid) return null
  const sectionId = deptSectionIdForTopicSubsection(sid, subsections)
  if (!sectionId) return null
  if (!deptTopLevelSections(subsections, departmentId).some((s) => s.id === sectionId)) {
    return null
  }
  return sectionId
}
