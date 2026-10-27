import type { SpravochnikApi } from '@app/vite-env.d'
import {
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
  type WhitelistEntry,
  type WorkDepartmentId,
} from '@app/types'
import { canonicalImageStoragePath } from '@app/lib/markdown'
import { ApiError, apiFetch, uploadMediaFile, validateServerUrl } from './api-client'
import {
  applyDepartmentPayload,
  applyFullSync,
  clearGuideStore,
  departmentGuide,
  getCachedDepartments,
  getCachedSubsections,
  getCachedSupportSections,
  getOwnerEmail,
  listKeyForDept,
  removeTopicFromGuide,
  removeTopicsFromGuide,
  setCachedDepartments,
  setCachedSubsections,
  setCachedSupportSections,
  setDepartmentGuide,
  setLastPulledAt,
  setUsersFromSync,
  toAdminDepartments,
  upsertTopicInGuide,
  type StoredSubsection,
  type StoredSupportSection,
} from './guide-store'
import { getStoredServerUrl, mediaAbsoluteUrl, setStoredServerUrl } from './server-url'

/** API media requires auth; <img src> cannot rely on cookies — load via fetch + blob URL. */
async function fetchMediaObjectUrl(httpPath: string): Promise<string> {
  const res = await fetch(httpPath, { credentials: 'include' })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const blob = await res.blob()
  if (!blob.size) {
    throw new Error('Empty media response')
  }
  return URL.createObjectURL(blob)
}

