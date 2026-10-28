import {
  canonicalizeMediaRelativePath,
  normalizeMediaDepartmentId,
  posixMediaRel,
} from './media-layout.js'

const IMAGE_MD_RE = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const FILE_MD_RE = /!?\[[^\]]*]\((files\/[^)\s]+)(?:\s+"[^"]*")?\)/g

function stripSpravochnikPrefix(ref: string): string {
  return ref.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^spravochnik:\/\//, '')
}

export function extractImageRefsFromMarkdown(markdown: string): string[] {
  const refs: string[] = []
  const text = markdown || ''
  IMAGE_MD_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = IMAGE_MD_RE.exec(text)) !== null) {
    const raw = match[1].trim().replace(/\\/g, '/')
    if (raw.startsWith('<') && raw.endsWith('>')) {
      refs.push(raw.slice(1, -1).trim())
    } else if (raw) refs.push(raw)
  }
  return refs
}

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

function imagesBasename(ref: string): string | null {
  const cleaned = stripSpravochnikPrefix(ref)
  if (cleaned.startsWith('images/')) {
    const name = cleaned.slice('images/'.length).split(/[?#]/)[0]
    if (name && !name.includes('..') && !name.includes('/')) return name
  }
  const fromMedia = cleaned.match(/\/images\/([^/?#\s]+)$/i)
  if (fromMedia?.[1] && !fromMedia[1].includes('..')) return fromMedia[1]
  return null
}

function filesBasename(ref: string): string | null {
  const cleaned = stripSpravochnikPrefix(ref)
  if (cleaned.startsWith('files/')) {
    const name = cleaned.slice('files/'.length).split(/[?#]/)[0]
    if (name && !name.includes('..') && !name.includes('/')) return name
  }
  const fromMedia = cleaned.match(/\/files\/([^/?#\s]+)$/i)
  if (fromMedia?.[1] && !fromMedia[1].includes('..')) return fromMedia[1]
  return null
}

export function topicImageRelativePath(
  departmentId: string,
  topicId: number,
  fileName: string,
): string {
  return `media/${normalizeMediaDepartmentId(departmentId)}/${topicId}/images/${fileName}`
}

export function topicFileRelativePath(
  departmentId: string,
  topicId: number,
  fileName: string,
): string {
  return `media/${normalizeMediaDepartmentId(departmentId)}/${topicId}/files/${fileName}`
}

export type TopicMediaSource = {
  departmentId: string
  id: number
  answer?: unknown
  photos?: unknown
  documents?: unknown
}

function normalizeStoredPath(rel: string, departmentId: string): string {
  return posixMediaRel(canonicalizeMediaRelativePath(rel, departmentId))
}

export function mediaImagePathsFromTopic(source: TopicMediaSource): string[] {
  const { departmentId, id: topicId } = source
  const answerMarkdown = String(source.answer ?? '')
  const extraRefs = Array.isArray(source.photos) ? source.photos : []
  const paths = new Set<string>()
  const addPath = (rel: string) => {
    const n = normalizeStoredPath(rel, departmentId)
    if (n.startsWith('media/')) paths.add(n)
  }
  for (const ref of extractImageRefsFromMarkdown(answerMarkdown)) {
    const cleaned = stripSpravochnikPrefix(ref)
    if (cleaned.startsWith('media/')) {
      addPath(cleaned.split(/[?#]/)[0])
    } else {
      const base = imagesBasename(cleaned)
      if (base) addPath(topicImageRelativePath(departmentId, topicId, base))
    }
  }
  for (const extra of extraRefs) {
    if (typeof extra !== 'string') continue
    const cleaned = stripSpravochnikPrefix(extra)
    if (cleaned.startsWith('media/')) {
      addPath(cleaned.split(/[?#]/)[0])
    } else {
      const base = imagesBasename(cleaned)
      if (base) addPath(topicImageRelativePath(departmentId, topicId, base))
    }
  }
  return [...paths]
}

export function mediaFilePathsFromTopic(source: TopicMediaSource): string[] {
  const { departmentId, id: topicId } = source
  const answerMarkdown = String(source.answer ?? '')
  const extraRefs = Array.isArray(source.documents) ? source.documents : []
  const paths = new Set<string>()
  const addPath = (rel: string) => {
    const n = normalizeStoredPath(rel, departmentId)
    if (n.startsWith('media/')) paths.add(n)
  }
  for (const ref of extractFileRefsFromMarkdown(answerMarkdown)) {
    const cleaned = stripSpravochnikPrefix(ref)
    if (cleaned.startsWith('media/')) {
      addPath(cleaned.split(/[?#]/)[0])
    } else {
      const base = filesBasename(cleaned)
      if (base) addPath(topicFileRelativePath(departmentId, topicId, base))
    }
  }
  for (const extra of extraRefs) {
    if (typeof extra === 'string') {
      const cleaned = stripSpravochnikPrefix(extra)
      if (cleaned.startsWith('media/')) addPath(cleaned.split(/[?#]/)[0])
      else {
        const base = filesBasename(cleaned)
        if (base) addPath(topicFileRelativePath(departmentId, topicId, base))
      }
      continue
    }
    if (extra && typeof extra === 'object' && 'file_id' in extra) {
      const id = String((extra as { file_id: unknown }).file_id ?? '')
      const cleaned = stripSpravochnikPrefix(id)
      if (cleaned.startsWith('media/')) addPath(cleaned.split(/[?#]/)[0])
      else {
        const base = filesBasename(cleaned) ?? (id.includes('/') ? null : id)
        if (base && !base.includes('..')) addPath(topicFileRelativePath(departmentId, topicId, base))
      }
    }
  }
  return [...paths]
}

export function collectAllReferencedMediaPaths(sources: TopicMediaSource[]): Set<string> {
  const paths = new Set<string>()
  for (const source of sources) {
    if (!Number.isFinite(source.id)) continue
    for (const rel of mediaImagePathsFromTopic(source)) paths.add(rel)
    for (const rel of mediaFilePathsFromTopic(source)) paths.add(rel)
  }
  return paths
}
