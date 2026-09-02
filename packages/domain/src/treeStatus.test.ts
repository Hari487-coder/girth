import { describe, expect, it } from 'vitest'
import {
  TREE_STATUSES,
  TreeStatusError,
  allowedTransitions,
  assertTransition,
  canTransition,
  isAlive,
  isMeasurable,
} from './treeStatus.js'

describe('tree status machine', () => {
  it('follows the planting lifecycle', () => {
    expect(canTransition('PLANNED', 'PLANTED')).toBe(true)
    expect(canTransition('PLANTED', 'ACTIVE')).toBe(true)
    expect(canTransition('ACTIVE', 'NEEDS_ATTENTION')).toBe(true)
    expect(canTransition('NEEDS_ATTENTION', 'ACTIVE')).toBe(true)
    expect(canTransition('ACTIVE', 'DEAD')).toBe(true)
    expect(canTransition('DEAD', 'REPLACED')).toBe(true)
  })

  it('never resurrects a dead tree or reuses a retired one', () => {
    expect(canTransition('DEAD', 'ACTIVE')).toBe(false)
    expect(canTransition('REPLACED', 'ACTIVE')).toBe(false)
    expect(allowedTransitions('RETIRED')).toHaveLength(0)
    expect(() => assertTransition('DEAD', 'ACTIVE')).toThrow(TreeStatusError)
  })

  it('cannot skip planting', () => {
    expect(canTransition('PLANNED', 'ACTIVE')).toBe(false)
    expect(canTransition('PLANNED', 'DEAD')).toBe(false)
  })

  it('knows which statuses count as alive and measurable', () => {
    expect(isAlive('ACTIVE')).toBe(true)
    expect(isAlive('FLAGGED')).toBe(true)
    expect(isAlive('DEAD')).toBe(false)
    expect(isAlive('PLANNED')).toBe(false)
    expect(isMeasurable('PLANNED')).toBe(false)
    expect(isMeasurable('NEEDS_ATTENTION')).toBe(true)
  })

  it('defines transitions for every status', () => {
    for (const status of TREE_STATUSES) {
      expect(Array.isArray(allowedTransitions(status))).toBe(true)
    }
  })
})
