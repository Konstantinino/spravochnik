import { Router, type NextFunction, type Response } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'
import { query, bumpGlobalVersion } from '../db/pool.js'
import { canEditDepartment, isStaffRole } from '../lib/auth-utils.js'
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth.js'
import {
  blockWritesIfClientOutdated,
  requireCurrentClientVersion,
} from '../middleware/min-client-version.js'
import {
  canonicalizeMediaRelativePath,
  mediaRelativePathCandidates,
  moveFileSafe,
  parseMediaRelativePath,
  resolveExistingMediaFile,
} from '../lib/media-layout.js'

const MEDIA_DIR = process.env.MEDIA_DIR ?? path.join(process.cwd(), 'data', 'media')
const UPDATES_DIR = process.env.UPDATES_DIR ?? path.join(process.cwd(), 'data', 'updates')
const UPLOAD_MAX_BYTES = 120 * 1024 * 1024

export const mediaRouter = Router()

function requireClientVersionUnlessUpdatesUpload(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const relativePath = String(req.body?.relativePath ?? '')
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (normalized.startsWith('updates/')) {
    next()
    return
  }
  void requireCurrentClientVersion(req, res, next)
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const relativePath = String(req.body?.relativePath ?? '')
      const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
      if (normalized.startsWith('updates/')) {
        ensureUpdatesDir()
        cb(null, UPDATES_DIR)
        return
      }
      ensureMediaDir()
      cb(null, MEDIA_DIR)
    },
    filename: (_req, file, cb) => {
      cb(null, file.originalname)
    },
  }),
  limits: { fileSize: UPLOAD_MAX_BYTES },
})

function paramCapture(params: Record<string, unknown>): string {
  // Express/path-to-regexp may put the /* splat in "0" or "" depending on version.
  for (const key of ['0', ''] as const) {
    const v = params[key]
    if (typeof v === 'string' && v) return v.replace(/^\/+/, '')
    if (Array.isArray(v) && typeof v[0] === 'string' && v[0]) return v[0].replace(/^\/+/, '')
  }
  return ''
}

