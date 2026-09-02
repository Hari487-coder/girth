import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/plugins/auth.js'
import { Client, createTestApp, resetDatabase } from './helpers.js'

type Role = 'ADMIN' | 'FIELD_AUDITOR' | 'FARMER' | 'CUSTOMER' | 'ORGANISATION' | 'ANON'
const ROLES: Role[] = ['ADMIN', 'FIELD_AUDITOR', 'FARMER', 'CUSTOMER', 'ORGANISATION', 'ANON']

interface Rule {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH'
  url: string
  allowed: Role[]
}

/**
 * The authorisation matrix. A role that is not listed must get 401 (anonymous)
 * or 403; a listed role must get anything except 401/403 (400 for an empty
 * body still proves the gate opened). Every new private route belongs here.
 */
const RULES: Rule[] = [
  { method: 'GET', url: '/users', allowed: ['ADMIN'] },
  { method: 'POST', url: '/users', allowed: ['ADMIN'] },
  { method: 'POST', url: '/organisations', allowed: ['ADMIN'] },
  { method: 'GET', url: '/organisations', allowed: ['ADMIN', 'ORGANISATION'] },
  { method: 'POST', url: '/programs', allowed: ['ADMIN', 'ORGANISATION'] },
  { method: 'POST', url: '/farmers', allowed: ['ADMIN'] },
  { method: 'GET', url: '/farmers', allowed: ['ADMIN', 'FIELD_AUDITOR'] },
  { method: 'POST', url: '/land-plots', allowed: ['ADMIN'] },
  { method: 'GET', url: '/land-plots', allowed: ['ADMIN', 'FIELD_AUDITOR', 'FARMER'] },
  { method: 'POST', url: '/clusters', allowed: ['ADMIN', 'ORGANISATION'] },
  { method: 'GET', url: '/clusters', allowed: ['ADMIN', 'FIELD_AUDITOR', 'ORGANISATION'] },
  { method: 'POST', url: '/trees', allowed: ['ADMIN', 'ORGANISATION'] },
  { method: 'GET', url: '/trees', allowed: ['ADMIN', 'FIELD_AUDITOR', 'FARMER', 'CUSTOMER', 'ORGANISATION'] },
  { method: 'POST', url: '/trees/GIRTH-000001/status', allowed: ['ADMIN', 'FIELD_AUDITOR'] },
  { method: 'POST', url: '/trees/GIRTH-000001/tags', allowed: ['ADMIN', 'FIELD_AUDITOR'] },
  { method: 'POST', url: '/trees/GIRTH-000001/measurements', allowed: ['ADMIN', 'FIELD_AUDITOR', 'FARMER'] },
  { method: 'GET', url: '/measurements/queue', allowed: ['ADMIN', 'FIELD_AUDITOR'] },
  { method: 'POST', url: '/measurements/00000000-0000-0000-0000-000000000000/verify', allowed: ['ADMIN', 'FIELD_AUDITOR'] },
  { method: 'GET', url: '/audits', allowed: ['ADMIN', 'FIELD_AUDITOR'] },
  { method: 'POST', url: '/audits', allowed: ['ADMIN'] },
  { method: 'GET', url: '/payments/config', allowed: ['ADMIN', 'FIELD_AUDITOR', 'FARMER', 'CUSTOMER', 'ORGANISATION'] },
  { method: 'POST', url: '/payments/config', allowed: ['ADMIN'] },
  { method: 'GET', url: '/payments/ledger', allowed: ['ADMIN'] },
  { method: 'POST', url: '/payments/00000000-0000-0000-0000-000000000000/mark-paid', allowed: ['ADMIN'] },
  { method: 'POST', url: '/trees/GIRTH-000001/sponsorships', allowed: ['ADMIN', 'CUSTOMER'] },
  { method: 'POST', url: '/sponsorships/00000000-0000-0000-0000-000000000000/activate', allowed: ['ADMIN'] },
  { method: 'GET', url: '/sponsorships', allowed: ['ADMIN'] },
  { method: 'GET', url: '/me/farm', allowed: ['FARMER'] },
  { method: 'GET', url: '/me/payments', allowed: ['FARMER'] },
  { method: 'GET', url: '/me/trees', allowed: ['FARMER', 'CUSTOMER'] },
  { method: 'GET', url: '/analytics/overview', allowed: ['ADMIN'] },
  { method: 'GET', url: '/audit-log', allowed: ['ADMIN'] },
  { method: 'GET', url: '/settings', allowed: ['ADMIN'] },
  { method: 'PUT', url: '/settings/audit.sampling_rate', allowed: ['ADMIN'] },
  { method: 'GET', url: '/experiments', allowed: ['ADMIN'] },
  { method: 'POST', url: '/experiments', allowed: ['ADMIN'] },
]

describe('authorisation matrix', () => {
  let app: FastifyInstance
  let db: PrismaClient
  const clients = new Map<Role, Client>()

  beforeAll(async () => {
    const built = await createTestApp(inject('databaseUrl'))
    app = built.app
    db = built.db
    await resetDatabase(db)
    const password = 'matrix-password-1'
    const hash = await hashPassword(password)
    const org = await db.organisation.create({ data: { name: 'Matrix Org', organisationType: 'NGO' } })
    for (const role of ROLES) {
      if (role === 'ANON') {
        clients.set(role, new Client(app))
        continue
      }
      const user = await db.user.create({
        data: {
          name: role,
          email: `${role.toLowerCase()}@matrix.local`,
          passwordHash: hash,
          role,
          organisationId: role === 'ORGANISATION' ? org.id : null,
        },
      })
      if (role === 'FARMER') {
        await db.farmer.create({ data: { userId: user.id, legalName: 'Matrix Farmer', phone: '+910000000000', village: 'v', district: 'd', state: 's' } })
      }
      const client = new Client(app)
      await client.login(user.email!, password)
      clients.set(role, client)
    }
  })

  afterAll(async () => {
    await app.close()
    await db.$disconnect()
  })

  for (const rule of RULES) {
    for (const role of ROLES) {
      const shouldAllow = rule.allowed.includes(role)
      it(`${rule.method} ${rule.url} is ${shouldAllow ? 'open to' : 'closed to'} ${role}`, async () => {
        const res = await clients.get(role)!.request({ method: rule.method, url: rule.url, payload: rule.method === 'GET' ? undefined : {} })
        if (shouldAllow) {
          expect([401, 403]).not.toContain(res.statusCode)
        } else if (role === 'ANON') {
          expect(res.statusCode).toBe(401)
        } else {
          expect(res.statusCode).toBe(403)
        }
      })
    }
  }
})
