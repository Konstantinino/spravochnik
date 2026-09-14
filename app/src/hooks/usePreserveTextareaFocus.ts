import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button, input, select, textarea, a, label, .topic-link-picker, [contenteditable="true"]'

const EXTERNAL_FOCUS_ROOT =
  '.search-block, .sidebar, .app-header, .viewer__header, .viewer-find, .viewer__topbar, .modal'

function shouldKeepExternalFocus(el: Element | null): boolean {
  if (!el || el === document.body || el === document.documentElement) return false
  if (!(el instanceof HTMLElement)) return false
  if (el.matches(FOCUSABLE_SELECTOR)) return true
  if (el.closest(FOCUSABLE_SELECTOR)) return true
  if (el.closest(EXTERNAL_FOCUS_ROOT)) return true
  return false
}

/** Keep caret in textarea when Windows language switch (Alt+Shift) steals focus to body. */
export function usePreserveTextareaFocus(
  active: boolean,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
): void {
  const selectionRef = useRef({ start: 0, end: 0 })
  const activeRef = useRef(active)
  const blurTimerRef = useRef<number | null>(null)

  activeRef.current = active

  useEffect(() => {
    if (!active) return
    const el = textareaRef.current
    if (!el) return

    function clearBlurTimer() {
      if (blurTimerRef.current != null) {
        window.clearTimeout(blurTimerRef.current)
        blurTimerRef.current = null
      }
    }

    function saveSelection() {
      if (document.activeElement !== el) return
      selectionRef.current = { start: el!.selectionStart, end: el!.selectionEnd }
    }

    function restoreFocusIfNeeded() {
      if (!activeRef.current) return
      const textarea = textareaRef.current
      if (!textarea) return
      if (document.activeElement === textarea) return
      if (shouldKeepExternalFocus(document.activeElement)) return

      // Alt+Shift on Windows often leaves focus on <body> — recover the editor caret.
      const activeEl = document.activeElement
      if (activeEl != null && activeEl !== document.body && activeEl !== document.documentElement) {
        return
      }

      textarea.focus({ preventScroll: true })
      const { start, end } = selectionRef.current
      try {
        textarea.setSelectionRange(start, end)
      } catch {
        /* textarea may be detached */
      }
    }

    function onBlur() {
      saveSelection()
      clearBlurTimer()
      blurTimerRef.current = window.setTimeout(() => {
        blurTimerRef.current = null
        restoreFocusIfNeeded()
      }, 0)
    }

    function onFocusIn(e: FocusEvent) {
      if (shouldKeepExternalFocus(e.target as Element | null)) {
        clearBlurTimer()
      }
    }

    el.addEventListener('select', saveSelection)
    el.addEventListener('keyup', saveSelection)
    el.addEventListener('input', saveSelection)
    el.addEventListener('blur', onBlur)
    document.addEventListener('focusin', onFocusIn, true)

    return () => {
      clearBlurTimer()
      el.removeEventListener('select', saveSelection)
      el.removeEventListener('keyup', saveSelection)
      el.removeEventListener('input', saveSelection)
      el.removeEventListener('blur', onBlur)
      document.removeEventListener('focusin', onFocusIn, true)
      if (document.activeElement === el) {
        el.blur()
      }
    }
  }, [active, textareaRef])

  useEffect(() => {
    if (active) return
    if (blurTimerRef.current != null) {
      window.clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
  }, [active])
}
