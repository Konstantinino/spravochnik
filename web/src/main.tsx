import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installSpravochnik } from './platform/install'
import App from '@app/App'
import '@app/styles.css'
import './web-overrides.css'

installSpravochnik()

if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
