export type GuideListKey = 'questions' | 'templates'

export interface GuideTopic {
  id: number
  question?: string
  answer?: string
  [key: string]: unknown
}

export interface TopicConflict {
  fileName: string
  listKey: GuideListKey
  id: number
  title: string
  local: GuideTopic
  remote: GuideTopic
}

export interface MergeGuideResult {
  merged: Record<string, unknown>
  conflicts: TopicConflict[]
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortValue(obj[key])
    }
    return out
  }
  return value
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b)
}

function asTopicMap(list: unknown): Map<number, GuideTopic> {
  const map = new Map<number, GuideTopic>()
  if (!Array.isArray(list)) return map
  for (const row of list) {
    if (!row || typeof row !== 'object') continue
    const id = (row as GuideTopic).id
    if (typeof id !== 'number' || !Number.isFinite(id)) continue
    map.set(id, row as GuideTopic)
  }
  return map
}

function topicTitle(topic: GuideTopic | undefined, id: number): string {
  const q = topic?.question
  if (typeof q === 'string' && q.trim()) return q.trim()
  return `Тема #${id}`
}

function detectListKey(file: Record<string, unknown>): GuideListKey {
  if (Array.isArray(file.templates)) return 'templates'
  return 'questions'
}

/** Build a synthetic base when no snapshot exists: equal items only. */
export function synthesizeBase(
  localFile: Record<string, unknown>,
  remoteFile: Record<string, unknown>,
  listKey: GuideListKey,
): Record<string, unknown> {
  const localMap = asTopicMap(localFile[listKey])
  const remoteMap = asTopicMap(remoteFile[listKey])
  const baseList: GuideTopic[] = []
  for (const [id, local] of localMap) {
    const remote = remoteMap.get(id)
    if (remote && deepEqual(local, remote)) baseList.push(local)
  }
  return { ...remoteFile, ...localFile, [listKey]: baseList }
}

/**
 * Three-way merge of guide topics by id.
 * Non-list fields: prefer local if changed from base, else remote if changed, else local.
 */
export function mergeGuideFile(
  fileName: string,
  baseFile: Record<string, unknown> | null,
  localFile: Record<string, unknown>,
  remoteFile: Record<string, unknown>,
): MergeGuideResult {
  const listKey = detectListKey(localFile) || detectListKey(remoteFile)
  const base =
    baseFile ?? synthesizeBase(localFile, remoteFile, listKey)

  const baseMap = asTopicMap(base[listKey])
  const localMap = asTopicMap(localFile[listKey])
  const remoteMap = asTopicMap(remoteFile[listKey])

  const ids = new Set<number>([
    ...baseMap.keys(),
    ...localMap.keys(),
    ...remoteMap.keys(),
  ])

  const mergedList: GuideTopic[] = []
  const conflicts: TopicConflict[] = []

  for (const id of [...ids].sort((a, b) => a - b)) {
    const b = baseMap.get(id)
    const l = localMap.get(id)
    const r = remoteMap.get(id)

    const inBase = b !== undefined
    const inLocal = l !== undefined
    const inRemote = r !== undefined

    // Deleted locally, unchanged remotely → drop
    if (inBase && !inLocal && inRemote && deepEqual(b, r)) continue
    // Deleted remotely, unchanged locally → drop
    if (inBase && inLocal && !inRemote && deepEqual(b, l)) continue
    // Deleted both → drop
    if (inBase && !inLocal && !inRemote) continue
    // Deleted one side, changed other → conflict (use surviving copies)
    if (inBase && !inLocal && inRemote && !deepEqual(b, r)) {
      conflicts.push({
        fileName,
        listKey,
        id,
        title: topicTitle(r, id),
        local: { id, question: '(удалено локально)', answer: '' },
        remote: r,
      })
      mergedList.push(r)
      continue
    }
    if (inBase && inLocal && !inRemote && !deepEqual(b, l)) {
      conflicts.push({
        fileName,
        listKey,
        id,
        title: topicTitle(l, id),
        local: l,
        remote: { id, question: '(удалено на Диске)', answer: '' },
      })
      mergedList.push(l)
      continue
    }

    // Added only local / only remote
    if (!inBase && inLocal && !inRemote) {
      mergedList.push(l)
      continue
    }
    if (!inBase && !inLocal && inRemote) {
      mergedList.push(r)
      continue
    }
    if (!inBase && inLocal && inRemote) {
      if (deepEqual(l, r)) {
        mergedList.push(l)
      } else {
        conflicts.push({
          fileName,
          listKey,
          id,
          title: topicTitle(l, id) || topicTitle(r, id),
          local: l,
          remote: r,
        })
        mergedList.push(l) // placeholder until user resolves
      }
      continue
    }

    // Present in all three (or base+both)
    if (inLocal && inRemote) {
      const localChanged = !inBase || !deepEqual(b, l)
      const remoteChanged = !inBase || !deepEqual(b, r)
      if (!localChanged && !remoteChanged) {
        mergedList.push(l)
      } else if (localChanged && !remoteChanged) {
        mergedList.push(l)
      } else if (!localChanged && remoteChanged) {
        mergedList.push(r)
      } else if (deepEqual(l, r)) {
        mergedList.push(l)
      } else {
        conflicts.push({
          fileName,
          listKey,
          id,
          title: topicTitle(l, id) || topicTitle(r, id),
          local: l,
          remote: r,
        })
        mergedList.push(l)
      }
      continue
    }
  }

  // Merge top-level envelope: prefer local keys, keep remote extras
  const merged: Record<string, unknown> = { ...remoteFile, ...localFile, [listKey]: mergedList }
  return { merged, conflicts }
}

export function applyConflictResolutions(
  file: Record<string, unknown>,
  listKey: GuideListKey,
  resolutions: Array<{ id: number; choice: 'local' | 'remote' }>,
  conflictTopics: TopicConflict[],
): Record<string, unknown> {
  const map = asTopicMap(file[listKey])
  for (const res of resolutions) {
    const c = conflictTopics.find((x) => x.id === res.id && x.listKey === listKey)
    if (!c) continue
    const isDeletedLocal =
      typeof c.local.question === 'string' && c.local.question.includes('удалено локально')
    const isDeletedRemote =
      typeof c.remote.question === 'string' && c.remote.question.includes('удалено на Диске')

    if (res.choice === 'local') {
      if (isDeletedLocal) map.delete(res.id)
      else map.set(res.id, c.local)
    } else {
      if (isDeletedRemote) map.delete(res.id)
      else map.set(res.id, c.remote)
    }
  }
  const list = [...map.values()].sort((a, b) => a.id - b.id)
  return { ...file, [listKey]: list }
}
