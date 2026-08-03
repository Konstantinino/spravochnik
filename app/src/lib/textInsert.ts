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

export function focusCursor(el: HTMLTextAreaElement | null, cursor: number): void {
  if (!el) return
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(cursor, cursor)
  })
}
