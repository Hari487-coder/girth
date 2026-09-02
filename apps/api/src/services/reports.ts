import { isAlive } from '@girth/domain'
import type { Db } from '../lib/prisma.js'
import { notFound } from '../lib/errors.js'
import { decimalToNumber } from '../lib/prisma.js'
import { farmerPaymentSummary } from './payments.js'

type TreeForReport = {
  id: string
  publicId: string
  species: string
  status: string
  plantingDate: Date | null
  currentGirthCm: { toNumber(): number } | null
  currentGirthDate: Date | null
  measurements: { verificationStatus: string; measurementDate: Date; girthCm: { toNumber(): number } }[]
}

function summariseTrees(trees: TreeForReport[]) {
  const registered = trees.filter((t) => t.status !== 'PLANNED')
  const alive = registered.filter((t) => isAlive(t.status as never))
  const dead = registered.filter((t) => t.status === 'DEAD' || t.status === 'REPLACED')
  const attention = registered.filter((t) => t.status === 'NEEDS_ATTENTION' || t.status === 'FLAGGED')
  const verified = registered.filter((t) => t.measurements.some((m) => m.verificationStatus === 'VERIFIED'))
  const pending = registered.filter((t) => t.measurements.some((m) => m.verificationStatus === 'PENDING_REVIEW'))
  const growths = registered
    .map((t) => {
      const v = t.measurements
        .filter((m) => m.verificationStatus === 'VERIFIED')
        .sort((a, b) => a.measurementDate.getTime() - b.measurementDate.getTime())
      const first = v[0]
      const last = v[v.length - 1]
      return first && last && v.length > 1 ? last.girthCm.toNumber() - first.girthCm.toNumber() : null
    })
    .filter((g): g is number => g !== null)
  const denominator = registered.length - trees.filter((t) => t.status === 'RETIRED').length
  return {
    trees: trees.length,
    registered: registered.length,
    alive: alive.length,
    dead: dead.length,
    needsAttention: attention.length,
    verified: verified.length,
    pending: pending.length,
    survivalPct: denominator > 0 ? Math.round((alive.length / denominator) * 1000) / 10 : null,
    verifiedPct: registered.length > 0 ? Math.round((verified.length / registered.length) * 1000) / 10 : null,
    averageGrowthCm: growths.length ? Math.round((growths.reduce((a, b) => a + b, 0) / growths.length) * 10) / 10 : null,
  }
}

const TREE_REPORT_INCLUDE = {
  measurements: { select: { verificationStatus: true, measurementDate: true, girthCm: true } },
} as const

export async function programOverview(db: Db, programId: string) {
  const program = await db.program.findUnique({
    where: { id: programId },
    include: { organisation: { select: { id: true, name: true } }, clusters: { select: { id: true, name: true } } },
  })
  if (!program) throw notFound('Program not found')
  const trees = await db.tree.findMany({
    where: { clusterId: { in: program.clusters.map((c) => c.id) } },
    include: TREE_REPORT_INCLUDE,
  })
  const farmers = new Set(trees.map((t) => (t as { farmerId?: string | null }).farmerId).filter(Boolean))
  const audits = await db.audit.findMany({ where: { treeId: { in: trees.map((t) => t.id) } } })
  const discrepancies = audits.filter((a) => a.result === 'MAJOR_DISCREPANCY' || a.result === 'FRAUD_SUSPECTED')
  return {
    program: {
      id: program.id,
      name: program.name,
      status: program.status,
      organisation: program.organisation,
      clusters: program.clusters,
    },
    ...summariseTrees(trees),
    farmers: farmers.size,
    audits: audits.length,
    auditDiscrepancyPct: audits.length ? Math.round((discrepancies.length / audits.length) * 1000) / 10 : null,
  }
}

export async function programTreesCsv(db: Db, programId: string): Promise<string> {
  const program = await db.program.findUnique({ where: { id: programId }, include: { clusters: true } })
  if (!program) throw notFound('Program not found')
  const trees = await db.tree.findMany({
    where: { clusterId: { in: program.clusters.map((c) => c.id) } },
    orderBy: { seq: 'asc' },
    include: { ...TREE_REPORT_INCLUDE, cluster: { select: { name: true } } },
  })
  const header = [
    'tree_id',
    'species',
    'status',
    'alive',
    'cluster',
    'planting_date',
    'verified_readings',
    'first_verified_girth_cm',
    'current_verified_girth_cm',
    'current_girth_date',
    'growth_cm',
  ]
  const rows = trees.map((t) => {
    const v = t.measurements
      .filter((m) => m.verificationStatus === 'VERIFIED')
      .sort((a, b) => a.measurementDate.getTime() - b.measurementDate.getTime())
    const first = v[0]?.girthCm.toNumber() ?? ''
    const current = decimalToNumber(t.currentGirthCm) ?? ''
    const growth = first !== '' && current !== '' && v.length > 1 ? (current as number) - (first as number) : ''
    return [
      t.publicId,
      t.species,
      t.status,
      isAlive(t.status) ? 'yes' : 'no',
      t.cluster?.name ?? '',
      t.plantingDate?.toISOString().slice(0, 10) ?? '',
      v.length,
      first,
      current,
      t.currentGirthDate?.toISOString().slice(0, 10) ?? '',
      growth,
    ]
  })
  const escape = (value: unknown) => {
    const s = String(value ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [header, ...rows].map((r) => r.map(escape).join(',')).join('\n') + '\n'
}

export async function farmSummary(db: Db, farmerId: string) {
  const farmer = await db.farmer.findUnique({ where: { id: farmerId } })
  if (!farmer) throw notFound('Farmer not found')
  const trees = await db.tree.findMany({ where: { farmerId }, include: TREE_REPORT_INCLUDE, orderBy: { seq: 'asc' } })
  const payments = await farmerPaymentSummary(db, farmerId)
  return {
    farmer: {
      id: farmer.id,
      legalName: farmer.legalName,
      village: farmer.village,
      district: farmer.district,
      state: farmer.state,
      preferredLanguage: farmer.preferredLanguage,
    },
    ...summariseTrees(trees),
    payments: { pendingPaise: payments.pendingPaise, paidPaise: payments.paidPaise },
  }
}

export async function platformOverview(db: Db) {
  const [trees, measurements, audits, farmers, sponsorships] = await Promise.all([
    db.tree.findMany({ include: TREE_REPORT_INCLUDE }),
    db.measurement.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
    db.audit.groupBy({ by: ['result'], _count: { _all: true } }),
    db.farmer.count(),
    db.sponsorship.groupBy({ by: ['status'], _count: { _all: true } }),
  ])
  const count = (rows: { _count: { _all: number } }[]) => rows.reduce((s, r) => s + r._count._all, 0)
  const auditTotal = count(audits)
  const auditMaterial = audits
    .filter((a) => a.result === 'MAJOR_DISCREPANCY' || a.result === 'FRAUD_SUSPECTED')
    .reduce((s, r) => s + r._count._all, 0)
  return {
    trees: summariseTrees(trees),
    measurements: Object.fromEntries(measurements.map((m) => [m.verificationStatus, m._count._all])),
    measurementsTotal: count(measurements),
    audits: Object.fromEntries(audits.map((a) => [a.result, a._count._all])),
    auditsTotal: auditTotal,
    auditDiscrepancyPct: auditTotal ? Math.round((auditMaterial / auditTotal) * 1000) / 10 : null,
    farmers,
    sponsorships: Object.fromEntries(sponsorships.map((s) => [s.status, s._count._all])),
  }
}
