import type pg from 'pg'
import { query, withTransaction, bumpGlobalVersion } from '../db/pool.js'
import { isSupportArchiveSubsectionId } from './archive-lost.js'
export interface SubsectionRecord {
  id: string
  departmentId: string
  label: string
  sortOrder: number
  /** id раздела техподдержки (support_topic_sections) */
  party: string | null
  isArchiveLost: boolean
  isArchiveArchived: boolean
}

type Client = pg.PoolClient

type SubsectionRow = {
  id: string
  department_id: string
  label: string
  sort_order: number
  party?: string | null
  is_archive_lost?: boolean
  is_archive_archived?: boolean
}

/** Как в клиенте: без декоративных «-» по краям, первая буква заглавная. */
export function normalizeSubsectionLabelInput(raw: string): string {
  const stripped = raw.trim().replace(/^[\s-]+/, '').replace(/[\s-]+$/, '').trim()
  if (!stripped) return ''
  const chars = [...stripped]
  const first = chars[0]
  if (!first) return stripped
  chars[0] = first.toLocaleUpperCase('ru-RU')
  return chars.join('')
}

function slugifyLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return slug || 'part'
}

function isMissingSubsectionsTable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '42P01'
  )
}

function isMissingColumn(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '42703'
  )
}

function rowToRecord(row: SubsectionRow): SubsectionRecord {
  const partyRaw = row.party
  const party = typeof partyRaw === 'string' && partyRaw.trim() ? partyRaw.trim() : null
  return {
    id: row.id,
    departmentId: row.department_id,
    label: row.label,
    sortOrder: row.sort_order,
    party,
    isArchiveLost: Boolean(row.is_archive_lost),
    isArchiveArchived: Boolean(row.is_archive_archived),
  }
}

const SELECT_WITH_PARTY = `SELECT id, department_id, label, sort_order, party, is_archive_lost, is_archive_archived`
const SELECT_NO_PARTY = `SELECT id, department_id, label, sort_order`

async function querySubsections(
  sqlWithParty: string,
  sqlNoParty: string,
  params: unknown[],
): Promise<SubsectionRecord[]> {
  try {
    const result = await query<SubsectionRow>(sqlWithParty, params)
    return result.rows.map(rowToRecord)
  } catch (err) {
    if (isMissingSubsectionsTable(err)) return []
    if (isMissingColumn(err)) {
      const result = await query<Omit<SubsectionRow, 'party'>>(sqlNoParty, params)
      return result.rows.map((row) =>
        rowToRecord({
          ...row,
          party: null,
          is_archive_lost: row.id === 'support__archive__lost',
          is_archive_archived: row.id === 'support__archive__archived',
        }),
      )
    }
    throw err
  }
}

export async function listSubsections(departmentId?: string): Promise<SubsectionRecord[]> {
  if (departmentId) {
    return querySubsections(
      `${SELECT_WITH_PARTY}
         FROM department_subsections
        WHERE department_id = $1
        ORDER BY sort_order ASC, id ASC`,
      `${SELECT_NO_PARTY}
         FROM department_subsections
        WHERE department_id = $1
        ORDER BY sort_order ASC, id ASC`,
      [departmentId],
    )
  }
  return querySubsections(
    `${SELECT_WITH_PARTY}
       FROM department_subsections
      ORDER BY department_id ASC, sort_order ASC, id ASC`,
    `${SELECT_NO_PARTY}
       FROM department_subsections
      ORDER BY department_id ASC, sort_order ASC, id ASC`,
    [],
  )
}

export async function getSubsectionById(id: string): Promise<SubsectionRecord | null> {
  try {
    const result = await query<SubsectionRow>(
      `${SELECT_WITH_PARTY} FROM department_subsections WHERE id = $1`,
      [id],
    )
    const row = result.rows[0]
    return row ? rowToRecord(row) : null
  } catch (err) {
    if (isMissingColumn(err)) {
      const result = await query<Omit<SubsectionRow, 'party'>>(
        `${SELECT_NO_PARTY} FROM department_subsections WHERE id = $1`,
        [id],
      )
      const row = result.rows[0]
      return row ? rowToRecord({ ...row, party: null }) : null
    }
    throw err
  }
}

