import { randomUUID } from 'node:crypto'
import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { Prisma, type PrismaClient } from '@prisma/client'
import { TreeStatusError } from '@girth/domain'
import type { Env } from './config/env.js'
import { HttpError } from './lib/errors.js'
import { createPrisma } from './lib/prisma.js'
import { attachAuth } from './plugins/auth.js'
import { authRoutes } from './routes/auth.js'
import { commerceRoutes } from './routes/commerce.js'
import { meRoutes } from './routes/me.js'
import { peopleRoutes } from './routes/people.js'
import { platformRoutes } from './routes/platform.js'
import { publicRoutes } from './routes/publicRoutes.js'
import { treeRoutes } from './routes/trees.js'
import { verificationRoutes } from './routes/verification.js'
import { createStorage, type Storage } from './services/storage.js'

declare module 'fastify' {
  interface FastifyInstance {
    env: Env
    db: PrismaClient
    storage: Storage
  }
}

export interface BuildOptions {
  env: Env
  db?: PrismaClient
  storage?: Storage
}

export async function buildApp(options: BuildOptions): Promise<FastifyInstance> {
  const { env } = options
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: ['req.headers.cookie', 'req.headers.authorization'],
    },
    genReqId: () => randomUUID(),
    requestIdHeader: 'x-request-id',
    bodyLimit: 1024 * 1024,
    trustProxy: env.NODE_ENV === 'production',
  })

  app.decorate('env', env)
  app.decorate('db', options.db ?? createPrisma(env.DATABASE_URL))
  app.decorate('storage', options.storage ?? createStorage(env))

  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cors, {
    origin: env.WEB_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
    credentials: true,
  })
  await app.register(cookie, { secret: env.SESSION_SECRET })
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' })
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 20 } })

  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id)
  })

  attachAuth(app)

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ error: error.message, details: error.details, requestId: request.id })
    }
    if (error instanceof TreeStatusError) {
      return reply.status(422).send({ error: error.message, requestId: request.id })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return reply.status(409).send({ error: 'That record already exists', requestId: request.id })
      if (error.code === 'P2025') return reply.status(404).send({ error: 'Not found', requestId: request.id })
    }
    const message = error instanceof Error ? error.message : String(error)
    // integrity triggers raise messages prefixed with "girth:"
    const guard = /girth: ([^\n"]+)/.exec(message)
    if (guard) return reply.status(422).send({ error: guard[1], requestId: request.id })
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send({ error: message, requestId: request.id })
    }
    request.log.error({ err: error, requestId: request.id }, 'unhandled error')
    return reply.status(500).send({ error: 'Something went wrong', requestId: request.id })
  })

  await app.register(platformRoutes)
  await app.register(authRoutes)
  await app.register(peopleRoutes)
  await app.register(treeRoutes)
  await app.register(verificationRoutes)
  await app.register(commerceRoutes)
  await app.register(meRoutes)
  await app.register(publicRoutes)

  app.addHook('onClose', async () => {
    if (!options.db) await app.db.$disconnect()
  })

  return app
}
