import { describe, expect, it } from 'vitest'
import { formatTreeId, isTreeId, parseTreeId } from './ids.js'
import { growthSummary } from './growth.js'

describe('tree ids', () => {
  it('formats six-digit padded ids', () => {
    expect(formatTreeId(1)).toBe('GIRTH-000001')
    expect(formatTreeId(201)).toBe('GIRTH-000201')
    expect(formatTreeId(1234567)).toBe('GIRTH-1234567')
  })

  it('parses and validates ids', () => {
    expect(parseTreeId('GIRTH-000001')).toBe(1)
    expect(parseTreeId('girth-000042 ')).toBe(42)
    expect(parseTreeId('GIRTH-1')).toBeNull()
    expect(isTreeId('TREE-000001')).toBe(false)
  })

  it('rejects invalid sequences', () => {
    expect(() => formatTreeId(0)).toThrow()
    expect(() => formatTreeId(1.5)).toThrow()
  })
})

describe('growth summary', () => {
  it('summarises a verified history', () => {
    const s = growthSummary([
      { measurementDate: new Date('2024-08-20'), girthCm: 8 },
      { measurementDate: new Date('2026-08-28'), girthCm: 14 },
      { measurementDate: new Date('2025-08-24'), girthCm: 11 },
    ])
    expect(s.currentGirthCm).toBe(14)
    expect(s.firstGirthCm).toBe(8)
    expect(s.totalGrowthCm).toBe(6)
    expect(s.lastGrowthCm).toBe(3)
    expect(s.yearsTracked).toBe(2)
    expect(s.readings).toBe(3)
  })

  it('handles an empty history', () => {
    expect(growthSummary([]).currentGirthCm).toBeNull()
    expect(growthSummary([]).readings).toBe(0)
  })
})