export async function nextSubsectionSortOrder(
  departmentId: string,
  party: string | null,
  client?: Client,
): Promise<number> {
  const q = client ? client.query.bind(client) : query
  try {
    const result = await q<{ max: string | null }>(
      `SELECT MAX(sort_order) AS max FROM department_subsections
        WHERE department_id = $1
          AND party IS NOT DISTINCT FROM $2`,
      [departmentId, party],
    )
    const max = result.rows[0]?.max != null ? parseInt(String(result.rows[0].max), 10) : 0
    return Number.isFinite(max) ? max + 10 : 10
  } catch (err) {
    if (isMissingColumn(err)) {
      const result = await q<{ max: string | null }>(
        `SELECT MAX(sort_order) AS max FROM department_subsections WHERE department_id = $1`,
        [departmentId],
      )
      const max = result.rows[0]?.max != null ? parseInt(String(result.rows[0].max), 10) : 0
      return Number.isFinite(max) ? max + 10 : 10
    }
    throw err
  }
}

export async function allocateSubsectionId(
  departmentId: string,
  label: string,
  client?: Client,
): Promise<string> {
  const q = client ? client.query.bind(client) : query
  const base = `${departmentId}__${slugifyLabel(label)}`
  let candidate = base
  let n = 2
  while (true) {
    const exists = await q<{ id: string }>(
      `SELECT id FROM department_subsections WHERE id = $1`,
      [candidate],
    )
    if (exists.rows.length === 0) return candidate
    candidate = `${base}_${n}`
    n += 1
  }
}

export async function departmentHasSubsections(departmentId: string): Promise<boolean> {
  const rows = await listSubsections(departmentId)
  return rows.length > 0
}

function filterSubsectionsForTopicScope(
  subs: SubsectionRecord[],
  departmentId: string,
  party: string | null,
): SubsectionRecord[] {
  if (departmentId === 'support') {
    return subs.filter((s) => s.party === party)
  }
  return subs.filter((s) => !s.isArchiveLost && !s.isArchiveArchived)
}

function deptTopLevelSectionRecords(subs: SubsectionRecord[]): SubsectionRecord[] {
  return subs.filter((s) => !s.party && !s.isArchiveLost && !s.isArchiveArchived)
}

function departmentHasNestedSubsectionRecords(subs: SubsectionRecord[]): boolean {
  return subs.some((s) => Boolean(s.party?.trim()))
}

/** Как в клиенте: «без подраздела» → id раздела; иначе id подраздела или раздела (плоский отдел). */
export function resolveNonSupportRootSubsectionId(
  subs: SubsectionRecord[],
  requested: unknown,
  deptSectionId: string | null,
): string | null {
  const tops = deptTopLevelSectionRecords(subs)
  if (tops.length === 0) {
    const raw = typeof requested === 'string' ? requested.trim() : ''
    return raw || null
  }

  const picked =
    typeof requested === 'string' && requested.trim()
      ? requested.trim()
      : null
  const section = deptSectionId?.trim() || null

  if (departmentHasNestedSubsectionRecords(subs)) {
    if (!section) return picked
    const nested = subs.filter((s) => (s.party ?? null) === section)
    if (nested.length > 0) {
      if (picked && nested.some((s) => s.id === picked)) return picked
      return section
    }
    return section
  }
  return picked
}

