import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { readSettings, normalizeServerUrl } from './auth-store'

export const CLIENT_VERSION_HEADER = 'X-Rest-Info-Client-Version'

export class ServerApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export const INVALID_SERVER_URL_MESSAGE = 'Неверно указан URL сервера'

function baseUrl(): string {
  const url = normalizeServerUrl(readSettings().serverUrl)
  if (!url) throw new ServerApiError('URL сервера не указан', 0)
  return url
}

function clientVersionHeaders(): Record<string, string> {
  try {
    const version = app.getVersion()?.trim()
    if (version) return { [CLIENT_VERSION_HEADER]: version }
  } catch {
    /* not in Electron main */
  }
  return {}
}

function authHeaders(): Record<string, string> {
  const token = readSettings().authToken.trim()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...clientVersionHeaders(),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function serverFetch<T = unknown>(
  path: string,
  init?: RequestInit & { skipAuth?: boolean; skipRemotePull?: boolean },
): Promise<T> {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers = init?.skipAuth ? { 'Content-Type': 'application/json' } : authHeaders()
  if (init?.headers) {
    Object.assign(headers, init.headers)
  }

  let res: Response
  try {
    res = await fetch(url, { ...init, headers })
  } catch (err) {
    throw new ServerApiError(
      err instanceof Error ? err.message : 'Нет связи с сервером',
      0,
    )
  }

  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: string }).error)
        : `HTTP ${res.status}`
    throw new ServerApiError(msg, res.status, body)
  }

  if (shouldPeekAfterRequest(path, init)) {
    afterServerRequest?.(path)
  }

  return body as T
}

let afterServerRequest: ((path: string) => void) | null = null

export function setAfterServerRequest(fn: ((path: string) => void) | null): void {
  afterServerRequest = fn
}

function shouldPeekAfterRequest(requestPath: string, init?: RequestInit & { skipAuth?: boolean; skipRemotePull?: boolean }): boolean {
  if (init?.skipAuth || init?.skipRemotePull) return false
  const p = requestPath.split('?')[0] ?? requestPath
  if (p === '/health' || p === '/sync/status' || p.startsWith('/sync/changes')) return false
  if (p.startsWith('/app/')) return false
  if (p.startsWith('/auth/login') || p.startsWith('/auth/register')) return false
  return true
}

export async function validateServerUrl(rawUrl: string): Promise<string> {
  const url = normalizeServerUrl(rawUrl)
  if (!url) throw new ServerApiError('URL сервера не указан', 0)

  let res: Response
  try {
    res = await fetch(`${url}/health`, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    throw new ServerApiError(INVALID_SERVER_URL_MESSAGE, 0)
  }

  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (
    !res.ok ||
    !body ||
    typeof body !== 'object' ||
    (body as { ok?: boolean }).ok !== true
  ) {
    throw new ServerApiError(INVALID_SERVER_URL_MESSAGE, res.status, body)
  }

  return url
}

export async function isServerReachable(): Promise<boolean> {
  try {
    const settings = readSettings()
    if (!settings.serverUrl.trim()) return false
    await validateServerUrl(settings.serverUrl)
    return true
  } catch {
    return false
  }
}

export async function serverLogin(
  email: string,
  password: string,
): Promise<{ token: string; user: Record<string, unknown> }> {
  return serverFetch('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  })
}

export async function serverRegister(payload: {
  name: string
  email: string
  password: string
}): Promise<{ token: string; user: Record<string, unknown> }> {
  return serverFetch('/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(payload),
  })
}

export async function uploadMediaFile(
  relativePath: string,
  localFilePath: string,
  departmentId?: string,
): Promise<void> {
  const url = `${baseUrl()}/media/upload`
  const token = readSettings().authToken.trim()
  const form = new FormData()
  const buffer = fs.readFileSync(localFilePath)
  const blob = new Blob([buffer])
  form.append('file', blob, path.basename(localFilePath))
  form.append('relativePath', relativePath)
  if (departmentId) form.append('departmentId', departmentId)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...clientVersionHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new ServerApiError(text || `HTTP ${res.status}`, res.status)
  }
  afterServerRequest?.('/media/upload')
}

export async function downloadMediaFile(relativePath: string, destPath: string): Promise<void> {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const url = `${baseUrl()}/media/${normalized}`
  const token = readSettings().authToken.trim()

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    throw new ServerApiError(`Не удалось скачать ${normalized}`, res.status)
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(destPath, buffer)
}

