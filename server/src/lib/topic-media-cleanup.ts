import fs from 'node:fs'
import path from 'node:path'
import { query } from '../db/pool.js'
import {
  canonicalizeMediaRelativePath,
  mediaRelativePathCandidates,
  normalizeMediaDepartmentId,
  posixMediaRel,
  resolveExistingMediaFile,
} from './media-layout.js'
import {
  collectAllReferencedMediaPaths,
  topicFileRelativePath,
  topicImageRelativePath,
  type TopicMediaSource,
} from './topic-media-refs.js'

function topicStorageDirs(
  mediaDir: string,
  departmentId: string,
  topicId: number,
): Array<{ kind: 'images' | 'files'; dir: string }> {
  const dept = normalizeMediaDepartmentId(departmentId)
  const id = String(topicId)
  const roots = [mediaDir, path.join(mediaDir, 'media')]
  const out: Array<{ kind: 'images' | 'files'; dir: string }> = []
  const seen = new Set<string>()
  const add = (kind: 'images' | 'files', dir: string) => {
    const key = path.resolve(dir)
    if (seen.has(key)) return
    seen.add(key)
    out.push({ kind, dir })
  }
  for (const root of roots) {
    add('images', path.join(root, dept, id, 'images'))
    add('files', path.join(root, dept, id, 'files'))
    add('images', path.join(root, id, 'images'))
    add('files', path.join(root, id, 'files'))
  }
  return out
}

function canonicalPathsForTopicFile(
  departmentId: string,
  topicId: number,
  kind: 'images' | 'files',
  fileName: string,
): string[] {
  const rel =
    kind === 'images'
      ? topicImageRelativePath(departmentId, topicId, fileName)
      : topicFileRelativePath(departmentId, topicId, fileName)
  const canon = posixMediaRel(canonicalizeMediaRelativePath(rel, departmentId))
  const legacy =
    kind === 'images'
      ? `media/${topicId}/images/${fileName}`
      : `media/${topicId}/files/${fileName}`
  return [...new Set([canon, legacy])]
}

function isPathReserved(
  reservePaths: Set<string>,
  departmentId: string,
  topicId: number,
  kind: 'images' | 'files',
  fileName: string,
): boolean {
  for (const rel of canonicalPathsForTopicFile(departmentId, topicId, kind, fileName)) {
    if (reservePaths.has(rel)) return true
  }
  const suffix = kind === 'images' ? `/images/${fileName}` : `/files/${fileName}`
  for (const p of reservePaths) {
    if (p.endsWith(suffix)) return true
  }
  return false
}

function isPathReferenced(referenced: Set<string>, candidates: string[]): boolean {
  for (const rel of candidates) {
    if (referenced.has(rel)) return true
    const canon = posixMediaRel(canonicalizeMediaRelativePath(rel))
    if (referenced.has(canon)) return true
  }
  return false
}

async function softDeleteMediaPaths(mediaDir: string, relativePaths: string[]): Promise<void> {
  const toMark = new Set<string>()
  for (const rel of relativePaths) {
    for (const candidate of mediaRelativePathCandidates(rel)) {
      toMark.add(candidate)
      const abs = resolveExistingMediaFile(mediaDir, candidate)
      if (abs && fs.existsSync(abs)) {
        try {
          fs.unlinkSync(abs)
        } catch {
          /* ignore */
        }
      }
    }
  }
  if (toMark.size === 0) return
  await query(
    `UPDATE media_files SET deleted_at = NOW(), updated_at = NOW()
      WHERE relative_path = ANY($1::text[]) AND deleted_at IS NULL`,
    [[...toMark]],
  )
}

async function loadAllTopicMediaSources(): Promise<TopicMediaSource[]> {
  const result = await query<{
    department_id: string
    id: number
    answer: string
    photos: unknown
    documents: unknown
  }>(
    `SELECT department_id, id, answer, photos, documents
       FROM topics
      WHERE deleted_at IS NULL`,
  )
  return result.rows.map((row) => ({
    departmentId: row.department_id,
    id: row.id,
    answer: row.answer,
    photos: row.photos,
    documents: row.documents,
  }))
}

/**
 * After a topic is saved, remove files in that topic's media folders that are not
 * referenced by any live topic. Paths in reserveRelativePaths are kept (undo / «Сбросить»).
 */
export async function cleanupTopicMediaAfterSave(
  mediaDir: string,
  departmentId: string,
  topicId: number,
  options?: { reserveRelativePaths?: string[] },
): Promise<number> {
  const sources = await loadAllTopicMediaSources()
  const referenced = collectAllReferencedMediaPaths(sources)
  const reservePaths = new Set<string>()
  for (const rel of options?.reserveRelativePaths ?? []) {
    const trimmed = String(rel ?? '').trim()
    if (!trimmed) continue
    reservePaths.add(posixMediaRel(canonicalizeMediaRelativePath(trimmed, departmentId)))
  }

  const toDelete: string[] = []
  for (const { kind, dir } of topicStorageDirs(mediaDir, departmentId, topicId)) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      if (!fs.statSync(full).isFile()) continue
      if (isPathReserved(reservePaths, departmentId, topicId, kind, name)) continue
      const candidates = canonicalPathsForTopicFile(departmentId, topicId, kind, name)
      if (isPathReferenced(referenced, candidates)) continue
      toDelete.push(...candidates)
    }
  }

  const unique = [...new Set(toDelete)]
  if (unique.length === 0) return 0
  await softDeleteMediaPaths(mediaDir, unique)
  return unique.length
}
