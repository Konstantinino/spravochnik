import fs from 'node:fs'
import path from 'node:path'
import { query } from '../db/pool.js'

export const MEDIA_DEPARTMENT_IDS = [
  'support',
  'lawyers',
  'managers',
  'spp',
  'templates',
] as const

export type MediaDepartmentId = (typeof MEDIA_DEPARTMENT_IDS)[number]
export const DEFAULT_MEDIA_DEPARTMENT: MediaDepartmentId = 'support'

export function isMediaDepartmentId(value: unknown): value is MediaDepartmentId {
  return typeof value === 'string' && (MEDIA_DEPARTMENT_IDS as readonly string[]).includes(value)
}

export function normalizeMediaDepartmentId(value: unknown): MediaDepartmentId {
  return isMediaDepartmentId(value) ? value : DEFAULT_MEDIA_DEPARTMENT
}

export function posixMediaRel(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/+/, '')
}

export function canonicalizeMediaRelativePath(
  relativePath: string,
  departmentId: unknown = DEFAULT_MEDIA_DEPARTMENT,
): string {
  const n = posixMediaRel(relativePath)
  const dept = normalizeMediaDepartmentId(departmentId)
  if (!n.startsWith('media/')) return n
  const rest = n.slice('media/'.length)
  if (!rest || rest.startsWith('_draft/')) return n
  const parts = rest.split('/')
  const first = parts[0] ?? ''
  if (isMediaDepartmentId(first)) return n
  if (/^\d+$/.test(first) && parts.length >= 2) {
    return `media/${dept}/${rest}`
  }
  if (parts.length === 1 && first) {
    return `media/${dept}/${first}`
  }
  return n
}

