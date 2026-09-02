export type TreeStatus = 'growing' | 'attention' | 'dead'

export type MeasurementStatus = 'pending' | 'verified' | 'flagged' | 'remeasure'

export type Occasion =
  | 'Birthday'
  | 'Wedding'
  | 'New baby'
  | 'Housewarming'
  | 'Memorial'
  | 'Just because'

export interface Measurement {
  id: string
  treeId: string
  /** 1-based sequence number within the tree's history */
  seq: number
  /** ISO date, e.g. 2026-08-28 */
  date: string
  girthCm: number
  submittedBy: string
  status: MeasurementStatus
  /** true when created by the "See next year's growth" demo action */
  simulated?: boolean
}

export interface Tree {
  id: string
  species: string
  plantedYear: number
  location: string
  farmerId: string
  farmerName: string
  priceInr: number
  status: TreeStatus
  occasions: Occasion[]
  /** listed in the marketplace and open for sponsorship */
  available: boolean
}

export interface Sponsorship {
  treeId: string
  occasion: Occasion
  planInr: number
  name: string
  message: string
  /** ISO date */
  sponsoredAt: string
  girthAtSponsorshipCm: number
}

export interface AppState {
  version: number
  trees: Tree[]
  measurements: Measurement[]
  sponsorships: Sponsorship[]
}

export type Action =
  | { type: 'SPONSOR'; sponsorship: Sponsorship }
  | { type: 'SIMULATE_GROWTH'; treeId: string }
  | {
      type: 'SUBMIT_MEASUREMENT'
      treeId: string
      date: string
      girthCm: number
      submittedBy: string
    }
  | {
      type: 'REVIEW_MEASUREMENT'
      measurementId: string
      decision: 'verified' | 'flagged' | 'remeasure' | 'pending'
    }
  | { type: 'RESET' }
