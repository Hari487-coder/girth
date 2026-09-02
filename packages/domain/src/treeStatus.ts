export const TREE_STATUSES = [
  'PLANNED',
  'PLANTED',
  'ACTIVE',
  'NEEDS_ATTENTION',
  'FLAGGED',
  'DEAD',
  'REPLACED',
  'RETIRED',
] as const

export type TreeStatus = (typeof TREE_STATUSES)[number]

/** Statuses in which the tree is considered alive for reporting and payment. */
export const LIVING_STATUSES: readonly TreeStatus[] = [
  'PLANTED',
  'ACTIVE',
  'NEEDS_ATTENTION',
  'FLAGGED',
]

/** Statuses in which a measurement may be submitted. */
export const MEASURABLE_STATUSES: readonly TreeStatus[] = [
  'PLANTED',
  'ACTIVE',
  'NEEDS_ATTENTION',
  'FLAGGED',
]

const TRANSITIONS: Record<TreeStatus, readonly TreeStatus[]> = {
  PLANNED: ['PLANTED', 'RETIRED'],
  PLANTED: ['ACTIVE', 'NEEDS_ATTENTION', 'FLAGGED', 'DEAD', 'RETIRED'],
  ACTIVE: ['NEEDS_ATTENTION', 'FLAGGED', 'DEAD', 'RETIRED'],
  NEEDS_ATTENTION: ['ACTIVE', 'FLAGGED', 'DEAD', 'RETIRED'],
  FLAGGED: ['ACTIVE', 'NEEDS_ATTENTION', 'DEAD', 'RETIRED'],
  DEAD: ['REPLACED', 'RETIRED'],
  REPLACED: [],
  RETIRED: [],
}

export class TreeStatusError extends Error {
  constructor(
    public readonly from: TreeStatus,
    public readonly to: TreeStatus,
  ) {
    super(`Tree status cannot move from ${from} to ${to}`)
    this.name = 'TreeStatusError'
  }
}

export function canTransition(from: TreeStatus, to: TreeStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function assertTransition(from: TreeStatus, to: TreeStatus): void {
  if (!canTransition(from, to)) throw new TreeStatusError(from, to)
}

export function allowedTransitions(from: TreeStatus): readonly TreeStatus[] {
  return TRANSITIONS[from]
}

export function isAlive(status: TreeStatus): boolean {
  return LIVING_STATUSES.includes(status)
}

export function isMeasurable(status: TreeStatus): boolean {
  return MEASURABLE_STATUSES.includes(status)
}
