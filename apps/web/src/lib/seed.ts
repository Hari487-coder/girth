import type { AppState, Measurement, Occasion, Tree, TreeStatus } from './types'

export const DEMO_YEAR = 2026

export const FARMERS = {
  ravi: { id: 'F-01', name: 'Ravi Kumar', village: 'Sangareddy, Telangana' },
  lakshmamma: { id: 'F-02', name: 'Lakshmamma Gari', village: 'Medak, Telangana' },
} as const

/** Deterministic pseudo-random in [0, 1) so the demo data is stable across reloads. */
export function seededRandom(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

interface TreeSpec {
  n: number
  species: string
  plantedYear: number
  farmer: keyof typeof FARMERS
  priceInr: number
  status: TreeStatus
  occasions: Occasion[]
  available: boolean
  /** verified girth per year, starting at plantedYear */
  girths: number[]
  /** an unverified measurement waiting in the queue, dated this year */
  pendingGirthCm?: number
}

const SPECS: TreeSpec[] = [
  {
    n: 1,
    species: 'Mango',
    plantedYear: 2024,
    farmer: 'ravi',
    priceInr: 2500,
    status: 'growing',
    occasions: ['Birthday', 'New baby', 'Just because'],
    available: true,
    girths: [8, 11, 14],
  },
  {
    n: 2,
    species: 'Custard Apple',
    plantedYear: 2025,
    farmer: 'ravi',
    priceInr: 2000,
    status: 'growing',
    occasions: ['Birthday', 'Just because'],
    available: true,
    girths: [7, 11],
  },
  {
    n: 3,
    species: 'Teak',
    plantedYear: 2023,
    farmer: 'lakshmamma',
    priceInr: 3500,
    status: 'growing',
    occasions: ['Wedding', 'Housewarming'],
    available: true,
    girths: [6, 9, 13, 17],
  },
  {
    n: 4,
    species: 'Neem',
    plantedYear: 2024,
    farmer: 'ravi',
    priceInr: 2500,
    status: 'growing',
    occasions: ['Housewarming', 'Just because'],
    available: true,
    girths: [9, 13],
    pendingGirthCm: 18,
  },
  {
    n: 5,
    species: 'Tamarind',
    plantedYear: 2023,
    farmer: 'lakshmamma',
    priceInr: 3500,
    status: 'growing',
    occasions: ['Wedding', 'Memorial'],
    available: true,
    girths: [7, 10, 15, 19],
  },
  {
    n: 6,
    species: 'Guava',
    plantedYear: 2025,
    farmer: 'ravi',
    priceInr: 2000,
    status: 'growing',
    occasions: ['New baby', 'Birthday'],
    available: true,
    girths: [6, 9],
  },
  {
    n: 7,
    species: 'Jamun',
    plantedYear: 2024,
    farmer: 'ravi',
    priceInr: 2500,
    status: 'growing',
    occasions: ['Memorial', 'Just because'],
    available: true,
    girths: [8, 12],
    pendingGirthCm: 15,
  },
  {
    n: 8,
    species: 'Amla',
    plantedYear: 2025,
    farmer: 'lakshmamma',
    priceInr: 2000,
    status: 'growing',
    occasions: ['Housewarming', 'Just because'],
    available: true,
    girths: [5, 8],
  },
  {
    n: 9,
    species: 'Pongamia',
    plantedYear: 2023,
    farmer: 'lakshmamma',
    priceInr: 3500,
    status: 'growing',
    occasions: ['Memorial', 'Just because'],
    available: true,
    girths: [8, 12, 16, 20],
  },
  // Trees on Ravi's farm that are not open for sponsorship. They make the
  // farmer portal and its incentive math real instead of a hand-typed summary.
  {
    n: 14,
    species: 'Custard Apple',
    plantedYear: 2023,
    farmer: 'ravi',
    priceInr: 2000,
    status: 'attention',
    occasions: ['Just because'],
    available: false,
    girths: [6, 9, 12, 12],
  },
  {
    n: 19,
    species: 'Neem',
    plantedYear: 2025,
    farmer: 'ravi',
    priceInr: 2000,
    status: 'attention',
    occasions: ['Just because'],
    available: false,
    girths: [7, 8],
  },
  {
    n: 24,
    species: 'Guava',
    plantedYear: 2023,
    farmer: 'ravi',
    priceInr: 2000,
    status: 'dead',
    occasions: ['Just because'],
    available: false,
    girths: [5, 8, 9],
  },
]

const FILLER_SPECIES = ['Neem', 'Mango', 'Jamun', 'Pongamia', 'Tamarind', 'Guava', 'Custard Apple']

/**
 * Ravi's farm should hold 23 living trees (21 growing + 2 needing attention)
 * plus 1 dead tree, so the portal numbers are derived rather than asserted.
 * The specs above give him 5 marketplace trees, 2 attention trees and 1 dead
 * tree; the remaining 16 growing trees are generated here deterministically.
 */
function fillerSpecs(): TreeSpec[] {
  const taken = new Set(SPECS.map((s) => s.n))
  const out: TreeSpec[] = []
  let n = 10
  while (out.length < 16) {
    while (taken.has(n)) n++
    const key = `filler-${n}`
    const species = FILLER_SPECIES[n % FILLER_SPECIES.length]
    const plantedYear = 2023 + (n % 3)
    const years = DEMO_YEAR - plantedYear + 1
    const girths: number[] = []
    let girth = 5 + Math.floor(seededRandom(`${key}-base`) * 5)
    for (let y = 0; y < years; y++) {
      if (y > 0) girth += 2 + Math.floor(seededRandom(`${key}-y${y}`) * 4)
      girths.push(girth)
    }
    out.push({
      n,
      species,
      plantedYear,
      farmer: 'ravi',
      priceInr: plantedYear === 2023 ? 3500 : plantedYear === 2024 ? 2500 : 2000,
      status: 'growing',
      occasions: ['Just because'],
      available: false,
      girths,
    })
    taken.add(n)
    n++
  }
  return out
}

function treeId(n: number): string {
  return `GIRTH-${String(n).padStart(3, '0')}`
}

/** Annual measurements land in the field season; day varies a little per tree. */
function measurementDate(n: number, year: number, seq: number): string {
  if (year === DEMO_YEAR) {
    const day = 28 - ((n - 1) % 9)
    return `${year}-08-${String(day).padStart(2, '0')}`
  }
  const day = 14 + ((n * 3 + seq) % 12)
  return `${year}-08-${String(day).padStart(2, '0')}`
}

export function buildSeedState(): AppState {
  const specs = [...SPECS, ...fillerSpecs()].sort((a, b) => a.n - b.n)
  const trees: Tree[] = []
  const measurements: Measurement[] = []

  for (const spec of specs) {
    const id = treeId(spec.n)
    const farmer = FARMERS[spec.farmer]
    trees.push({
      id,
      species: spec.species,
      plantedYear: spec.plantedYear,
      location: farmer.village,
      farmerId: farmer.id,
      farmerName: farmer.name,
      priceInr: spec.priceInr,
      status: spec.status,
      occasions: spec.occasions,
      available: spec.available,
    })

    spec.girths.forEach((girthCm, i) => {
      const year = spec.plantedYear + i
      // A dead tree has no measurement in the demo year: it stopped growing.
      if (spec.status === 'dead' && year >= DEMO_YEAR) return
      measurements.push({
        id: `${id}-M${String(i + 1).padStart(2, '0')}`,
        treeId: id,
        seq: i + 1,
        date: measurementDate(spec.n, year, i + 1),
        girthCm,
        submittedBy: farmer.name,
        status: 'verified',
      })
    })

    if (spec.pendingGirthCm) {
      const seq = spec.girths.length + 1
      measurements.push({
        id: `${id}-M${String(seq).padStart(2, '0')}`,
        treeId: id,
        seq,
        date: measurementDate(spec.n, DEMO_YEAR, seq),
        girthCm: spec.pendingGirthCm,
        submittedBy: farmer.name,
        status: 'pending',
      })
    }
  }

  return { version: 1, trees, measurements, sponsorships: [] }
}
