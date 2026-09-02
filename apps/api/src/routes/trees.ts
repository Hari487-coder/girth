import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import QRCode from 'qrcode'
import {
  AttachTagSchema,
  ChangeTreeStatusSchema,
  CreateClusterSchema,
  CreateTreeSchema,
  SubmitMeasurementSchema,
} from '@girth/domain'
import { parse } from '../lib/validate.js'
import { forbidden, notFound } from '../lib/errors.js'
import { readBody } from '../lib/multipart.js'
import { serializeMeasurement, serializeTree } from '../lib/serialize.js'
import { assertOrganisationScope, requireAuth, requireRole, type AuthUser } from '../plugins/auth.js'
import { recordAudit } from '../services/auditLog.js'
import { submitMeasurement } from '../services/measurements.js'
import { attachTag, changeTreeStatus, createTree, findTreeByPublicId } from '../services/trees.js'

const meta = (request: { id: string; ip: string }) => ({ requestId: request.id, ip: request.ip })

/** Which trees a signed-in user may see in the private API. */
function treeScope(user: AuthUser): Prisma.TreeWhereInput {
  switch (user.role) {
    case 'ADMIN':
    case 'FIELD_AUDITOR':
      return {}
    case 'FARMER':
      return { farmerId: user.farmerId ?? '' }
    case 'ORGANISATION':
      return { organisationId: user.organisationId ?? '' }
    case 'CUSTOMER':
      return { sponsorships: { some: { customerId: user.id } } }
  }
}

async function loadScopedTree(app: FastifyInstance, user: AuthUser, publicId: string) {
  const tree = await findTreeByPublicId(app.db, publicId)
  const allowed = await app.db.tree.findFirst({ where: { id: tree.id, ...treeScope(user) }, select: { id: true } })
  if (!allowed) throw forbidden()
  return tree
}

