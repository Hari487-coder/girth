import type { AppState, Measurement, Tree } from './types'
import { DEMO_YEAR } from './seed'

export function getTree(state: AppState, id: string): Tree | undefined {
  return state.trees.find((t) => t.id === id)
}

/** All measurements for a tree, oldest first. */
export function treeMeasurements(state: AppState, treeId: string): Measurement[] {
  return state.measurements
    .filter((m) => m.treeId === treeId)
    .sort((a, b) => a.seq - b.seq)
}

/** The verified growth history: the only numbers customers ever see. */
export function verifiedHistory(state: AppState, treeId: string): Measurement[] {
  return treeMeasurements(state, treeId).filter((m) => m.status === 'verified')
}

export function latestVerified(state: AppState, treeId: string): Measurement | undefined {
  const history = verifiedHistory(state, treeId)
  return history[history.length - 1]
}

export function currentGirthCm(state: AppState, treeId: string): number {
  return latestVerified(state, treeId)?.girthCm ?? 0
}

/** Growth between the two most recent verified measurements. */
export function lastGrowthCm(state: AppState, treeId: string): number | undefined {
  const history = verifiedHistory(state, treeId)
  if (history.length < 2) return undefined
  return history[history.length - 1].girthCm - history[history.length - 2].girthCm
}

export function treeAge(tree: Tree, state?: AppState): number {
  const lastYear = state
    ? Math.max(
        DEMO_YEAR,
        ...verifiedHistory(state, tree.id).map((m) => Number(m.date.slice(0, 4))),
      )
    : DEMO_YEAR
  return Math.max(0, lastYear - tree.plantedYear)
}

export function pendingMeasurement(state: AppState, treeId: string): Measurement | undefined {
  return treeMeasurements(state, treeId).find((m) => m.status === 'pending')
}

export function pendingQueue(state: AppState): Measurement[] {
  return state.measurements
    .filter((m) => m.status === 'pending')
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function reviewedMeasurements(state: AppState): Measurement[] {
  return state.measurements
    .filter((m) => m.status === 'flagged' || m.status === 'remeasure')
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function sponsorshipFor(state: AppState, treeId: string) {
  return state.sponsorships.find((s) => s.treeId === treeId)
}

/** The next simulated annual growth increment. Deterministic so demos repeat. */
export function nextGrowthIncrement(state: AppState, treeId: string): number {
  const history = verifiedHistory(state, treeId)
  if (history.length === 0) return 3
  if (history.length === 1) return 3
  const lastDelta =
    history[history.length - 1].girthCm - history[history.length - 2].girthCm
  const tree = getTree(state, treeId)
  const age = tree ? history.length : 2
  const trend = age < 5 ? 1 : -1
  return Math.min(6, Math.max(2, lastDelta + trend))
}

export interface FarmSummary {
  farmerId: string
  farmerName: string
  village: string
  trees: Tree[]
  activeCount: number
  growingCount: number
  attentionCount: number
  deadCount: number
  maintenanceInr: number
  growthBonusInr: number
  totalInr: number
}

/** Prototype incentive model: a flat care payment for every living tree plus a
 *  growth bonus for trees that put on girth. Dead trees earn nothing. */
export const INCENTIVE = {
  alivePerTreeInr: 600,
  growthBonusInr: 200,
}

export function farmSummary(state: AppState, farmerId: string): FarmSummary {
  const trees = state.trees.filter((t) => t.farmerId === farmerId)
  const growing = trees.filter((t) => t.status === 'growing')
  const attention = trees.filter((t) => t.status === 'attention')
  const dead = trees.filter((t) => t.status === 'dead')
  const aliveCount = growing.length + attention.length
  const maintenanceInr = aliveCount * INCENTIVE.alivePerTreeInr
  const growthBonusInr = growing.length * INCENTIVE.growthBonusInr
  const first = trees[0]
  return {
    farmerId,
    farmerName: first?.farmerName ?? '',
    village: first?.location ?? '',
    trees,
    activeCount: aliveCount,
    growingCount: growing.length,
    attentionCount: attention.length,
    deadCount: dead.length,
    maintenanceInr,
    growthBonusInr,
    totalInr: maintenanceInr + growthBonusInr,
  }
}
