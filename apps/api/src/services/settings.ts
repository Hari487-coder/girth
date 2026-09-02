import type { Db, Tx } from '../lib/prisma.js'

export const SETTING = {
  AUDIT_SAMPLING_RATE: 'audit.sampling_rate',
  SPONSORSHIP_PRICE_PAISE: 'sponsorship.price_paise',
  SPONSORSHIP_TERM_YEARS: 'sponsorship.term_years',
} as const

export const SETTING_DEFAULTS: Record<string, { value: string; description: string }> = {
  [SETTING.AUDIT_SAMPLING_RATE]: {
    value: '0.10',
    description: 'Share of verified measurements selected for a physical spot audit (0 to 1)',
  },
  [SETTING.SPONSORSHIP_PRICE_PAISE]: {
    value: '249900',
    description: 'Illustrative MVP sponsorship price in paise for the default term',
  },
  [SETTING.SPONSORSHIP_TERM_YEARS]: {
    value: '5',
    description: 'Default prepaid sponsorship term in years',
  },
}

export async function getSetting(db: Db | Tx, key: string): Promise<string> {
  const row = await db.setting.findUnique({ where: { key } })
  if (row) return row.value
  const fallback = SETTING_DEFAULTS[key]
  if (!fallback) throw new Error(`Unknown setting ${key}`)
  return fallback.value
}

export async function getNumberSetting(db: Db | Tx, key: string): Promise<number> {
  const value = Number(await getSetting(db, key))
  if (!Number.isFinite(value)) throw new Error(`Setting ${key} is not numeric`)
  return value
}
