import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  getDraftFilesDir,
  getDraftImagesDir,
  getTopicFilesDir,
  getTopicImagesDir,
  topicFileRelativePath,
  topicImageRelativePath,
  draftFileRelativePath,
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

function removeDraftOwnerDirIfEmpty(draftId: string): void {
  const safe = sanitizeDraftId(draftId)
  const ownerDir = path.dirname(getDraftImagesDir(safe))
  try {
    if (fs.existsSync(ownerDir) && fs.readdirSync(ownerDir).length === 0) {
      fs.rmSync(ownerDir, { recursive: true, force: true })
    }
  } catch {
    /* ignore */
  }
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
      fs.rmSync(fromDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  }

  rewritePendingMediaPaths(fromPrefix, toPrefix)
  removeDraftOwnerDirIfEmpty(draftId)
}

const FILE_MD_RE = /!?\[[^\]]*]\((files\/[^)\s]+)(?:\s+"[^"]*")?\)/g

export const TOPIC_FILE_MAX_BYTES = 10 * 1024 * 1024

const BLOCKED_FILE_EXT = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.msi',
  '.scr',
  '.pif',
  '.cpl',
  '.msc',
  '.jar',
  '.vbs',
  '.vbe',
  '.js',
  '.jse',
  '.wsf',
  '.wsh',
  '.ps1',
  '.psd1',
  '.psm1',
  '.sh',
  '.bash',
  '.dll',
  '.sys',
  '.hta',
  '.lnk',
  '.reg',
  '.app',
])

export function extractFileRefsFromMarkdown(markdown: string): string[] {
  const refs: string[] = []
  const text = markdown || ''
  FILE_MD_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FILE_MD_RE.exec(text)) !== null) {
    const raw = match[1].trim().replace(/\\/g, '/')
    if (raw) refs.push(raw)
  }
  return refs
}

/** Basename of files/foo.pdf → foo.pdf */
export function filesBasename(ref: string): string | null {
  const cleaned = ref.replace(/\\/g, '/')
  if (cleaned.startsWith('files/')) {
    const name = cleaned.slice('files/'.length)
    if (name && !name.includes('..') && !name.includes('/')) return name
  }
  return null
}

export function cleanupTopicFileOrphans(topicId: number, answerMarkdown: string): void {
  try {
    const dir = getTopicFilesDir(topicId)
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return

    const referenced = new Set(
      extractFileRefsFromMarkdown(answerMarkdown)
        .map(filesBasename)
        .filter((n): n is string => Boolean(n)),
    )

    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      if (!fs.statSync(full).isFile()) continue
      if (referenced.has(name)) continue
      try {
        fs.unlinkSync(full)
        queueMediaRemoteDelete(topicFileRelativePath(topicId, name))
      } catch {
        /* ignore */
      }
    }
  } catch (err) {
    console.error('cleanupTopicFileOrphans', err)
  }
}

function sanitizeOriginalName(name: string): string {
  const base = path
    .basename(name)
    .replace(/[\u0000-\u001f<>:"|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
  return base.slice(0, 180) || 'file'
}

export interface SavedTopicFile {
  markdownPath: string
  originalName: string
  url: string
  relativeFsPath: string
}

export function saveFileForOwner(owner: ImageOwner, sourcePath: string): SavedTopicFile {
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw new Error('Файл не найден')
  }
  const stat = fs.statSync(sourcePath)
  if (stat.size <= 0) {
    throw new Error('Файл пустой')
  }
  if (stat.size > TOPIC_FILE_MAX_BYTES) {
    throw new Error('Файл больше 10 МБ')
  }

  const ext = path.extname(sourcePath).toLowerCase()
  if (BLOCKED_FILE_EXT.has(ext)) {
    throw new Error('Этот тип файла нельзя прикрепить')
  }

  const originalName = sanitizeOriginalName(path.basename(sourcePath))
  const fileName = `${randomUUID()}${safeExt(ext, '.bin')}`
  const draftSafe = owner.kind === 'draft' ? sanitizeDraftId(owner.draftId) : ''
  const dir = owner.kind === 'topic' ? getTopicFilesDir(owner.topicId) : getDraftFilesDir(draftSafe)
  ensureDir(dir)
  const destPath = path.join(dir, fileName)
  fs.copyFileSync(sourcePath, destPath)

  const relativeFsPath =
    owner.kind === 'topic'
      ? topicFileRelativePath(owner.topicId, fileName)
      : draftFileRelativePath(draftSafe, fileName)

  queueMediaUpload(relativeFsPath)

  return {
    markdownPath: `files/${fileName}`,
    originalName,
    url: `spravochnik://${relativeFsPath}`,
    relativeFsPath,
  }
}

/** Move draft files to topic folder; markdown paths stay as files/…. */
export function migrateDraftFilesToTopic(draftId: string, topicId: number): void {
  const safe = sanitizeDraftId(draftId)
  const fromDir = getDraftFilesDir(safe)
  const toDir = getTopicFilesDir(topicId)
  const fromPrefix = `media/_draft/${safe}/files/`
  const toPrefix = `media/${topicId}/files/`

  if (fs.existsSync(fromDir)) {
    ensureDir(toDir)
    for (const name of fs.readdirSync(fromDir)) {
      const from = path.join(fromDir, name)
      if (!fs.statSync(from).isFile()) continue
      const to = path.join(toDir, name)
      fs.renameSync(from, to)
      queueMediaUpload(topicFileRelativePath(topicId, name))
    }
    try {
      fs.rmSync(fromDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  }

  rewritePendingMediaPaths(fromPrefix, toPrefix)
  removeDraftOwnerDirIfEmpty(draftId)
}
