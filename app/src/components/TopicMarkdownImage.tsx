import { useEffect, useMemo, useRef, useState } from 'react'
import type { DepartmentId, ImageDisplayMap } from '../types'
import {
  IMAGE_SCALE_DEFAULT,
  getImageScaleForTopicImage,
  normalizeImageDisplayKey,
} from '../lib/imageDisplay'
import { mediaSrcFromMarkdownUrl } from '../lib/markdown'

interface TopicMarkdownImageProps {
  rawSrc: string
  alt: string
  topicId: number
  departmentId: DepartmentId
  displayMap: ImageDisplayMap | undefined
  onOpenLightbox: (resolvedSrc: string) => void
  onContextMenu: (e: React.MouseEvent, markdownKey: string, resolvedSrc: string) => void
}

export function TopicMarkdownImage({
  rawSrc,
  alt,
  topicId,
  departmentId,
  displayMap,
  onOpenLightbox,
  onContextMenu,
}: TopicMarkdownImageProps) {
  const [storagePath, setStoragePath] = useState<string | null>(null)
  const isRemote = /^https?:\/\//i.test(rawSrc.trim())
  const displayRef = isRemote ? rawSrc : (storagePath ?? rawSrc)
  const markdownKey = normalizeImageDisplayKey(displayRef)
  const resolved = mediaSrcFromMarkdownUrl(displayRef, topicId, departmentId)
  const scale = getImageScaleForTopicImage(displayMap, displayRef, topicId, departmentId)
  const scaled = scale !== IMAGE_SCALE_DEFAULT
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)
  const loadRetryRef = useRef(0)
  const MAX_LOAD_RETRIES = 3

  useEffect(() => {
    if (isRemote) {
      setStoragePath(null)
      return
    }
    let cancelled = false
    void (async () => {
      const path = await window.spravochnik.resolveImageStorageRef({
        departmentId,
        ref: rawSrc,
        contextTopicId: topicId,
      })
      if (!cancelled) setStoragePath(path)
    })()
    return () => {
      cancelled = true
    }
  }, [rawSrc, topicId, departmentId, isRemote])

  const src = useMemo(() => {
    if (!reloadNonce) return resolved
    const join = resolved.includes('?') ? '&' : '?'
    return `${resolved}${join}r=${reloadNonce}`
  }, [resolved, reloadNonce])

  useEffect(() => {
    loadRetryRef.current = 0
    setLoaded(false)
    setLoadFailed(false)
    setReloadNonce(0)
  }, [rawSrc, topicId, departmentId, storagePath])

  async function handleError() {
    if (loadRetryRef.current >= MAX_LOAD_RETRIES) {
      setLoadFailed(true)
      return
    }
    loadRetryRef.current += 1

    const canonical = isRemote ? null : (storagePath ?? displayRef)
    const mediaPath = canonical?.replace(/^spravochnik:\/\//, '').split(/[?#]/)[0]
    if (mediaPath?.startsWith('media/')) {
      try {
        await window.spravochnik.ensureMediaFiles({
          departmentId,
          relativePaths: [mediaPath],
        })
      } catch {
        setLoadFailed(true)
        return
      }
      setLoadFailed(false)
      setReloadNonce((n) => n + 1)
      return
    }
    setLoadFailed(true)
  }

  const showScale = scaled && loaded && !loadFailed

  return (
    <img
      src={src}
      alt={alt}
      className={[
        'viewer__image',
        loadFailed ? 'viewer__image--broken' : '',
        !loaded && !loadFailed ? 'viewer__image--loading' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      loading={isRemote ? 'lazy' : 'eager'}
      style={
        showScale
          ? { maxWidth: `${scale}%`, width: 'auto', height: 'auto' }
          : undefined
      }
      onLoad={() => {
        loadRetryRef.current = 0
        setLoaded(true)
        setLoadFailed(false)
      }}
      onError={() => void handleError()}
      onClick={() => onOpenLightbox(resolved)}
      onContextMenu={(e) => onContextMenu(e, markdownKey, resolved)}
    />
  )
}
