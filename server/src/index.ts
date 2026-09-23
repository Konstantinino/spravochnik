import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import fs from 'node:fs'
import path from 'node:path'
import { runMigrations } from './migrate.js'
import { migrateLegacyServerMedia, purgeOrphanTopicMedia } from './lib/media-layout.js'
import { ensureBootstrapWhitelist, ensureOwnerRole, authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { topicsRouter } from './routes/topics.js'
import { mediaRouter } from './routes/media.js'
import { syncRouter } from './routes/sync.js'
import { updatesRouter } from './routes/updates.js'

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const MEDIA_DIR = process.env.MEDIA_DIR ?? path.join(process.cwd(), 'data', 'media')
const UPDATES_DIR = process.env.UPDATES_DIR ?? path.join(process.cwd(), 'data', 'updates')

async function main(): Promise<void> {
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  fs.mkdirSync(UPDATES_DIR, { recursive: true })

  await runMigrations()
  await migrateLegacyServerMedia(MEDIA_DIR)
  const purgedMedia = await purgeOrphanTopicMedia(MEDIA_DIR)
  if (purgedMedia > 0) {
    console.log(`Purged ${purgedMedia} orphan media file record(s) for deleted topics`)
  }
  await ensureBootstrapWhitelist()
  await ensureOwnerRole()

  const app = express()
  const corsOrigin = process.env.CORS_ORIGIN?.trim()
  app.use(
    cors({
      origin: corsOrigin || '*',
      credentials: Boolean(corsOrigin),
    }),
  )
  app.use(cookieParser())
  app.use(express.json({ limit: '10mb' }))

  app.get('/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() })
  })

  app.use('/auth', authRouter)
  app.use('/admin', adminRouter)
  app.use('/departments', topicsRouter)
  app.use('/media', mediaRouter)
  app.use('/sync', syncRouter)
  app.use('/app', updatesRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  app.listen(PORT, () => {
    console.log(`REST INFO API listening on port ${PORT}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
