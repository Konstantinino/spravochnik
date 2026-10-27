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

/** Fetch base: same-origin (dev proxy or SPA on API host) → ''; else stored server URL. */
export function getApiBase(): string {
  if (import.meta.env.DEV) return ''
  const url = normalizeServerUrl(getStoredServerUrl())
  if (!url) return ''
  try {
    if (typeof window !== 'undefined' && new URL(url).origin === window.location.origin) {
      return ''
    }
  } catch {
    /* ignore */
  }
  return url
}

export function mediaAbsoluteUrl(relativePath: string): string {
  const base = getApiBase()
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized
  // API mount is /media/…; storage keys are usually media/{dept}/…
  const path = normalized.startsWith('media/') ? `/${normalized}` : `/media/${normalized}`
  if (!base) return path
  return `${base}${path}`
}