function resolveMediaHttpUrl(
  relativePath: string,
  topicId?: number,
  departmentId?: DepartmentId,
): string {
  const cleaned = relativePath.replace(/\\/g, '/').replace(/^spravochnik:\/\//, '')
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned
  const canonical =
    canonicalImageStoragePath(cleaned, topicId, departmentId) ??
    (cleaned.startsWith('media/') ? cleaned : null)
  if (canonical) return mediaAbsoluteUrl(canonical)
  if (cleaned.startsWith('images/') && topicId != null && departmentId) {
    return mediaAbsoluteUrl(`media/${departmentId}/${topicId}/${cleaned}`)
  }
  if (cleaned.startsWith('files/') && topicId != null && departmentId) {
    return mediaAbsoluteUrl(`media/${departmentId}/${topicId}/${cleaned}`)
  }
  return mediaAbsoluteUrl(cleaned)
}

const REORDER_CLIENT_STORAGE_KEY = 'rest-info-topic-order-client-id'

function getTopicOrderClientId(): string {
  try {
    let id = sessionStorage.getItem(REORDER_CLIENT_STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(REORDER_CLIENT_STORAGE_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

let currentUser: PublicUser | null = null
let syncStatus: SyncStatus = {
  code: 'no_server',
  label: 'Укажите URL сервера',
  hasPendingChanges: false,
}
const syncListeners = new Set<(status: SyncStatus) => void>()
const supportPhonesListeners = new Set<() => void>()
const supportEmailsListeners = new Set<() => void>()
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

function mapSubsection(row: Record<string, unknown>): StoredSubsection {
  return {
    id: String(row.id),
    departmentId: String(row.departmentId ?? row.department_id ?? ''),
    label: String(row.label ?? ''),
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
    party: (row.party as StoredSubsection['party']) ?? null,
    isArchiveLost: Boolean(row.isArchiveLost),
    isArchiveArchived: Boolean(row.isArchiveArchived),
  }
}

function mapSupportSection(row: Record<string, unknown>): StoredSupportSection {
  return {
    id: String(row.id),
    label: String(row.label ?? ''),
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
    systemLocked: Boolean(row.systemLocked ?? row.system_locked),
  }
}

async function pullFullFromServer(): Promise<SyncStatus> {
  emitSync({ code: 'syncing', label: 'Загрузка данных…' })
  try {
    const changes = await apiFetch<{
      topicsByDept: Record<string, unknown[]>
      syncedAt: string
      users?: unknown[]
      departments?: Array<{
        id: string
        label: string
        listKey?: 'questions' | 'templates'
        sortOrder?: number
        systemLocked?: boolean
      }>
      subsections?: Array<Record<string, unknown>>
      supportSections?: Array<Record<string, unknown>>
    }>('/sync/changes?full=true')
    if (changes.departments?.length) setCachedDepartments(changes.departments)
    if (changes.subsections) {
      setCachedSubsections(changes.subsections.map(mapSubsection))
    }
    if (changes.supportSections) {
      setCachedSupportSections(changes.supportSections.map(mapSupportSection))
    }
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

function imageExtFromName(name: string, mimeType?: string): string {
  const m = name.match(/(\.[a-z0-9]{1,8})$/i)
  if (m) return m[1].toLowerCase()
  if (mimeType?.startsWith('image/')) {
    let ext = mimeType.slice('image/'.length).toLowerCase()
    if (ext === 'jpeg') ext = 'jpg'
    if (/^[a-z0-9]{1,8}$/.test(ext)) return `.${ext}`
  }
  return '.png'
}

/** Avoid spaces/parens in stored names (markdown + filesystem), same idea as desktop UUID names. */
function safeStoredImageName(originalName: string, mimeType?: string): string {
  return `${randomId()}${imageExtFromName(originalName, mimeType)}`
}

function fileExtFromName(name: string): string {
  const m = name.match(/(\.[a-z0-9]{1,8})$/i)
  return m ? m[1].toLowerCase() : '.bin'
}

function safeStoredFileName(originalName: string): string {
  return `${randomId()}${fileExtFromName(originalName)}`
}

async function saveImageFile(
  file: File,
  payload: { topicId?: number; draftId?: string; departmentId?: DepartmentId },
): Promise<{ markdownPath: string; url: string; relativeFsPath: string }> {
  const dept = payload.departmentId ?? 'support'
  const topicPart =
    payload.topicId != null ? String(payload.topicId) : `draft-${payload.draftId ?? randomId()}`
  const storedName = safeStoredImageName(file.name, file.type)
  const rel = `media/${dept}/${topicPart}/images/${storedName}`
  await uploadMediaFile(rel, file, dept)
  const url = mediaAbsoluteUrl(rel)
  return { markdownPath: `images/${storedName}`, url, relativeFsPath: rel }
}

function collectDescendantIds(list: GuideItem[], rootId: number): number[] {
  const byParent = new Map<number, number[]>()
  for (const item of list) {
    if (item.parent_id == null) continue
    const arr = byParent.get(item.parent_id) ?? []
    arr.push(item.id)
    byParent.set(item.parent_id, arr)
  }
  const seen = new Set<number>()
  const stack = [...(byParent.get(rootId) ?? [])]
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    for (const child of byParent.get(id) ?? []) stack.push(child)
  }
  return [...seen]
}

async function promoteDirectChildren(
  deptId: DepartmentId,
  parentId: number,
): Promise<void> {
  const listKey = listKeyForDept(deptId)
  const list = [...((departmentGuide(deptId)[listKey] as GuideItem[] | undefined) ?? [])]
  const parent = list.find((t) => t.id === parentId)
  const newParent = parent?.parent_id ?? null
  const children = list.filter((t) => t.parent_id === parentId)
  for (const child of children) {
    await apiFetch(`/departments/${deptId}/topics/${child.id}`, {
      method: 'PUT',
      body: JSON.stringify({ item: { ...child, parent_id: newParent } }),
    })
  }
}

const api: SpravochnikApi = {
  getDepartments: async () =>
    getCachedDepartments().map(({ id, label, fileName, listKey }) => ({
      id,
      label,
      fileName,
      listKey,
    })),

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
    if (payload.promoteChildren && payload.item.archived) {
      await promoteDirectChildren(payload.departmentId, payload.item.id)
    }
    await apiFetch<{ topic: GuideItem }>(
      `/departments/${payload.departmentId}/topics/${payload.item.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ item: payload.item }),
      },
    )
    return refreshDepartmentFromServer(payload.departmentId)
  },

  deleteItem: async (payload) => {
    const listKey = listKeyForDept(payload.departmentId)
    const list = [...((departmentGuide(payload.departmentId)[listKey] as GuideItem[] | undefined) ?? [])]
    if (payload.scope === 'topic') {
      await promoteDirectChildren(payload.departmentId, payload.id)
      await apiFetch(`/departments/${payload.departmentId}/topics/${payload.id}`, {
        method: 'DELETE',
      })
      return removeTopicFromGuide(payload.departmentId, payload.id)
    }
    const toRemove = [payload.id, ...collectDescendantIds(list, payload.id)]
    await apiFetch(`/departments/${payload.departmentId}/topics/${payload.id}`, {
      method: 'DELETE',
    })
    return removeTopicsFromGuide(payload.departmentId, toRemove)
  },

  reorderTopics: async (payload) => {
    const dept = payload.departmentId
    await apiFetch(`/departments/${dept}/topic-order`, {
      method: 'PUT',
      body: JSON.stringify({ items: payload.items, clientId: getTopicOrderClientId() }),
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
        let ext = (type.split('/')[1] ?? 'png').toLowerCase()
        if (ext === 'jpeg') ext = 'jpg'
        if (!/^[a-z0-9]{1,8}$/.test(ext)) ext = 'png'
        const file = new File([blob], `${randomId()}.${ext}`, { type })
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
    const storedName = safeStoredFileName(file.name)
    const rel = `media/${dept}/${topicPart}/files/${storedName}`
    await uploadMediaFile(rel, file, dept)
    const url = mediaAbsoluteUrl(rel)
    return {
      markdownPath: `files/${storedName}`,
      originalName: file.name,
      url,
      relativeFsPath: rel,
    }
  },

  resolveMediaUrl: async (relativePath, topicId, departmentId) => {
    const httpUrl = resolveMediaHttpUrl(relativePath, topicId, departmentId)
    const isApiMedia =
      httpUrl.startsWith('/media/') || httpUrl.includes('/media/media/')
    if (
      (httpUrl.startsWith('http://') || httpUrl.startsWith('https://')) &&
      !isApiMedia
    ) {
      return httpUrl
    }
    return fetchMediaObjectUrl(httpUrl)
  },

  resolveImageStorageRef: async (payload) => {
    const cleaned = payload.ref.replace(/\\/g, '/').replace(/^spravochnik:\/\//, '')
    const canonical = canonicalImageStoragePath(
      cleaned,
      payload.contextTopicId,
      payload.departmentId,
    )
    if (canonical) return canonical
    if (cleaned.startsWith('media/')) return cleaned
    if (cleaned.startsWith('images/')) {
      return `media/${payload.departmentId}/${payload.contextTopicId}/${cleaned}`
    }
    return cleaned
  },

  ensureTopicMedia: async () => {
    /* web loads media on demand via URL */
  },

  ensureMediaFiles: async () => {
    /* web loads media on demand via URL */
  },

  downloadMediaImage: async (resolvedSrc, suggestedName) => {
    try {
      let url = resolvedSrc
      if (url.startsWith('spravochnik://')) {
        url = mediaAbsoluteUrl(url.replace(/^spravochnik:\/\//, ''))
      }
      const res = await fetch(url, { credentials: 'include' })
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
    let url = resolvedSrc
    if (url.startsWith('spravochnik://')) {
      url = mediaAbsoluteUrl(url.replace(/^spravochnik:\/\//, ''))
    }
    window.open(url, '_blank', 'noopener,noreferrer')
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
    const data = await apiFetch<{ users: Record<string, unknown>[] }>(`/admin/users/${userId}`, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    })
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

  getSupportPhones: async () => {
    const data = await apiFetch<{ phones: Array<{ label: string; display: string; tel: string }> }>(
      '/app/support-phones',
    )
    return data.phones ?? []
  },

  setSupportPhones: async (payload) => {
    const data = await apiFetch<{ phones: Array<{ label: string; display: string; tel: string }> }>(
      '/admin/support-phones',
      { method: 'PUT', body: JSON.stringify(payload) },
    )
    for (const fn of supportPhonesListeners) fn()
    return data.phones ?? []
  },

  onSupportPhonesChanged: (callback) => {
    supportPhonesListeners.add(callback)
    return () => supportPhonesListeners.delete(callback)
  },

  getSupportEmails: async () => {
    const data = await apiFetch<{ emails: Array<{ label: string; email: string }> }>(
      '/app/support-emails',
    )
    return data.emails ?? []
  },

  setSupportEmails: async (payload) => {
    const data = await apiFetch<{ emails: Array<{ label: string; email: string }> }>(
      '/admin/support-emails',
      { method: 'PUT', body: JSON.stringify(payload) },
    )
    for (const fn of supportEmailsListeners) fn()
    return data.emails ?? []
  },

  onSupportEmailsChanged: (callback) => {
    supportEmailsListeners.add(callback)
    return () => supportEmailsListeners.delete(callback)
  },

  getAdminSettings: async () => ({
    hasPendingChanges: false,
    hasToken: Boolean(currentUser),
    hasServer: Boolean(getStoredServerUrl()),
    serverUrl: getStoredServerUrl(),
    ownerEmail: getOwnerEmail(),
  }),

  getStorageStats: async () => apiFetch('/admin/storage-stats'),

  listAdminDepartments: async () => {
    try {
      const data = await apiFetch<{
        departments: Array<{
          id: string
          label: string
          listKey: 'questions' | 'templates'
          sortOrder: number
          systemLocked?: boolean
          subsections?: Array<Record<string, unknown>>
        }>
      }>('/admin/departments')
      const depts = data.departments ?? []
      setCachedDepartments(depts)
      const subs: StoredSubsection[] = []
      for (const d of depts) {
        for (const sub of d.subsections ?? []) {
          subs.push(mapSubsection({ ...sub, departmentId: d.id }))
        }
      }
      if (subs.length) setCachedSubsections(subs)
      return toAdminDepartments()
    } catch {
      return toAdminDepartments()
    }
  },

  createAdminDepartment: async (payload) => {
    const data = await apiFetch<{
      department: {
        id: string
        label: string
        listKey: 'questions' | 'templates'
        sortOrder: number
        systemLocked?: boolean
      }
    }>('/admin/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await pullFullFromServer()
    return {
      id: data.department.id,
      label: data.department.label,
      listKey: data.department.listKey,
      sortOrder: data.department.sortOrder,
      systemLocked: data.department.systemLocked,
    }
  },

  updateAdminDepartment: async (payload) => {
    const data = await apiFetch<{
      department: {
        id: string
        label: string
        listKey: 'questions' | 'templates'
        sortOrder: number
        systemLocked?: boolean
      }
    }>(`/admin/departments/${payload.id}`, {
      method: 'PUT',
      body: JSON.stringify({ label: payload.label }),
    })
    await pullFullFromServer()
    return {
      id: data.department.id,
      label: data.department.label,
      listKey: data.department.listKey,
      sortOrder: data.department.sortOrder,
      systemLocked: data.department.systemLocked,
    }
  },

  deleteAdminDepartment: async (id) => {
    const data = await apiFetch<{ movedTopics?: number }>(`/admin/departments/${id}`, {
      method: 'DELETE',
    })
    await pullFullFromServer()
    return { movedTopics: data.movedTopics ?? 0 }
  },

  getSubsections: async () => getCachedSubsections(),

  createAdminSubsection: async (payload) => {
    const data = await apiFetch<{ subsection: Record<string, unknown> }>(
      `/admin/departments/${encodeURIComponent(payload.departmentId)}/subsections`,
      {
        method: 'POST',
        body: JSON.stringify({ label: payload.label, party: payload.party }),
      },
    )
    const sub = mapSubsection({ ...data.subsection, departmentId: payload.departmentId })
    setCachedSubsections([...getCachedSubsections(), sub])
    return sub
  },

  updateAdminSubsection: async (payload) => {
    const data = await apiFetch<{ subsection: Record<string, unknown> }>(
      `/admin/subsections/${encodeURIComponent(payload.id)}`,
      { method: 'PUT', body: JSON.stringify({ label: payload.label }) },
    )
    const updated = mapSubsection(data.subsection)
    setCachedSubsections(
      getCachedSubsections().map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
    )
    return {
      id: updated.id,
      departmentId: updated.departmentId,
      label: updated.label,
      sortOrder: updated.sortOrder,
    }
  },

  deleteAdminSubsection: async (id) => {
    await apiFetch(`/admin/subsections/${encodeURIComponent(id)}`, { method: 'DELETE' })
    setCachedSubsections(getCachedSubsections().filter((s) => s.id !== id))
    return { ok: true }
  },

  getSupportSections: async () => {
    if (getCachedSupportSections().length === 0) {
      try {
        const data = await apiFetch<{ sections: Array<Record<string, unknown>> }>(
          '/admin/support-sections',
        )
        setCachedSupportSections((data.sections ?? []).map(mapSupportSection))
      } catch {
        /* keep empty for non-admin */
      }
    }
    return getCachedSupportSections()
  },

  createAdminSupportSection: async (payload) => {
    const data = await apiFetch<{ section: Record<string, unknown> }>('/admin/support-sections', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const section = mapSupportSection(data.section)
    setCachedSupportSections([...getCachedSupportSections(), section])
    return section
  },

  updateAdminSupportSection: async (payload) => {
    const data = await apiFetch<{ section: Record<string, unknown> }>(
      `/admin/support-sections/${encodeURIComponent(payload.id)}`,
      { method: 'PUT', body: JSON.stringify({ label: payload.label }) },
    )
    const section = mapSupportSection(data.section)
    setCachedSupportSections(
      getCachedSupportSections().map((s) => (s.id === section.id ? section : s)),
    )
    return section
  },

  deleteAdminSupportSection: async (id) => {
    await apiFetch(`/admin/support-sections/${encodeURIComponent(id)}`, { method: 'DELETE' })
    setCachedSupportSections(getCachedSupportSections().filter((s) => s.id !== id))
    return { ok: true }
  },

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
      await apiFetch(`/departments/${payload.departmentId}/topic-order/lock`, {
        method: 'POST',
        body: JSON.stringify({ clientId: getTopicOrderClientId() }),
      })
      return { ok: true }
    } catch (e) {
      if (e instanceof ApiError && e.status === 423) {
        const body = e.body as { lockedByName?: string }
        const name = body?.lockedByName?.trim()
        return {
          ok: false,
          lockedByName: name,
          error: name
            ? `Порядок уже редактирует: ${name}`
            : 'Порядок уже редактируется в другом окне или приложении',
        }
      }
      return { ok: false, error: e instanceof Error ? e.message : 'Ошибка блокировки порядка' }
    }
  },

  unlockTopicOrder: async (payload) => {
    await apiFetch(`/departments/${payload.departmentId}/topic-order/unlock`, {
      method: 'POST',
      body: JSON.stringify({ clientId: getTopicOrderClientId() }),
    })
    return { ok: true }
  },

  renewTopicOrderLock: async (payload) => {
    await apiFetch(`/departments/${payload.departmentId}/topic-order/renew-lock`, {
      method: 'POST',
      body: JSON.stringify({ clientId: getTopicOrderClientId() }),
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
