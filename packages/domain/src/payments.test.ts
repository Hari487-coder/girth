import { describe, expect, it } from 'vitest'
import { computePayoutLines, formatPaise, sumPaise } from './payments.js'

const config = {
  currency: 'INR',
  basePaise: 0,
  survivalPaise: 20000,
  growthBonusPaise: 5000,
  minGrowthCmForBonus: 1,
  deadPaise: 0,
}

describe('farmer payout maths', () => {
  it('pays survival plus growth bonus for a growing tree', () => {
    const lines = computePayoutLines(config, { treeAlive: true, growthCm: 3 })
    expect(lines.map((l) => l.reason)).toEqual(['SURVIVAL', 'GROWTH_BONUS'])
    expect(sumPaise(lines)).toBe(25000)
  })

  it('pays survival only when growth is below the threshold', () => {
    const lines = computePayoutLines(config, { treeAlive: true, growthCm: 0 })
    expect(lines.map((l) => l.reason)).toEqual(['SURVIVAL'])
  })

  it('pays survival only for a first reading with nothing to compare', () => {
    const lines = computePayoutLines(config, { treeAlive: true, growthCm: null })
    expect(lines.map((l) => l.reason)).toEqual(['SURVIVAL'])
  })

  it('pays nothing for a dead tree', () => {
    expect(computePayoutLines(config, { treeAlive: false, growthCm: null })).toHaveLength(0)
  })

  it('includes a base line when configured', () => {
    const lines = computePayoutLines({ ...config, basePaise: 1000 }, { treeAlive: true, growthCm: 2 })
    expect(lines[0]?.reason).toBe('BASE')
    expect(sumPaise(lines)).toBe(26000)
  })

  it('formats paise with Indian grouping', () => {
    expect(formatPaise(20000)).toBe('₹200')
    expect(formatPaise(20050)).toBe('₹200.50')
    expect(formatPaise(1850000)).toBe('₹18,500')
    expect(formatPaise(-500)).toBe('-₹5')
  })
})
