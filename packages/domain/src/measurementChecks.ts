import { haversineMeters, isValidLatLng } from './geo.js'
import { isMeasurable, type TreeStatus } from './treeStatus.js'

export interface CheckRules {
  /** Girth is measured at a standard height above ground. */
  standardHeightCm: number
  heightToleranceCm: number
  minGirthCm: number
  maxGirthCm: number
  /** Measurement location must be within this distance of the tree. */
  maxDistanceFromTreeM: number
  /** Beyond this annual gain the reading is an anomaly, not a rejection. */
  maxAnnualGrowthCm: number
  /** Girth rarely shrinks; small tape variance is tolerated. */
  maxShrinkCm: number
  /** Readings dated further in the future than this are input errors. */
  maxFutureDays: number
}

export const DEFAULT_CHECK_RULES: CheckRules = {
  standardHeightCm: 130,
  heightToleranceCm: 20,
  minGirthCm: 0.5,
  maxGirthCm: 600,
  maxDistanceFromTreeM: 150,
  maxAnnualGrowthCm: 15,
  maxShrinkCm: 1,
  maxFutureDays: 1,
}

export type CheckSeverity = 'INFO' | 'WARN' | 'FAIL'

export interface CheckResult {
  key: string
  passed: boolean
  severity: CheckSeverity
  detail: string
}

export interface CheckInput {
  tree: {
    publicId: string
    status: TreeStatus
    plantingDate?: Date | null
    latitude?: number | null
    longitude?: number | null
  }
  /** The most recent VERIFIED measurement, if any. */
  previous?: { girthCm: number; measurementDate: Date } | null
  submission: {
    measurementDate: Date
    measurementHeightCm: number
    girthCm: number
    latitude?: number | null
    longitude?: number | null
    hasPhoto: boolean
    submittedAt: Date
  }
  /** Another measurement already exists for this tree on this date. */
  duplicateOfDate?: boolean
  rules?: Partial<CheckRules>
}

export interface CheckOutcome {
  checks: CheckResult[]
  /** At least one FAIL: the submission is rejected as an input error. */
  hardFailure: boolean
  /** At least one WARN: accepted, but a human must look before it counts. */
  anomaly: boolean
  /** Distance between measurement and tree location, when both are known. */
  distanceFromTreeM: number | null
  summary: string
}

const DAY_MS = 86_400_000

/**
 * Automated checks find anomalies; they never prove a reading is true.
 * FAIL means the submission cannot be accepted as entered. WARN means it is
 * accepted and routed to a human with the anomaly called out.
 */
