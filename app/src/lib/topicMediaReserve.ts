import type { DepartmentId, GuideItem } from '../types'
import { canonicalImageStoragePath, parseFileAttachmentHref } from './markdown'

const IMAGE_MD_RE = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const FILE_MD_RE = /!?\[[^\]]*]\((files\/[^)\s]+)(?:\s+"[^"]*")?\)/g

function stripRef(ref: string): string {
  return ref.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^spravochnik:\/\//, '')
}

function canonicalFileStoragePath(
  ref: string,
  topicId: number,
  departmentId: DepartmentId,
): string | null {
  const cleaned = stripRef(ref)
  const withDept = cleaned.match(
    /^media\/([a-z][a-z0-9_-]{0,47})\/(\d+)\/files\/([^/?#\s]+)$/i,
  )
  if (withDept) {
    return `media/${withDept[1]}/${withDept[2]}/files/${withDept[3]}`
  }
  const nested = cleaned.match(/^media\/(\d+)\/files\/([^/?#\s]+)$/i)
  if (nested) {
    return `media/${departmentId}/${nested[1]}/files/${nested[2]}`
  }
  const parsed = parseFileAttachmentHref(cleaned.startsWith('files/') ? cleaned : `files/${cleaned}`)
  if (parsed && cleaned.startsWith('files/')) {
    return `media/${departmentId}/${topicId}/files/${parsed.storedName}`
  }
  if (cleaned.startsWith('files/')) {
    const name = cleaned.slice('files/'.length).split(/[?#]/)[0]
    if (name && !name.includes('..')) {
      return `media/${departmentId}/${topicId}/files/${name}`
    }
  }
  return null
}

/** All server-relative media paths referenced by a topic (answer, photos, documents). */
export function collectTopicMediaRelativePaths(
  item: Pick<GuideItem, 'id' | 'answer' | 'photos' | 'documents'>,
  departmentId: DepartmentId,
): string[] {
  const topicId = item.id
  const paths = new Set<string>()
  const answer = String(item.answer ?? '')

  IMAGE_MD_RE.lastIndex = 0
  let im: RegExpExecArray | null
  while ((im = IMAGE_MD_RE.exec(answer)) !== null) {
    let raw = im[1].trim()
    if (raw.startsWith('<') && raw.endsWith('>')) raw = raw.slice(1, -1).trim()
    const canon = canonicalImageStoragePath(raw, topicId, departmentId)
    if (canon) paths.add(canon)
  }

  for (const extra of item.photos ?? []) {
    if (typeof extra !== 'string') continue
    const canon = canonicalImageStoragePath(extra, topicId, departmentId)
    if (canon) paths.add(canon)
  }

  FILE_MD_RE.lastIndex = 0
  let fm: RegExpExecArray | null
  while ((fm = FILE_MD_RE.exec(answer)) !== null) {
    const raw = fm[1].trim()
    const canon = canonicalFileStoragePath(raw, topicId, departmentId)
    if (canon) paths.add(canon)
  }

  for (const doc of item.documents ?? []) {
    const fileId = doc?.file_id
    if (typeof fileId !== 'string') continue
    const canon = canonicalFileStoragePath(fileId, topicId, departmentId)
    if (canon) paths.add(canon)
  }

  return [...paths]
}

/** Media removed in the saved version but still needed for «Сбросить» to the baseline topic. */
export function reserveMediaPathsForUndo(
  editBaseline: GuideItem | null | undefined,
  saved: GuideItem,
  departmentId: DepartmentId,
  resetBaseline?: GuideItem | null,
): string[] {
  const savedSet = new Set(collectTopicMediaRelativePaths(saved, departmentId))
  const reserved = new Set<string>()
  for (const source of [editBaseline, resetBaseline]) {
    if (!source || source.id !== saved.id) continue
    for (const p of collectTopicMediaRelativePaths(source, departmentId)) {
      if (!savedSet.has(p)) reserved.add(p)
    }
  }
  return [...reserved]
}
