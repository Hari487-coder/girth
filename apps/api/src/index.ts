import 'dotenv/config'
import { loadEnv } from './config/env.js'
import { buildApp } from './app.js'

const env = loadEnv()
const app = await buildApp({ env })

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down')
  await app.close()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await app.listen({ port: env.PORT, host: env.HOST })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
