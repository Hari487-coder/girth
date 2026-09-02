import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { Client, createAdmin, createTestApp, fakePhoto, multipart, resetDatabase } from './helpers.js'

/**
 * The critical acceptance chain from the production specification (§55):
 * admin registers farmer, land, cluster and tree; the QR exists; the farmer
 * submits a measurement; it enters the queue; an auditor verifies it; the
 * growth history and payment eligibility update; the public tree page shows
 * the verified history without private data.
 */
describe('critical acceptance journey', () => {
  let app: FastifyInstance
  let db: PrismaClient
  const admin = new Client(null as never)
  const farmer = new Client(null as never)
  const auditor = new Client(null as never)
  const customer = new Client(null as never)

  let farmerId = ''
  let farmerUserId = ''
  let clusterId = ''
  let treePublicId = ''
  let measurementId = ''

  beforeAll(async () => {
    const built = await createTestApp(inject('databaseUrl'))
    app = built.app
    db = built.db
    await resetDatabase(db)
    await createAdmin(db)
    for (const c of [admin, farmer, auditor, customer]) Object.assign(c, { app })
    await admin.login('admin@test.local', 'admin-password-1')
  })

  afterAll(async () => {
    await app.close()
    await db.$disconnect()
  })

  it('step 1-3: admin creates a farmer, land and cluster', async () => {
    const farmerRes = await admin.post('/farmers', {
      name: 'Ravi Kumar',
      phone: '+919000000001',
      password: 'farmer-password-1',
      village: 'Kandi',
      district: 'Sangareddy',
      state: 'Telangana',
      preferredLanguage: 'te',
    })
    expect(farmerRes.statusCode).toBe(201)
    farmerId = farmerRes.json().farmer.id
    farmerUserId = farmerRes.json().farmer.userId

    const landRes = await admin.post('/land-plots', {
      farmerId,
      name: 'North field',
      locationLabel: 'Kandi, Sangareddy',
      latitude: 17.5947,
      longitude: 78.1223,
      ownershipStatus: 'OWNED',
    })
    expect(landRes.statusCode).toBe(201)

    const clusterRes = await admin.post('/clusters', {
      name: 'Kandi cluster A',
      locationLabel: 'Kandi, Sangareddy, Telangana',
      landPlotId: landRes.json().landPlot.id,
      latitude: 17.5947,
      longitude: 78.1223,
    })
    expect(clusterRes.statusCode).toBe(201)
    clusterId = clusterRes.json().cluster.id

    const configRes = await admin.post('/payments/config', {
      name: 'Pilot illustrative model',
      survivalPaise: 60000,
      growthBonusPaise: 20000,
      minGrowthCmForBonus: 1,
      reason: 'Pilot configuration',
    })
    expect(configRes.statusCode).toBe(201)
  })

  it('step 4-5: tree GIRTH-000001 is created with a QR code', async () => {
    const res = await admin.post('/trees', {
      clusterId,
      farmerId,
      species: 'Mango',
      plantingDate: '2024-07-02',
      latitude: 17.5947,
      longitude: 78.1223,
      tagCode: 'TAG-00001',
    })
    expect(res.statusCode).toBe(201)
    treePublicId = res.json().tree.publicId
    expect(treePublicId).toBe('GIRTH-000001')
    expect(res.json().tree.status).toBe('PLANTED')

    const qr = await app.inject({ method: 'GET', url: `/trees/${treePublicId}/qr.svg` })
    expect(qr.statusCode).toBe(200)
    expect(qr.headers['content-type']).toContain('image/svg+xml')
    expect(qr.body).toContain('<svg')

    const second = await admin.post('/trees', { clusterId, farmerId, species: 'Neem' })
    expect(second.json().tree.publicId).toBe('GIRTH-000002')
  })

  it('step 6-8: the farmer submits a measurement with a photo and it enters the queue', async () => {
    await farmer.login('+919000000001', 'farmer-password-1')
    const photo = await fakePhoto()
    const form = multipart(
      {
        measurementDate: '2024-08-20',
        measurementHeightCm: '130',
        girthCm: '8',
        latitude: '17.5948',
        longitude: '78.1224',
        clientSubmissionId: 'offline-1',
      },
      { name: 'photo', filename: 'tape.jpg', buffer: photo, mimetype: 'image/jpeg' },
    )
    const res = await farmer.request({ method: 'POST', url: `/trees/${treePublicId}/measurements`, payload: form.payload, headers: form.headers })
    expect(res.statusCode).toBe(201)
    const m = res.json().measurement
    measurementId = m.id
    expect(m.verificationStatus).toBe('PENDING_REVIEW')
    expect(m.girthCm).toBe(8)
    expect(m.anomaly).toBe(false)
    expect(m.photos).toHaveLength(1)
    expect(m.checks.every((c: { passed: boolean }) => c.passed)).toBe(true)

    // offline retry with the same client id is idempotent
    const retry = await farmer.request({ method: 'POST', url: `/trees/${treePublicId}/measurements`, payload: form.payload, headers: form.headers })
    expect(retry.statusCode).toBe(200)
    expect(retry.json().duplicate).toBe(true)
    expect(retry.json().measurement.id).toBe(measurementId)

    const queue = await admin.get('/measurements/queue')
    expect(queue.json().queue.map((q: { id: string }) => q.id)).toContain(measurementId)

    // a farmer can never verify
    const forbidden = await farmer.post(`/measurements/${measurementId}/verify`, {})
    expect(forbidden.statusCode).toBe(403)
  })

  it('step 9-12: the auditor verifies, history updates and the farmer sees eligible payment', async () => {
    await admin.post('/users', { name: 'Field Auditor', email: 'auditor@test.local', password: 'auditor-password-1', role: 'FIELD_AUDITOR' })
    await auditor.login('auditor@test.local', 'auditor-password-1')

    const res = await auditor.post(`/measurements/${measurementId}/verify`, { notes: 'Photo and location consistent' })
    expect(res.statusCode).toBe(200)
    expect(res.json().measurement.verificationStatus).toBe('VERIFIED')
    expect(res.json().payout.totalPaise).toBe(60000)

    const tree = await admin.get(`/trees/${treePublicId}`)
    expect(tree.json().tree.status).toBe('ACTIVE')
    expect(tree.json().tree.currentGirthCm).toBe(8)

    const payments = await farmer.get('/me/payments')
    expect(payments.statusCode).toBe(200)
    expect(payments.json().pendingPaise).toBe(60000)
    expect(payments.json().entries[0].reason).toBe('SURVIVAL')

    const farm = await farmer.get('/me/farm')
    expect(farm.json().alive).toBe(2)
    expect(farm.json().verified).toBe(1)
  })

  it('a second year adds growth, growth bonus and an audit-able trail', async () => {
    const res = await farmer.post(`/trees/${treePublicId}/measurements`, {
      measurementDate: '2025-08-24',
      measurementHeightCm: 130,
      girthCm: 11,
      latitude: 17.5947,
      longitude: 78.1223,
    })
    expect(res.statusCode).toBe(201)
    const second = res.json().measurement
    expect(second.checks.find((c: { key: string }) => c.key === 'photo_present').severity).toBe('WARN')
    expect(second.anomaly).toBe(true)

    const verify = await auditor.post(`/measurements/${second.id}/verify`, { notes: 'Confirmed on site' })
    expect(verify.json().growthCm).toBe(3)
    expect(verify.json().payout.totalPaise).toBe(80000)

    const log = await admin.get(`/audit-log?entityType=Measurement&entityId=${second.id}`)
    const actions = log.json().entries.map((e: { action: string }) => e.action)
    expect(actions).toContain('measurement.submitted')
    expect(actions).toContain('measurement.verified')
  })

  it('implausible growth is flagged as a potential anomaly, not rejected', async () => {
    const res = await farmer.post(`/trees/${treePublicId}/measurements`, {
      measurementDate: '2026-08-28',
      measurementHeightCm: 130,
      girthCm: 35,
      latitude: 17.5947,
      longitude: 78.1223,
    })
    expect(res.statusCode).toBe(201)
    const growth = res.json().measurement.checks.find((c: { key: string }) => c.key === 'growth_plausible')
    expect(growth.severity).toBe('WARN')
    expect(growth.detail).toContain('Potential anomaly')

    const queue = await auditor.get('/measurements/queue')
    expect(queue.json().queue[0].id).toBe(res.json().measurement.id)

    const remeasure = await auditor.post(`/measurements/${res.json().measurement.id}/remeasure`, { notes: 'Please re-measure at 130 cm' })
    expect(remeasure.json().measurement.verificationStatus).toBe('REMEASURE_REQUIRED')
    const tree = await admin.get(`/trees/${treePublicId}`)
    expect(tree.json().tree.status).toBe('NEEDS_ATTENTION')
    expect(tree.json().tree.currentGirthCm).toBe(11)
  })

  it('step 13-14: the public tree page shows verified history and no private data', async () => {
    const res = await app.inject({ method: 'GET', url: `/public/trees/${treePublicId}` })
    expect(res.statusCode).toBe(200)
    const profile = res.json()
    expect(profile.publicId).toBe('GIRTH-000001')
    expect(profile.species).toBe('Mango')
    expect(profile.currentGirthCm).toBe(11)
    expect(profile.timeline.map((t: { girthCm: number }) => t.girthCm)).toEqual([8, 11])
    expect(profile.growth.totalCm).toBe(3)
    expect(profile.latestVerification.photoUrl).toBeNull()
    expect(profile.timeline[0].photoUrl).toMatch(/^\/public\/photos\//)
    const raw = res.body
    expect(raw).not.toContain('Ravi')
    expect(raw).not.toContain('+9190')
    expect(raw).not.toContain('17.59')
    expect(profile.location).toBe('Kandi, Sangareddy, Telangana')

    const photo = await app.inject({ method: 'GET', url: profile.timeline[0].photoUrl })
    expect(photo.statusCode).toBe(200)
    expect(photo.headers['content-type']).toBe('image/jpeg')
  })

  it('history cannot be silently changed, even with database access', async () => {
    await expect(
      db.measurement.update({ where: { id: measurementId }, data: { girthCm: 99 } }),
    ).rejects.toThrow(/immutable/)
    await expect(
      db.measurement.update({ where: { id: measurementId }, data: { verificationStatus: 'FLAGGED' } }),
    ).rejects.toThrow(/never un-verified/)
    await expect(db.measurement.delete({ where: { id: measurementId } })).rejects.toThrow(/append-only/)
    const entry = await db.auditLog.findFirst()
    await expect(db.auditLog.delete({ where: { id: entry!.id } })).rejects.toThrow(/append-only/)
    const ledger = await db.paymentLedger.findFirst()
    await expect(db.paymentLedger.update({ where: { id: ledger!.id }, data: { amountPaise: 1 } })).rejects.toThrow(/immutable/)
    const tree = await db.tree.findUniqueOrThrow({ where: { publicId: treePublicId } })
    await expect(db.tree.update({ where: { id: tree.id }, data: { publicId: 'GIRTH-999999' } })).rejects.toThrow(/permanent/)
  })

  it('a random audit finding a major discrepancy flags the tree and cancels unpaid eligibility', async () => {
    await admin.put('/settings/audit.sampling_rate', { value: '1', reason: 'Force audit selection in test' })
    const neem = await admin.post('/trees', { clusterId, farmerId, species: 'Jamun', plantingDate: '2024-07-02' })
    const neemId = neem.json().tree.publicId
    const sub = await farmer.post(`/trees/${neemId}/measurements`, { measurementDate: '2024-08-20', measurementHeightCm: 130, girthCm: 14 })
    const verified = await auditor.post(`/measurements/${sub.json().measurement.id}/verify`, {})
    expect(verified.json().auditScheduled).toBe(true)

    const audits = await auditor.get('/audits?result=PENDING')
    const audit = audits.json().audits.find((a: { measurementId: string }) => a.measurementId === sub.json().measurement.id)
    expect(audit.reportedGirthCm).toBe(14)

    const result = await auditor.post(`/audits/${audit.id}/result`, { observedGirthCm: 9, notes: 'Tape reading does not match' })
    expect(result.statusCode).toBe(200)
    expect(result.json().audit.result).toBe('MAJOR_DISCREPANCY')
    expect(result.json().audit.differenceCm).toBe(-5)

    const tree = await admin.get(`/trees/${neemId}`)
    expect(tree.json().tree.status).toBe('FLAGGED')
    const ledger = await admin.get(`/payments/ledger?farmerId=${farmerId}`)
    const forMeasurement = ledger.json().entries.filter((e: { measurementId: string }) => e.measurementId === sub.json().measurement.id)
    expect(forMeasurement.every((e: { status: string }) => e.status === 'CANCELLED')).toBe(true)

    // the original reading is untouched
    const original = await db.measurement.findUniqueOrThrow({ where: { id: sub.json().measurement.id } })
    expect(original.girthCm.toNumber()).toBe(14)
    expect(original.verificationStatus).toBe('VERIFIED')
    await admin.put('/settings/audit.sampling_rate', { value: '0.1', reason: 'Restore default' })
  })

  it('a dead tree is replaced by a new identity that links back, never overwritten', async () => {
    const neem = await admin.get('/trees/GIRTH-000002')
    expect(neem.json().tree.status).toBe('PLANTED')
    const dead = await auditor.post('/trees/GIRTH-000002/status', { status: 'DEAD', reason: 'Confirmed dead on site visit' })
    expect(dead.statusCode).toBe(200)
    const replacement = await admin.post('/trees', { clusterId, farmerId, species: 'Neem', replacementForTreeId: neem.json().tree.id })
    expect(replacement.statusCode).toBe(201)
    expect(replacement.json().tree.replacementForId).toBe(neem.json().tree.id)
    const original = await admin.get('/trees/GIRTH-000002')
    expect(original.json().tree.status).toBe('REPLACED')
    expect(original.json().replacedBy.publicId).toBe(replacement.json().tree.publicId)
    const pub = await app.inject({ method: 'GET', url: '/public/trees/GIRTH-000002' })
    expect(pub.json().statusLabel).toContain('replaced')
    expect(pub.json().replacedBy.publicId).toBe(replacement.json().tree.publicId)
    const resurrect = await auditor.post('/trees/GIRTH-000002/status', { status: 'ACTIVE', reason: 'oops' })
    expect(resurrect.statusCode).toBe(422)
  })

  it('a customer can sponsor and name a tree, and sees growth since sponsorship', async () => {
    await admin.post('/users', { name: 'Anita', email: 'anita@test.local', password: 'customer-password-1', role: 'CUSTOMER' })
    await customer.login('anita@test.local', 'customer-password-1')
    const res = await customer.post(`/trees/${treePublicId}/sponsorships`, { treeName: "Amma's Mango Tree", message: 'Growing with us.', occasion: 'BIRTHDAY' })
    expect(res.statusCode).toBe(201)
    expect(res.json().sponsorship.status).toBe('PENDING_PAYMENT')
    const activate = await admin.post(`/sponsorships/${res.json().sponsorship.id}/activate`, { externalPaymentId: 'pay_test_001' })
    expect(activate.json().sponsorship.status).toBe('ACTIVE')
    const mine = await customer.get('/me/trees')
    expect(mine.json().trees[0].treeName).toBe("Amma's Mango Tree")
    expect(mine.json().trees[0].currentGirthCm).toBe(11)
    expect(mine.json().trees[0].growthSinceSponsorshipCm).toBe(0)
    const pub = await app.inject({ method: 'GET', url: `/public/trees/${treePublicId}` })
    expect(pub.json().sponsorship.treeName).toBe("Amma's Mango Tree")
    const farmerCannotSponsor = await farmer.post(`/trees/${treePublicId}/sponsorships`, { treeName: 'x', occasion: 'BIRTHDAY' })
    expect(farmerCannotSponsor.statusCode).toBe(403)

    // the public marketplace no longer offers the sponsored tree, and prices come from settings
    const available = await app.inject({ method: 'GET', url: '/public/trees' })
    expect(available.statusCode).toBe(200)
    expect(available.json().pricePaise).toBe(249900)
    const ids = available.json().trees.map((t: { publicId: string }) => t.publicId)
    expect(ids).not.toContain(treePublicId)
    expect(ids).toContain('GIRTH-000003')
    expect(JSON.stringify(available.json())).not.toContain('Ravi')
  })

  it('organisation reporting never counts unverified trees as verified', async () => {
    const org = await admin.post('/organisations', { name: 'Sangareddy Green Trust', organisationType: 'NGO' })
    const program = await admin.post('/programs', { organisationId: org.json().organisation.id, name: 'Sangareddy Green Cluster' })
    const cluster = await admin.post('/clusters', { name: 'Reporting cluster', locationLabel: 'Kandi', organisationId: org.json().organisation.id, programId: program.json().program.id })
    const t1 = await admin.post('/trees', { clusterId: cluster.json().cluster.id, farmerId, organisationId: org.json().organisation.id, species: 'Teak' })
    await admin.post('/trees', { clusterId: cluster.json().cluster.id, farmerId, organisationId: org.json().organisation.id, species: 'Teak' })
    const sub = await farmer.post(`/trees/${t1.json().tree.publicId}/measurements`, { measurementDate: '2026-08-01', measurementHeightCm: 130, girthCm: 6 })
    const overviewBefore = await admin.get(`/programs/${program.json().program.id}/overview`)
    expect(overviewBefore.json().registered).toBe(2)
    expect(overviewBefore.json().verified).toBe(0)
    expect(overviewBefore.json().pending).toBe(1)
    await auditor.post(`/measurements/${sub.json().measurement.id}/verify`, {})
    const overviewAfter = await admin.get(`/programs/${program.json().program.id}/overview`)
    expect(overviewAfter.json().verified).toBe(1)
    expect(overviewAfter.json().survivalPct).toBe(100)
    const csv = await admin.get(`/programs/${program.json().program.id}/report.csv`)
    expect(csv.headers['content-type']).toContain('text/csv')
    expect(csv.body.split('\n')[0]).toContain('tree_id')
    expect(csv.body).toContain(t1.json().tree.publicId)
    expect(farmerUserId).toBeTruthy()
  })
})
