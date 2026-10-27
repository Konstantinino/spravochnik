const TEXT_INPUT_SELECTOR =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'

/** Фокус на оболочке приложения — клавиатура не попадает в поля (типично Electron после модалок). */
export function isStaleAppShellFocus(el: Element | null): boolean {
  if (!el || el === document.body || el === document.documentElement) return true
  if (!(el instanceof HTMLElement)) return false
  if (el.classList.contains('app-shell')) return true
  return false
}

/** Drop focus from a button/control that is about to disable or unmount. */
export function releaseStaleFocus() {
  const active = document.activeElement
  if (active instanceof HTMLElement && active !== document.body) {
    active.blur()
  }
}

/** Recover keyboard input in Electron after dialogs or focus traps. */
export function restoreAppFocus() {
  const active = document.activeElement
  if (active instanceof HTMLElement && isStaleAppShellFocus(active)) {
    active.blur()
  } else {
    releaseStaleFocus()
  }
  if (__REST_INFO_WEB__) return
  requestAnimationFrame(() => {
    void window.spravochnik.focusAppWindow()
  })
}

function focusTextControl(el: HTMLElement) {
  if (el.matches('input[type="checkbox"], input[type="radio"]')) return
  requestAnimationFrame(() => {
    if (document.activeElement === el) return
    try {
      el.focus({ preventScroll: true })
    } catch {
      /* detached */
    }
  })
}

/**
 * Страховка: клик по полю ввода всегда даёт ему фокус; фокус на `.app-shell` сбрасывается.
 * Подключается один раз в App.
 */
export function installInputFocusGuard(): () => void {
  function onPointerDown(e: PointerEvent) {
    const target = e.target
    if (!(target instanceof Element)) return
    const field = target.closest(TEXT_INPUT_SELECTOR)
    if (!(field instanceof HTMLElement)) return
    focusTextControl(field)
  }

  function onFocusIn(e: FocusEvent) {
    const target = e.target
    if (!(target instanceof HTMLElement)) return
    if (!target.classList.contains('app-shell')) return
    target.blur()
    void window.spravochnik.focusAppWindow()
  }

  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('focusin', onFocusIn, true)
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('focusin', onFocusIn, true)
  }
}
