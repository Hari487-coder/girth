import { describe, expect, it } from 'vitest'
import {
  auditSelectionScore,
  classifyDiscrepancy,
  clampSamplingRate,
  shouldSelectForAudit,
} from './auditSampling.js'

describe('audit sampling', () => {
  it('is deterministic for the same measurement and salt', () => {
    expect(auditSelectionScore('m-1', 'salt')).toBe(auditSelectionScore('m-1', 'salt'))
    expect(auditSelectionScore('m-1', 'salt')).not.toBe(auditSelectionScore('m-1', 'other'))
  })

  it('selects roughly the configured share of measurements', () => {
    const n = 5000
    let selected = 0
    for (let i = 0; i < n; i++) {
      if (shouldSelectForAudit(`measurement-${i}`, 'pilot-salt', 0.1)) selected++
    }
    const share = selected / n
    expect(share).toBeGreaterThan(0.07)
    expect(share).toBeLessThan(0.13)
  })

  it('handles the edges of the rate', () => {
    expect(shouldSelectForAudit('x', 's', 0)).toBe(false)
    expect(shouldSelectForAudit('x', 's', 1)).toBe(true)
    expect(clampSamplingRate(4)).toBe(1)
    expect(clampSamplingRate(-1)).toBe(0)
    expect(clampSamplingRate(Number.NaN)).toBe(0)
  })
})

describe('audit discrepancy classification', () => {
  it('passes within tape tolerance', () => {
    expect(classifyDiscrepancy(14, 14.5)).toEqual({ differenceCm: 0.5, result: 'PASS' })
  })

  it('records a minor discrepancy for small differences', () => {
    expect(classifyDiscrepancy(14, 12)).toEqual({ differenceCm: -2, result: 'MINOR_DISCREPANCY' })
  })

  it('records a major discrepancy when the reading is materially wrong', () => {
    expect(classifyDiscrepancy(14, 9)).toEqual({ differenceCm: -5, result: 'MAJOR_DISCREPANCY' })
  })
})
