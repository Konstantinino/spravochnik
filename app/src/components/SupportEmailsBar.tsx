import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SUPPORT_EMAILS,
  normalizeSupportEmail,
  type SupportEmailLine,
} from '../lib/supportEmails'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
      return true
    } catch {
      return false
    }
  }
}

interface SupportEmailsBarProps {
  emails?: SupportEmailLine[]
  placement?: 'header' | 'strip'
}

export function SupportEmailsBar({
  emails: emailsProp,
  placement = 'strip',
}: SupportEmailsBarProps) {
  const [emails, setEmails] = useState<SupportEmailLine[]>(
    emailsProp?.length ? emailsProp : DEFAULT_SUPPORT_EMAILS,
  )
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (emailsProp?.length) setEmails(emailsProp)
  }, [emailsProp])

  useEffect(() => {
    if (emailsProp?.length) return
    let cancelled = false
    void window.spravochnik.getSupportEmails().then((list) => {
      if (!cancelled && list.length) setEmails(list)
    })
    const off = window.spravochnik.onSupportEmailsChanged(() => {
      void window.spravochnik.getSupportEmails().then((list) => {
        if (list.length) setEmails(list)
      })
    })
    return () => {
      cancelled = true
      off()
    }
  }, [emailsProp])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy(email: string) {
    const value = normalizeSupportEmail(email)
    const ok = await copyText(value)
    if (!ok) return
    setCopiedEmail(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopiedEmail(null), 1600)
  }

  return (
    <div
      className={`support-emails-bar support-emails-bar--${placement}`}
      role="region"
      aria-label="Почта техподдержки"
    >
      {emails.map(({ label, email }) => {
        const normalized = normalizeSupportEmail(email)
        return (
          <span key={`${normalized}-${label}`} className="support-emails-bar__item">
            <span className="support-emails-bar__label">{label}</span>
            <button
              type="button"
              className="support-emails-bar__address"
              title="Скопировать адрес"
              onClick={() => void handleCopy(normalized)}
            >
              {copiedEmail === normalized ? 'Скопировано' : normalized}
            </button>
          </span>
        )
      })}
    </div>
  )
}
