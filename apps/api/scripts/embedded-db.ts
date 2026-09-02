import { existsSync } from 'node:fs'
import { join } from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'

export interface EmbeddedDb {
  url: (database: string) => string
  createDatabase: (name: string) => Promise<void>
  stop: () => Promise<void>
}

/**
 * Runs a real PostgreSQL server from npm-managed binaries. Used for local
 * development and tests on machines without Docker; production uses a
 * managed Postgres.
 */
export async function startEmbeddedDb(options: {
  dir: string
  port: number
  persistent: boolean
}): Promise<EmbeddedDb> {
  const user = 'girth'
  const password = 'girth'
  const pg = new EmbeddedPostgres({
    databaseDir: options.dir,
    user,
    password,
    port: options.port,
    persistent: options.persistent,
    onLog: () => {},
    onError: (message: unknown) => {
      // postgres writes routine notices to stderr; only surface real failures
      const text = String(message)
      if (/FATAL|PANIC/.test(text)) console.error(text)
    },
  })

  if (!existsSync(join(options.dir, 'PG_VERSION'))) {
    await pg.initialise()
  }
  await pg.start()

  return {
    url: (database) => `postgresql://${user}:${password}@127.0.0.1:${options.port}/${database}`,
    createDatabase: async (name) => {
      try {
        await pg.createDatabase(name)
      } catch (error) {
        if (!/already exists/i.test(String(error))) throw error
      }
    },
    stop: () => pg.stop(),
  }
}
