import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { query } from '../db/pool.js'

const UPDATES_DIR = process.env.UPDATES_DIR ?? path.join(process.cwd(), 'data', 'updates')

export const updatesRouter = Router()

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0)
  const pb = b.replace(/^v/i, '').split(/[.+-]/).map((x) => parseInt(x, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da - db
  }
  return 0
}

updatesRouter.get('/update', async (req, res) => {
  try {
    const currentVersion = String(req.query.currentVersion ?? '0.0.0')
    const result = await query<{
      version: string
      setup_filename: string
      notes: string
    }>(`SELECT version, setup_filename, notes FROM app_releases ORDER BY published_at DESC LIMIT 1`)

    const release = result.rows[0]
    if (!release) {
      res.json({
        available: false,
        currentVersion,
        version: null,
        downloadUrl: null,
        notes: null,
      })
      return
    }

    const available = compareVersions(release.version, currentVersion) > 0
    const baseUrl = `${req.protocol}://${req.get('host')}`

    res.json({
      available,
      currentVersion,
      version: release.version,
      setupFilename: release.setup_filename,
      downloadUrl: `${baseUrl}/app/download/${encodeURIComponent(release.setup_filename)}`,
      notes: release.notes,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

updatesRouter.get('/download/:filename', (req, res) => {
  try {
    fs.mkdirSync(UPDATES_DIR, { recursive: true })
    const filename = path.basename(req.params.filename)
    const filePath = path.join(UPDATES_DIR, filename)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Файл не найден' })
      return
    }
    res.download(filePath, filename)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка скачивания' })
  }
})
