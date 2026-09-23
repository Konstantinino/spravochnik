import type { SpravochnikApi } from '@app/vite-env.d'
import {
  DEPARTMENTS,
  parseUserRole,
  normalizeWorkDepartmentId,
  type ConflictResolution,
  type DepartmentId,
  type GuideFile,
  type GuideItem,
  type PublicUser,
  type SessionLogEntry,
  type SyncStatus,
  type UpdateInfo,
  type UserRole,
  type WhitelistEntry,
  type WorkDepartmentId,
} from '@app/types'
import { ApiError, apiFetch, uploadMediaFile, validateServerUrl } from './api-client'
import {
  applyDepartmentPayload,
  applyFullSync,
  clearGuideStore,
  departmentGuide,
  getCachedUsers,
  getLastPulledAt,
  getOwnerEmail,
  removeTopicFromGuide,
  setDepartmentGuide,
  setLastPulledAt,
  setUsersFromSync,
  upsertTopicInGuide,
} from './guide-store'
import { getStoredServerUrl, mediaAbsoluteUrl, setStoredServerUrl } from './server-url'

let currentUser: PublicUser | null = null
let syncStatus: SyncStatus = {
  code: 'no_server',
  label: 'Укажите URL сервера',
  hasPendingChanges: false,
}
const syncListeners = new Set<(status: SyncStatus) => void>()
let sessionLogs: SessionLogEntry[] = []
let sessionLogSeq = 0

function emitSync(partial?: Partial<SyncStatus>): SyncStatus {
  syncStatus = { ...syncStatus, ...partial, hasPendingChanges: false }
  for (const fn of syncListeners) fn(syncStatus)
  return syncStatus
}

function appendLog(level: SessionLogEntry['level'], tag: string, message: string): void {
  sessionLogs = [
    ...sessionLogs.slice(-199),
    { id: ++sessionLogSeq, at: new Date().toISOString(), level, tag, message },
  ]
}

function publicUserFromRow(user: Record<string, unknown>): PublicUser {
  return {
    id: String(user.id),
    name: String(user.name),
    email: String(user.email),
    role: parseUserRole(user.role),
    departmentId: normalizeWorkDepartmentId(user.departmentId ?? user.department_id),
    ...(user.role === 'owner' || user.isOwner ? { isOwner: true } : {}),
  }
}

