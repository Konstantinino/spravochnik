import type { DepartmentId } from '../types'

const IMAGE_STORAGE_PATH_RE =
  /^media\/(?:(support|lawyers|managers|spp|templates)\/)?(\d+)\/images\/([^/?#\s]+)$/i

function stripMediaRefPrefix(ref: string): string {
  return ref.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^spravochnik:\/\//, '')
}

export function topicIdFromImageStoragePath(ref: string): number | null {
  const cleaned = stripMediaRefPrefix(ref)
  const m = cleaned.match(
    /^media\/(?:support|lawyers|managers|spp|templates)\/(\d+)\/images\//i,
  )
  if (!m) return null
  const id = Number(m[1])
  return Number.isFinite(id) ? id : null
}

/** Canonical on-disk path media/{dept}/{topicId}/images/{file} for any image src in markdown. */
export function canonicalImageStoragePath(
  ref: string,
  topicId?: number | null,
  departmentId?: DepartmentId | null,
): string | null {
  const cleaned = stripMediaRefPrefix(ref)
  const nested = cleaned.match(IMAGE_STORAGE_PATH_RE)
  if (nested) {
    const dept = (nested[1] as DepartmentId | undefined) || departmentId || 'support'
    return `media/${dept}/${nested[2]}/images/${nested[3]}`
  }
  if (cleaned.startsWith('images/') && topicId != null) {
    const name = cleaned.slice('images/'.length).split(/[?#]/)[0]
    if (name && !name.includes('..') && !name.includes('/')) {
      const dept = departmentId || 'support'
      return `media/${dept}/${topicId}/images/${name}`
    }
  }
  return null
}

/** Markdown `![](…)` or bare media / spravochnik image path from clipboard. */
export function parsePastedImageMarkdown(text: string): string | null {
  const trimmed = text.trim()
  const mdMatch = trimmed.match(/^!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)$/)
  if (mdMatch) return mdMatch[1].trim()
  const cleaned = stripMediaRefPrefix(trimmed)
  if (IMAGE_STORAGE_PATH_RE.test(cleaned)) return cleaned
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return null
}

/** Image ref from editor selection or clipboard (`![](…)`, `images/…`, `media/…`). */
export function parseImageRefFromClipboard(text: string): string | null {
  const fromMd = parsePastedImageMarkdown(text)
  if (fromMd) return fromMd
  const cleaned = stripMediaRefPrefix(text.trim())
  if (cleaned.startsWith('images/') || cleaned.startsWith('media/')) return cleaned
  return null
}

/** Share image across topics: stable path in markdown (no copy in storage). */
export function formatSharedImageMarkdown(canonicalMediaPath: string): string {
  const path = stripMediaRefPrefix(canonicalMediaPath)
  return `![](${path})`
}

/** В исходнике темы — `&#160;`, при просмотре — символ NBSP. */
export function markdownForDisplay(source: string): string {
  return source.replace(/&#160;/g, '\u00A0')
}

/** Telegram file_id typically looks like AgACAg... or BQACAg... (long alphanumeric). */
export function isTelegramFileId(value: string): boolean {
  if (!value) return false
  if (value.startsWith('media/')) return false
  if (value.startsWith('images/')) return false
  if (value.startsWith('files/')) return false
  if (value.startsWith('spravochnik://')) return false
  if (/^https?:\/\//i.test(value)) return false
  if (/^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('./') || value.startsWith('../')) {
    return false
  }
  return /^[A-Za-z0-9_-]{20,}$/.test(value)
}

/**
 * Resolve markdown image/file src for display.
 * - spravochnik://… / media/… / http(s) — as-is (media → protocol)
 * - images/… or files/… — needs topicId + department → spravochnik://media/{dept}/{topicId}/…
 */
export function mediaSrcFromMarkdownUrl(
  url: string,
  topicId?: number | null,
  departmentId?: DepartmentId | null,
): string {
  if (!url) return url
  if (url.startsWith('spravochnik://')) return url
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('media/')) return `spravochnik://${url}`
  if ((url.startsWith('images/') || url.startsWith('files/')) && topicId != null) {
    const dept = departmentId || 'support'
    return `spravochnik://media/${dept}/${topicId}/${url}`
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

/** Topic file attachment: `files/uuid.pdf`, `media/12/files/…`, `spravochnik://media/12/files/…`. */
export function parseFileAttachmentHref(href: string | undefined): { storedName: string } | null {
  if (!href) return null
  const cleaned = href.replace(/\\/g, '/').replace(/^\/+/, '').trim()
  const match = cleaned.match(
    /^(?:spravochnik:\/\/)?(?:media\/(?:_draft\/[^/]+|(?:(?:support|lawyers|managers|spp|templates)\/)?\d+)\/)?files\/([^/?#\s]+)$/i,
  )
  if (!match) return null
  const storedName = match[1]
  if (!storedName || storedName.includes('..') || storedName.includes('/')) return null
  return { storedName }
}

/** Markdown snippet for an attached file: `[contract.pdf](files/uuid.pdf)`. */
export function formatFileMarkdownLink(originalName: string, markdownPath: string): string {
  const label = escapeMdLinkLabel(originalName.trim() || 'Файл')
  return `[${label}](${markdownPath})`
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
