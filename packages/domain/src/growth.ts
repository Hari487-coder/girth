export interface VerifiedPoint {
  measurementDate: Date
  girthCm: number
}

export interface GrowthSummary {
  currentGirthCm: number | null
  firstGirthCm: number | null
  totalGrowthCm: number | null
  lastGrowthCm: number | null
  yearsTracked: number | null
  lastVerifiedAt: Date | null
  readings: number
}

const YEAR_MS = 365.25 * 86_400_000

export function yearsBetween(from: Date, to: Date): number {
  return Math.round(((to.getTime() - from.getTime()) / YEAR_MS) * 10) / 10
}

/** Summarise a verified history, oldest to newest. */
export function growthSummary(points: readonly VerifiedPoint[]): GrowthSummary {
  const sorted = [...points].sort(
    (a, b) => a.measurementDate.getTime() - b.measurementDate.getTime(),
  )
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  if (!first || !last) {
    return {
      currentGirthCm: null,
      firstGirthCm: null,
      totalGrowthCm: null,
      lastGrowthCm: null,
      yearsTracked: null,
      lastVerifiedAt: null,
      readings: 0,
    }
  }
  return {
    currentGirthCm: last.girthCm,
    firstGirthCm: first.girthCm,
    totalGrowthCm: sorted.length > 1 ? round1(last.girthCm - first.girthCm) : null,
    lastGrowthCm: prev ? round1(last.girthCm - prev.girthCm) : null,
    yearsTracked: yearsBetween(first.measurementDate, last.measurementDate),
    lastVerifiedAt: last.measurementDate,
    readings: sorted.length,
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
