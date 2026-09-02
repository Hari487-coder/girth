import type { FastifyInstance } from 'fastify'
import { growthSummary, LIVING_STATUSES } from '@girth/domain'
import { notFound, forbidden } from '../lib/errors.js'
import { requireAuth } from '../plugins/auth.js'
import { publicTreeProfile } from '../services/publicTree.js'
import { getNumberSetting, SETTING } from '../services/settings.js'

export async function publicRoutes(app: FastifyInstance) {
  /** Trees open for sponsorship: alive, verified at least once, not already sponsored. */
  app.get('/public/trees', { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } }, async (request, reply) => {
    const query = request.query as { species?: string; limit?: string }
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 60))
    const [trees, pricePaise, termYears] = await Promise.all([
      app.db.tree.findMany({
        where: {
          status: { in: [...LIVING_STATUSES] },
          sponsorships: { none: { status: { in: ['ACTIVE', 'PENDING_PAYMENT'] } } },
          ...(query.species ? { species: { equals: query.species, mode: 'insensitive' } } : {}),
        },
        orderBy: { seq: 'asc' },
        take: limit,
        include: {
          cluster: { select: { locationLabel: true } },
          farmer: { select: { district: true, state: true } },
          measurements: {
            where: { verificationStatus: 'VERIFIED' },
            orderBy: { measurementDate: 'asc' },
            select: { measurementDate: true, girthCm: true },
          },
        },
      }),
      getNumberSetting(app.db, SETTING.SPONSORSHIP_PRICE_PAISE),
      getNumberSetting(app.db, SETTING.SPONSORSHIP_TERM_YEARS),
    ])
    return reply.header('cache-control', 'public, max-age=60').send({
      pricePaise,
      termYears,
      trees: trees.map((t) => {
        const summary = growthSummary(t.measurements.map((m) => ({ measurementDate: m.measurementDate, girthCm: m.girthCm.toNumber() })))
        return {
          publicId: t.publicId,
          species: t.species,
          status: t.status,
          location: t.cluster?.locationLabel ?? (t.farmer ? `${t.farmer.district}, ${t.farmer.state}` : null),
          plantingYear: t.plantingDate?.getUTCFullYear() ?? null,
          currentGirthCm: summary.currentGirthCm,
          lastGrowthCm: summary.lastGrowthCm,
          totalGrowthCm: summary.totalGrowthCm,
          verifiedReadings: summary.readings,
          lastVerifiedAt: summary.lastVerifiedAt,
        }
      }),
    })
  })

  /** What a QR scan opens. No login, no farmer identity, no coordinates. */
  app.get('/public/trees/:publicId', { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { publicId } = request.params as { publicId: string }
    const [profile, pricePaise, termYears] = await Promise.all([
      publicTreeProfile(app.db, publicId),
      getNumberSetting(app.db, SETTING.SPONSORSHIP_PRICE_PAISE),
      getNumberSetting(app.db, SETTING.SPONSORSHIP_TERM_YEARS),
    ])
    return reply.header('cache-control', 'public, max-age=60').send({
      ...profile,
      sponsorable: profile.alive && !profile.sponsorship,
      pricePaise,
      termYears,
    })
  })

  app.get('/public/photos/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const photo = await app.db.photo.findUnique({ where: { id } })
    if (!photo || !photo.isPublic || !photo.thumbnailKey) throw notFound('Photo not found')
    const body = await app.storage.get(photo.thumbnailKey)
    return reply.header('content-type', 'image/jpeg').header('cache-control', 'public, max-age=86400').send(body)
  })

  /** Signed-in evidence access, scoped like the tree it belongs to. */
  app.get('/photos/:id/:variant', async (request, reply) => {
    const user = requireAuth(request)
    const { id, variant } = request.params as { id: string; variant: string }
    const photo = await app.db.photo.findUnique({
      where: { id },
      include: { tree: { select: { farmerId: true, organisationId: true, sponsorships: { select: { customerId: true } } } } },
    })
    if (!photo) throw notFound('Photo not found')
    const allowed =
      user.role === 'ADMIN' ||
      user.role === 'FIELD_AUDITOR' ||
      (user.role === 'FARMER' && photo.tree.farmerId === user.farmerId) ||
      (user.role === 'ORGANISATION' && photo.tree.organisationId === user.organisationId) ||
      (user.role === 'CUSTOMER' && (photo.isPublic || photo.tree.sponsorships.some((s) => s.customerId === user.id)))
    if (!allowed) throw forbidden()
    const key = variant === 'original' ? photo.storageKey : photo.thumbnailKey ?? photo.storageKey
    const body = await app.storage.get(key)
    return reply
      .header('content-type', variant === 'original' ? photo.mimeType : 'image/jpeg')
      .header('cache-control', 'private, max-age=3600')
      .send(body)
  })
}
