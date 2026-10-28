/** Где показывать телефоны в отделе «Техподдержка». Откат эксперимента: `'strip'`. */
export type SupportPhonesPlacement = 'header' | 'strip'

export const SUPPORT_PHONES_PLACEMENT: SupportPhonesPlacement = 'header'

/** Максимум почт или телефонов на отдел; в UI — два столбика по 3. */
export const MAX_CONTACT_LINES = 6
export const CONTACT_LINES_PER_COLUMN = 3

/** Левый столбик — «хвост» записей; правый — до 3 последних (полный столбик сверху). */
export function splitContactLines<T>(lines: T[]): { first: T[]; second: T[] } {
  const capped = lines.slice(0, MAX_CONTACT_LINES)
  if (capped.length <= CONTACT_LINES_PER_COLUMN) {
    return { first: capped, second: [] }
  }
  const second = capped.slice(-CONTACT_LINES_PER_COLUMN)
  const first = capped.slice(0, capped.length - second.length)
  return { first, second }
}

/** Классы раскладки столбиков почт/телефонов в шапке и полоске. */
export function contactBarLayoutClasses(
  barClass: 'support-emails-bar' | 'support-phones-bar',
  placement: SupportPhonesPlacement,
  firstCount: number,
  secondCount: number,
): { root: string; firstColumn: string; secondColumn: string } {
  const total = firstCount + secondCount
  const rootMods = [`${barClass}`, `${barClass}--${placement}`]
  if (total === 1) rootMods.push('support-contact-bar--solo')

  const firstColumn = [
    'support-contact-bar__column',
    'support-contact-bar__column--lead',
    secondCount > 0 && firstCount < secondCount ? 'support-contact-bar__column--shorter' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const secondColumn =
    'support-contact-bar__column support-contact-bar__column--tail'

  return { root: rootMods.join(' '), firstColumn, secondColumn }
}
