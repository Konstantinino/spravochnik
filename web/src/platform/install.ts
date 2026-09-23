import { createBrowserSpravochnik } from './browser-spravochnik'

export function installSpravochnik(): void {
  if (typeof window === 'undefined') return
  window.spravochnik = createBrowserSpravochnik()
}
