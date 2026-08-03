/** Telegram file_id typically looks like AgACAg... or BQACAg... (long alphanumeric). */
export function isTelegramFileId(value: string): boolean {
  if (!value) return false
  if (value.startsWith('media/')) return false
  if (value.startsWith('images/')) return false
  if (value.startsWith('spravochnik://')) return false
  if (/^https?:\/\//i.test(value)) return false
  if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('./') || value.startsWith('../')) {
    return false
  }
  return /^[A-Za-z0-9_-]{20,}$/.test(value)
}

/**
 * Resolve markdown image src for display.
 * - spravochnik://… / media/… / http(s) — as-is (media → protocol)
 * - images/… — needs topicId → spravochnik://media/{topicId}/images/…
 */
export function mediaSrcFromMarkdownUrl(url: string, topicId?: number | null): string {
  if (!url) return url
  if (url.startsWith('spravochnik://')) return url
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('media/')) return `spravochnik://${url}`
  if (url.startsWith('images/') && topicId != null) {
    return `spravochnik://media/${topicId}/${url}`
  }
  return url
}

export function isAllowedMarkdownImageSrc(url: string): boolean {
  return (
    url.startsWith('media/') ||
    url.startsWith('images/') ||
    url.startsWith('spravochnik://') ||
    /^https?:\/\//i.test(url)
  )
}
