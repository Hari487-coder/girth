import { execSync } from 'node:child_process'
import { readdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import type { TestProject } from 'vitest/node'
import { startEmbeddedDb, type EmbeddedDb } from '../scripts/embedded-db.js'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

const TEST_DIR_PREFIX = '.pgdata-test-'

/** Leftover clusters from interrupted runs; a fresh path avoids stale shared-memory clashes. */
function removeOldTestClusters() {
  for (const entry of readdirSync('.')) {
    if (entry.startsWith(TEST_DIR_PREFIX)) rmSync(entry, { recursive: true, force: true })
  }
}

/** A port nothing else holds, so an interrupted earlier run can never block this one. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

/**
 * Tests run against a real, migrated PostgreSQL. CI provides DATABASE_URL_TEST
 * (a service container); locally an embedded server is started fresh.
 */
export default async function setup(project: TestProject) {
  let db: EmbeddedDb | undefined
  let dir: string | undefined
  let url = process.env.DATABASE_URL_TEST

  if (!url) {
    removeOldTestClusters()
    dir = `${TEST_DIR_PREFIX}${process.pid}`
    db = await startEmbeddedDb({ dir, port: await freePort(), persistent: false })
    await db.createDatabase('girth_test')
    url = db.url('girth_test')
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  })

  process.env.DATABASE_URL = url
  project.provide('databaseUrl', url)

  return async () => {
    if (db && dir) {
      await db.stop()
      rmSync(dir, { recursive: true, force: true })
    }
  }
}
