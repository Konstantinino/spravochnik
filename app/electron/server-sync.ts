import fs from 'node:fs'
import path from 'node:path'
import {
  DEPARTMENTS,
  departmentById,
  getUserDataRoot,
  normalizeWorkDepartmentId,
  type DepartmentId,
} from './paths'
import {
  departmentIdFromMediaPath,
  resolveExistingMediaAbsolutePath,
} from './media-layout'
import {
  readSettings,
  setPendingChanges,
  writeSettings,
  writeAccounts,
  readAccounts,
  setWhitelist,
  type AccountsData,
} from './auth-store'
import { hasPendingMedia, readPendingMedia, writePendingMedia } from './pending-media'
import {
  clearPendingOperations,
  hasPendingOperations,
  readPendingOperations,
  removeOperation,
  type PendingOperation,
} from './pending-operations'
import {
  ServerApiError,
  downloadMediaFile,
  isServerReachable,
  serverFetch,
  setAfterServerRequest,
  uploadMediaFile,
} from './server-api'
import { checkForUpdates } from './updates'

export type SyncStatusCode =
  | 'idle'
  | 'no_server'
  | 'no_token'
  | 'connecting'
  | 'syncing'
  | 'uploading'
  | 'up_to_date'
  | 'pending'
  | 'offline_pending'
  | 'busy'
  | 'conflict'
  | 'error'

export interface SyncConflictInfo {
  fileName: string
  listKey: 'questions' | 'templates'
  id: number
  title: string
  localPreview: string
  remotePreview: string
  localFull?: Record<string, unknown>
  remoteFull?: Record<string, unknown>
}

export interface SyncStatus {
  code: SyncStatusCode
  label: string
  detail?: string
  hasPendingChanges: boolean
  retryAfterSec?: number
  lockBy?: string
  conflicts?: SyncConflictInfo[]
  lastPulledAt?: string
}

export interface ConflictResolution {
  fileName: string
  id: number
  choice: 'local' | 'remote'
}

type StatusListener = (status: SyncStatus) => void

const listeners = new Set<StatusListener>()
let currentStatus: SyncStatus = {
  code: 'idle',
  label: 'Готово',
  hasPendingChanges: false,
}

let pendingConflicts: SyncConflictInfo[] = []

function hasUnsyncedLocalWork(): boolean {
  const settings = readSettings()
  return settings.hasPendingChanges || hasPendingOperations() || hasPendingMedia()
}

function emit(partial: Partial<SyncStatus> & Pick<SyncStatus, 'code' | 'label'>): SyncStatus {
  currentStatus = {
    ...currentStatus,
    retryAfterSec: undefined,
    lockBy: undefined,
    conflicts: undefined,
    ...partial,
    hasPendingChanges: hasUnsyncedLocalWork(),
  }
  for (const listener of listeners) listener(currentStatus)
  return currentStatus
}

export function onSyncStatus(listener: StatusListener): () => void {
  listeners.add(listener)
  listener(currentStatus)
  return () => listeners.delete(listener)
}

export function getSyncStatus(): SyncStatus {
  return {
    ...currentStatus,
    hasPendingChanges: hasUnsyncedLocalWork(),
  }
}

