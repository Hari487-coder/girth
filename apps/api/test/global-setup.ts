import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import type { TestProject } from 'vitest/node'
import { startEmbeddedDb, type EmbeddedDb } from '../scripts/embedded-db.js'

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

const TEST_DIR = './.pgdata-test'

/**
 * Tests run against a real, migrated PostgreSQL. CI provides DATABASE_URL_TEST
 * (a service container); locally an embedded server is started fresh.
 */
export default async function setup(project: TestProject) {
  let db: EmbeddedDb | undefined
  let url = process.env.DATABASE_URL_TEST

  if (!url) {
    rmSync(TEST_DIR, { recursive: true, force: true })
    db = await startEmbeddedDb({ dir: TEST_DIR, port: 5434, persistent: false })
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
    if (db) {
      await db.stop()
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  }
}
