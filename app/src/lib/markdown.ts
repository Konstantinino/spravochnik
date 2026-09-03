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

/** Internal topic link: `#123`, `#topic-123`, `topic:123`. Returns null if not a topic link. */
export function parseTopicLinkHref(href: string | undefined): number | null {
  if (!href) return null
  const trimmed = href.trim()
  const hashMatch = trimmed.match(/^#(?:topic-)?(\d+)$/i)
  if (hashMatch) {
    const id = Number(hashMatch[1])
    return Number.isFinite(id) ? id : null
  }
  const topicMatch = trimmed.match(/^topic:(?:\/\/)?(\d+)$/i)
  if (topicMatch) {
    const id = Number(topicMatch[1])
    return Number.isFinite(id) ? id : null
  }
  return null
}

function escapeMdLinkLabel(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
}

/** Markdown snippet to paste into a topic body: `[Title](#123)`. */
export function formatTopicMarkdownLink(id: number, title: string): string {
  const label = escapeMdLinkLabel(title.trim() || 'Тема')
  return `[${label}](#${id})`
}

/** Topic id from a copied markdown link or a bare `#123` / `topic:123`. */
export function parseCopiedTopicLink(text: string): number | null {
  const trimmed = text.trim()
  const mdMatch = trimmed.match(/^\[(?:\\.|[^\]])*\]\(([^)]+)\)$/)
  return parseTopicLinkHref(mdMatch ? mdMatch[1] : trimmed)
}
