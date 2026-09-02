import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { formatTreeId } from '@girth/domain'
import { hashPassword } from '../src/plugins/auth.js'
import { SETTING_DEFAULTS } from '../src/services/settings.js'

/**
 * Development seed: one admin, one auditor, one organisation with a program
 * and cluster, one farmer with land, and a few trees with verified history so
 * the public tree page and dashboards have something to show. Idempotent.
 */
const db = new PrismaClient()

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@girth.local').toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'girth-admin-local'

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: 'Girth Admin', email: adminEmail, passwordHash: await hashPassword(adminPassword), role: 'ADMIN' },
  })

  const auditor = await db.user.upsert({
    where: { email: 'auditor@girth.local' },
    update: {},
    create: { name: 'Field Auditor', email: 'auditor@girth.local', passwordHash: await hashPassword('girth-auditor-local'), role: 'FIELD_AUDITOR' },
  })

  const organisation =
    (await db.organisation.findFirst({ where: { name: 'Sangareddy Green Trust' } })) ??
    (await db.organisation.create({
      data: { name: 'Sangareddy Green Trust', organisationType: 'NGO', contactName: 'Programme Office', contactEmail: 'programs@sgt.local' },
    }))

  await db.user.upsert({
    where: { email: 'org@girth.local' },
    update: {},
    create: { name: 'Programme Manager', email: 'org@girth.local', passwordHash: await hashPassword('girth-org-local'), role: 'ORGANISATION', organisationId: organisation.id },
  })

  const program =
    (await db.program.findFirst({ where: { organisationId: organisation.id } })) ??
    (await db.program.create({ data: { organisationId: organisation.id, name: 'Sangareddy Green Cluster', startDate: new Date('2024-06-01') } }))

  const farmerUser = await db.user.upsert({
    where: { phone: '+919000000001' },
    update: {},
    create: { name: 'Ravi Kumar', phone: '+919000000001', passwordHash: await hashPassword('girth-farmer-local'), role: 'FARMER' },
  })
  const farmer = await db.farmer.upsert({
    where: { userId: farmerUser.id },
    update: {},
    create: { userId: farmerUser.id, legalName: 'Ravi Kumar', phone: '+919000000001', village: 'Kandi', district: 'Sangareddy', state: 'Telangana', preferredLanguage: 'te', contractStatus: 'SIGNED' },
  })

  const landPlot =
    (await db.landPlot.findFirst({ where: { farmerId: farmer.id } })) ??
    (await db.landPlot.create({
      data: { farmerId: farmer.id, name: 'Kandi north field', locationLabel: 'Kandi, Sangareddy, Telangana', latitude: 17.5947, longitude: 78.1223, ownershipStatus: 'OWNED', agreementStatus: 'SIGNED' },
    }))

  const cluster =
    (await db.treeCluster.findFirst({ where: { programId: program.id } })) ??
    (await db.treeCluster.create({
      data: { organisationId: organisation.id, programId: program.id, landPlotId: landPlot.id, name: 'Kandi cluster A', locationLabel: 'Kandi, Sangareddy, Telangana', latitude: 17.5947, longitude: 78.1223 },
    }))

  await db.user.upsert({
    where: { email: 'customer@girth.local' },
    update: {},
    create: { name: 'Demo Customer', email: 'customer@girth.local', passwordHash: await hashPassword('girth-customer-local'), role: 'CUSTOMER' },
  })

  if (!(await db.paymentConfig.findFirst({ where: { isActive: true } }))) {
    await db.paymentConfig.create({
      data: {
        name: 'Pilot illustrative model',
        survivalPaise: 60000,
        growthBonusPaise: 20000,
        minGrowthCmForBonus: 1,
        replacementRule: 'A dead tree earns nothing; its replacement is registered as a new tree linked to the original.',
        isActive: true,
        createdById: admin.id,
      },
    })
  }

  for (const [key, def] of Object.entries(SETTING_DEFAULTS)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value: def.value, description: def.description } })
  }

  const experiments = [
    { code: 'EXP-01', hypothesis: 'Farmers will maintain trees when payment depends on survival.', experiment: 'Pilot 200 trees with 5 to 10 farmers in one cluster.', metric: '12-month survival rate', target: '85%', status: 'PLANNED' as const },
    { code: 'EXP-02', hypothesis: 'People value verified tree growth.', experiment: 'Show the MVP to 100 people; count QR scans, profile views, sponsorship intent and actual commitments.', metric: 'Sponsorship commitments per 100 viewers', target: '5', status: 'RUNNING' as const },
    { code: 'EXP-03', hypothesis: 'Verification can be performed cheaply.', experiment: 'Track field visit time, travel cost and discrepancy rate across the pilot cluster.', metric: 'Cost per verified tree', target: 'Under 20% of annual sponsorship revenue per tree', status: 'PLANNED' as const },
  ]
  for (const e of experiments) {
    await db.experiment.upsert({ where: { code: e.code }, update: {}, create: e })
  }

  // Demo trees with verified history, mirroring the MVP story (GIRTH-000001 = mango, 8 -> 11 -> 14 cm)
  if ((await db.tree.count()) === 0) {
    const demo = [
      { species: 'Mango', planted: '2024-07-02', girths: [8, 11, 14] },
      { species: 'Custard Apple', planted: '2025-07-05', girths: [7, 11] },
      { species: 'Neem', planted: '2024-07-02', girths: [9, 13] },
    ]
    for (const t of demo) {
      const rows = await db.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('"Tree_seq_seq"')`
      const seq = Number(rows[0]!.nextval)
      const tree = await db.tree.create({
        data: {
          seq,
          publicId: formatTreeId(seq),
          clusterId: cluster.id,
          farmerId: farmer.id,
          organisationId: organisation.id,
          landPlotId: landPlot.id,
          species: t.species,
          plantingDate: new Date(t.planted),
          latitude: 17.5947 + seq * 0.0001,
          longitude: 78.1223 + seq * 0.0001,
          status: 'ACTIVE',
        },
      })
      await db.treeStatusHistory.create({ data: { treeId: tree.id, toStatus: 'PLANTED', reason: 'Seeded', changedById: admin.id } })
      await db.treeStatusHistory.create({ data: { treeId: tree.id, fromStatus: 'PLANTED', toStatus: 'ACTIVE', reason: 'Seeded', changedById: admin.id } })
      await db.treeTag.create({ data: { treeId: tree.id, tagCode: `TAG-${String(seq).padStart(5, '0')}` } })
      const plantedYear = new Date(t.planted).getUTCFullYear()
      let last: { girthCm: number; date: Date } | null = null
      for (let i = 0; i < t.girths.length; i++) {
        const girthCm = t.girths[i]!
        const date = new Date(Date.UTC(plantedYear + i, 7, 20 + i * 4))
        await db.measurement.create({
          data: {
            treeId: tree.id,
            submittedById: farmerUser.id,
            submittedAt: date,
            measurementDate: date,
            measurementHeightCm: 130,
            girthCm,
            latitude: tree.latitude,
            longitude: tree.longitude,
            distanceFromTreeM: 3,
            verificationStatus: 'VERIFIED',
            verifiedById: auditor.id,
            verifiedAt: date,
            verificationNotes: 'Seeded demo history',
            checks: { create: [{ key: 'seed', passed: true, severity: 'INFO', detail: 'Seeded demo measurement' }] },
          },
        })
        last = { girthCm, date }
      }
      if (last) {
        await db.tree.update({ where: { id: tree.id }, data: { currentGirthCm: last.girthCm, currentGirthDate: last.date } })
      }
    }
  }

  console.log('Seed complete.')
  console.log(`  admin:    ${adminEmail} / ${adminPassword}`)
  console.log('  auditor:  auditor@girth.local / girth-auditor-local')
  console.log('  org:      org@girth.local / girth-org-local')
  console.log('  farmer:   +919000000001 / girth-farmer-local')
  console.log('  customer: customer@girth.local / girth-customer-local')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
