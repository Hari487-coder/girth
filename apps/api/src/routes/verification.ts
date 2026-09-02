import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { RecordAuditResultSchema, ReviewMeasurementSchema } from '@girth/domain'
import { parse } from '../lib/validate.js'
import { forbidden, notFound } from '../lib/errors.js'
import { readBody } from '../lib/multipart.js'
import { serializeMeasurement, serializePhoto } from '../lib/serialize.js'
import { requireAuth, requireRole } from '../plugins/auth.js'
import { recordAuditResult, scheduleAudit } from '../services/audits.js'
import { listQueue, reviewMeasurement } from '../services/measurements.js'

const meta = (request: { id: string; ip: string }) => ({ requestId: request.id, ip: request.ip })

export async function verificationRoutes(app: FastifyInstance) {
  app.get('/measurements/queue', async (request) => {
    requireRole(request, 'ADMIN', 'FIELD_AUDITOR')
    const queue = await listQueue(app.db)
    return {
      queue: queue.map((m) => ({
        ...serializeMeasurement(m),
        tree: { ...m.tree, currentGirthCm: m.tree.currentGirthCm ? m.tree.currentGirthCm.toNumber() : null },
        submittedBy: m.submittedBy,
      })),
    }
  })

  app.get('/measurements/:id', async (request) => {
    const user = requireAuth(request)
    const { id } = request.params as { id: string }
    const measurement = await app.db.measurement.findUnique({
      where: { id },
      include: { checks: true, photos: true, tree: { select: { publicId: true, farmerId: true, organisationId: true } }, audits: true },
    })
    if (!measurement) throw notFound('Measurement not found')
    const own =
      user.role === 'ADMIN' ||
      user.role === 'FIELD_AUDITOR' ||
      (user.role === 'FARMER' && measurement.tree.farmerId === user.farmerId) ||
      (user.role === 'ORGANISATION' && measurement.tree.organisationId === user.organisationId)
    if (!own) throw forbidden()
    return { measurement: { ...serializeMeasurement(measurement), tree: measurement.tree, audits: measurement.audits } }
  })

  const review = (decision: 'VERIFIED' | 'FLAGGED' | 'REMEASURE_REQUIRED') => async (request: FastifyRequest) => {
    const actor = requireRole(request, 'ADMIN', 'FIELD_AUDITOR')
    const { id } = request.params as { id: string }
    const body = parse(ReviewMeasurementSchema.omit({ decision: true }), request.body ?? {})
    const result = await reviewMeasurement(app.db, app.env, actor, id, { decision, notes: body.notes }, meta(request))
    return {
      measurement: serializeMeasurement(result.measurement),
      growthCm: result.growthCm,
      payout: result.payout,
      auditScheduled: result.auditScheduled,
    }
  }

  app.post('/measurements/:id/verify', review('VERIFIED'))
  app.post('/measurements/:id/flag', review('FLAGGED'))
  app.post('/measurements/:id/remeasure', review('REMEASURE_REQUIRED'))

  // ---- audits
  app.get('/audits', async (request) => {
    const user = requireRole(request, 'ADMIN', 'FIELD_AUDITOR')
    const { result } = request.query as { result?: string }
    const audits = await app.db.audit.findMany({
      where: {
        ...(result ? { result: result as never } : {}),
        ...(user.role === 'FIELD_AUDITOR' ? { OR: [{ auditorId: null }, { auditorId: user.id }] } : {}),
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        tree: { select: { publicId: true, species: true, status: true } },
        measurement: { select: { measurementDate: true, girthCm: true, verificationStatus: true } },
        photos: true,
      },
    })
    return {
      audits: audits.map((a) => ({
        ...a,
        reportedGirthCm: a.reportedGirthCm.toNumber(),
        observedGirthCm: a.observedGirthCm?.toNumber() ?? null,
        differenceCm: a.differenceCm?.toNumber() ?? null,
        measurement: { ...a.measurement, girthCm: a.measurement.girthCm.toNumber() },
        photos: a.photos.map(serializePhoto),
      })),
    }
  })

  app.post('/audits', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN')
    const input = parse(z.object({ measurementId: z.string().uuid(), reason: z.string().min(3).max(300) }), request.body)
    const measurement = await app.db.measurement.findUnique({ where: { id: input.measurementId } })
    if (!measurement) throw notFound('Measurement not found')
    const scheduled = await app.db.$transaction((tx) => scheduleAudit(tx, actor, measurement, input.reason, meta(request)))
    return reply.status(scheduled ? 201 : 200).send({ scheduled })
  })

  app.post('/audits/:id/result', async (request) => {
    const actor = requireRole(request, 'ADMIN', 'FIELD_AUDITOR')
    const { id } = request.params as { id: string }
    const body = await readBody(request)
    const input = parse(RecordAuditResultSchema, {
      ...body.fields,
      fraudSuspected: body.fields.fraudSuspected === 'true',
    })
    const audit = await recordAuditResult(app.db, app.storage, actor, id, input, body.file, meta(request))
    return {
      audit: {
        ...audit,
        reportedGirthCm: audit.reportedGirthCm.toNumber(),
        observedGirthCm: audit.observedGirthCm?.toNumber() ?? null,
        differenceCm: audit.differenceCm?.toNumber() ?? null,
      },
    }
  })
}