function applyTopicToLocal(deptId: DepartmentId, topic: Record<string, unknown>): void {
  const dept = departmentById(deptId)
  const filePath = path.join(getUserDataRoot(), dept.fileName)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>
  const listKey = dept.listKey
  const list = (data[listKey] as Array<Record<string, unknown>>) ?? []
  const id = topic.id as number
  const idx = list.findIndex((t) => t.id === id)
  const clean = { ...topic }
  delete clean.version
  delete clean.updated_at
  if (idx >= 0) list[idx] = clean
  else list.push(clean)
  data[listKey] = list
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

function removeTopicFromLocal(deptId: DepartmentId, topicId: number): void {
  const dept = departmentById(deptId)
  const filePath = path.join(getUserDataRoot(), dept.fileName)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>
  const listKey = dept.listKey
  const list = (data[listKey] as Array<Record<string, unknown>>) ?? []
  data[listKey] = list.filter((t) => t.id !== topicId)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

function writeFullDeptTopics(deptId: DepartmentId, topics: Record<string, unknown>[]): void {
  const dept = departmentById(deptId)
  const filePath = path.join(getUserDataRoot(), dept.fileName)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>
  const cleaned = topics.map((t) => {
    const c = { ...t }
    delete c.version
    delete c.updated_at
    return c
  })
  data[dept.listKey] = cleaned
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

async function downloadMissingMedia(
  mediaList: Array<{ relative_path: string; deleted_at?: string | null }>,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const root = getUserDataRoot()
  const toDownload = mediaList.filter((m) => !m.deleted_at)
  let done = 0
  for (const m of toDownload) {
    const rel = m.relative_path
    const localPath = path.join(root, rel)
    if (fs.existsSync(localPath) || resolveExistingMediaAbsolutePath(rel)) {
      done++
      onProgress?.(done, toDownload.length)
      continue
    }
    try {
      await downloadMediaFile(rel, localPath)
    } catch {
      /* skip failed downloads */
    }
    done++
    onProgress?.(done, toDownload.length)
  }
}

interface SyncChangesResponse {
  full: boolean
  globalVersion: number
  syncedAt: string
  topicsByDept: Record<string, Record<string, unknown>[]>
  deletedTopics: Array<{ department_id: string; id: number; deleted_at: string }>
  media: Array<{ relative_path: string; deleted_at?: string | null }>
  users?: unknown[]
  whitelist?: Array<string | { email: string; departmentId?: string; department_id?: string }>
}

function shouldSkipRemotePull(): boolean {
  const settings = readSettings()
  return settings.hasPendingChanges || hasPendingOperations()
}

export async function pullFromServer(options?: {
  force?: boolean
  silent?: boolean
}): Promise<SyncStatus> {
  const settings = readSettings()
  if (!settings.serverUrl.trim()) {
    return emit({
      code: 'no_server',
      label: 'URL сервера не указан',
      detail: 'Укажите адрес сервера на экране входа',
    })
  }
  if (!settings.authToken.trim()) {
    return emit({
      code: 'no_token',
      label: 'Не выполнен вход',
      detail: 'Войдите в аккаунт для синхронизации',
    })
  }

  const hasPending = hasUnsyncedLocalWork()
  if (hasPending && !options?.force) {
    if (options?.silent) {
      if (shouldSkipRemotePull()) return getSyncStatus()
    } else {
      return emit({
        code: 'pending',
        label: 'Есть локальные изменения',
        detail: 'Сначала синхронизируйте локальные изменения',
      })
    }
  }

  try {
    if (!options?.silent) {
      emit({ code: 'connecting', label: 'Подключение к серверу…' })
    }

    const since = settings.lastSyncAt
    const query = since && !options?.force ? `?since=${encodeURIComponent(since)}` : '?full=true'
    const changes = await serverFetch<SyncChangesResponse>(`/sync/changes${query}`, {
      skipRemotePull: true,
    })

    if (!options?.silent) {
      emit({ code: 'syncing', label: 'Загрузка данных…' })
    }

    if (changes.full) {
      for (const dept of DEPARTMENTS) {
        const topics = changes.topicsByDept[dept.id] ?? []
        writeFullDeptTopics(dept.id, topics)
      }
    } else {
      for (const dept of DEPARTMENTS) {
        const topics = changes.topicsByDept[dept.id] ?? []
        for (const topic of topics) {
          applyTopicToLocal(dept.id, topic)
        }
      }
      for (const del of changes.deletedTopics ?? []) {
        removeTopicFromLocal(del.department_id as DepartmentId, del.id)
      }
    }

    if (changes.users?.length || changes.whitelist?.length) {
      const accounts = readAccounts()
      if (changes.users?.length) {
        for (const remote of changes.users as Array<Record<string, unknown>>) {
          const email = String(remote.email).toLowerCase()
          const idx = accounts.users.findIndex((u) => u.email.toLowerCase() === email)
          const merged = {
            id: String(remote.id),
            name: String(remote.name),
            email,
            passwordHash: idx >= 0 ? accounts.users[idx].passwordHash : '',
            salt: idx >= 0 ? accounts.users[idx].salt : '',
            role: remote.role as AccountsData['users'][0]['role'],
            departmentId: normalizeWorkDepartmentId(
              remote.departmentId ??
                remote.department_id ??
                (idx >= 0 ? accounts.users[idx].departmentId : 'support'),
            ),
            createdAt: String(
              remote.createdAt ??
                remote.created_at ??
                (idx >= 0 ? accounts.users[idx].createdAt : new Date().toISOString()),
            ),
          }
          if (idx >= 0) {
            accounts.users[idx] = merged
          } else {
            accounts.users.push(merged)
          }
        }
      }
      if (changes.whitelist?.length) {
        const wl = setWhitelist(changes.whitelist)
        accounts.whitelist = wl
      }
      writeAccounts(accounts)
    }

    const hasContent =
      changes.full ||
      DEPARTMENTS.some((dept) => (changes.topicsByDept[dept.id] ?? []).length > 0) ||
      (changes.deletedTopics?.length ?? 0) > 0 ||
      (changes.media ?? []).some((m) => !m.deleted_at)

    if (!options?.silent) {
      emit({ code: 'syncing', label: 'Загрузка медиа…' })
    }
    await downloadMissingMedia(changes.media ?? [])

    const latest = readSettings()
    writeSettings({
      ...latest,
      lastSyncAt: changes.syncedAt,
      lastGlobalVersion: changes.globalVersion,
    })
    if (!options?.silent) {
      void checkForUpdates()
    }
    return emit({
      code: 'up_to_date',
      label: 'Актуально',
      ...(hasContent ? { lastPulledAt: changes.syncedAt } : {}),
    })
  } catch (e) {
    if (options?.silent) {
      return getSyncStatus()
    }
    const detail = e instanceof Error ? e.message : String(e)
    return emit({
      code: 'error',
      label: 'Ошибка загрузки',
      detail,
    })
  }
}

async function replayOperation(op: PendingOperation): Promise<void> {
  switch (op.type) {
    case 'create_topic': {
      const deptId = op.departmentId!
      await serverFetch(`/departments/${deptId}/topics`, {
        method: 'POST',
        body: JSON.stringify({ item: op.payload }),
      })
      break
    }
    case 'update_topic': {
      const deptId = op.departmentId!
      const id = op.payload.id as number
      const headers: Record<string, string> = {}
      if (op.expectedVersion) headers['If-Match'] = String(op.expectedVersion)
      await serverFetch(`/departments/${deptId}/topics/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ item: op.payload }),
      })
      break
    }
    case 'delete_topic': {
      const deptId = op.departmentId!
      const id = op.payload.id as number
      await serverFetch(`/departments/${deptId}/topics/${id}`, { method: 'DELETE' })
      break
    }
    case 'set_user_role':
      await serverFetch(`/admin/users/${op.payload.userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: op.payload.role }),
      })
      break
    case 'transfer_ownership':
      await serverFetch('/admin/transfer-ownership', {
        method: 'POST',
        body: JSON.stringify({ userId: op.payload.userId }),
      })
      break
    case 'delete_user':
      await serverFetch(`/admin/users/${op.payload.userId}`, {
        method: 'DELETE',
        body: JSON.stringify(
          op.payload.successorId ? { successorId: op.payload.successorId } : {},
        ),
      })
      break
    case 'update_user':
      await serverFetch(`/admin/users/${op.payload.userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: op.payload.name,
          ...(op.payload.password ? { password: op.payload.password } : {}),
          ...(op.payload.departmentId ? { departmentId: op.payload.departmentId } : {}),
        }),
      })
      break
    case 'set_whitelist':
      await serverFetch('/admin/whitelist', {
        method: 'PUT',
        body: JSON.stringify({ emails: op.payload.emails ?? op.payload.whitelist }),
      })
      break
    case 'add_whitelist':
      await serverFetch('/admin/whitelist', {
        method: 'POST',
        body: JSON.stringify({
          email: op.payload.email,
          departmentId: op.payload.departmentId ?? 'support',
        }),
      })
      break
    case 'remove_whitelist':
      await serverFetch(`/admin/whitelist/${encodeURIComponent(String(op.payload.email))}`, {
        method: 'DELETE',
      })
      break
    default:
      break
  }
}

export async function pushToServer(): Promise<SyncStatus> {
  const settings = readSettings()
  if (!settings.serverUrl.trim()) {
    return emit({ code: 'no_server', label: 'URL сервера не указан' })
  }
  if (!settings.authToken.trim()) {
    return emit({ code: 'no_token', label: 'Не выполнен вход' })
  }

  try {
    emit({ code: 'uploading', label: 'Отправка изменений…' })

    const ops = readPendingOperations().operations
    pendingConflicts = []

    for (const op of ops) {
      try {
        await replayOperation(op)
        removeOperation(op.id)
      } catch (e) {
        if (e instanceof ServerApiError && e.status === 409) {
          const body = e.body as {
            serverTopic?: Record<string, unknown>
            serverVersion?: number
          }
          const deptId = op.departmentId as DepartmentId
          const dept = departmentById(deptId)
          const localTopic = op.payload
          const serverTopic = body.serverTopic ?? {}
          pendingConflicts.push({
            fileName: dept.fileName,
            listKey: dept.listKey,
            id: localTopic.id as number,
            title: String(localTopic.question ?? serverTopic.question ?? `#${localTopic.id}`),
            localPreview: String(localTopic.answer ?? '').slice(0, 200),
            remotePreview: String(serverTopic.answer ?? '').slice(0, 200),
            localFull: localTopic,
            remoteFull: serverTopic,
          })
        } else if (e instanceof ServerApiError && e.status === 423) {
          const body = e.body as { lockedByName?: string }
          return emit({
            code: 'busy',
            label: 'Тема занята другим редактором',
            detail: body.lockedByName ? `Редактирует: ${body.lockedByName}` : undefined,
            lockBy: body.lockedByName,
          })
        } else {
          throw e
        }
      }
    }

    if (pendingConflicts.length > 0) {
      return emit({
        code: 'conflict',
        label: 'Конфликты при синхронизации',
        detail: `Нужно выбрать версию для ${pendingConflicts.length} тем(ы)`,
        conflicts: pendingConflicts,
      })
    }

    await flushPendingMedia()

    setPendingChanges(false)
    clearPendingOperations()

    const pullResult = await pullFromServer({ force: true })
    if (pullResult.code === 'up_to_date') {
      return emit({ code: 'up_to_date', label: 'Актуально' })
    }
    return pullResult
  } catch (e) {
    return emit({
      code: 'error',
      label: 'Ошибка отправки',
      detail: e instanceof Error ? e.message : String(e),
    })
  }
}

