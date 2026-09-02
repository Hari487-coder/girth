import { createContext, useContext, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { Action, AppState, Measurement } from './types'
import { buildSeedState, DEMO_YEAR } from './seed'
import { nextGrowthIncrement, verifiedHistory } from './selectors'

const STORAGE_KEY = 'girth-demo-state'
const STATE_VERSION = 1

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (
        parsed &&
        parsed.version === STATE_VERSION &&
        Array.isArray(parsed.trees) &&
        Array.isArray(parsed.measurements) &&
        Array.isArray(parsed.sponsorships)
      ) {
        return parsed
      }
    }
  } catch {
    // Corrupt or inaccessible storage: fall through to a fresh seed.
  }
  return buildSeedState()
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SPONSOR': {
      if (state.sponsorships.some((s) => s.treeId === action.sponsorship.treeId)) {
        return state
      }
      return { ...state, sponsorships: [...state.sponsorships, action.sponsorship] }
    }

    case 'SIMULATE_GROWTH': {
      const history = verifiedHistory(state, action.treeId)
      const last = history[history.length - 1]
      if (!last) return state
      const lastYear = Number(last.date.slice(0, 4))
      const nextYear = Math.max(lastYear + 1, DEMO_YEAR + 1)
      const seq =
        Math.max(
          0,
          ...state.measurements.filter((m) => m.treeId === action.treeId).map((m) => m.seq),
        ) + 1
      const measurement: Measurement = {
        id: `${action.treeId}-M${String(seq).padStart(2, '0')}`,
        treeId: action.treeId,
        seq,
        date: `${nextYear}-08-${last.date.slice(8, 10)}`,
        girthCm: last.girthCm + nextGrowthIncrement(state, action.treeId),
        submittedBy: state.trees.find((t) => t.id === action.treeId)?.farmerName ?? 'Farmer',
        status: 'verified',
        simulated: true,
      }
      return { ...state, measurements: [...state.measurements, measurement] }
    }

    case 'SUBMIT_MEASUREMENT': {
      const alreadyPending = state.measurements.some(
        (m) => m.treeId === action.treeId && m.status === 'pending',
      )
      if (alreadyPending) return state
      const seq =
        Math.max(
          0,
          ...state.measurements.filter((m) => m.treeId === action.treeId).map((m) => m.seq),
        ) + 1
      const measurement: Measurement = {
        id: `${action.treeId}-M${String(seq).padStart(2, '0')}`,
        treeId: action.treeId,
        seq,
        date: action.date,
        girthCm: action.girthCm,
        submittedBy: action.submittedBy,
        status: 'pending',
      }
      return { ...state, measurements: [...state.measurements, measurement] }
    }

    case 'REVIEW_MEASUREMENT': {
      return {
        ...state,
        measurements: state.measurements.map((m) =>
          m.id === action.measurementId ? { ...m, status: action.decision } : m,
        ),
      }
    }

    case 'RESET':
      return buildSeedState()

    default:
      return state
  }
}

interface StoreValue {
  state: AppState
  dispatch: (action: Action) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or blocked: the demo still works, it just won't persist.
    }
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
