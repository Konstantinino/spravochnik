/** Drop focus from a button/control that is about to disable or unmount. */
export function releaseStaleFocus() {
  const active = document.activeElement
  if (active instanceof HTMLElement && active !== document.body) {
    active.blur()
  }
}

/** Recover keyboard/mouse input in Electron after dialogs or focus traps. */
export function restoreAppFocus() {
  releaseStaleFocus()
  requestAnimationFrame(() => {
    void window.spravochnik.focusAppWindow()
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('.app-shell')?.focus({ preventScroll: true })
    })
  })
}