export function mediaRelativePathCandidates(
  relativePath: string,
  departmentId: unknown = DEFAULT_MEDIA_DEPARTMENT,
): string[] {
  const n = posixMediaRel(relativePath)
  const canonical = canonicalizeMediaRelativePath(n, departmentId)
  const out: string[] = []
  const add = (p: string) => {
    if (p && !out.includes(p)) out.push(p)
  }
  add(n)
  add(canonical)
  add(canonical.replace(/^media\/(?:support|lawyers|managers|spp|templates)\//, 'media/'))
  return out
}

export function parseMediaRelativePath(relativePath: string): {
  departmentId: MediaDepartmentId | null
  topicId: number | null
  kind: 'photos' | 'files' | null
} {
  const n = posixMediaRel(relativePath)
  const nested = n.match(
    /^media\/(?:(support|lawyers|managers|spp|templates)\/)?(\d+)\/(images|files)\//,
  )
  if (nested) {
    return {
      departmentId: isMediaDepartmentId(nested[1]) ? nested[1] : null,
      topicId: parseInt(nested[2], 10),
      kind: nested[3] === 'images' ? 'photos' : 'files',
    }
  }
  const deptPrefix = n.match(/^media\/(support|lawyers|managers|spp|templates)\//)
  const isPhoto = /\.(png|jpe?g|gif|webp|bmp)$/i.test(n)
  return {
    departmentId: deptPrefix && isMediaDepartmentId(deptPrefix[1]) ? deptPrefix[1] : null,
    topicId: null,
    kind: isPhoto ? 'photos' : n.startsWith('media/') ? 'files' : null,
  }
}

export function absoluteMediaCandidates(mediaDir: string, relativePath: string): string[] {
  const out: string[] = []
  const add = (p: string) => {
    if (p && !out.includes(p)) out.push(p)
  }
  for (const rel of mediaRelativePathCandidates(relativePath)) {
    add(path.join(mediaDir, ...posixMediaRel(rel).split('/')))
    if (rel.startsWith('media/')) {
      add(path.join(mediaDir, ...rel.slice('media/'.length).split('/')))
    }
  }
  return out
}

export function resolveExistingMediaFile(mediaDir: string, relativePath: string): string | null {
  for (const abs of absoluteMediaCandidates(mediaDir, relativePath)) {
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs
  }
  return null
}

function moveFile(from: string, to: string): void {
  if (!fs.existsSync(from) || path.resolve(from) === path.resolve(to)) return
  fs.mkdirSync(path.dirname(to), { recursive: true })
  if (!fs.existsSync(to)) fs.renameSync(from, to)
}

function moveTree(fromDir: string, toDir: string): void {
  if (!fs.existsSync(fromDir)) return
  fs.mkdirSync(toDir, { recursive: true })
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name)
    const to = path.join(toDir, entry.name)
    if (entry.isDirectory()) moveTree(from, to)
    else moveFile(from, to)
  }
  try {
    fs.rmSync(fromDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

function migrateFolderContents(
  srcParent: string,
  destDeptDir: string,
  skip: Set<string>,
): void {
  if (!fs.existsSync(srcParent)) return
  fs.mkdirSync(destDeptDir, { recursive: true })
  for (const entry of fs.readdirSync(srcParent, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const from = path.join(srcParent, entry.name)
    const to = path.join(destDeptDir, entry.name)
    if (entry.isDirectory() && /^\d+$/.test(entry.name)) {
      moveTree(from, to)
    } else if (entry.isFile()) {
      moveFile(from, to)
    }
  }
}

/** Existing photos are support. Move media/{id}/… and flat files under media/support/. */
export async function migrateLegacyServerMedia(
  mediaDir: string,
  defaultDept: MediaDepartmentId = DEFAULT_MEDIA_DEPARTMENT,
): Promise<void> {
  fs.mkdirSync(mediaDir, { recursive: true })
  const nestedMedia = path.join(mediaDir, 'media')
  const dest = path.join(nestedMedia, defaultDept)
  const skipTop = new Set<string>(['_draft', 'media', 'updates', ...MEDIA_DEPARTMENT_IDS])
  const skipNested = new Set<string>(['_draft', ...MEDIA_DEPARTMENT_IDS])

  migrateFolderContents(mediaDir, dest, skipTop)
  migrateFolderContents(nestedMedia, dest, skipNested)

  const rows = await query<{
    relative_path: string
    topic_id: number | null
    department_id: string | null
  }>(
    `SELECT relative_path, topic_id, department_id FROM media_files WHERE deleted_at IS NULL`,
  )

  for (const row of rows.rows) {
    const dept = normalizeMediaDepartmentId(row.department_id || defaultDept)
    const nextRel = canonicalizeMediaRelativePath(row.relative_path, dept)
    const parsed = parseMediaRelativePath(nextRel)
    const topicId = parsed.topicId ?? row.topic_id
    const departmentId = parsed.departmentId ?? dept

    if (nextRel !== row.relative_path) {
      const fromAbs = resolveExistingMediaFile(mediaDir, row.relative_path)
      const toAbs = path.join(mediaDir, ...posixMediaRel(nextRel).split('/'))
      if (fromAbs && path.resolve(fromAbs) !== path.resolve(toAbs)) {
        moveFile(fromAbs, toAbs)
      }
      const clash = await query<{ n: string }>(
        `SELECT 1 AS n FROM media_files WHERE relative_path = $1 AND relative_path <> $2 LIMIT 1`,
        [nextRel, row.relative_path],
      )
      if (clash.rowCount && clash.rowCount > 0) continue
      await query(
        `UPDATE media_files
            SET relative_path = $1,
                department_id = $2,
                topic_id = $3,
                updated_at = NOW()
          WHERE relative_path = $4`,
        [nextRel, departmentId, topicId, row.relative_path],
      )
    } else if (!row.department_id || row.topic_id == null) {
      await query(
        `UPDATE media_files
            SET department_id = COALESCE(NULLIF(department_id, ''), $1),
                topic_id = COALESCE(topic_id, $2),
                updated_at = NOW()
          WHERE relative_path = $3`,
        [departmentId, topicId, row.relative_path],
      )
    }
  }
}