export async function resolveSyncConflicts(
  resolutions: ConflictResolution[],
): Promise<SyncStatus> {
  for (const res of resolutions) {
    const conflict = pendingConflicts.find((c) => c.id === res.id && c.fileName === res.fileName)
    if (!conflict) continue

    const dept = DEPARTMENTS.find((d) => d.fileName === res.fileName)
    if (!dept) continue

    if (res.choice === 'local' && conflict.localFull) {
      const version = (conflict.remoteFull?.version as number) ?? 0
      try {
        await serverFetch(`/departments/${dept.id}/topics/${res.id}`, {
          method: 'PUT',
          headers: { 'If-Match': String(version) },
          body: JSON.stringify({ item: conflict.localFull }),
        })
        applyTopicToLocal(dept.id, conflict.localFull)
      } catch (e) {
        return emit({
          code: 'error',
          label: 'Не удалось применить выбор',
          detail: e instanceof Error ? e.message : String(e),
        })
      }
    } else if (res.choice === 'remote' && conflict.remoteFull) {
      applyTopicToLocal(dept.id, conflict.remoteFull)
    }
  }

  pendingConflicts = []
  setPendingChanges(false)
  return pullFromServer({ force: true })
}

export function markLocalChange(): SyncStatus {
  setPendingChanges(true)
  return emit({ code: 'pending', label: 'Есть локальные изменения' })
}

