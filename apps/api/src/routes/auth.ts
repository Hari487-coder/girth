import type { FastifyInstance } from 'fastify'
import { LoginSchema } from '@girth/domain'
import { parse } from '../lib/validate.js'
import { unauthorized } from '../lib/errors.js'
import { createSession, destroySession, verifyPassword } from '../plugins/auth.js'

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/auth/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = parse(LoginSchema, request.body)
      const identifier = input.identifier.toLowerCase()
      const user = await app.db.user.findFirst({
        where: { OR: [{ email: identifier }, { phone: input.identifier }] },
        include: { farmer: { select: { id: true } } },
      })
      const ok = user?.passwordHash ? await verifyPassword(input.password, user.passwordHash) : false
      if (!user || !ok || user.status !== 'ACTIVE') throw unauthorized('Incorrect email/phone or password')
      await createSession(app, reply, request, user.id)
      return {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          organisationId: user.organisationId,
          farmerId: user.farmer?.id ?? null,
        },
      }
    },
  )

  app.post('/auth/logout', async (request, reply) => {
    await destroySession(app, reply, request)
    return { ok: true }
  })

  /** 200 with a null user when signed out: clients probe this on every load. */
  app.get('/auth/me', async (request) => {
    return { user: request.user }
  })
}
