import { formatTopicMarkdownLink, parseCopiedTopicLink } from './markdown'

/** Insert markdown snippet into textarea value at cursor (or append). */
export function insertAtCursor(
  value: string,
  snippet: string,
  el: HTMLTextAreaElement | null,
): { next: string; cursor: number } {
  if (el) {
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = value.slice(0, start) + snippet + value.slice(end)
    return { next, cursor: start + snippet.length }
  }
  return { next: value + snippet, cursor: value.length + snippet.length }
}

/** If text is selected and clipboard is a topic link, wrap the selection. */
export function wrapSelectionWithTopicLink(
  value: string,
  clipboardText: string,
  el: HTMLTextAreaElement | null,
): { next: string; cursor: number } | null {
  if (!el) return null
  const start = el.selectionStart
  const end = el.selectionEnd
  if (start === end) return null
  const id = parseCopiedTopicLink(clipboardText)
  if (id == null) return null
  const snippet = formatTopicMarkdownLink(id, value.slice(start, end))
  const next = value.slice(0, start) + snippet + value.slice(end)
  return { next, cursor: start + snippet.length }
}

/**
 * Active `+query` before the caret (after start/whitespace/punctuation).
 * Used to open the topic-link picker while editing.
 */
export function getActivePlusQuery(
  value: string,
  cursor: number,
): { start: number; end: number; query: string } | null {
  if (cursor < 1) return null
  const before = value.slice(0, cursor)
  const match = before.match(/(^|[\s([{«"'])\+([^\n+]*)$/)
  if (!match) return null
  const query = match[2]
  const start = before.length - query.length - 1
  return { start, end: cursor, query }
}

/** Replace [start, end) with a topic markdown link. */
export function replaceRangeWithTopicLink(
  value: string,
  start: number,
  end: number,
  topicId: number,
  title: string,
): { next: string; cursor: number } {
  const snippet = formatTopicMarkdownLink(topicId, title)
  const next = value.slice(0, start) + snippet + value.slice(end)
  return { next, cursor: start + snippet.length }
}

export function focusCursor(el: HTMLTextAreaElement | null, cursor: number): void {
  if (!el) return
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(cursor, cursor)
  })
}