function mediaRelParam(req: { params: Record<string, unknown>; path: string; url?: string }): string {
  const fromParams = paramCapture(req.params)
  if (fromParams) return fromParams
  // Inside app.use('/media', …) remainder is e.g. /media/support/… or /support/…
  const remainder = (req.path || '').replace(/^\/+/, '')
  if (remainder.startsWith('media/')) return remainder
  if (remainder) return remainder
  const urlPath = (req.url || '').split('?')[0] || ''
  return urlPath.replace(/^\/+/, '')
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
  requireRole('editor', 'admin', 'owner'),
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
  requireClientVersionUnlessUpdatesUpload,
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

      const parsedEarly = parseMediaRelativePath(normalized)
      const uploadDept =
        parsedEarly.departmentId ??
        (req.body.departmentId ? String(req.body.departmentId) : null)
      if (
        uploadDept &&
        !canEditDepartment(req.user!.role, req.user!.departmentId, uploadDept)
      ) {
        res.status(403).json({ error: 'Редактор может изменять только свой отдел' })
        return
      }

      // App installers go to UPDATES_DIR (served by GET /app/download/…), not media volume.
      if (normalized.startsWith('updates/')) {
        if (!isStaffRole(req.user!.role)) {
          res.status(403).json({ error: 'Публикация обновлений доступна только admin/owner' })
          return
        }
        const filename = path.basename(normalized)
        const destPath = path.join(UPDATES_DIR, filename)
        if (file.path !== destPath) {
          moveFileSafe(file.path, destPath)
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

      const destRel = canonicalizeMediaRelativePath(
        normalized,
        req.body.departmentId || parseMediaRelativePath(normalized).departmentId,
      )
      const destPath = path.join(MEDIA_DIR, destRel)
      fs.mkdirSync(path.dirname(destPath), { recursive: true })

      if (file.path !== destPath) {
        moveFileSafe(file.path, destPath)
      }

      const sha256 = sha256File(destPath)
      const stat = fs.statSync(destPath)
      const parsed = parseMediaRelativePath(destRel)
      const topicId = parsed.topicId
      const departmentId =
        parsed.departmentId ??
        (req.body.departmentId ? String(req.body.departmentId) : null)

      await query(
        `INSERT INTO media_files (topic_id, department_id, relative_path, sha256, size_bytes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (relative_path) DO UPDATE SET
           sha256 = $4, size_bytes = $5, department_id = COALESCE($2, media_files.department_id),
           topic_id = COALESCE($1, media_files.topic_id),
           updated_at = NOW(), deleted_at = NULL`,
        [topicId, departmentId, destRel, sha256, stat.size],
      )
      await bumpGlobalVersion()

      res.json({ ok: true, relativePath: destRel, sha256, sizeBytes: stat.size })
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

function resolveMediaFileForRequest(normalized: string): string | null {
  let filePath = resolveExistingMediaFile(MEDIA_DIR, normalized)
  // Accept /media/support/… (mount already provides /media) as alias of storage key media/support/…
  if (!filePath && normalized && !normalized.startsWith('media/')) {
    filePath = resolveExistingMediaFile(MEDIA_DIR, `media/${normalized}`)
  }
  return filePath
}

const EXT_CONTENT_TYPE: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

function sendMediaFile(res: Response, filePath: string): void {
  const ext = path.extname(filePath).toLowerCase()
  const type = EXT_CONTENT_TYPE[ext] || 'application/octet-stream'
  let stat: fs.Stats
  try {
    stat = fs.statSync(filePath)
  } catch (err) {
    console.error('media stat failed', filePath, err)
    res.status(500).json({ error: 'Ошибка чтения файла', code: (err as NodeJS.ErrnoException).code })
    return
  }
  if (!stat.isFile()) {
    res.status(404).json({ error: 'Файл не найден' })
    return
  }
  res.setHeader('Content-Type', type)
  res.setHeader('Content-Length', String(stat.size))
  res.setHeader('Cache-Control', 'public, max-age=86400')
  const stream = fs.createReadStream(filePath)
  stream.on('error', (err) => {
    console.error('media stream failed', filePath, err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка чтения файла', code: (err as NodeJS.ErrnoException).code })
      return
    }
    res.destroy(err)
  })
  stream.pipe(res)
}

/** JSON probe for ops: media volume top-level listing. */
mediaRouter.get('/_stat', (_req, res) => {
  try {
    ensureMediaDir()
    const top = fs.readdirSync(MEDIA_DIR).slice(0, 80)
    res.json({ mediaDir: MEDIA_DIR, top })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка', detail: String(err) })
  }
})

/** JSON probe for ops: does the file resolve on disk / is it readable? */
mediaRouter.get('/_stat/*', (req, res) => {
  try {
    ensureMediaDir()
    // path is /_stat/<rel> inside the /media mount
    const normalized = req.path
      .replace(/^\/_stat\/?/, '')
      .replace(/^\/+/, '')
      .replace(/\\/g, '/')
    if (!normalized || normalized.includes('..')) {
      res.status(400).json({ error: 'Недопустимый путь', path: req.path })
      return
    }
    const candidates = mediaRelativePathCandidates(
      normalized.startsWith('media/') ? normalized : `media/${normalized}`,
    )
    const resolved = resolveMediaFileForRequest(normalized)
    let readable: boolean | null = null
    let size: number | null = null
    let readError: string | null = null
    if (resolved) {
      try {
        fs.accessSync(resolved, fs.constants.R_OK)
        readable = true
        size = fs.statSync(resolved).size
      } catch (err) {
        readable = false
        readError = (err as NodeJS.ErrnoException).code || String(err)
      }
    }
    res.json({
      mediaDir: MEDIA_DIR,
      requested: normalized,
      resolved,
      readable,
      size,
      readError,
      candidates: candidates.map((c) => ({
        rel: c,
        abs: path.join(MEDIA_DIR, ...c.split('/')),
        exists: fs.existsSync(path.join(MEDIA_DIR, ...c.split('/'))),
        absStripped: c.startsWith('media/')
          ? path.join(MEDIA_DIR, ...c.slice('media/'.length).split('/'))
          : null,
        existsStripped: c.startsWith('media/')
          ? fs.existsSync(path.join(MEDIA_DIR, ...c.slice('media/'.length).split('/')))
          : null,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

// Use RegExp so nested paths are taken from req.path (avoids brittle /* splat params).
mediaRouter.get(/.*/, (req, res, next) => {
  try {
    const normalized = req.path.replace(/^\/+/, '').replace(/\\/g, '/')
    if (
      !normalized ||
      normalized === 'manifest/all' ||
      normalized === '_stat' ||
      normalized.startsWith('_stat/') ||
      normalized === 'upload'
    ) {
      next()
      return
    }
    if (normalized.includes('..')) {
      res.status(400).json({ error: 'Недопустимый путь' })
      return
    }
    ensureMediaDir()
    const filePath = resolveMediaFileForRequest(normalized)
    if (!filePath) {
      res.status(404).json({ error: 'Файл не найден', path: normalized })
      return
    }
    sendMediaFile(res, filePath)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка' })
  }
})

mediaRouter.delete(
  /.*/,
  authMiddleware,
  requireRole('editor', 'admin', 'owner'),
  blockWritesIfClientOutdated,
  async (req: AuthRequest, res) => {
    try {
      const normalized = req.path.replace(/^\/+/, '').replace(/\\/g, '/')
      if (!normalized || normalized.includes('..')) {
        res.status(400).json({ error: 'Недопустимый путь' })
        return
      }
      const parsed = parseMediaRelativePath(normalized)
      if (
        parsed.departmentId &&
        !canEditDepartment(req.user!.role, req.user!.departmentId, parsed.departmentId)
      ) {
        res.status(403).json({ error: 'Редактор может изменять только свой отдел' })
        return
      }
      const candidates = mediaRelativePathCandidates(normalized)
      for (const rel of candidates) {
        const filePath = resolveExistingMediaFile(MEDIA_DIR, rel)
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
      await query(
        `UPDATE media_files SET deleted_at = NOW(), updated_at = NOW()
          WHERE relative_path = ANY($1::text[])`,
        [candidates],
      )
      await bumpGlobalVersion()
      res.json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Ошибка удаления' })
    }
  },
)
