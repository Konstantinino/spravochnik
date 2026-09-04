import fs from 'node:fs'
import path from 'node:path'
import { PENDING_MEDIA_FILE, getUserDataRoot } from './paths'

export interface PendingMedia {
  upload: string[]
  deleteRemote: string[]
}

function pendingPath(): string {
  return path.join(getUserDataRoot(), PENDING_MEDIA_FILE)
}

export function readPendingMedia(): PendingMedia {
  try {
    const raw = JSON.parse(fs.readFileSync(pendingPath(), 'utf8')) as PendingMedia
    return {
      upload: Array.isArray(raw.upload) ? raw.upload.map(normalizeRel) : [],
      deleteRemote: Array.isArray(raw.deleteRemote)
        ? raw.deleteRemote.map(normalizeRel)
        : [],
    }
  } catch {
    return { upload: [], deleteRemote: [] }
  }
}

function normalizeRel(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/+/, '')
}

export function writePendingMedia(data: PendingMedia): void {
  const cleaned: PendingMedia = {
    upload: Array.from(new Set(data.upload.map(normalizeRel).filter(Boolean))),
    deleteRemote: Array.from(new Set(data.deleteRemote.map(normalizeRel).filter(Boolean))),
  }
  fs.writeFileSync(pendingPath(), JSON.stringify(cleaned, null, 2), 'utf8')
}

export function clearPendingMedia(): void {
  writePendingMedia({ upload: [], deleteRemote: [] })
}

export function hasPendingMedia(): boolean {
  const pending = readPendingMedia()
  return pending.upload.length > 0 || pending.deleteRemote.length > 0
}

export function queueMediaUpload(relativePath: string): void {
  const pending = readPendingMedia()
  const rel = normalizeRel(relativePath)
  pending.upload.push(rel)
  pending.deleteRemote = pending.deleteRemote.filter((p) => p !== rel)
  writePendingMedia(pending)
}

export function queueMediaRemoteDelete(relativePath: string): void {
  const pending = readPendingMedia()
  const rel = normalizeRel(relativePath)
  pending.deleteRemote.push(rel)
  pending.upload = pending.upload.filter((p) => p !== rel)
  writePendingMedia(pending)
}

export function rewritePendingMediaPaths(fromPrefix: string, toPrefix: string): void {
  const pending = readPendingMedia()
  const mapPath = (p: string) =>
    p.startsWith(fromPrefix) ? toPrefix + p.slice(fromPrefix.length) : p
  writePendingMedia({
    upload: pending.upload.map(mapPath),
    deleteRemote: pending.deleteRemote.map(mapPath),
  })
}
