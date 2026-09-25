import type { DepartmentId, ImageDisplayMap } from '../types'
import { canonicalImageStoragePath, topicIdFromImageStoragePath } from './markdown'

export const IMAGE_SCALE_MIN = 10
export const IMAGE_SCALE_MAX = 200
export const IMAGE_SCALE_DEFAULT = 100

export function clampImageScale(value: number): number {
  if (!Number.isFinite(value)) return IMAGE_SCALE_DEFAULT
  return Math.min(IMAGE_SCALE_MAX, Math.max(IMAGE_SCALE_MIN, Math.round(value)))
}

export function getImageScale(map: ImageDisplayMap | undefined, key: string): number {
  const raw = map?.[key]
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return IMAGE_SCALE_DEFAULT
  return clampImageScale(raw)
}

/** Returns updated map, or undefined when empty (all at 100%). */
export function withImageScale(
  map: ImageDisplayMap | undefined,
  key: string,
  scale: number,
): ImageDisplayMap | undefined {
  const next: ImageDisplayMap = { ...(map ?? {}) }
  const clamped = clampImageScale(scale)
  if (clamped === IMAGE_SCALE_DEFAULT) delete next[key]
  else next[key] = clamped
  return Object.keys(next).length > 0 ? next : undefined
}

export function normalizeImageDisplayKey(src: string): string {
  return src.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^spravochnik:\/\//, '')
}

/** Scale for an image in a topic; cross-topic refs ignore unrelated local keys. */
export function getImageScaleForTopicImage(
  map: ImageDisplayMap | undefined,
  rawSrc: string,
  topicId: number,
  departmentId: DepartmentId,
): number {
  const key = normalizeImageDisplayKey(rawSrc)
  const canonical = canonicalImageStoragePath(key, topicId, departmentId)
  const ownerTopicId =
    (canonical ? topicIdFromImageStoragePath(canonical) : null) ??
    topicIdFromImageStoragePath(key)

  if (ownerTopicId != null && ownerTopicId !== topicId) {
    if (canonical && map?.[canonical] != null) return getImageScale(map, canonical)
    if (map?.[key] != null && key.startsWith('media/')) return getImageScale(map, key)
    return IMAGE_SCALE_DEFAULT
  }

  if (map?.[key] != null) return getImageScale(map, key)
  if (canonical && map?.[canonical] != null) return getImageScale(map, canonical)
  const tail = canonical?.match(/\/images\/([^/?#\s]+)$/i)?.[1]
  if (tail && map?.[`images/${tail}`] != null) return getImageScale(map, `images/${tail}`)
  return IMAGE_SCALE_DEFAULT
}
