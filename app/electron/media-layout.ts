import fs from 'node:fs'
import path from 'node:path'
import { getMediaDir, getUserDataRoot } from './paths'
import { readPendingMedia, writePendingMedia } from './pending-media'

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

/** media/{dept}/{topicId}/images|files/{file} — or leave drafts / already-canonical paths. */
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

export function departmentIdFromMediaPath(relativePath: string): MediaDepartmentId | undefined {
  const n = posixMediaRel(relativePath)
  const m = n.match(/^media\/(support|lawyers|managers|spp|templates)\//)
  return m && isMediaDepartmentId(m[1]) ? m[1] : undefined
}

function absFromRoot(root: string, rel: string): string {
  return path.join(root, ...posixMediaRel(rel).split('/'))
}

export function resolveExistingMediaAbsolutePath(
  relativePath: string,
  departmentId?: unknown,
): string | null {
  const root = getUserDataRoot()
  const mediaDir = getMediaDir()
  for (const rel of mediaRelativePathCandidates(relativePath, departmentId)) {
    const a = absFromRoot(root, rel)
    if (fs.existsSync(a) && fs.statSync(a).isFile()) return a
    if (rel.startsWith('media/')) {
      const b = path.join(mediaDir, ...rel.slice('media/'.length).split('/'))
      if (fs.existsSync(b) && fs.statSync(b).isFile()) return b
    }
  }
  return null
}

function moveFile(from: string, to: string): void {
  if (!fs.existsSync(from) || path.resolve(from) === path.resolve(to)) return
  fs.mkdirSync(path.dirname(to), { recursive: true })
  if (!fs.existsSync(to)) {
    fs.renameSync(from, to)
  }
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

/** Move media/{topicId}/… and flat media/file.jpg into media/support/… */
export function migrateLegacyLocalMedia(
  defaultDept: MediaDepartmentId = DEFAULT_MEDIA_DEPARTMENT,
): void {
  const mediaDir = getMediaDir()
  if (!fs.existsSync(mediaDir)) return

  const pending = readPendingMedia()
  writePendingMedia({
    upload: pending.upload.map((p) => canonicalizeMediaRelativePath(p, defaultDept)),
    deleteRemote: pending.deleteRemote.map((p) => canonicalizeMediaRelativePath(p, defaultDept)),
  })

  const destRoot = path.join(mediaDir, defaultDept)
  fs.mkdirSync(destRoot, { recursive: true })

  for (const entry of fs.readdirSync(mediaDir, { withFileTypes: true })) {
    if (entry.name === '_draft') continue
    if (isMediaDepartmentId(entry.name)) continue
    const from = path.join(mediaDir, entry.name)
    const to = path.join(destRoot, entry.name)
    if (entry.isDirectory() && /^\d+$/.test(entry.name)) {
      moveTree(from, to)
    } else if (entry.isFile()) {
      moveFile(from, to)
    }
  }
}