export function markOfflinePending(): SyncStatus {
  setPendingChanges(true)
  return emit({
    code: 'offline_pending',
    label: 'Сохранено локально',
    detail: 'Нет связи с сервером — синхронизируйте позже',
  })
}

async function flushPendingMedia(): Promise<void> {
  const pending = readPendingMedia()
  if (pending.upload.length === 0 && pending.deleteRemote.length === 0) return

  const root = getUserDataRoot()
  const remainingUpload: string[] = []
  const remainingDelete: string[] = []
  let lastError: string | undefined

  for (const rel of pending.upload) {
    const localPath =
      resolveExistingMediaAbsolutePath(rel) ??
      path.join(root, ...rel.replace(/\\/g, '/').split('/'))
    if (!fs.existsSync(localPath)) continue
    try {
      await uploadMediaFile(rel, localPath, departmentIdFromMediaPath(rel))
    } catch (e) {
      remainingUpload.push(rel)
      lastError = e instanceof Error ? e.message : String(e)
    }
  }

  for (const rel of pending.deleteRemote) {
    try {
      await serverFetch(`/media/${rel.replace(/\\/g, '/')}`, { method: 'DELETE' })
    } catch (e) {
      remainingDelete.push(rel)
      lastError = e instanceof Error ? e.message : String(e)
    }
  }

  writePendingMedia({ upload: remainingUpload, deleteRemote: remainingDelete })
  if (remainingUpload.length > 0 || remainingDelete.length > 0) {
    setPendingChanges(true)
    throw new Error(lastError || 'Не удалось отправить фото на сервер')
  }
}

