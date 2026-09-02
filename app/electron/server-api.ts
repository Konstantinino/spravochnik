import fs from 'node:fs'
import path from 'node:path'
import { readSettings } from './auth-store'

export class ServerApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

function baseUrl(): string {
  const url = readSettings().serverUrl.trim().replace(/\/+$/, '')
  if (!url) throw new ServerApiError('URL сервера не указан', 0)
  return url
}

function authHeaders(): Record<string, string> {
  const token = readSettings().authToken.trim()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function serverFetch<T = unknown>(
  path: string,
  init?: RequestInit & { skipAuth?: boolean },
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

  return body as T
}

export async function isServerReachable(): Promise<boolean> {
  try {
    const settings = readSettings()
    if (!settings.serverUrl.trim()) return false
    await serverFetch<{ ok: boolean }>('/health', { skipAuth: true })
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
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new ServerApiError(text || `HTTP ${res.status}`, res.status)
  }
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