export function runMeasurementChecks(input: CheckInput): CheckOutcome {
  const rules: CheckRules = { ...DEFAULT_CHECK_RULES, ...input.rules }
  const { tree, previous, submission } = input
  const checks: CheckResult[] = []
  let distanceFromTreeM: number | null = null

  const pass = (key: string, detail: string) =>
    checks.push({ key, passed: true, severity: 'INFO', detail })
  const warn = (key: string, detail: string) =>
    checks.push({ key, passed: false, severity: 'WARN', detail })
  const fail = (key: string, detail: string) =>
    checks.push({ key, passed: false, severity: 'FAIL', detail })

  // 1. Tree must be in a measurable state
  if (isMeasurable(tree.status)) {
    pass('tree_status', `Tree ${tree.publicId} is ${tree.status}`)
  } else {
    fail('tree_status', `Tree ${tree.publicId} is ${tree.status} and cannot be measured`)
  }

  // 2. Date validity
  const futureLimit = submission.submittedAt.getTime() + rules.maxFutureDays * DAY_MS
  if (submission.measurementDate.getTime() > futureLimit) {
    fail('date_valid', 'Measurement date is in the future')
  } else if (tree.plantingDate && submission.measurementDate < tree.plantingDate) {
    fail('date_valid', 'Measurement date is before the planting date')
  } else if (previous && submission.measurementDate < previous.measurementDate) {
    warn('date_valid', 'Measurement is dated before the last verified measurement')
  } else {
    pass('date_valid', 'Measurement date is valid')
  }

  // 3. Height at which girth was taken
  if (!(submission.measurementHeightCm > 0)) {
    fail('height_present', 'Measurement height is missing')
  } else if (
    Math.abs(submission.measurementHeightCm - rules.standardHeightCm) > rules.heightToleranceCm
  ) {
    warn(
      'height_standard',
      `Measured at ${submission.measurementHeightCm} cm; standard height is ${rules.standardHeightCm} cm`,
    )
  } else {
    pass('height_standard', `Measured at ${submission.measurementHeightCm} cm (standard height)`)
  }

  // 4. Girth within physical limits
  if (
    !Number.isFinite(submission.girthCm) ||
    submission.girthCm < rules.minGirthCm ||
    submission.girthCm > rules.maxGirthCm
  ) {
    fail('girth_plausible', `Girth ${submission.girthCm} cm is outside plausible limits`)
  } else {
    pass('girth_plausible', `Girth ${submission.girthCm} cm is within plausible limits`)
  }

  // 5. Location proximity
  const here = { latitude: submission.latitude, longitude: submission.longitude }
  const there = { latitude: tree.latitude, longitude: tree.longitude }
  if (isValidLatLng(here) && isValidLatLng(there)) {
    distanceFromTreeM = Math.round(haversineMeters(here, there))
    if (distanceFromTreeM > rules.maxDistanceFromTreeM) {
      warn(
        'location_near_tree',
        `Potential anomaly: measured ${distanceFromTreeM} m from the tree's registered location`,
      )
    } else {
      pass('location_near_tree', `Measured ${distanceFromTreeM} m from the tree's registered location`)
    }
  } else if (isValidLatLng(here)) {
    pass('location_near_tree', 'Location captured; tree has no registered location to compare')
  } else {
    warn('location_near_tree', 'No location captured with this measurement')
  }

  // 6. Photo evidence
  if (submission.hasPhoto) {
    pass('photo_present', 'Photo evidence attached')
  } else {
    warn('photo_present', 'No photo attached: evidence is incomplete')
  }

  // 7. Duplicate submission
  if (input.duplicateOfDate) {
    fail('duplicate', 'A measurement for this tree already exists on this date')
  } else {
    pass('duplicate', 'No duplicate submission for this date')
  }

  // 8. Growth plausibility against the last verified reading
  if (previous) {
    const deltaCm = round1(submission.girthCm - previous.girthCm)
    const elapsedYears = Math.max(
      0.25,
      (submission.measurementDate.getTime() - previous.measurementDate.getTime()) / (365.25 * DAY_MS),
    )
    const maxGain = round1(rules.maxAnnualGrowthCm * elapsedYears)
    if (deltaCm < -rules.maxShrinkCm) {
      warn(
        'growth_plausible',
        `Potential anomaly: girth shrank by ${Math.abs(deltaCm)} cm since ${previous.girthCm} cm`,
      )
    } else if (deltaCm > maxGain) {
      warn(
        'growth_plausible',
        `Potential anomaly: +${deltaCm} cm in ${round1(elapsedYears)} years exceeds the expected maximum of ${maxGain} cm`,
      )
    } else {
      pass('growth_plausible', `${deltaCm >= 0 ? '+' : ''}${deltaCm} cm since the last verified reading`)
    }
  } else {
    pass('growth_plausible', 'First reading for this tree; nothing to compare against')
  }

  const hardFailure = checks.some((c) => c.severity === 'FAIL')
  const anomaly = checks.some((c) => c.severity === 'WARN')
  const failed = checks.filter((c) => !c.passed)
  const summary = hardFailure
    ? `Rejected: ${failed.filter((c) => c.severity === 'FAIL').map((c) => c.detail).join('; ')}`
    : anomaly
      ? `Needs attention: ${failed.map((c) => c.detail).join('; ')}`
      : 'All automated checks passed'

  return { checks, hardFailure, anomaly, distanceFromTreeM, summary }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
