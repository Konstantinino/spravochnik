/**
 * Local dev starter without Docker — uses embedded PostgreSQL.
 * Usage: npm run dev:local
 */
import EmbeddedPostgres from 'embedded-postgres'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runMigrations } from './migrate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dataDir = path.join(root, 'data', 'pg-embedded')
const mediaDir = path.join(root, 'data', 'media')
const updatesDir = path.join(root, 'data', 'updates')

async function main(): Promise<void> {
  fs.mkdirSync(dataDir, { recursive: true })
  fs.mkdirSync(mediaDir, { recursive: true })
  fs.mkdirSync(updatesDir, { recursive: true })

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'restinfo',
    password: 'restinfo_dev',
    port: 5433,
    persistent: true,
  })

  console.log('Starting embedded PostgreSQL on port 5433...')
  const clusterReady = fs.existsSync(path.join(dataDir, 'PG_VERSION'))
  if (!clusterReady) {
    await pg.initialise()
  } else {
    const stalePid = path.join(dataDir, 'postmaster.pid')
    if (fs.existsSync(stalePid)) {
      fs.unlinkSync(stalePid)
    }
  }
  await pg.start()

  const databaseUrl = `postgres://restinfo:restinfo_dev@127.0.0.1:5433/postgres`
  process.env.DATABASE_URL = databaseUrl
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'dev-local-secret'
  process.env.MEDIA_DIR = mediaDir
  process.env.UPDATES_DIR = updatesDir
  process.env.PORT = process.env.PORT ?? '3000'

  console.log('Running migrations...')
  await runMigrations()

  console.log('Starting API on http://127.0.0.1:3000 ...')
  await import('./index.js')

  const shutdown = async () => {
    console.log('Shutting down...')
    await pg.stop()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown())
  process.on('SIGTERM', () => void shutdown())
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
