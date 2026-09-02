export { formatPaise } from '@girth/domain'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 2026-08-28T00:00:00.000Z -> 28 Aug 2026 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function todayIso(): string {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

export function signedCm(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta} cm`
}

export const OCCASION_LABEL: Record<string, string> = {
  BIRTH: 'New baby',
  WEDDING: 'Wedding',
  BIRTHDAY: 'Birthday',
  MEMORIAL: 'Memorial',
  HOUSEWARMING: 'Housewarming',
  COMMITMENT: 'A commitment',
}

export const OCCASIONS: { value: string; emoji: string }[] = [
  { value: 'BIRTHDAY', emoji: '🎂' },
  { value: 'WEDDING', emoji: '💍' },
  { value: 'BIRTH', emoji: '👶' },
  { value: 'HOUSEWARMING', emoji: '🏠' },
  { value: 'MEMORIAL', emoji: '🕊️' },
  { value: 'COMMITMENT', emoji: '🌱' },
]
