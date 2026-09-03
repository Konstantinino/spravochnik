/** Approximate caret screen position inside a textarea (mirror technique). */
export function getTextareaCaretRect(
  el: HTMLTextAreaElement,
  position: number,
): { left: number; top: number; height: number } {
  const style = window.getComputedStyle(el)
  const mirror = document.createElement('div')
  const properties = [
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'whiteSpace',
    'wordWrap',
    'wordBreak',
  ] as const

  mirror.setAttribute('aria-hidden', 'true')
  Object.assign(mirror.style, {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    top: '0',
    left: '-9999px',
  })

  for (const prop of properties) {
    mirror.style[prop] = style[prop]
  }
  mirror.style.width = `${el.clientWidth}px`
  mirror.style.height = 'auto'
  mirror.style.overflow = 'hidden'

  const value = el.value
  mirror.textContent = value.slice(0, position)
  const marker = document.createElement('span')
  marker.textContent = value.slice(position) || '.'
  mirror.appendChild(marker)
  document.body.appendChild(mirror)

  const elRect = el.getBoundingClientRect()
  const markerRect = marker.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()
  const topInMirror = markerRect.top - mirrorRect.top
  const leftInMirror = markerRect.left - mirrorRect.left

  document.body.removeChild(mirror)

  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2
  return {
    left: elRect.left + leftInMirror - el.scrollLeft,
    top: elRect.top + topInMirror - el.scrollTop,
    height: lineHeight,
  }
}

/** Keep floating panel inside the viewport. */
export function clampPickerPosition(
  left: number,
  top: number,
  width = 320,
  height = 260,
): { left: number; top: number } {
  const margin = 8
  const maxLeft = Math.max(margin, window.innerWidth - width - margin)
  const maxTop = Math.max(margin, window.innerHeight - height - margin)
  return {
    left: Math.min(Math.max(margin, left), maxLeft),
    top: Math.min(Math.max(margin, top), maxTop),
  }
}