export async function lockTopic(departmentId: string, topicId: number): Promise<void> {
  await serverFetch(`/departments/${departmentId}/topics/lock/${topicId}`, { method: 'POST' })
}

export async function unlockTopic(departmentId: string, topicId: number): Promise<void> {
  await serverFetch(`/departments/${departmentId}/topics/unlock/${topicId}`, { method: 'POST' })
}

export async function renewTopicLock(departmentId: string, topicId: number): Promise<void> {
  await serverFetch(`/departments/${departmentId}/topics/renew-lock/${topicId}`, {
    method: 'POST',
  })
}

export async function lockTopicOrder(departmentId: string): Promise<void> {
  await serverFetch(`/departments/${departmentId}/topic-order/lock`, { method: 'POST' })
}

export async function unlockTopicOrder(departmentId: string): Promise<void> {
  await serverFetch(`/departments/${departmentId}/topic-order/unlock`, { method: 'POST' })
}

export async function renewTopicOrderLock(departmentId: string): Promise<void> {
  await serverFetch(`/departments/${departmentId}/topic-order/renew-lock`, { method: 'POST' })
}

export async function fetchDepartmentTopics(
  departmentId: string,
): Promise<Record<string, unknown>> {
  return serverFetch<Record<string, unknown>>(`/departments/${departmentId}/topics`, {
    skipRemotePull: true,
  })
}

export interface SupportPhoneLineDto {
  label: string
  display: string
  tel: string
}

export async function fetchSupportPhones(): Promise<SupportPhoneLineDto[]> {
  const data = await serverFetch<{ phones: SupportPhoneLineDto[] }>('/app/support-phones', {
    skipRemotePull: true,
  })
  return data.phones ?? []
}

export async function saveSupportPhonesOnServer(
  phones: SupportPhoneLineDto[],
): Promise<SupportPhoneLineDto[]> {
  const data = await serverFetch<{ phones: SupportPhoneLineDto[] }>('/admin/support-phones', {
    method: 'PUT',
    body: JSON.stringify({ phones }),
    skipRemotePull: true,
  })
  return data.phones ?? []
}

export interface AdminSubsectionDto {
  id: string
  departmentId: string
  label: string
  sortOrder: number
}

export interface AdminDepartmentDto {
  id: string
  label: string
  listKey: 'questions' | 'templates'
  sortOrder: number
  systemLocked?: boolean
  subsections?: AdminSubsectionDto[]
}

export async function fetchAdminDepartments(): Promise<AdminDepartmentDto[]> {
  const data = await serverFetch<{ departments: AdminDepartmentDto[] }>('/admin/departments', {
    skipRemotePull: true,
  })
  return data.departments ?? []
}

export async function createSubsectionOnServer(
  departmentId: string,
  payload: { label: string },
): Promise<AdminSubsectionDto> {
  const data = await serverFetch<{ subsection: AdminSubsectionDto }>(
    `/admin/departments/${encodeURIComponent(departmentId)}/subsections`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      skipRemotePull: true,
    },
  )
  return data.subsection
}

export async function updateSubsectionOnServer(
  id: string,
  payload: { label: string },
): Promise<AdminSubsectionDto> {
  const data = await serverFetch<{ subsection: AdminSubsectionDto }>(
    `/admin/subsections/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      skipRemotePull: true,
    },
  )
  return data.subsection
}

export async function deleteSubsectionOnServer(id: string): Promise<void> {
  await serverFetch(`/admin/subsections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    skipRemotePull: true,
  })
}

export async function createDepartmentOnServer(payload: {
  id: string
  label: string
}): Promise<AdminDepartmentDto> {
  const data = await serverFetch<{ department: AdminDepartmentDto }>('/admin/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipRemotePull: true,
  })
  return data.department
}

export async function updateDepartmentOnServer(
  id: string,
  payload: { label: string },
): Promise<AdminDepartmentDto> {
  const data = await serverFetch<{ department: AdminDepartmentDto }>(`/admin/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    skipRemotePull: true,
  })
  return data.department
}

export async function deleteDepartmentOnServer(id: string): Promise<{ movedTopics: number }> {
  const data = await serverFetch<{ ok: boolean; movedTopics?: number }>(
    `/admin/departments/${id}`,
    {
      method: 'DELETE',
      skipRemotePull: true,
    },
  )
  return { movedTopics: data.movedTopics ?? 0 }
}