export async function treeRoutes(app: FastifyInstance) {
  // ---- clusters
  app.post('/clusters', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN', 'ORGANISATION')
    const input = parse(CreateClusterSchema, request.body)
    if (input.organisationId) assertOrganisationScope(actor, input.organisationId)
    if (actor.role === 'ORGANISATION' && !input.organisationId) throw forbidden('Organisation clusters need an organisationId')
    if (input.programId) {
      const program = await app.db.program.findUnique({ where: { id: input.programId } })
      if (!program) throw notFound('Program not found')
      assertOrganisationScope(actor, program.organisationId)
    }
    const cluster = await app.db.$transaction(async (tx) => {
      const created = await tx.treeCluster.create({ data: input })
      await recordAudit(tx, { actor, action: 'cluster.created', entityType: 'TreeCluster', entityId: created.id, newState: created, ...meta(request) })
      return created
    })
    return reply.status(201).send({ cluster })
  })

  app.get('/clusters', async (request) => {
    const user = requireRole(request, 'ADMIN', 'FIELD_AUDITOR', 'ORGANISATION')
    const where = user.role === 'ORGANISATION' ? { organisationId: user.organisationId ?? '' } : {}
    const clusters = await app.db.treeCluster.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { trees: true } } },
    })
    return { clusters }
  })

  app.get('/clusters/:id/trees', async (request) => {
    const user = requireRole(request, 'ADMIN', 'FIELD_AUDITOR', 'ORGANISATION')
    const { id } = request.params as { id: string }
    const cluster = await app.db.treeCluster.findUnique({ where: { id } })
    if (!cluster) throw notFound('Cluster not found')
    if (user.role === 'ORGANISATION') assertOrganisationScope(user, cluster.organisationId)
    const trees = await app.db.tree.findMany({ where: { clusterId: id }, orderBy: { seq: 'asc' }, include: { tags: { where: { status: 'ACTIVE' } } } })
    return { cluster, trees: trees.map(serializeTree) }
  })

  // ---- trees
  app.post('/trees', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN', 'ORGANISATION')
    const input = parse(CreateTreeSchema, request.body)
    if (actor.role === 'ORGANISATION') {
      assertOrganisationScope(actor, input.organisationId ?? null)
    }
    const tree = await createTree(app.db, actor, input, meta(request))
    return reply.status(201).send({ tree: serializeTree(tree) })
  })

  app.get('/trees', async (request) => {
    const user = requireAuth(request)
    const query = request.query as { status?: string; species?: string; farmerId?: string; clusterId?: string; limit?: string }
    const where: Prisma.TreeWhereInput = {
      ...treeScope(user),
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.species ? { species: { equals: query.species, mode: 'insensitive' } } : {}),
      ...(query.farmerId && user.role !== 'FARMER' ? { farmerId: query.farmerId } : {}),
      ...(query.clusterId ? { clusterId: query.clusterId } : {}),
    }
    const limit = Math.min(500, Math.max(1, Number(query.limit) || 100))
    const trees = await app.db.tree.findMany({ where, orderBy: { seq: 'asc' }, take: limit, include: { tags: { where: { status: 'ACTIVE' } } } })
    return { trees: trees.map(serializeTree) }
  })

  app.get('/trees/:publicId', async (request) => {
    const user = requireAuth(request)
    const { publicId } = request.params as { publicId: string }
    const tree = await loadScopedTree(app, user, publicId)
    const [measurements, history, replacedBy] = await Promise.all([
      app.db.measurement.findMany({ where: { treeId: tree.id }, orderBy: { measurementDate: 'asc' }, include: { checks: true, photos: true } }),
      app.db.treeStatusHistory.findMany({ where: { treeId: tree.id }, orderBy: { createdAt: 'asc' } }),
      app.db.tree.findUnique({ where: { replacementForId: tree.id }, select: { publicId: true, status: true } }),
    ])
    return {
      tree: serializeTree(tree),
      measurements: measurements.map(serializeMeasurement),
      statusHistory: history,
      replacedBy,
    }
  })

  app.get('/trees/:publicId/measurements', async (request) => {
    const user = requireAuth(request)
    const { publicId } = request.params as { publicId: string }
    const tree = await loadScopedTree(app, user, publicId)
    const measurements = await app.db.measurement.findMany({ where: { treeId: tree.id }, orderBy: { measurementDate: 'asc' }, include: { checks: true, photos: true } })
    return { measurements: measurements.map(serializeMeasurement) }
  })

  app.post('/trees/:publicId/measurements', async (request, reply) => {
    const actor = requireRole(request, 'FARMER', 'FIELD_AUDITOR', 'ADMIN')
    const { publicId } = request.params as { publicId: string }
    const body = await readBody(request)
    const input = parse(SubmitMeasurementSchema, body.fields)
    const result = await submitMeasurement(app.db, app.storage, actor, publicId, input, body.file, meta(request))
    return reply.status(result.duplicate ? 200 : 201).send({
      measurement: serializeMeasurement(result.measurement),
      duplicate: result.duplicate,
    })
  })

  app.post('/trees/:publicId/status', async (request) => {
    const actor = requireRole(request, 'ADMIN', 'FIELD_AUDITOR')
    const { publicId } = request.params as { publicId: string }
    const input = parse(ChangeTreeStatusSchema, request.body)
    const tree = await changeTreeStatus(app.db, actor, publicId, input.status, input.reason, meta(request))
    return { tree: serializeTree(tree) }
  })

  app.post('/trees/:publicId/tags', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN', 'FIELD_AUDITOR')
    const { publicId } = request.params as { publicId: string }
    const input = parse(AttachTagSchema, request.body)
    const tag = await attachTag(app.db, actor, publicId, input.tagCode, input.reason, meta(request))
    return reply.status(201).send({ tag })
  })

  /** Public: the QR that goes on the physical tag. Contains only the public URL. */
  app.get('/trees/:publicId/qr.svg', async (request, reply) => {
    const { publicId } = request.params as { publicId: string }
    const tree = await findTreeByPublicId(app.db, publicId)
    const url = `${app.env.PUBLIC_TREE_BASE_URL.replace(/\/$/, '')}/tree/${tree.publicId}`
    const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#1f2721', light: '#ffffff' } })
    return reply.header('content-type', 'image/svg+xml').header('cache-control', 'public, max-age=86400').send(svg)
  })
}
