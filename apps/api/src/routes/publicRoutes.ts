import type { FastifyInstance } from 'fastify'
import { notFound, forbidden } from '../lib/errors.js'
import { requireAuth } from '../plugins/auth.js'
import { publicTreeProfile } from '../services/publicTree.js'

export async function publicRoutes(app: FastifyInstance) {
  /** What a QR scan opens. No login, no farmer identity, no coordinates. */
  app.get('/public/trees/:publicId', { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { publicId } = request.params as { publicId: string }
    const profile = await publicTreeProfile(app.db, publicId)
    return reply.header('cache-control', 'public, max-age=60').send(profile)
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
