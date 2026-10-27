import { SupportEmailsBar } from './SupportEmailsBar'
import { SupportPhonesBar } from './SupportPhonesBar'

interface SupportContactBarsProps {
  placement: 'header' | 'strip'
}

/** Почты слева, телефоны справа — один блок в шапке или полоске. */
export function SupportContactBars({ placement }: SupportContactBarsProps) {
  return (
    <div className={`support-contact-bars support-contact-bars--${placement}`}>
      <SupportEmailsBar placement={placement} />
      <SupportPhonesBar placement={placement} />
    </div>
  )
}
