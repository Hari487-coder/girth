import type { FastifyInstance } from 'fastify'
import { ExperimentSchema, UpdateSettingSchema } from '@girth/domain'
import { parse } from '../lib/validate.js'
import { notFound } from '../lib/errors.js'
import { requireRole } from '../plugins/auth.js'
import { recordAudit } from '../services/auditLog.js'
import { platformOverview } from '../services/reports.js'
import { SETTING_DEFAULTS } from '../services/settings.js'

const meta = (request: { id: string; ip: string }) => ({ requestId: request.id, ip: request.ip })

export async function platformRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    await app.db.$queryRaw`SELECT 1`
    return { ok: true, service: 'girth-api', time: new Date().toISOString() }
  })

  app.get('/analytics/overview', async (request) => {
    requireRole(request, 'ADMIN')
    return platformOverview(app.db)
  })

  app.get('/audit-log', async (request) => {
    requireRole(request, 'ADMIN')
    const query = request.query as { entityType?: string; entityId?: string; limit?: string }
    const entries = await app.db.auditLog.findMany({
      where: {
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(500, Math.max(1, Number(query.limit) || 100)),
      include: { actor: { select: { name: true, role: true } } },
    })
    return { entries }
  })

  // ---- settings
  app.get('/settings', async (request) => {
    requireRole(request, 'ADMIN')
    const rows = await app.db.setting.findMany()
    const settings = Object.entries(SETTING_DEFAULTS).map(([key, def]) => {
      const row = rows.find((r) => r.key === key)
      return { key, value: row?.value ?? def.value, description: def.description, isDefault: !row, updatedAt: row?.updatedAt ?? null }
    })
    return { settings }
  })

  app.put('/settings/:key', async (request) => {
    const actor = requireRole(request, 'ADMIN')
    const { key } = request.params as { key: string }
    if (!SETTING_DEFAULTS[key]) throw notFound(`Unknown setting ${key}`)
    const input = parse(UpdateSettingSchema, request.body)
    const setting = await app.db.$transaction(async (tx) => {
      const previous = await tx.setting.findUnique({ where: { key } })
      const saved = await tx.setting.upsert({
        where: { key },
        create: { key, value: input.value, description: SETTING_DEFAULTS[key]?.description, updatedById: actor.id },
        update: { value: input.value, updatedById: actor.id },
      })
      await recordAudit(tx, {
        actor,
        action: 'setting.changed',
        entityType: 'Setting',
        entityId: key,
        previousState: { value: previous?.value ?? SETTING_DEFAULTS[key]?.value },
        newState: { value: input.value },
        reason: input.reason,
        ...meta(request),
      })
      return saved
    })
    return { setting }
  })

  // ---- experiments (build -> measure -> learn)
  app.get('/experiments', async (request) => {
    requireRole(request, 'ADMIN')
    const experiments = await app.db.experiment.findMany({ orderBy: { code: 'asc' } })
    return { experiments }
  })

  app.post('/experiments', async (request, reply) => {
    const actor = requireRole(request, 'ADMIN')
    const input = parse(ExperimentSchema, request.body)
    const experiment = await app.db.$transaction(async (tx) => {
      const created = await tx.experiment.create({ data: input })
      await recordAudit(tx, { actor, action: 'experiment.created', entityType: 'Experiment', entityId: created.id, newState: created, ...meta(request) })
      return created
    })
    return reply.status(201).send({ experiment })
  })

  app.patch('/experiments/:id', async (request) => {
    const actor = requireRole(request, 'ADMIN')
    const { id } = request.params as { id: string }
    const input = parse(ExperimentSchema.partial(), request.body)
    const experiment = await app.db.$transaction(async (tx) => {
      const previous = await tx.experiment.findUnique({ where: { id } })
      if (!previous) throw notFound('Experiment not found')
      const updated = await tx.experiment.update({ where: { id }, data: input })
      await recordAudit(tx, { actor, action: 'experiment.updated', entityType: 'Experiment', entityId: id, previousState: previous, newState: updated, ...meta(request) })
      return updated
    })
    return { experiment }
  })
}
