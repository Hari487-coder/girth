import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { UserRole } from '@prisma/client'
import { forbidden, unauthorized } from '../lib/errors.js'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
  organisationId: string | null
  farmerId: string | null
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null
  }
}

export const SESSION_COOKIE = 'girth_session'
const BCRYPT_ROUNDS = 12

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/** The cookie carries a random token; the database stores only its hash. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(
  app: FastifyInstance,
  reply: FastifyReply,
  request: FastifyRequest,
  userId: string,
): Promise<void> {
  const token = randomBytes(32).toString('base64url')
  const ttlMs = app.env.SESSION_TTL_DAYS * 86_400_000
  await app.db.session.create({
    data: {
      id: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + ttlMs),
      ip: request.ip,
      userAgent: request.headers['user-agent']?.slice(0, 200),
    },
  })
  reply.setCookie(SESSION_COOKIE, token, {
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: app.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(ttlMs / 1000),
  })
}

export async function destroySession(
  app: FastifyInstance,
  reply: FastifyReply,
  request: FastifyRequest,
): Promise<void> {
  const raw = request.cookies[SESSION_COOKIE]
  if (raw) {
    const unsigned = request.unsignCookie(raw)
    if (unsigned.valid && unsigned.value) {
      await app.db.session.deleteMany({ where: { id: hashToken(unsigned.value) } })
    }
  }
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}

/** Resolves the session cookie into request.user on every request. */
export function attachAuth(app: FastifyInstance): void {
  app.decorateRequest('user', null)
  app.addHook('onRequest', async (request) => {
    request.user = null
    const raw = request.cookies[SESSION_COOKIE]
    if (!raw) return
    const unsigned = request.unsignCookie(raw)
    if (!unsigned.valid || !unsigned.value) return
    const session = await app.db.session.findUnique({
      where: { id: hashToken(unsigned.value) },
      include: { user: { include: { farmer: { select: { id: true } } } } },
    })
    if (!session || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') return
    request.user = {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
      organisationId: session.user.organisationId,
      farmerId: session.user.farmer?.id ?? null,
    }
  })
}

export function requireAuth(request: FastifyRequest): AuthUser {
  if (!request.user) throw unauthorized()
  return request.user
}

export function requireRole(request: FastifyRequest, ...roles: UserRole[]): AuthUser {
  const user = requireAuth(request)
  if (!roles.includes(user.role)) throw forbidden()
  return user
}

/** Organisation users only ever see their own organisation. */
export function assertOrganisationScope(user: AuthUser, organisationId: string | null | undefined): void {
  if (user.role === 'ADMIN') return
  if (user.role === 'ORGANISATION' && user.organisationId && user.organisationId === organisationId) return
  throw forbidden()
}
