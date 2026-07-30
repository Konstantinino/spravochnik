/** Telegram file_id typically looks like AgACAg... or BQACAg... (long alphanumeric). */
export function isTelegramFileId(value: string): boolean {
  if (!value) return false
  if (value.startsWith('media/')) return false
  if (value.startsWith('spravochnik://')) return false
  if (/^https?:\/\//i.test(value)) return false
  // Local absolute/relative paths
  if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('./') || value.startsWith('../')) {
    return false
  }
  return /^[A-Za-z0-9_-]{20,}$/.test(value)
}

export function mediaSrcFromMarkdownUrl(url: string): string {
  if (url.startsWith('spravochnik://')) return url
  if (url.startsWith('media/')) return `spravochnik://${url}`
  return url
}
