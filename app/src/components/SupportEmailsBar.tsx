import { useEffect, useRef, useState } from 'react'
import type { DepartmentId } from '../types'
import {
  normalizeSupportEmail,
  normalizeSupportEmails,
  supportEmailsForDepartment,
  type SupportEmailLine,
  type SupportEmailsByDepartment,
} from '../lib/supportEmails'
import { contactBarLayoutClasses, splitContactLines } from '../lib/supportPhonesUi'

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
  departmentId: DepartmentId
  emails?: SupportEmailLine[]
  placement?: 'header' | 'strip'
}

export function SupportEmailsBar({
  departmentId,
  emails: emailsProp,
  placement = 'strip',
}: SupportEmailsBarProps) {
  const [emails, setEmails] = useState<SupportEmailLine[]>(emailsProp ?? [])
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (emailsProp) setEmails(emailsProp)
  }, [emailsProp])

  useEffect(() => {
    if (emailsProp) return
    let cancelled = false

    function applyStore(store: SupportEmailsByDepartment) {
      if (cancelled) return
      setEmails(supportEmailsForDepartment(store, departmentId))
    }

    void window.spravochnik.getSupportEmails().then((raw) => {
      applyStore(normalizeSupportEmails(raw))
    })
    const off = window.spravochnik.onSupportEmailsChanged(() => {
      void window.spravochnik.getSupportEmails().then((raw) => {
        applyStore(normalizeSupportEmails(raw))
      })
    })
    return () => {
      cancelled = true
      off()
    }
  }, [emailsProp, departmentId])

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

  if (emails.length === 0) return null

  const { first, second } = splitContactLines(emails)
  const layout = contactBarLayoutClasses('support-emails-bar', placement, first.length, second.length)

  function renderItem({ label, email }: SupportEmailLine) {
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
  }

  return (
    <div className={layout.root} role="region" aria-label="Почты">
      <div className={layout.firstColumn}>{first.map(renderItem)}</div>
      {second.length > 0 ? (
        <div className={layout.secondColumn}>{second.map(renderItem)}</div>
      ) : null}
    </div>
  )
}
