import { startEmbeddedDb } from './embedded-db.js'

// Local development database. Keeps running until Ctrl+C.
const db = await startEmbeddedDb({ dir: './.pgdata', port: 5433, persistent: true })
await db.createDatabase('girth')
console.log(`Postgres ready: ${db.url('girth')}`)
console.log('Run `npm run db:migrate` then `npm run db:seed` in another terminal. Ctrl+C to stop.')

const shutdown = async () => {
  await db.stop()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
