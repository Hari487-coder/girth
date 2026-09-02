import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { CreateSponsorshipSchema, MarkPaidSchema, PaymentConfigSchema, isAlive } from '@girth/domain'
import { parse } from '../lib/validate.js'
import { notFound, unprocessable } from '../lib/errors.js'
import { requireAuth, requireRole } from '../plugins/auth.js'
import { recordAudit } from '../services/auditLog.js'
import { enqueueEvent, EVENT } from '../services/notifications.js'
import { getActivePaymentConfig, markLedgerPaid, setPaymentConfig } from '../services/payments.js'
import { getNumberSetting, SETTING } from '../services/settings.js'
import { findTreeByPublicId } from '../services/trees.js'

const meta = (request: { id: string; ip: string }) => ({ requestId: request.id, ip: request.ip })

function serializeConfig(config: NonNullable<Awaited<ReturnType<typeof getActivePaymentConfig>>>) {
  return { ...config, minGrowthCmForBonus: config.minGrowthCmForBonus.toNumber() }
}

export async function commerceRoutes(app: FastifyInstance) {
  // ---- farmer payment model
  app.get('/payments/config', async (request) => {
    requireAuth(request)
    const config = await getActivePaymentConfig(app.db)
    return { config: config ? serializeConfig(config) : null }
  })

  app.post('/payments/config', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN')
    const input = parse(PaymentConfigSchema, request.body)
    const config = await setPaymentConfig(app.db, actor, input, meta(request))
    return reply.status(201).send({ config: serializeConfig(config) })
  })

  app.get('/payments/ledger', async (request) => {
    requireRole(request, 'ADMIN')
    const query = request.query as { farmerId?: string; status?: string }
    const entries = await app.db.paymentLedger.findMany({
      where: { ...(query.farmerId ? { farmerId: query.farmerId } : {}), ...(query.status ? { status: query.status as never } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { farmer: { select: { legalName: true, village: true } }, tree: { select: { publicId: true } } },
    })
    return { entries }
  })

  app.post('/payments/:id/mark-paid', async (request) => {
    const actor = requireRole(request, 'ADMIN')
    const { id } = request.params as { id: string }
    const input = parse(MarkPaidSchema, request.body)
    const entry = await markLedgerPaid(app.db, actor, id, input, meta(request))
    return { entry }
  })

  // ---- customer sponsorship (no payment gateway yet; activation is server-side and admin-recorded)
  app.post('/trees/:publicId/sponsorships', async (request, reply) => {
    const actor = requireRole(request, 'CUSTOMER', 'ADMIN')
    const { publicId } = request.params as { publicId: string }
    const input = parse(CreateSponsorshipSchema, request.body)
    const tree = await findTreeByPublicId(app.db, publicId)
    if (!isAlive(tree.status)) throw unprocessable(`Tree ${tree.publicId} is ${tree.status} and cannot be sponsored`)
    const active = await app.db.sponsorship.findFirst({ where: { treeId: tree.id, status: { in: ['ACTIVE', 'PENDING_PAYMENT'] } } })
    if (active) throw unprocessable('This tree already has a sponsor')
    const pricePaise = await getNumberSetting(app.db, SETTING.SPONSORSHIP_PRICE_PAISE)
    const sponsorship = await app.db.$transaction(async (tx) => {
      const created = await tx.sponsorship.create({
        data: {
          treeId: tree.id,
          customerId: actor.id,
          treeName: input.treeName,
          message: input.message ?? null,
          occasion: input.occasion,
          planType: input.planType,
          termYears: input.termYears,
          amountPaise: pricePaise,
          girthAtStartCm: tree.currentGirthCm,
        },
      })
      await recordAudit(tx, {
        actor,
        action: 'sponsorship.created',
        entityType: 'Sponsorship',
        entityId: created.id,
        newState: { treeId: tree.publicId, amountPaise: created.amountPaise, status: created.status },
        ...meta(request),
      })
      return created
    })
    return reply.status(201).send({ sponsorship: { ...sponsorship, girthAtStartCm: sponsorship.girthAtStartCm?.toNumber() ?? null } })
  })

  app.post('/sponsorships/:id/activate', async (request) => {
    const actor = requireRole(request, 'ADMIN')
    const { id } = request.params as { id: string }
    const input = parse(z.object({ externalPaymentId: z.string().min(1).max(120), reason: z.string().max(300).optional() }), request.body)
    const sponsorship = await app.db.$transaction(async (tx) => {
      const existing = await tx.sponsorship.findUnique({ where: { id }, include: { tree: true } })
      if (!existing) throw notFound('Sponsorship not found')
      if (existing.status !== 'PENDING_PAYMENT') throw unprocessable(`Sponsorship is ${existing.status}`)
      const startsAt = new Date()
      const endsAt = new Date(startsAt)
      endsAt.setUTCFullYear(endsAt.getUTCFullYear() + existing.termYears)
      const updated = await tx.sponsorship.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          startsAt,
          endsAt,
          externalPaymentId: input.externalPaymentId,
          girthAtStartCm: existing.tree.currentGirthCm,
        },
      })
      await recordAudit(tx, {
        actor,
        action: 'sponsorship.activated',
        entityType: 'Sponsorship',
        entityId: id,
        previousState: { status: existing.status },
        newState: { status: 'ACTIVE', externalPaymentId: input.externalPaymentId, endsAt },
        reason: input.reason,
        ...meta(request),
      })
      await enqueueEvent(tx, {
        eventType: EVENT.SPONSORSHIP_STARTED,
        entityType: 'Sponsorship',
        entityId: id,
        recipientUserIds: [existing.customerId],
        payload: { treeId: existing.tree.publicId, treeName: existing.treeName, endsAt },
      })
      return updated
    })
    return { sponsorship: { ...sponsorship, girthAtStartCm: sponsorship.girthAtStartCm?.toNumber() ?? null } }
  })

  app.get('/sponsorships', async (request) => {
    requireRole(request, 'ADMIN')
    const sponsorships = await app.db.sponsorship.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tree: { select: { publicId: true, species: true } }, customer: { select: { name: true, email: true } } },
    })
    return { sponsorships: sponsorships.map((s) => ({ ...s, girthAtStartCm: s.girthAtStartCm?.toNumber() ?? null })) }
  })
}