async function pullFullFromServer(): Promise<SyncStatus> {
  emitSync({ code: 'syncing', label: 'Загрузка данных…' })
  try {
    const changes = await apiFetch<{
      topicsByDept: Record<string, unknown[]>
      syncedAt: string
      users?: unknown[]
    }>('/sync/changes?full=true')
    applyFullSync(changes.topicsByDept ?? {})
    setUsersFromSync(changes.users ?? [])
    setLastPulledAt(changes.syncedAt)
    appendLog('info', 'sync', 'Данные загружены с сервера')
    return emitSync({
      code: 'up_to_date',
      label: 'Актуально',
      lastPulledAt: changes.syncedAt,
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    appendLog('error', 'sync', detail)
    return emitSync({ code: 'error', label: 'Ошибка загрузки', detail })
  }
}

async function refreshDepartmentFromServer(deptId: DepartmentId): Promise<GuideFile> {
  const payload = await apiFetch<Record<string, unknown>>(`/departments/${deptId}/topics`)
  return applyDepartmentPayload(deptId, payload)
}

function pickFile(accept?: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    if (accept) input.accept = accept
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

async function saveImageFile(
  file: File,
  payload: { topicId?: number; draftId?: string; departmentId?: DepartmentId },
): Promise<{ markdownPath: string; url: string; relativeFsPath: string }> {
  const dept = payload.departmentId ?? 'support'
  const topicPart =
    payload.topicId != null ? String(payload.topicId) : `draft-${payload.draftId ?? randomId()}`
  const rel = `media/${dept}/${topicPart}/images/${file.name}`
  await uploadMediaFile(rel, file, dept)
  const url = mediaAbsoluteUrl(rel)
  return { markdownPath: `images/${file.name}`, url, relativeFsPath: rel }
}

const api: SpravochnikApi = {
  getDepartments: async () =>
    DEPARTMENTS.map(({ id, label, fileName }) => ({ id, label, fileName })),

  loadGuide: async (departmentId) => departmentGuide(departmentId),

  saveItem: async (payload) => {
    const { topic } = await apiFetch<{ topic: GuideItem }>(
      `/departments/${payload.departmentId}/topics`,
      {
        method: 'POST',
        body: JSON.stringify({ item: payload.item }),
      },
    )
    return upsertTopicInGuide(payload.departmentId, topic)
  },

  updateItem: async (payload) => {
    const { topic } = await apiFetch<{ topic: GuideItem }>(
      `/departments/${payload.departmentId}/topics/${payload.item.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ item: payload.item }),
      },
    )
    return upsertTopicInGuide(payload.departmentId, topic)
  },

  deleteItem: async (payload) => {
    await apiFetch(`/departments/${payload.departmentId}/topics/${payload.id}`, {
      method: 'DELETE',
    })
    return removeTopicFromGuide(payload.departmentId, payload.id)
  },

  reorderTopics: async (payload) => {
    const dept = payload.departmentId
    const data = departmentGuide(dept)
    const listKey = DEPARTMENTS.find((d) => d.id === dept)?.listKey ?? 'questions'
    const list = [...((data[listKey] as GuideItem[] | undefined) ?? [])]
    const indexById = new Map(payload.items.map((e) => [e.id, e.sort_index]))
    for (const item of list) {
      const sortIndex = indexById.get(item.id)
      if (sortIndex !== undefined) item.sort_index = sortIndex
    }
    setDepartmentGuide(dept, { [listKey]: list })
    await apiFetch(`/departments/${dept}/topic-order`, {
      method: 'PUT',
      body: JSON.stringify({ items: payload.items }),
    })
    return refreshDepartmentFromServer(dept)
  },

  pickAndSaveImage: async () => {
    const file = await pickFile('image/*')
    if (!file) return null
    const saved = await saveImageFile(file, { departmentId: 'support' })
    return { markdownPath: saved.markdownPath, url: saved.url }
  },

  saveTopicImage: async (payload) => {
    const file = await pickFile('image/*')
    if (!file) return null
    return saveImageFile(file, payload)
  },

  saveTopicImageFromClipboard: async (payload) => {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      for (const type of item.types) {
        if (!type.startsWith('image/')) continue
        const blob = await item.getType(type)
        const ext = type.split('/')[1] ?? 'png'
        const file = new File([blob], `clipboard.${ext}`, { type })
        return saveImageFile(file, payload)
      }
    }
    return null
  },

  saveTopicFile: async (payload) => {
    const file = await pickFile('*/*')
    if (!file) return null
    const dept = payload.departmentId ?? 'support'
    const topicPart =
      payload.topicId != null ? String(payload.topicId) : `draft-${payload.draftId ?? randomId()}`
    const rel = `media/${dept}/${topicPart}/files/${file.name}`
    await uploadMediaFile(rel, file, dept)
    const url = mediaAbsoluteUrl(rel)
    return {
      markdownPath: `files/${file.name}`,
      originalName: file.name,
      url,
      relativeFsPath: rel,
    }
  },

  resolveMediaUrl: async (relativePath, _topicId, _departmentId) => {
    const cleaned = relativePath.replace(/\\/g, '/').replace(/^spravochnik:\/\//, '')
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned
    if (cleaned.startsWith('media/')) return mediaAbsoluteUrl(cleaned)
    if (cleaned.startsWith('images/')) {
      return mediaAbsoluteUrl(cleaned)
    }
    return mediaAbsoluteUrl(cleaned)
  },

  downloadMediaImage: async (resolvedSrc, suggestedName) => {
    try {
      const res = await fetch(resolvedSrc, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = suggestedName ?? 'image'
      a.click()
      URL.revokeObjectURL(a.href)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Ошибка скачивания' }
    }
  },

  openMediaFile: async (resolvedSrc) => {
    window.open(resolvedSrc, '_blank', 'noopener,noreferrer')
    return { ok: true }
  },

  getDataPath: async () => getStoredServerUrl() || '(веб-клиент)',

  getCurrentUser: async () => {
    if (currentUser) return currentUser
    if (!getStoredServerUrl()) return null
    try {
      const data = await apiFetch<{ user: Record<string, unknown> }>('/auth/me')
      currentUser = publicUserFromRow(data.user)
      return currentUser
    } catch {
      return null
    }
  },

  login: async (payload) => {
    const data = await apiFetch<{ user: Record<string, unknown> }>('/auth/login-web', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    })
    currentUser = publicUserFromRow(data.user)
    appendLog('info', 'auth', `Вход: ${currentUser.email}`)
    await pullFullFromServer()
    return currentUser
  },

  register: async (payload) => {
    if (payload.password !== payload.passwordConfirm) {
      throw new Error('Пароли не совпадают')
    }
    const data = await apiFetch<{ user: Record<string, unknown> }>('/auth/register-web', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
      }),
    })
    currentUser = publicUserFromRow(data.user)
    await pullFullFromServer()
    return currentUser
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout-web', { method: 'POST' })
    } catch {
      /* ignore */
    }
    currentUser = null
    clearGuideStore()
    emitSync({
      code: getStoredServerUrl() ? 'no_token' : 'no_server',
      label: getStoredServerUrl() ? 'Войдите в аккаунт' : 'Укажите URL сервера',
    })
    return null
  },

  listUsers: async () => {
    const data = await apiFetch<{ users: Record<string, unknown>[] }>('/admin/users')
    return data.users.map(publicUserFromRow)
  },

  setUserRole: async (payload) => {
    const data = await apiFetch<{ users: Record<string, unknown>[] }>(
      `/admin/users/${payload.userId}/role`,
      { method: 'PUT', body: JSON.stringify({ role: payload.role }) },
    )
    return data.users.map(publicUserFromRow)
  },

  transferOwnership: async (payload) => {
    const data = await apiFetch<{ users: Record<string, unknown>[] }>(
      '/admin/transfer-ownership',
      { method: 'POST', body: JSON.stringify({ userId: payload.userId }) },
    )
    return data.users.map(publicUserFromRow)
  },

  updateUser: async (payload) => {
    const data = await apiFetch<{ users: Record<string, unknown>[]; whitelist?: WhitelistEntry[] }>(
      `/admin/users/${payload.userId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: payload.name,
          password: payload.password,
          departmentId: payload.departmentId,
        }),
      },
    )
    return {
      users: data.users.map(publicUserFromRow),
      whitelist: data.whitelist ?? [],
    }
  },

  deleteUser: async (payload) => {
    const userId = typeof payload === 'string' ? payload : payload.userId
    const body =
      typeof payload === 'object' && payload.successorId
        ? { successorId: payload.successorId }
        : undefined
    const data = await apiFetch<{ users: Record<string, unknown>[] }>(
      `/admin/users/${userId}`,
      { method: 'DELETE', body: body ? JSON.stringify(body) : undefined },
    )
    return data.users.map(publicUserFromRow)
  },

  getWhitelist: async () => {
    const data = await apiFetch<{ whitelist: WhitelistEntry[] }>('/admin/whitelist')
    return data.whitelist
  },

  setWhitelist: async (emails) => {
    const data = await apiFetch<{ whitelist: WhitelistEntry[] }>('/admin/whitelist', {
      method: 'PUT',
      body: JSON.stringify({ emails }),
    })
    return data.whitelist
  },

  addWhitelist: async (payload) => {
    const body = typeof payload === 'string' ? { email: payload } : payload
    const data = await apiFetch<{ whitelist: WhitelistEntry[] }>('/admin/whitelist', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.whitelist
  },

  removeWhitelist: async (email) => {
    const data = await apiFetch<{ whitelist: WhitelistEntry[] }>(
      `/admin/whitelist/${encodeURIComponent(email)}`,
      { method: 'DELETE' },
    )
    return data.whitelist
  },

  getRegistrationDepartment: async (email) => {
    try {
      return await apiFetch<{ departmentId: WorkDepartmentId; label: string }>(
        `/auth/registration-department?email=${encodeURIComponent(email)}`,
        { skipAuth: true },
      )
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },

  getAdminSettings: async () => ({
    hasPendingChanges: false,
    hasToken: Boolean(currentUser),
    hasServer: Boolean(getStoredServerUrl()),
    serverUrl: getStoredServerUrl(),
    ownerEmail: getOwnerEmail(),
  }),

  getStorageStats: async () => apiFetch('/admin/storage-stats'),

  setServerUrl: async (url) => {
    const normalized = await validateServerUrl(url)
    setStoredServerUrl(normalized)
    emitSync({
      code: currentUser ? 'up_to_date' : 'no_token',
      label: currentUser ? 'Актуально' : 'Войдите в аккаунт',
    })
    return { serverUrl: normalized }
  },

  getServerUrl: async () => ({ serverUrl: getStoredServerUrl() }),

  hasServer: async () => ({ hasServer: Boolean(getStoredServerUrl().trim()) }),

  setYandexToken: async () => ({ hasToken: false, hasPendingChanges: false }),

  getTokenMasked: async () => ({ hasToken: false, masked: '' }),

  hasYandexToken: async () => ({ hasToken: false }),

  getSyncStatus: async () => syncStatus,

  pullSync: async () => pullFullFromServer(),

  pullSyncFull: async () => pullFullFromServer(),

  discardSync: async () => emitSync({ code: 'up_to_date', label: 'Актуально' }),

  pushSync: async () => emitSync({ code: 'up_to_date', label: 'Актуально' }),

  resolveSyncConflicts: async (_resolutions: ConflictResolution[]) =>
    emitSync({ code: 'up_to_date', label: 'Актуально' }),

  lockTopic: async (payload) => {
    try {
      await apiFetch(`/departments/${payload.departmentId}/topics/lock/${payload.topicId}`, {
        method: 'POST',
      })
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Не удалось заблокировать тему',
      }
    }
  },

  unlockTopic: async (payload) => {
    await apiFetch(`/departments/${payload.departmentId}/topics/unlock/${payload.topicId}`, {
      method: 'POST',
    })
    return { ok: true }
  },

  renewTopicLock: async (payload) => {
    await apiFetch(
      `/departments/${payload.departmentId}/topics/renew-lock/${payload.topicId}`,
      { method: 'POST' },
    )
    return { ok: true }
  },

  lockTopicOrder: async (payload) => {
    try {
      await apiFetch(`/departments/${payload.departmentId}/topic-order/lock`, { method: 'POST' })
      return { ok: true }
    } catch (e) {
      if (e instanceof ApiError && e.status === 423) {
        const body = e.body as { lockedByName?: string }
        return {
          ok: false,
          lockedByName: body?.lockedByName,
          error: e.message,
        }
      }
      return { ok: false, error: e instanceof Error ? e.message : 'Ошибка блокировки порядка' }
    }
  },

  unlockTopicOrder: async (payload) => {
    await apiFetch(`/departments/${payload.departmentId}/topic-order/unlock`, { method: 'POST' })
    return { ok: true }
  },

  renewTopicOrderLock: async (payload) => {
    await apiFetch(`/departments/${payload.departmentId}/topic-order/renew-lock`, {
      method: 'POST',
    })
    return { ok: true }
  },

  prepareTopicReorder: async (departmentId) => {
    let guide: GuideFile
    try {
      guide = await refreshDepartmentFromServer(departmentId)
    } catch (e) {
      return {
        ok: false as const,
        guide: departmentGuide(departmentId),
        error: e instanceof Error ? e.message : 'Не удалось загрузить порядок с сервера',
      }
    }
    const lock = await api.lockTopicOrder({ departmentId })
    if (!lock.ok) {
      return {
        ok: false as const,
        guide,
        error: lock.error,
        lockedByName: lock.lockedByName,
      }
    }
    return { ok: true as const, guide }
  },

  onSyncStatus: (callback) => {
    syncListeners.add(callback)
    return () => syncListeners.delete(callback)
  },

  getUpdateStatus: async () =>
    ({
      available: false,
      currentVersion: 'web',
      version: null,
      remoteSetupPath: null,
      phase: 'idle',
    }) satisfies UpdateInfo,

  checkForUpdates: async () => api.getUpdateStatus(),

  downloadUpdate: async () => ({ ok: false, error: 'Обновления только в веб-версии автоматически' }),

  installUpdate: async () => ({ ok: false, error: 'Не применимо для веб-клиента' }),

  getLatestRelease: async () => ({
    version: null,
    downloadUrl: null,
    remoteSetupPath: null,
  }),

  downloadLatestRelease: async () => ({
    ok: false,
    error: 'Скачивание Setup доступно в десктоп-клиенте',
  }),

  onUpdateStatus: () => () => undefined,

  focusAppWindow: async () => {
    window.focus()
    return true
  },

  getSessionLogs: async () => sessionLogs,

  clearSessionLogs: async () => {
    sessionLogs = []
    return sessionLogs
  },

  onSessionLog: () => () => undefined,
}

export function createBrowserSpravochnik(): SpravochnikApi {
  if (getStoredServerUrl()) {
    emitSync({ code: 'no_token', label: 'Войдите в аккаунт', hasPendingChanges: false })
  }
  void api.getCurrentUser().then((user) => {
    if (user) void pullFullFromServer()
  })
  return api
}
