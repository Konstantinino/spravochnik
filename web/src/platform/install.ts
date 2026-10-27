import { createBrowserSpravochnik } from './browser-spravochnik'
import { getStoredServerUrl, setStoredServerUrl } from './server-url'

export function installSpravochnik(): void {
  if (typeof window === 'undefined') return
  // Same-origin deploy (SPA on API host): default server URL so media stays on this origin.
  if (!import.meta.env.DEV && !getStoredServerUrl().trim()) {
    setStoredServerUrl(window.location.origin)
  }
  window.spravochnik = createBrowserSpravochnik()
}
