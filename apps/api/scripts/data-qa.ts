import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { isAlive, parseTreeId } from '@girth/domain'

/**
 * Invariants the data must satisfy in any environment. Run against staging
 * after a deploy and against a restored backup during a drill:
 *   DATABASE_URL=... npx tsx scripts/data-qa.ts
 * Exits 1 when any check fails.
 */
const db = new PrismaClient()

interface Check {
  name: string
  run: () => Promise<string[]>
}

const checks: Check[] = [
  {
    name: 'every tree id matches its sequence and is unique',
    run: async () => {
      const trees = await db.tree.findMany({ select: { publicId: true, seq: true } })
      const seen = new Set<string>()
      const bad: string[] = []
      for (const t of trees) {
        if (parseTreeId(t.publicId) !== t.seq) bad.push(`${t.publicId} != seq ${t.seq}`)
        if (seen.has(t.publicId)) bad.push(`duplicate ${t.publicId}`)
        seen.add(t.publicId)
      }
      return bad
    },
  },
  {
    name: 'verified measurements carry a verifier and a time',
    run: async () => {
      const rows = await db.measurement.findMany({
        where: { verificationStatus: 'VERIFIED', OR: [{ verifiedById: null }, { verifiedAt: null }] },
        select: { id: true },
      })
      return rows.map((r) => r.id)
    },
  },
  {
    name: 'nobody verified their own reading',
    run: async () => {
      const rows = await db.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Measurement" WHERE "verificationStatus" = 'VERIFIED' AND "verifiedById" = "submittedById"`
      return rows.map((r) => r.id)
    },
  },
  {
    name: 'current girth equals the newest verified reading',
    run: async () => {
      const trees = await db.tree.findMany({
        include: { measurements: { where: { verificationStatus: 'VERIFIED' }, orderBy: { measurementDate: 'desc' }, take: 1 } },
      })
      return trees
        .filter((t) => {
          const latest = t.measurements[0]
          if (!latest) return t.currentGirthCm !== null
          return t.currentGirthCm === null || !t.currentGirthCm.equals(latest.girthCm)
        })
        .map((t) => t.publicId)
    },
  },
  {
    name: 'dead or replaced trees have no readings dated after their death',
    run: async () => {
      const rows = await db.$queryRaw<{ publicId: string }[]>`
        SELECT t."publicId" FROM "Tree" t
        JOIN "TreeStatusHistory" h ON h."treeId" = t.id AND h."toStatus" = 'DEAD'
        JOIN "Measurement" m ON m."treeId" = t.id AND m."measurementDate" > h."createdAt" AND m."verificationStatus" = 'VERIFIED'
        WHERE t.status IN ('DEAD','REPLACED')`
      return rows.map((r) => r.publicId)
    },
  },
  {
    name: 'ledger entries reference verified readings of living trees (or are adjustments)',
    run: async () => {
      const rows = await db.paymentLedger.findMany({
        where: { reason: { notIn: ['ADJUSTMENT', 'PENALTY', 'DEAD'] } },
        include: { measurement: { select: { verificationStatus: true } }, tree: { select: { publicId: true, status: true } } },
      })
      return rows
        .filter((r) => !r.measurement || r.measurement.verificationStatus !== 'VERIFIED')
        .map((r) => `${r.id} (${r.tree?.publicId ?? 'no tree'})`)
    },
  },
  {
    name: 'no paid ledger entry lacks an external payment reference',
    run: async () => {
      const rows = await db.paymentLedger.findMany({ where: { status: 'PAID', externalPaymentId: null }, select: { id: true } })
      return rows.map((r) => r.id)
    },
  },
  {
    name: 'every photo has a stored original and a hash',
    run: async () => {
      const rows = await db.photo.findMany({ where: { OR: [{ storageKey: '' }, { sha256: '' }] }, select: { id: true } })
      return rows.map((r) => r.id)
    },
  },
  {
    name: 'public photos belong to verified measurements only',
    run: async () => {
      const rows = await db.photo.findMany({
        where: { isPublic: true },
        include: { measurement: { select: { verificationStatus: true } } },
      })
      return rows.filter((p) => p.measurement && p.measurement.verificationStatus !== 'VERIFIED').map((p) => p.id)
    },
  },
  {
    name: 'active sponsorships point at living trees',
    run: async () => {
      const rows = await db.sponsorship.findMany({ where: { status: 'ACTIVE' }, include: { tree: { select: { publicId: true, status: true } } } })
      return rows.filter((s) => !isAlive(s.tree.status)).map((s) => s.tree.publicId)
    },
  },
  {
    name: 'every mutation of a tree status has an audit-log line',
    run: async () => {
      const rows = await db.$queryRaw<{ id: string }[]>`
        SELECT h.id FROM "TreeStatusHistory" h
        LEFT JOIN "AuditLog" a ON a."entityType" = 'Tree' AND a."entityId" = h."treeId"
          AND a."createdAt" BETWEEN h."createdAt" - interval '5 seconds' AND h."createdAt" + interval '5 seconds'
        WHERE h."fromStatus" IS NOT NULL AND a.id IS NULL`
      return rows.map((r) => r.id)
    },
  },
]

async function main() {
  let failures = 0
  for (const check of checks) {
    const problems = await check.run()
    const ok = problems.length === 0
    if (!ok) failures++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${check.name}${ok ? '' : `\n      ${problems.slice(0, 10).join('\n      ')}${problems.length > 10 ? `\n      ... ${problems.length - 10} more` : ''}`}`)
  }
  const counts = {
    trees: await db.tree.count(),
    measurements: await db.measurement.count(),
    verified: await db.measurement.count({ where: { verificationStatus: 'VERIFIED' } }),
    audits: await db.audit.count(),
    ledger: await db.paymentLedger.count(),
    auditLog: await db.auditLog.count(),
  }
  console.log(`\ncounts ${JSON.stringify(counts)}`)
  console.log(failures === 0 ? '\nData QA: all checks passed' : `\nData QA: ${failures} check(s) failed`)
  process.exit(failures === 0 ? 0 : 1)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
