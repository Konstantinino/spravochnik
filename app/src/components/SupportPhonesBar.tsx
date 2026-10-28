import { useEffect, useRef, useState } from 'react'
import type { DepartmentId } from '../types'
import {
  formatSupportPhoneDisplay,
  normalizeSupportPhones,
  supportPhonesForDepartment,
  type SupportPhoneLine,
  type SupportPhonesByDepartment,
} from '../lib/supportPhones'
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

interface SupportPhonesBarProps {
  departmentId: DepartmentId
  phones?: SupportPhoneLine[]
  /** `header` — синяя шапка, столбик; `strip` — полоска под шапкой */
  placement?: 'header' | 'strip'
}

export function SupportPhonesBar({
  departmentId,
  phones: phonesProp,
  placement = 'strip',
}: SupportPhonesBarProps) {
  const [phones, setPhones] = useState<SupportPhoneLine[]>(phonesProp ?? [])
  const [copiedTel, setCopiedTel] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (phonesProp) setPhones(phonesProp)
  }, [phonesProp])

  useEffect(() => {
    if (phonesProp) return
    let cancelled = false

    function applyStore(store: SupportPhonesByDepartment) {
      if (cancelled) return
      setPhones(supportPhonesForDepartment(store, departmentId))
    }

    void window.spravochnik.getSupportPhones().then((raw) => {
      applyStore(normalizeSupportPhones(raw))
    })
    const off = window.spravochnik.onSupportPhonesChanged(() => {
      void window.spravochnik.getSupportPhones().then((raw) => {
        applyStore(normalizeSupportPhones(raw))
      })
    })
    return () => {
      cancelled = true
      off()
    }
  }, [phonesProp, departmentId])

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

  if (phones.length === 0) return null

  const { first, second } = splitContactLines(phones)
  const layout = contactBarLayoutClasses('support-phones-bar', placement, first.length, second.length)

  function renderItem({ label, tel }: SupportPhoneLine) {
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
  }

  return (
    <div className={layout.root} role="region" aria-label="Телефоны">
      <div className={layout.firstColumn}>{first.map(renderItem)}</div>
      {second.length > 0 ? (
        <div className={layout.secondColumn}>{second.map(renderItem)}</div>
      ) : null}
    </div>
  )
}
