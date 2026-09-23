const STORAGE_KEY = 'rest-info-web-server-url'

export function getStoredServerUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function setStoredServerUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.trim())
}

export function normalizeServerUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

/** Fetch base: dev uses Vite proxy (same origin); prod uses stored server URL. */
export function getApiBase(): string {
  if (import.meta.env.DEV) return ''
  const url = normalizeServerUrl(getStoredServerUrl())
  return url
}

export function mediaAbsoluteUrl(relativePath: string): string {
  const base = getApiBase()
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized
  if (import.meta.env.DEV || base === '') {
    if (normalized.startsWith('media/')) return `/${normalized}`
    return `/media/${normalized}`
  }
  const origin = base || getStoredServerUrl()
  if (normalized.startsWith('media/')) return `${origin}/${normalized}`
  return `${origin}/media/${normalized}`
}
