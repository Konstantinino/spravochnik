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
/** Optional browser SPA (web/dist). Used when front nginx proxies everything to the API. */
const WEB_DIST = process.env.WEB_DIST?.trim() || ''

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
    let webIndex = false
    let webAssets = 0
    if (WEB_DIST) {
      try {
        webIndex = fs.existsSync(path.join(WEB_DIST, 'index.html'))
        const assetsDir = path.join(WEB_DIST, 'assets')
        if (fs.existsSync(assetsDir)) {
          webAssets = fs.readdirSync(assetsDir).length
        }
      } catch {
        /* ignore */
      }
    }
    let mediaTop: string[] = []
    try {
      mediaTop = fs.readdirSync(MEDIA_DIR).slice(0, 20)
    } catch {
      /* ignore */
    }
    res.json({
      ok: true,
      time: new Date().toISOString(),
      features: { adminDepartments: true },
      web: { dist: WEB_DIST || null, index: webIndex, assets: webAssets },
      media: { dir: MEDIA_DIR, top: mediaTop },
      build: '2026-10-27-reorder-lock-v5',
    })
  })

  app.use('/auth', authRouter)
  app.use('/admin', adminRouter)
  app.use('/departments', topicsRouter)
  app.use('/media', mediaRouter)
  app.use('/sync', syncRouter)
  app.use('/app', updatesRouter)

  if (WEB_DIST && fs.existsSync(WEB_DIST)) {
    const indexHtml = path.join(WEB_DIST, 'index.html')
    app.use(express.static(WEB_DIST, { index: false, maxAge: '1h' }))
    // Never fall back to index.html for /assets — missing files must be real 404s.
    app.get(
      /^(?!\/(auth|admin|departments|media|sync|app|health|assets)(\/|$)).*/,
      (req, res, next) => {
        if (!fs.existsSync(indexHtml)) {
          next()
          return
        }
        res.sendFile(indexHtml)
      },
    )
    console.log(`Serving web SPA from ${WEB_DIST}`)
  }

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