export async function tryPushTopicOnline(
  type: 'create' | 'update' | 'delete',
  departmentId: DepartmentId,
  payload: Record<string, unknown>,
  expectedVersion?: number,
): Promise<{ ok: true } | { ok: false; offline: boolean; conflict?: SyncConflictInfo }> {
  const reachable = await isServerReachable()
  if (!reachable) {
    return { ok: false, offline: true }
  }

  try {
    await flushPendingMedia()
    if (type === 'create') {
      const result = await serverFetch<{ topic: Record<string, unknown> }>(
        `/departments/${departmentId}/topics`,
        { method: 'POST', body: JSON.stringify({ item: payload }) },
      )
      applyTopicToLocal(departmentId, result.topic)
    } else if (type === 'update') {
      const id = payload.id as number
      const headers: Record<string, string> = {}
      if (expectedVersion) headers['If-Match'] = String(expectedVersion)
      const result = await serverFetch<{ topic: Record<string, unknown> }>(
        `/departments/${departmentId}/topics/${id}`,
        { method: 'PUT', headers, body: JSON.stringify({ item: payload }) },
      )
      applyTopicToLocal(departmentId, result.topic)
    } else {
      const id = payload.id as number
      await serverFetch(`/departments/${departmentId}/topics/${id}`, { method: 'DELETE' })
      removeTopicFromLocal(departmentId, id)
    }
    return { ok: true }
  } catch (e) {
    if (e instanceof ServerApiError && e.status === 409) {
      const body = e.body as { serverTopic?: Record<string, unknown> }
      const dept = departmentById(departmentId)
      return {
        ok: false,
        offline: false,
        conflict: {
          fileName: dept.fileName,
          listKey: dept.listKey,
          id: payload.id as number,
          title: String(payload.question ?? `#${payload.id}`),
          localPreview: String(payload.answer ?? '').slice(0, 200),
          remotePreview: String(body.serverTopic?.answer ?? '').slice(0, 200),
          localFull: payload,
          remoteFull: body.serverTopic,
        },
      }
    }
    if (e instanceof ServerApiError && (e.status === 0 || e.status >= 500)) {
      return { ok: false, offline: true }
    }
    if (e instanceof ServerApiError && e.status === 404 && type === 'update') {
      throw new Error(
        'На сервере нет этой темы. Локальный сервер (127.0.0.1) — тестовая база, а в клиенте, скорее всего, кэш с другого сервера. Верните production URL или импортируйте REST-INFO-export в локальный сервер.',
      )
    }
    throw e
  }
}

export async function pushAccountsFile(): Promise<boolean> {
  return isServerReachable()
}

export async function discardLocalChanges(): Promise<SyncStatus> {
  setPendingChanges(false)
  clearPendingOperations()
  pendingConflicts = []
  return pullFromServer({ force: true })
}

export function refreshStatusFromSettings(): SyncStatus {
  const settings = readSettings()
  if (!settings.serverUrl.trim()) {
    return emit({ code: 'no_server', label: 'URL сервера не указан' })
  }
  if (currentStatus.code === 'conflict' && (currentStatus.conflicts?.length ?? 0) > 0) {
    return getSyncStatus()
  }
  if (hasUnsyncedLocalWork()) {
    return emit({ code: 'pending', label: 'Есть локальные изменения' })
  }
  return emit({
    code: currentStatus.code === 'error' ? 'error' : 'up_to_date',
    label: currentStatus.code === 'error' ? currentStatus.label : 'Актуально',
  })
}

let peekInFlight = false
let peekTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleRemoteChangePeek(): void {
  if (peekTimer) return
  peekTimer = setTimeout(() => {
    peekTimer = null
    void peekAndPullRemoteChanges()
  }, 400)
}

export async function peekAndPullRemoteChanges(): Promise<void> {
  if (peekInFlight) {
    scheduleRemoteChangePeek()
    return
  }
  peekInFlight = true
  try {
    const settings = readSettings()
    if (!settings.serverUrl.trim() || !settings.authToken.trim()) return
    if (shouldSkipRemotePull()) return

    const remote = await serverFetch<{ globalVersion: number }>('/sync/status', {
      skipRemotePull: true,
    })
    const known = settings.lastGlobalVersion
    if (known != null && remote.globalVersion <= known) return

    await pullFromServer({ silent: true })
  } catch {
    /* background peek */
  } finally {
    peekInFlight = false
  }
}

setAfterServerRequest(() => {
  scheduleRemoteChangePeek()
})

// Aliases for compatibility with main.ts imports
export const pullFromYandex = pullFromServer
export const pushToYandex = pushToServer
