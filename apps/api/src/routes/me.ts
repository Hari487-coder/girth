import type { FastifyInstance } from 'fastify'
import { growthSummary } from '@girth/domain'
import { forbidden } from '../lib/errors.js'
import { serializeTree } from '../lib/serialize.js'
import { requireAuth, requireRole } from '../plugins/auth.js'
import { farmerPaymentSummary } from '../services/payments.js'
import { farmSummary } from '../services/reports.js'

export async function meRoutes(app: FastifyInstance) {
  /** Farmer home: my farm in numbers, then the trees. Mobile-first, one screen. */
  app.get('/me/farm', async (request) => {
    const user = requireRole(request, 'FARMER')
    if (!user.farmerId) throw forbidden('This account is not linked to a farm')
    return farmSummary(app.db, user.farmerId)
  })

  app.get('/me/payments', async (request) => {
    const user = requireRole(request, 'FARMER')
    if (!user.farmerId) throw forbidden('This account is not linked to a farm')
    return farmerPaymentSummary(app.db, user.farmerId)
  })

  app.get('/me/trees', async (request) => {
    const user = requireAuth(request)
    if (user.role === 'FARMER') {
      const trees = await app.db.tree.findMany({
        where: { farmerId: user.farmerId ?? '' },
        orderBy: { seq: 'asc' },
        include: {
          tags: { where: { status: 'ACTIVE' } },
          measurements: { where: { verificationStatus: { in: ['PENDING_REVIEW', 'FLAGGED', 'REMEASURE_REQUIRED'] } }, select: { verificationStatus: true } },
        },
      })
      return {
        trees: trees.map((t) => ({
          ...serializeTree(t),
          pendingMeasurements: t.measurements.length,
        })),
      }
    }
    if (user.role === 'CUSTOMER') {
      const sponsorships = await app.db.sponsorship.findMany({
        where: { customerId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          tree: {
            include: { measurements: { where: { verificationStatus: 'VERIFIED' }, orderBy: { measurementDate: 'asc' } } },
          },
        },
      })
      return {
        trees: sponsorships.map((s) => {
          const summary = growthSummary(
            s.tree.measurements.map((m) => ({ measurementDate: m.measurementDate, girthCm: m.girthCm.toNumber() })),
          )
          const startGirth = s.girthAtStartCm?.toNumber() ?? null
          return {
            sponsorshipId: s.id,
            status: s.status,
            treeName: s.treeName,
            message: s.message,
            occasion: s.occasion,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            tree: { publicId: s.tree.publicId, species: s.tree.species, status: s.tree.status },
            currentGirthCm: summary.currentGirthCm,
            growthSinceSponsorshipCm:
              summary.currentGirthCm !== null && startGirth !== null ? Math.round((summary.currentGirthCm - startGirth) * 10) / 10 : null,
            lastVerifiedAt: summary.lastVerifiedAt,
            verifiedReadings: summary.readings,
          }
        }),
      }
    }
    throw forbidden()
  })
}
