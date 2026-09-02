import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { Client, createAdmin, createTestApp, multipart, resetDatabase } from './helpers.js'

/** Inputs an attacker or a broken client would send. Each must fail safely. */
describe('abuse and malformed input', () => {
  let app: FastifyInstance
  let db: PrismaClient
  const admin = new Client(null as never)
  let treeId = ''

  beforeAll(async () => {
    const built = await createTestApp(inject('databaseUrl'))
    app = built.app
    db = built.db
    await resetDatabase(db)
    await createAdmin(db)
    Object.assign(admin, { app })
    await admin.login('admin@test.local', 'admin-password-1')
    const tree = await admin.post('/trees', { species: 'Mango', plantingDate: '2024-07-02' })
    treeId = tree.json().tree.publicId
  })

  afterAll(async () => {
    await app.close()
    await db.$disconnect()
  })

  it('rejects a non-image disguised as a photo', async () => {
    const form = multipart(
      { measurementDate: '2026-08-01', measurementHeightCm: '130', girthCm: '9' },
      { name: 'photo', filename: 'evil.jpg', buffer: Buffer.from('<script>alert(1)</script>'), mimetype: 'image/jpeg' },
    )
    const res = await admin.request({ method: 'POST', url: `/trees/${treeId}/measurements`, payload: form.payload, headers: form.headers })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/not a readable image/i)
    expect(await db.measurement.count()).toBe(0)
    expect(await db.photo.count()).toBe(0)
  })

  it('rejects an oversized upload', async () => {
    const form = multipart(
      { measurementDate: '2026-08-01', measurementHeightCm: '130', girthCm: '9' },
      { name: 'photo', filename: 'big.jpg', buffer: Buffer.alloc(11 * 1024 * 1024, 1), mimetype: 'image/jpeg' },
    )
    const res = await admin.request({ method: 'POST', url: `/trees/${treeId}/measurements`, payload: form.payload, headers: form.headers })
    expect([400, 413]).toContain(res.statusCode)
    expect(await db.measurement.count()).toBe(0)
  })

  it('rejects malformed JSON bodies with a 400, not a crash', async () => {
    const res = await admin.request({ method: 'POST', url: '/trees', payload: '{not json', headers: { 'content-type': 'application/json' } })
    expect(res.statusCode).toBe(400)
  })

  it('validates field bounds and reports the offending path', async () => {
    const res = await admin.post(`/trees/${treeId}/measurements`, { measurementDate: '2026-08-01', measurementHeightCm: 130, girthCm: 5000 })
    expect(res.statusCode).toBe(400)
    expect(JSON.stringify(res.json().details)).toContain('girthCm')
  })

  it('returns 404, not a stack trace, for unknown ids', async () => {
    const res = await admin.get('/trees/GIRTH-999999')
    expect(res.statusCode).toBe(404)
    expect(res.body).not.toMatch(/at .*\.ts:\d+/)
  })

  it('rate-limits repeated failed logins', async () => {
    let limited = false
    for (let i = 0; i < 12; i++) {
      const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { identifier: 'nobody@test.local', password: 'wrong-password-1' } })
      if (res.statusCode === 429) {
        limited = true
        break
      }
      expect(res.statusCode).toBe(401)
    }
    expect(limited).toBe(true)
  })

  it('does not reveal whether an account exists', async () => {
    const unknown = await app.inject({ method: 'POST', url: '/auth/login', payload: { identifier: 'ghost@test.local', password: 'wrong-password-1' }, remoteAddress: '10.9.9.9' })
    const known = await app.inject({ method: 'POST', url: '/auth/login', payload: { identifier: 'admin@test.local', password: 'wrong-password-1' }, remoteAddress: '10.9.9.8' })
    expect(unknown.statusCode).toBe(401)
    expect(known.statusCode).toBe(401)
    expect(unknown.json().error).toBe(known.json().error)
  })

  it('echoes a request id on errors for support correlation', async () => {
    const res = await app.inject({ method: 'GET', url: '/measurements/queue' })
    expect(res.statusCode).toBe(401)
    expect(res.headers['x-request-id']).toBeTruthy()
    expect(res.json().requestId).toBe(res.headers['x-request-id'])
  })
})
