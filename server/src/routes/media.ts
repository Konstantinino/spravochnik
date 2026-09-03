import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'
import { query, bumpGlobalVersion } from '../db/pool.js'
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js'

const MEDIA_DIR = process.env.MEDIA_DIR ?? path.join(process.cwd(), 'data', 'media')
const UPDATES_DIR = process.env.UPDATES_DIR ?? path.join(process.cwd(), 'data', 'updates')
const UPLOAD_MAX_BYTES = 120 * 1024 * 1024

export const mediaRouter = Router()

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, MEDIA_DIR)
    },
    filename: (_req, file, cb) => {
      cb(null, file.originalname)
    },
  }),
  limits: { fileSize: UPLOAD_MAX_BYTES },
})

function mediaRelParam(req: { params: Record<string, unknown>; path: string }): string {
  const fromParams = req.params['0']
  if (typeof fromParams === 'string') return fromParams
  if (Array.isArray(fromParams) && typeof fromParams[0] === 'string') return fromParams[0]
  const prefix = '/media/'
  if (req.path.startsWith(prefix)) return req.path.slice(prefix.length)
  return ''
}

function ensureMediaDir(): void {
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
}

function ensureUpdatesDir(): void {
  fs.mkdirSync(UPDATES_DIR, { recursive: true })
}

function sha256File(filePath: string): string {
  const data = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(data).digest('hex')
}

mediaRouter.post(
  '/upload',
  authMiddleware,
  requireRole('editor', 'admin'),
  (req, res, next) => {
    ensureMediaDir()
    ensureUpdatesDir()
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message })
        return
      }
      next()
    })
  },
  async (req: AuthRequest, res) => {
    try {
      const file = req.file
      const relativePath = String(req.body.relativePath ?? '')
      if (!file || !relativePath) {
        res.status(400).json({ error: 'Укажите file и relativePath' })
        return
      }

      const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
      if (normalized.includes('..')) {
        res.status(400).json({ error: 'Недопустимый путь' })
        return
      }

      // App installers go to UPDATES_DIR (served by GET /app/download/…), not media volume.
      if (normalized.startsWith('updates/')) {
        const filename = path.basename(normalized)
        const destPath = path.join(UPDATES_DIR, filename)
        if (file.path !== destPath) {
          fs.renameSync(file.path, destPath)
        }
        const sha256 = sha256File(destPath)
        const stat = fs.statSync(destPath)
        res.json({
          ok: true,
          relativePath: `updates/${filename}`,
          sha256,
          sizeBytes: stat.size,
        })
        return
      }

      const destPath = path.join(MEDIA_DIR, normalized)
      fs.mkdirSync(path.dirname(destPath), { recursive: true })

      if (file.path !== destPath) {
        fs.renameSync(file.path, destPath)
      }

      const sha256 = sha256File(destPath)
      const stat = fs.statSync(destPath)
      const parts = normalized.match(/^media\/(\d+)\//)
      const topicId = parts ? parseInt(parts[1], 10) : null
      const departmentId = req.body.departmentId ? String(req.body.departmentId) : null

      await query(
        `INSERT INTO media_files (topic_id, department_id, relative_path, sha256, size_bytes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (relative_path) DO UPDATE SET
           sha256 = $4, size_bytes = $5, updated_at = NOW(), deleted_at = NULL`,
        [topicId, departmentId, normalized, sha256, stat.size],
      )
      await bumpGlobalVersion()

      res.json({ ok: true, relativePath: normalized, sha256, sizeBytes: stat.size })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка загрузки' })
    }
  },
)

mediaRouter.get('/manifest/all', async (_req, res) => {
  try {
    const result = await query<{
      relative_path: string
      sha256: string | null
      size_bytes: string | null
      updated_at: string
    }>(
      `SELECT relative_path, sha256, size_bytes, updated_at FROM media_files WHERE deleted_at IS NULL`,
    )
    res.json({ files: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

mediaRouter.get('/*', (req, res) => {
  try {
    ensureMediaDir()
    const rel = mediaRelParam(req)
    const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '')
    if (normalized.includes('..')) {
      res.status(400).json({ error: 'Недопустимый путь' })
      return
    }
    const filePath = path.join(MEDIA_DIR, normalized)
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Файл не найден' })
      return
    }
    res.sendFile(filePath)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

mediaRouter.delete(
  '/*',
  authMiddleware,
  requireRole('editor', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const rel = mediaRelParam(req)
      const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '')
      if (normalized.includes('..')) {
        res.status(400).json({ error: 'Недопустимый путь' })
        return
      }
      const filePath = path.join(MEDIA_DIR, normalized)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      await query(
        `UPDATE media_files SET deleted_at = NOW(), updated_at = NOW() WHERE relative_path = $1`,
        [normalized],
      )
      await bumpGlobalVersion()
      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка удаления' })
    }
  },
)