export async function resolveTopicSubsectionId(
  departmentId: string,
  parentId: number | null,
  requested: unknown,
  client: Client,
  party: string | null,
  options?: { deptSectionId?: unknown },
): Promise<string | null> {
  const all = await listSubsectionsForClient(client, departmentId)
  const subs = filterSubsectionsForTopicScope(all, departmentId, party)
  if (subs.length === 0) return null

  if (parentId != null) {
    const parentRes = await client.query<{ subsection_id: string | null }>(
      `SELECT subsection_id FROM topics
        WHERE department_id = $1 AND id = $2 AND deleted_at IS NULL`,
      [departmentId, parentId],
    )
    const inherited = parentRes.rows[0]?.subsection_id
    if (inherited && subs.some((s) => s.id === inherited)) return inherited
    return null
  }

  if (departmentId === 'support' && requested === null) return null

  let effectiveRequested: unknown = requested
  if (departmentId !== 'support') {
    const deptSectionRaw = options?.deptSectionId
    const deptSectionId =
      typeof deptSectionRaw === 'string' && deptSectionRaw.trim()
        ? deptSectionRaw.trim()
        : null
    let normalizedRequest: unknown = requested
    const requestedStr = typeof requested === 'string' ? requested.trim() : ''
    if (requestedStr && !subs.some((s) => s.id === requestedStr)) {
      // Старый/локальный id (есть в клиенте, нет в department_subsections) — не блокируем «без подраздела».
      normalizedRequest = null
    }
    effectiveRequested = resolveNonSupportRootSubsectionId(
      subs,
      normalizedRequest,
      deptSectionId,
    )
  } else if (requested === null) {
    return null
  }

  const id = typeof effectiveRequested === 'string' ? effectiveRequested.trim() : ''
  if (!id) {
    if (departmentId !== 'support' && deptTopLevelSectionRecords(subs).length > 0) {
      const err = new Error('Выберите раздел')
      ;(err as Error & { status: number }).status = 400
      throw err
    }
    return null
  }

  const pickMsg = departmentId === 'support' ? 'Выберите подраздел' : 'Выберите раздел'
  if (!subs.some((s) => s.id === id)) {
    if (departmentId === 'support' && isSupportArchiveSubsectionId(id)) {
      return id
    }
    const err = new Error(
      departmentId === 'support'
        ? pickMsg
        : `${pickMsg} (id: ${id})`,
    )
    ;(err as Error & { status: number }).status = 400
    throw err
  }
  return id
}

async function listSubsectionsForClient(
  client: Client,
  departmentId: string,
): Promise<SubsectionRecord[]> {
  try {
    const result = await client.query<SubsectionRow>(
      `${SELECT_WITH_PARTY}
         FROM department_subsections
        WHERE department_id = $1
        ORDER BY sort_order ASC, id ASC`,
      [departmentId],
    )
    return result.rows.map(rowToRecord)
  } catch (err) {
    if (isMissingColumn(err)) {
      const result = await client.query<Omit<SubsectionRow, 'party'>>(
        `${SELECT_NO_PARTY}
           FROM department_subsections
          WHERE department_id = $1
          ORDER BY sort_order ASC, id ASC`,
        [departmentId],
      )
      return result.rows.map((row) =>
        rowToRecord({
          ...row,
          party: null,
          is_archive_lost: row.id === 'support__archive__lost',
          is_archive_archived: row.id === 'support__archive__archived',
        }),
      )
    }
    throw err
  }
}

export function subsectionToClient(row: SubsectionRecord) {
  return {
    id: row.id,
    departmentId: row.departmentId,
    label: normalizeSubsectionLabelInput(row.label),
    sortOrder: row.sortOrder,
    party: row.party,
    isArchiveLost: row.isArchiveLost,
    isArchiveArchived: row.isArchiveArchived,
  }
}

function matchesSubsectionScope(row: SubsectionRecord, party: string | null): boolean {
  if (row.isArchiveLost || row.isArchiveArchived) return false
  const rowParty = row.party ?? null
  return party === null ? rowParty === null : rowParty === party
}

export async function reorderSubsectionsInScope(
  departmentId: string,
  party: string | null,
  orderedIds: string[],
): Promise<SubsectionRecord[]> {
  const all = await listSubsections(departmentId)
  const scope = all.filter((row) => matchesSubsectionScope(row, party))
  if (orderedIds.length === 0) return scope
  const scopeIds = new Set(scope.map((row) => row.id))
  if (orderedIds.length !== scope.length) {
    throw new Error('Нужен полный список подразделов в группе')
  }
  const seen = new Set<string>()
  for (const id of orderedIds) {
    if (!scopeIds.has(id) || seen.has(id)) {
      throw new Error('Некорректный порядок подразделов')
    }
    seen.add(id)
  }
  await withTransaction(async (client) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      const sortOrder = (index + 1) * 10
      await client.query(
        `UPDATE department_subsections SET sort_order = $3
         WHERE id = $1 AND department_id = $2`,
        [orderedIds[index], departmentId, sortOrder],
      )
    }
    await bumpGlobalVersion(client)
  })
  return all
    .filter((row) => matchesSubsectionScope(row, party))
    .sort((a, b) => {
      const ai = orderedIds.indexOf(a.id)
      const bi = orderedIds.indexOf(b.id)
      return ai - bi
    })
}
