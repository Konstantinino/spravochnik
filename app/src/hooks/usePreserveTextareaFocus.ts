import { useEffect, useRef, type RefObject } from 'react'

const INTERACTIVE_SELECTOR =
  'button, input, select, textarea, a, label, .topic-link-picker, [contenteditable="true"]'

/** Keep caret in textarea when Windows language switch (Alt+Shift) steals focus. */
export function usePreserveTextareaFocus(
  active: boolean,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  rootSelector: string,
): void {
  const selectionRef = useRef({ start: 0, end: 0 })
  const intentionalBlurRef = useRef(false)

  useEffect(() => {
    if (!active) return
    const el = textareaRef.current
    if (!el) return

    function saveSelection() {
      if (document.activeElement !== el) return
      selectionRef.current = { start: el!.selectionStart, end: el!.selectionEnd }
    }

    function onDocPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null
      intentionalBlurRef.current = Boolean(target?.closest(INTERACTIVE_SELECTOR))
    }

    function restoreFocusIfNeeded() {
      const textarea = textareaRef.current
      if (!textarea || !active) return
      if (document.activeElement === textarea) return

      const activeEl = document.activeElement
      if (activeEl instanceof HTMLElement && activeEl.closest(rootSelector)) {
        return
      }

      if (activeEl == null || activeEl === document.body) {
        textarea.focus({ preventScroll: true })
        const { start, end } = selectionRef.current
        try {
          textarea.setSelectionRange(start, end)
        } catch {
          /* textarea may be detached */
        }
      }
    }

    function onBlur() {
      saveSelection()
      window.setTimeout(() => {
        if (intentionalBlurRef.current) {
          intentionalBlurRef.current = false
          return
        }
        restoreFocusIfNeeded()
      }, 0)
    }

    document.addEventListener('pointerdown', onDocPointerDown, true)
    el.addEventListener('select', saveSelection)
    el.addEventListener('keyup', saveSelection)
    el.addEventListener('input', saveSelection)
    el.addEventListener('blur', onBlur)

    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true)
      el.removeEventListener('select', saveSelection)
      el.removeEventListener('keyup', saveSelection)
      el.removeEventListener('input', saveSelection)
      el.removeEventListener('blur', onBlur)
    }
  }, [active, textareaRef, rootSelector])
}
