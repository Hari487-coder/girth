import type { FastifyInstance } from 'fastify'
import {
  CreateFarmerSchema,
  CreateLandPlotSchema,
  CreateOrganisationSchema,
  CreateProgramSchema,
  CreateUserSchema,
} from '@girth/domain'
import { parse } from '../lib/validate.js'
import { conflict, forbidden, notFound } from '../lib/errors.js'
import { assertOrganisationScope, hashPassword, requireAuth, requireRole } from '../plugins/auth.js'
import { recordAudit } from '../services/auditLog.js'
import { farmerPaymentSummary } from '../services/payments.js'
import { farmSummary, programOverview, programTreesCsv } from '../services/reports.js'
import { serializeTree } from '../lib/serialize.js'

const meta = (request: { id: string; ip: string }) => ({ requestId: request.id, ip: request.ip })

const publicUser = { id: true, name: true, email: true, phone: true, role: true, status: true, organisationId: true, createdAt: true } as const

export async function peopleRoutes(app: FastifyInstance) {
  // ---- users (admin)
  app.post('/users', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN')
    const input = parse(CreateUserSchema, request.body)
    const existing = await app.db.user.findFirst({
      where: { OR: [...(input.email ? [{ email: input.email.toLowerCase() }] : []), ...(input.phone ? [{ phone: input.phone }] : [])] },
    })
    if (existing) throw conflict('A user with that email or phone already exists')
    const user = await app.db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name,
          email: input.email?.toLowerCase() ?? null,
          phone: input.phone ?? null,
          passwordHash: await hashPassword(input.password),
          role: input.role,
          organisationId: input.organisationId ?? null,
        },
        select: publicUser,
      })
      await recordAudit(tx, { actor, action: 'user.created', entityType: 'User', entityId: created.id, newState: created, ...meta(request) })
      return created
    })
    return reply.status(201).send({ user })
  })

  app.get('/users', async (request) => {
    requireRole(request, 'ADMIN')
    const users = await app.db.user.findMany({ select: publicUser, orderBy: { createdAt: 'desc' } })
    return { users }
  })

  // ---- organisations
  app.post('/organisations', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN')
    const input = parse(CreateOrganisationSchema, request.body)
    const organisation = await app.db.$transaction(async (tx) => {
      const created = await tx.organisation.create({ data: input })
      await recordAudit(tx, { actor, action: 'organisation.created', entityType: 'Organisation', entityId: created.id, newState: created, ...meta(request) })
      return created
    })
    return reply.status(201).send({ organisation })
  })

  app.get('/organisations', async (request) => {
    const user = requireRole(request, 'ADMIN', 'ORGANISATION')
    const organisations = await app.db.organisation.findMany({
      where: user.role === 'ORGANISATION' ? { id: user.organisationId ?? '' } : {},
      orderBy: { name: 'asc' },
    })
    return { organisations }
  })

  app.get('/organisations/:id/programs', async (request) => {
    const user = requireAuth(request)
    const { id } = request.params as { id: string }
    assertOrganisationScope(user, id)
    const programs = await app.db.program.findMany({ where: { organisationId: id }, orderBy: { createdAt: 'desc' } })
    return { programs }
  })

  // ---- programs
  app.post('/programs', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN', 'ORGANISATION')
    const input = parse(CreateProgramSchema, request.body)
    assertOrganisationScope(actor, input.organisationId)
    const program = await app.db.$transaction(async (tx) => {
      const created = await tx.program.create({ data: input })
      await recordAudit(tx, { actor, action: 'program.created', entityType: 'Program', entityId: created.id, newState: created, ...meta(request) })
      return created
    })
    return reply.status(201).send({ program })
  })

  app.get('/programs/:id/overview', async (request) => {
    const user = requireAuth(request)
    const { id } = request.params as { id: string }
    const program = await app.db.program.findUnique({ where: { id } })
    if (!program) throw notFound('Program not found')
    if (user.role !== 'FIELD_AUDITOR') assertOrganisationScope(user, program.organisationId)
    return programOverview(app.db, id)
  })

  app.get('/programs/:id/report.csv', async (request, reply) => {
    const user = requireAuth(request)
    const { id } = request.params as { id: string }
    const program = await app.db.program.findUnique({ where: { id } })
    if (!program) throw notFound('Program not found')
    assertOrganisationScope(user, program.organisationId)
    const csv = await programTreesCsv(app.db, id)
    return reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header('content-disposition', `attachment; filename="girth-program-${id}.csv"`)
      .send(csv)
  })

  // ---- farmers
  app.post('/farmers', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN')
    const input = parse(CreateFarmerSchema, request.body)
    const clash = await app.db.user.findFirst({
      where: { OR: [{ phone: input.phone }, ...(input.email ? [{ email: input.email.toLowerCase() }] : [])] },
    })
    if (clash) throw conflict('A user with that phone or email already exists')
    const farmer = await app.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email?.toLowerCase() ?? null,
          passwordHash: await hashPassword(input.password),
          role: 'FARMER',
        },
      })
      const created = await tx.farmer.create({
        data: {
          userId: user.id,
          legalName: input.legalName ?? input.name,
          phone: input.phone,
          village: input.village,
          district: input.district,
          state: input.state,
          preferredLanguage: input.preferredLanguage,
        },
      })
      await recordAudit(tx, {
        actor,
        action: 'farmer.created',
        entityType: 'Farmer',
        entityId: created.id,
        newState: { userId: user.id, village: created.village, district: created.district },
        ...meta(request),
      })
      return { ...created, userId: user.id }
    })
    return reply.status(201).send({ farmer })
  })

  app.get('/farmers', async (request) => {
    requireRole(request, 'ADMIN', 'FIELD_AUDITOR')
    const farmers = await app.db.farmer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { trees: true } } },
    })
    return { farmers }
  })

  const assertFarmerAccess = (request: { user: { role: string; farmerId: string | null } | null }, farmerId: string) => {
    const user = requireAuth(request as never)
    if (user.role === 'ADMIN' || user.role === 'FIELD_AUDITOR') return user
    if (user.role === 'FARMER' && user.farmerId === farmerId) return user
    throw forbidden()
  }

  app.get('/farmers/:id', async (request) => {
    const { id } = request.params as { id: string }
    assertFarmerAccess(request, id)
    return farmSummary(app.db, id)
  })

  app.get('/farmers/:id/trees', async (request) => {
    const { id } = request.params as { id: string }
    assertFarmerAccess(request, id)
    const trees = await app.db.tree.findMany({
      where: { farmerId: id },
      orderBy: { seq: 'asc' },
      include: { tags: { where: { status: 'ACTIVE' } } },
    })
    return { trees: trees.map(serializeTree) }
  })

  app.get('/farmers/:id/payments', async (request) => {
    const { id } = request.params as { id: string }
    assertFarmerAccess(request, id)
    return farmerPaymentSummary(app.db, id)
  })

  // ---- land plots
  app.post('/land-plots', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN')
    const input = parse(CreateLandPlotSchema, request.body)
    if (!(await app.db.farmer.findUnique({ where: { id: input.farmerId } }))) throw notFound('Farmer not found')
    const landPlot = await app.db.$transaction(async (tx) => {
      const created = await tx.landPlot.create({ data: input })
      await recordAudit(tx, { actor, action: 'land_plot.created', entityType: 'LandPlot', entityId: created.id, newState: created, ...meta(request) })
      return created
    })
    return reply.status(201).send({ landPlot })
  })

  app.get('/land-plots', async (request) => {
    const user = requireRole(request, 'ADMIN', 'FIELD_AUDITOR', 'FARMER')
    const { farmerId } = request.query as { farmerId?: string }
    const where = user.role === 'FARMER' ? { farmerId: user.farmerId ?? '' } : farmerId ? { farmerId } : {}
    const landPlots = await app.db.landPlot.findMany({ where, orderBy: { createdAt: 'desc' } })
    return { landPlots }
  })
}
