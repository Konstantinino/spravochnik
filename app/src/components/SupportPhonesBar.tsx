import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SUPPORT_PHONES,
  formatSupportPhoneDisplay,
  type SupportPhoneLine,
} from '../lib/supportPhones'

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

interface SupportPhonesBarProps {
  phones?: SupportPhoneLine[]
  /** `header` — синяя шапка, столбик; `strip` — полоска под шапкой */
  placement?: 'header' | 'strip'
}

export function SupportPhonesBar({
  phones: phonesProp,
  placement = 'strip',
}: SupportPhonesBarProps) {
  const [phones, setPhones] = useState<SupportPhoneLine[]>(
    phonesProp?.length ? phonesProp : DEFAULT_SUPPORT_PHONES,
  )
  const [copiedTel, setCopiedTel] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (phonesProp?.length) setPhones(phonesProp)
  }, [phonesProp])

  useEffect(() => {
    if (phonesProp?.length) return
    let cancelled = false
    void window.spravochnik.getSupportPhones().then((list) => {
      if (!cancelled && list.length) setPhones(list)
    })
    const off = window.spravochnik.onSupportPhonesChanged(() => {
      void window.spravochnik.getSupportPhones().then((list) => {
        if (list.length) setPhones(list)
      })
    })
    return () => {
      cancelled = true
      off()
    }
  }, [phonesProp])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy(tel: string, display: string) {
    const ok = await copyText(display)
    if (!ok) return
    setCopiedTel(tel)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopiedTel(null), 1600)
  }

  return (
    <div
      className={`support-phones-bar support-phones-bar--${placement}`}
      role="region"
      aria-label="Телефоны техподдержки"
    >
      {phones.map(({ label, tel }) => {
        const display = formatSupportPhoneDisplay(tel)
        return (
          <span key={`${tel}-${label}`} className="support-phones-bar__item">
            <span className="support-phones-bar__label">{label}</span>
            <button
              type="button"
              className="support-phones-bar__number"
              title="Скопировать номер"
              onClick={() => void handleCopy(tel, display)}
            >
              {copiedTel === tel ? 'Скопировано' : display}
            </button>
          </span>
        )
      })}
    </div>
  )
}
