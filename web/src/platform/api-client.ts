import { getApiBase, getStoredServerUrl, normalizeServerUrl } from './server-url'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export const INVALID_SERVER_URL_MESSAGE = 'Неверно указан URL сервера'

export async function validateServerUrl(rawUrl: string): Promise<string> {
  const url = normalizeServerUrl(rawUrl)
  if (!url) throw new ApiError('URL сервера не указан', 0)

  let res: Response
  try {
    res = await fetch(`${url}/health`, { credentials: 'omit' })
  } catch {
    throw new ApiError(INVALID_SERVER_URL_MESSAGE, 0)
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
    throw new ApiError(INVALID_SERVER_URL_MESSAGE, res.status, body)
  }

  return url
}

/** skipAuth = публичный эндпоинт (без Bearer). Cookie-сессию всё равно принимаем/отправляем. */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { skipAuth?: boolean },
): Promise<T> {
  const base = getApiBase()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (!headers['Content-Type'] && init?.body && typeof init.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers,
      credentials: 'include',
    })
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : 'Нет связи с сервером', 0)
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
    throw new ApiError(msg, res.status, body)
  }

  return body as T
}

export async function uploadMediaFile(
  relativePath: string,
  file: File,
  departmentId?: string,
): Promise<void> {
  const base = getApiBase()
  const url = `${base}/media/upload`
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('relativePath', relativePath)
  if (departmentId) form.append('departmentId', departmentId)

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text || `HTTP ${res.status}`, res.status)
  }
}

export function hasConfiguredServer(): boolean {
  return Boolean(getStoredServerUrl().trim())
}
