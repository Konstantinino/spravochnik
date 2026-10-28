import type { DepartmentId } from '../types'
import { SupportEmailsBar } from './SupportEmailsBar'
import { SupportPhonesBar } from './SupportPhonesBar'

interface SupportContactBarsProps {
  departmentId: DepartmentId
  placement: 'header' | 'strip'
}

/** Почты слева, телефоны справа — один блок в шапке или полоске. */
export function SupportContactBars({ departmentId, placement }: SupportContactBarsProps) {
  return (
    <div className={`support-contact-bars support-contact-bars--${placement}`}>
      <SupportEmailsBar departmentId={departmentId} placement={placement} />
      <SupportPhonesBar departmentId={departmentId} placement={placement} />
    </div>
  )
}
