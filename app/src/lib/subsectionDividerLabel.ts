/** Полная ширина строки разделителя подраздела в списке тем (символы). */
export const SUBSECTION_DIVIDER_TOTAL_WIDTH = 40

function capitalizeSubsectionLabelFirstLetter(label: string): string {
  if (!label) return label
  const chars = [...label]
  const first = chars[0]
  if (!first) return label
  chars[0] = first.toLocaleUpperCase('ru-RU')
  return chars.join('')
}

/**
 * Убирает декоративные «-» и пробелы по краям; первая буква — заглавная.
 * «--- сторона админа ---» → «Сторона админа».
 */
export function normalizeSubsectionLabelInput(raw: string): string {
  const stripped = raw.trim().replace(/^[\s-]+/, '').replace(/[\s-]+$/, '').trim()
  return capitalizeSubsectionLabelFirstLetter(stripped)
}

/**
 * Строка вида «-------- название --------» фиксированной длины 40:
 * по одному пробелу между «-» и названием; при нечётной длине названия справа на один «-» больше.
 */
export function formatSubsectionDividerLine(rawLabel: string): string {
  const name = normalizeSubsectionLabelInput(rawLabel)
  if (!name) return '-'.repeat(SUBSECTION_DIVIDER_TOTAL_WIDTH)

  const nameLen = name.length
  let dashTotal = SUBSECTION_DIVIDER_TOTAL_WIDTH - nameLen - 2
  if (dashTotal < 0) dashTotal = 0

  let left: number
  let right: number
  if (nameLen % 2 === 1) {
    left = Math.floor(dashTotal / 2)
    right = dashTotal - left
  } else {
    left = dashTotal / 2
    right = dashTotal / 2
  }

  return `${'-'.repeat(left)} ${name} ${'-'.repeat(right)}`
}
