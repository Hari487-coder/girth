/**
 * Farmer payment maths. Amounts are integers in the smallest currency unit
 * (paise) so no float ever touches money. The numbers themselves live in a
 * configurable PaymentConfig; nothing here is a business fact.
 */
export interface PaymentConfigInput {
  currency: string
  /** Paid for every verified measurement regardless of growth. */
  basePaise: number
  /** Paid when the tree is verified alive. */
  survivalPaise: number
  /** Paid when verified growth meets the threshold. */
  growthBonusPaise: number
  minGrowthCmForBonus: number
  /** Normally 0: a dead tree earns nothing. */
  deadPaise: number
}

export type LedgerReason = 'BASE' | 'SURVIVAL' | 'GROWTH_BONUS' | 'DEAD' | 'PENALTY' | 'ADJUSTMENT'

export interface LedgerLine {
  reason: LedgerReason
  amountPaise: number
  description: string
}

export interface VerifiedMeasurementContext {
  treeAlive: boolean
  /** Growth against the previous verified reading; null for a first reading. */
  growthCm: number | null
}

export function computePayoutLines(
  config: PaymentConfigInput,
  ctx: VerifiedMeasurementContext,
): LedgerLine[] {
  const lines: LedgerLine[] = []

  if (!ctx.treeAlive) {
    if (config.deadPaise > 0) {
      lines.push({
        reason: 'DEAD',
        amountPaise: config.deadPaise,
        description: 'Tree confirmed dead',
      })
    }
    return lines
  }

  if (config.basePaise > 0) {
    lines.push({
      reason: 'BASE',
      amountPaise: config.basePaise,
      description: 'Verified measurement submitted',
    })
  }
  if (config.survivalPaise > 0) {
    lines.push({
      reason: 'SURVIVAL',
      amountPaise: config.survivalPaise,
      description: 'Tree verified alive',
    })
  }
  if (
    config.growthBonusPaise > 0 &&
    ctx.growthCm !== null &&
    ctx.growthCm >= config.minGrowthCmForBonus
  ) {
    lines.push({
      reason: 'GROWTH_BONUS',
      amountPaise: config.growthBonusPaise,
      description: `Verified growth of ${ctx.growthCm} cm meets the ${config.minGrowthCmForBonus} cm threshold`,
    })
  }
  return lines
}

export function sumPaise(lines: readonly { amountPaise: number }[]): number {
  return lines.reduce((total, l) => total + l.amountPaise, 0)
}

/** 20000 -> "₹200", 20050 -> "₹200.50". Indian digit grouping. */
export function formatPaise(paise: number, currency = 'INR'): string {
  const sign = paise < 0 ? '-' : ''
  const abs = Math.abs(paise)
  const rupees = Math.floor(abs / 100)
  const rest = abs % 100
  const symbol = currency === 'INR' ? '₹' : `${currency} `
  const whole = rupees.toLocaleString('en-IN')
  return rest === 0
    ? `${sign}${symbol}${whole}`
    : `${sign}${symbol}${whole}.${String(rest).padStart(2, '0')}`
}
