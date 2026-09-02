/**
 * Random audit selection that is reproducible: the same measurement with the
 * same secret salt always gets the same answer, so a selection can be
 * re-derived during a dispute, while farmers cannot predict it without the salt.
 */
export function auditSelectionScore(measurementId: string, salt: string): number {
  const key = `${salt}:${measurementId}`
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

export function clampSamplingRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0
  return Math.min(1, Math.max(0, rate))
}

export function shouldSelectForAudit(
  measurementId: string,
  salt: string,
  samplingRate: number,
): boolean {
  const rate = clampSamplingRate(samplingRate)
  if (rate === 0) return false
  if (rate === 1) return true
  return auditSelectionScore(measurementId, salt) < rate
}

export type AuditResult = 'PASS' | 'MINOR_DISCREPANCY' | 'MAJOR_DISCREPANCY' | 'FRAUD_SUSPECTED'

export interface DiscrepancyRules {
  /** Absolute difference tolerated as tape variance. */
  minorToleranceCm: number
  /** Beyond this the reading is materially wrong. */
  majorThresholdCm: number
}

export const DEFAULT_DISCREPANCY_RULES: DiscrepancyRules = {
  minorToleranceCm: 1,
  majorThresholdCm: 3,
}

/** Classify what the auditor found against what was reported. */
export function classifyDiscrepancy(
  reportedCm: number,
  observedCm: number,
  rules: DiscrepancyRules = DEFAULT_DISCREPANCY_RULES,
): { differenceCm: number; result: Exclude<AuditResult, 'FRAUD_SUSPECTED'> } {
  const differenceCm = Math.round((observedCm - reportedCm) * 10) / 10
  const abs = Math.abs(differenceCm)
  if (abs <= rules.minorToleranceCm) return { differenceCm, result: 'PASS' }
  if (abs <= rules.majorThresholdCm) return { differenceCm, result: 'MINOR_DISCREPANCY' }
  return { differenceCm, result: 'MAJOR_DISCREPANCY' }
}
