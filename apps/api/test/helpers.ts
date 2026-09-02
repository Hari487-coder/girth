import { randomUUID } from 'node:crypto'
import type { FastifyInstance, InjectOptions } from 'fastify'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import { buildApp } from '../src/app.js'
import { loadEnv } from '../src/config/env.js'
import { hashPassword, SESSION_COOKIE } from '../src/plugins/auth.js'

export async function createTestApp(databaseUrl: string) {
  const env = loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    SESSION_SECRET: 'test-secret-test-secret-test-secret-test-secret',
    STORAGE_DRIVER: 'local',
    STORAGE_LOCAL_DIR: `./.storage-test/${randomUUID()}`,
    AUDIT_SAMPLING_SALT: 'test-salt',
    LOG_LEVEL: 'error',
    PUBLIC_TREE_BASE_URL: 'https://girth.app',
  })
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  const app = await buildApp({ env, db })
  return { app, db, env }
}

/** Wipe every table; TRUNCATE bypasses the append-only row triggers by design. */
export async function resetDatabase(db: PrismaClient) {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
  const names = tables.map((t) => `"${t.tablename}"`).join(', ')
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`)
}

export async function createAdmin(db: PrismaClient) {
  return db.user.create({
    data: { name: 'Test Admin', email: 'admin@test.local', passwordHash: await hashPassword('admin-password-1'), role: 'ADMIN' },
  })
}

export class Client {
  private cookie: string | null = null
  constructor(private readonly app: FastifyInstance) {}

  async login(identifier: string, password: string) {
    const res = await this.app.inject({ method: 'POST', url: '/auth/login', payload: { identifier, password } })
    if (res.statusCode !== 200) throw new Error(`login failed: ${res.statusCode} ${res.body}`)
    const cookie = res.cookies.find((c) => c.name === SESSION_COOKIE)
    if (!cookie) throw new Error('no session cookie')
    this.cookie = cookie.value
    return res.json()
  }

  request(options: InjectOptions) {
    return this.app.inject({
      ...options,
      cookies: this.cookie ? { [SESSION_COOKIE]: this.cookie } : undefined,
    })
  }

  get(url: string) {
    return this.request({ method: 'GET', url })
  }

  post(url: string, payload?: unknown) {
    return this.request({ method: 'POST', url, payload: payload as never })
  }

  put(url: string, payload?: unknown) {
    return this.request({ method: 'PUT', url, payload: payload as never })
  }
}

/** A real JPEG so the evidence pipeline (sharp) exercises the same path as production. */
export async function fakePhoto(): Promise<Buffer> {
  return sharp({ create: { width: 640, height: 480, channels: 3, background: { r: 120, g: 90, b: 60 } } })
    .jpeg({ quality: 70 })
    .toBuffer()
}

export function multipart(fields: Record<string, string>, file?: { name: string; filename: string; buffer: Buffer; mimetype: string }) {
  const boundary = `----girth${randomUUID().replace(/-/g, '')}`
  const parts: Buffer[] = []
  for (const [name, value] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`))
  }
  if (file) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${file.mimetype}\r\n\r\n`,
      ),
      file.buffer,
      Buffer.from('\r\n'),
    )
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`))
  const payload = Buffer.concat(parts)
  return { payload, headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': String(payload.length) } }
}
