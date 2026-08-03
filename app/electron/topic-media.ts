import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  getDraftImagesDir,
  getTopicImagesDir,
  topicImageRelativePath,
  draftImageRelativePath,
} from './paths'
import { queueMediaRemoteDelete, queueMediaUpload, rewritePendingMediaPaths } from './pending-media'

const IMAGE_MD_RE = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

export function extractImageRefsFromMarkdown(markdown: string): string[] {
  const refs: string[] = []
  const text = markdown || ''
  IMAGE_MD_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = IMAGE_MD_RE.exec(text)) !== null) {
    const raw = match[1].trim().replace(/\\/g, '/')
    if (raw) refs.push(raw)
  }
  return refs
}

/** Basename of images/foo.jpg → foo.jpg */
export function imagesBasename(ref: string): string | null {
  const cleaned = ref.replace(/\\/g, '/')
  if (cleaned.startsWith('images/')) {
    const name = cleaned.slice('images/'.length)
    if (name && !name.includes('..') && !name.includes('/')) return name
  }
  return null
}

export function sanitizeDraftId(draftId: string): string {
  return draftId.replace(/[^a-zA-Z0-9_-]/g, '') || 'draft'
}

export function cleanupTopicImageOrphans(topicId: number, answerMarkdown: string): void {
  const dir = getTopicImagesDir(topicId)
  if (!fs.existsSync(dir)) return

  const referenced = new Set(
    extractImageRefsFromMarkdown(answerMarkdown)
      .map(imagesBasename)
      .filter((n): n is string => Boolean(n)),
  )

  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (!fs.statSync(full).isFile()) continue
    if (referenced.has(name)) continue
    try {
      fs.unlinkSync(full)
      queueMediaRemoteDelete(topicImageRelativePath(topicId, name))
    } catch {
      /* ignore */
    }
  }
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

function safeExt(ext: string, fallback = '.png'): string {
  const e = (ext || fallback).toLowerCase()
  if (!/^\.[a-z0-9]{1,8}$/.test(e)) return fallback
  return e
}

export interface SavedTopicImage {
  markdownPath: string
  url: string
  relativeFsPath: string
}

export type ImageOwner =
  | { kind: 'topic'; topicId: number }
  | { kind: 'draft'; draftId: string }

function saveBufferToOwner(owner: ImageOwner, buffer: Buffer, ext: string): SavedTopicImage {
  const fileName = `${randomUUID()}${safeExt(ext)}`
  const draftSafe = owner.kind === 'draft' ? sanitizeDraftId(owner.draftId) : ''
  const dir =
    owner.kind === 'topic' ? getTopicImagesDir(owner.topicId) : getDraftImagesDir(draftSafe)
  ensureDir(dir)
  const destPath = path.join(dir, fileName)
  fs.writeFileSync(destPath, buffer)

  const relativeFsPath =
    owner.kind === 'topic'
      ? topicImageRelativePath(owner.topicId, fileName)
      : draftImageRelativePath(draftSafe, fileName)

  queueMediaUpload(relativeFsPath)

  return {
    markdownPath: `images/${fileName}`,
    url: `spravochnik://${relativeFsPath}`,
    relativeFsPath,
  }
}

export function saveImageFileForOwner(owner: ImageOwner, sourcePath: string): SavedTopicImage {
  const ext = path.extname(sourcePath).toLowerCase() || '.jpg'
  const buffer = fs.readFileSync(sourcePath)
  return saveBufferToOwner(owner, buffer, ext)
}

/** Save nativeImage (PNG) for topic/draft. */
export function saveNativeImageForOwner(
  owner: ImageOwner,
  image: Electron.NativeImage,
): SavedTopicImage | null {
  if (image.isEmpty()) return null
  const png = image.toPNG()
  if (!png.length) return null
  return saveBufferToOwner(owner, png, '.png')
}

/** Move draft images to topic folder; markdown paths stay as images/…. */
export function migrateDraftImagesToTopic(draftId: string, topicId: number): void {
  const safe = sanitizeDraftId(draftId)
  const fromDir = getDraftImagesDir(safe)
  const toDir = getTopicImagesDir(topicId)
  const fromPrefix = `media/_draft/${safe}/images/`
  const toPrefix = `media/${topicId}/images/`

  if (fs.existsSync(fromDir)) {
    ensureDir(toDir)
    for (const name of fs.readdirSync(fromDir)) {
      const from = path.join(fromDir, name)
      if (!fs.statSync(from).isFile()) continue
      const to = path.join(toDir, name)
      fs.renameSync(from, to)
      queueMediaUpload(topicImageRelativePath(topicId, name))
    }
    try {
      fs.rmSync(path.dirname(fromDir), { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  }

  rewritePendingMediaPaths(fromPrefix, toPrefix)
}
