/** Response shapes from the Girth API that the pages depend on. */

export type TreeStatus = 'PLANNED' | 'PLANTED' | 'ACTIVE' | 'NEEDS_ATTENTION' | 'FLAGGED' | 'DEAD' | 'REPLACED' | 'RETIRED'
export type MeasurementStatus = 'SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'FLAGGED' | 'REMEASURE_REQUIRED' | 'SUPERSEDED'
export type LedgerStatus = 'ELIGIBLE' | 'APPROVED' | 'PAID' | 'CANCELLED'
export type SponsorshipStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
export type AuditResult = 'PENDING' | 'PASS' | 'MINOR_DISCREPANCY' | 'MAJOR_DISCREPANCY' | 'FRAUD_SUSPECTED'

export interface AvailableTree {
  publicId: string
  species: string
  status: TreeStatus
  location: string | null
  plantingYear: number | null
  currentGirthCm: number | null
  lastGrowthCm: number | null
  totalGrowthCm: number | null
  verifiedReadings: number
  lastVerifiedAt: string | null
}

export interface AvailableTreesResponse {
  pricePaise: number
  termYears: number
  trees: AvailableTree[]
}

export interface PublicTreeProfile {
  publicId: string
  species: string
  variety: string | null
  status: TreeStatus
  statusLabel: string
  alive: boolean
  location: string | null
  plantingYear: number | null
  currentGirthCm: number | null
  currentGirthDate: string | null
  growth: { totalCm: number | null; lastCm: number | null; yearsTracked: number | null; verifiedReadings: number }
  timeline: { date: string; girthCm: number; verifiedAt: string | null; photoUrl: string | null }[]
  latestVerification: {
    date: string
    girthCm: number
    measurementHeightCm: number
    verifiedAt: string | null
    audited: boolean
    photoUrl: string | null
  } | null
  replacementFor: { publicId: string; status: TreeStatus; species: string } | null
  replacedBy: { publicId: string; status: TreeStatus; species: string; plantingDate: string | null } | null
  sponsorship: { treeName: string; message: string | null; occasion: string } | null
}

export interface Tree {
  id: string
  publicId: string
  species: string
  variety: string | null
  status: TreeStatus
  ownershipStatus: string
  plantingDate: string | null
  latitude: number | null
  longitude: number | null
  currentGirthCm: number | null
  currentGirthDate: string | null
  clusterId: string | null
  farmerId: string | null
  organisationId: string | null
  landPlotId: string | null
  replacementForId: string | null
  tags?: { id: string; tagCode: string; status: string; attachedAt: string }[]
  createdAt: string
}

export interface Check {
  key: string
  passed: boolean
  severity: 'INFO' | 'WARN' | 'FAIL'
  detail: string
}

export interface Photo {
  id: string
  thumbnailUrl: string
  originalUrl: string
  isPublic: boolean
  uploadedAt: string
}

export interface Measurement {
  id: string
  treeId: string
  submittedById: string
  submittedAt: string
  measurementDate: string
  measurementHeightCm: number
  girthCm: number
  latitude: number | null
  longitude: number | null
  distanceFromTreeM: number | null
  verificationStatus: MeasurementStatus
  anomaly: boolean
  verifiedAt: string | null
  verificationNotes: string | null
  auditStatus: string
  notes: string | null
  checks?: Check[]
  photos?: Photo[]
}

export interface QueueItem extends Measurement {
  tree: { publicId: string; species: string; status: TreeStatus; currentGirthCm: number | null }
  submittedBy: { name: string; role: string }
}

export interface FarmSummary {
  farmer: { id: string; legalName: string; village: string; district: string; state: string; preferredLanguage: string }
  trees: number
  registered: number
  alive: number
  dead: number
  needsAttention: number
  verified: number
  pending: number
  survivalPct: number | null
  verifiedPct: number | null
  averageGrowthCm: number | null
  payments: { pendingPaise: number; paidPaise: number }
}

export interface LedgerEntry {
  id: string
  tree: { publicId: string; species: string } | null
  measurementId: string | null
  amountPaise: number
  currency: string
  reason: string
  description: string
  status: LedgerStatus
  createdAt: string
  paidAt: string | null
  externalPaymentId: string | null
}

export interface PaymentSummary {
  pendingPaise: number
  paidPaise: number
  entries: LedgerEntry[]
}

export interface SponsoredTree {
  sponsorshipId: string
  status: SponsorshipStatus
  treeName: string
  message: string | null
  occasion: string
  startsAt: string
  endsAt: string | null
  tree: { publicId: string; species: string; status: TreeStatus }
  currentGirthCm: number | null
  growthSinceSponsorshipCm: number | null
  lastVerifiedAt: string | null
  verifiedReadings: number
}

export interface Audit {
  id: string
  measurementId: string
  treeId: string
  auditorId: string | null
  scheduledAt: string
  performedAt: string | null
  reportedGirthCm: number
  observedGirthCm: number | null
  observedStatus: TreeStatus | null
  differenceCm: number | null
  result: AuditResult
  notes: string | null
  tree: { publicId: string; species: string; status: TreeStatus }
  measurement: { measurementDate: string; girthCm: number; verificationStatus: MeasurementStatus }
  photos: Photo[]
}

export interface Farmer {
  id: string
  userId: string
  legalName: string
  phone: string
  village: string
  district: string
  state: string
  preferredLanguage: string
  contractStatus: string
  _count?: { trees: number }
}

export interface Cluster {
  id: string
  name: string
  locationLabel: string
  organisationId: string | null
  programId: string | null
  _count?: { trees: number }
}

export interface PaymentConfig {
  id: string
  name: string
  currency: string
  basePaise: number
  survivalPaise: number
  growthBonusPaise: number
  minGrowthCmForBonus: number
  deadPaise: number
  penaltyPaise: number
  replacementRule: string
  label: string
  createdAt: string
}

export interface Setting {
  key: string
  value: string
  description: string
  isDefault: boolean
  updatedAt: string | null
}

export interface Experiment {
  id: string
  code: string
  hypothesis: string
  assumption: string | null
  targetAudience: string | null
  experiment: string
  metric: string
  target: string | null
  result: string | null
  status: 'PLANNED' | 'RUNNING' | 'LEARNING' | 'DECIDED'
  learning: string | null
  decision: 'PERSEVERE' | 'PIVOT' | 'STOP' | null
}

export interface ProgramOverview {
  program: { id: string; name: string; status: string; organisation: { id: string; name: string }; clusters: { id: string; name: string }[] }
  trees: number
  registered: number
  alive: number
  dead: number
  needsAttention: number
  verified: number
  pending: number
  survivalPct: number | null
  verifiedPct: number | null
  averageGrowthCm: number | null
  farmers: number
  audits: number
  auditDiscrepancyPct: number | null
}
