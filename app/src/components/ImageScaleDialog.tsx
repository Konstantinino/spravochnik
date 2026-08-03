import { useEffect, useRef, useState } from 'react'
import {
  IMAGE_SCALE_DEFAULT,
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  clampImageScale,
} from '../lib/imageDisplay'

interface ImageScaleDialogProps {
  scale: number
  initialLeft: number
  initialTop: number
  onScaleChange: (scale: number) => void
  onApply: () => void
  onReset: () => void
  onClose: () => void
}

export function ImageScaleDialog({
  scale,
  initialLeft,
  initialTop,
  onScaleChange,
  onApply,
  onReset,
  onClose,
}: ImageScaleDialogProps) {
  const [pos, setPos] = useState({ left: initialLeft, top: initialTop })
  const dragRef = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return
      setPos({
        left: dragRef.current.sx + (e.clientX - dragRef.current.ox),
        top: dragRef.current.sy + (e.clientY - dragRef.current.oy),
      })
    }
    function onUp() {
      dragRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="image-scale-dialog"
      style={{ left: pos.left, top: pos.top }}
      role="dialog"
      aria-label="Регулировка размера"
    >
      <div
        className="image-scale-dialog__title"
        onMouseDown={(e) => {
          if (e.button !== 0) return
          dragRef.current = {
            ox: e.clientX,
            oy: e.clientY,
            sx: pos.left,
            sy: pos.top,
          }
        }}
      >
        Размер изображения
        <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
      </div>
      <div className="image-scale-dialog__body">
        <label className="image-scale-dialog__slider">
          <span>{clampImageScale(scale)}%</span>
          <input
            type="range"
            min={IMAGE_SCALE_MIN}
            max={IMAGE_SCALE_MAX}
            step={1}
            value={clampImageScale(scale)}
            onChange={(e) => onScaleChange(Number(e.target.value))}
          />
        </label>
        <div className="image-scale-dialog__actions">
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            Сбросить
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onApply()
              onClose()
            }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}

export { IMAGE_SCALE_DEFAULT }
