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

export function focusCursor(el: HTMLTextAreaElement | null, cursor: number): void {
  if (!el) return
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(cursor, cursor)
  })
}
