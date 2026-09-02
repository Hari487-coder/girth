import { describe, expect, it } from 'vitest'
import { runMeasurementChecks, type CheckInput } from './measurementChecks.js'

const tree = {
  publicId: 'GIRTH-000001',
  status: 'ACTIVE' as const,
  plantingDate: new Date('2024-07-01'),
  latitude: 17.5947,
  longitude: 78.1223,
}

function submission(overrides: Partial<CheckInput['submission']> = {}): CheckInput['submission'] {
  return {
    measurementDate: new Date('2026-08-28'),
    measurementHeightCm: 130,
    girthCm: 14,
    latitude: 17.5948,
    longitude: 78.1224,
    hasPhoto: true,
    submittedAt: new Date('2026-08-28T10:00:00Z'),
    ...overrides,
  }
}

const previous = { girthCm: 11, measurementDate: new Date('2025-08-25') }

describe('automated measurement checks', () => {
  it('passes a clean reading with no anomalies', () => {
    const out = runMeasurementChecks({ tree, previous, submission: submission() })
    expect(out.hardFailure).toBe(false)
    expect(out.anomaly).toBe(false)
    expect(out.distanceFromTreeM).toBeLessThan(20)
    expect(out.checks.every((c) => c.passed)).toBe(true)
  })

  it('flags implausible growth as an anomaly rather than rejecting it', () => {
    const out = runMeasurementChecks({
      tree,
      previous: { girthCm: 10, measurementDate: new Date('2025-08-25') },
      submission: submission({ girthCm: 35 }),
    })
    expect(out.hardFailure).toBe(false)
    expect(out.anomaly).toBe(true)
    const growth = out.checks.find((c) => c.key === 'growth_plausible')
    expect(growth?.severity).toBe('WARN')
    expect(growth?.detail).toContain('Potential anomaly')
  })

  it('flags shrinkage beyond tape tolerance', () => {
    const out = runMeasurementChecks({ tree, previous, submission: submission({ girthCm: 9 }) })
    expect(out.anomaly).toBe(true)
    expect(out.checks.find((c) => c.key === 'growth_plausible')?.detail).toContain('shrank')
  })

  it('tolerates a centimetre of shrink as tape variance', () => {
    const out = runMeasurementChecks({ tree, previous, submission: submission({ girthCm: 10.5 }) })
    expect(out.checks.find((c) => c.key === 'growth_plausible')?.passed).toBe(true)
  })

  it('warns when the reading was taken far from the tree', () => {
    const out = runMeasurementChecks({
      tree,
      previous,
      submission: submission({ latitude: 17.6, longitude: 78.13 }),
    })
    expect(out.anomaly).toBe(true)
    expect(out.distanceFromTreeM).toBeGreaterThan(150)
  })

  it('warns, not rejects, when the photo is missing', () => {
    const out = runMeasurementChecks({ tree, previous, submission: submission({ hasPhoto: false }) })
    expect(out.hardFailure).toBe(false)
    expect(out.checks.find((c) => c.key === 'photo_present')?.severity).toBe('WARN')
  })

  it('rejects a reading for a dead tree', () => {
    const out = runMeasurementChecks({
      tree: { ...tree, status: 'DEAD' },
      previous,
      submission: submission(),
    })
    expect(out.hardFailure).toBe(true)
    expect(out.summary).toContain('Rejected')
  })

  it('rejects future-dated, pre-planting and duplicate readings', () => {
    expect(
      runMeasurementChecks({
        tree,
        submission: submission({ measurementDate: new Date('2027-01-01') }),
      }).hardFailure,
    ).toBe(true)
    expect(
      runMeasurementChecks({
        tree,
        submission: submission({ measurementDate: new Date('2023-01-01') }),
      }).hardFailure,
    ).toBe(true)
    expect(
      runMeasurementChecks({ tree, submission: submission(), duplicateOfDate: true }).hardFailure,
    ).toBe(true)
  })

  it('rejects impossible girth values', () => {
    expect(runMeasurementChecks({ tree, submission: submission({ girthCm: 0 }) }).hardFailure).toBe(true)
    expect(runMeasurementChecks({ tree, submission: submission({ girthCm: 900 }) }).hardFailure).toBe(true)
  })

  it('warns when measured away from the standard height', () => {
    const out = runMeasurementChecks({ tree, submission: submission({ measurementHeightCm: 60 }) })
    expect(out.checks.find((c) => c.key === 'height_standard')?.severity).toBe('WARN')
  })
})
