const HIT_CLASS = 'find-hit'
const ACTIVE_CLASS = 'find-hit--active'

/** Unwrap previous highlight marks inside root. */
export function clearFindHighlights(root: HTMLElement): void {
  const marks = root.querySelectorAll(`mark.${HIT_CLASS}`)
  marks.forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark)
    }
    parent.removeChild(mark)
    parent.normalize()
  })
}

/**
 * Highlight all case-insensitive matches of `query` in text nodes under `root`.
 * Returns number of matches. Active match gets find-hit--active and is scrolled into view.
 */
export function applyFindHighlights(
  root: HTMLElement,
  query: string,
  activeIndex: number,
): number {
  clearFindHighlights(root)
  const q = query.trim()
  if (!q) return 0

  const qLower = q.toLowerCase()
  const textNodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      const tag = parent.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK') {
        return NodeFilter.FILTER_REJECT
      }
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let current = walker.nextNode()
  while (current) {
    textNodes.push(current as Text)
    current = walker.nextNode()
  }

  const marks: HTMLElement[] = []

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    const lower = text.toLowerCase()
    let from = 0
    const parts: Array<{ text: string; hit: boolean }> = []
    let matched = false

    while (from < text.length) {
      const idx = lower.indexOf(qLower, from)
      if (idx < 0) {
        parts.push({ text: text.slice(from), hit: false })
        break
      }
      if (idx > from) {
        parts.push({ text: text.slice(from, idx), hit: false })
      }
      parts.push({ text: text.slice(idx, idx + q.length), hit: true })
      matched = true
      from = idx + q.length
    }

    if (!matched) continue

    const frag = document.createDocumentFragment()
    for (const part of parts) {
      if (!part.text) continue
      if (part.hit) {
        const mark = document.createElement('mark')
        mark.className = HIT_CLASS
        mark.textContent = part.text
        frag.appendChild(mark)
        marks.push(mark)
      } else {
        frag.appendChild(document.createTextNode(part.text))
      }
    }
    textNode.parentNode?.replaceChild(frag, textNode)
  }

  if (marks.length === 0) return 0

  const safeIndex = ((activeIndex % marks.length) + marks.length) % marks.length
  marks.forEach((mark, i) => {
    mark.classList.toggle(ACTIVE_CLASS, i === safeIndex)
  })
  marks[safeIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' })

  return marks.length
}
