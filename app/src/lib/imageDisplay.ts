import type { ImageDisplayMap } from '../types'

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
  return src.replace(/\\/g, '/').replace(/^\/+/, '')
}
