import { useRef, useState, type ReactNode } from 'react'

interface TopicSectionDraggableLiProps {
  reorderMode: boolean
  dragScope: string
  index: number
  className: string
  onMove: (scope: string, fromIndex: number, toIndex: number) => void
  children: ReactNode
  disabled?: boolean
}

/** Shared while a row is dragged (only one drag at a time). */
let activeTopicSectionDrag: { scope: string; fromIndex: number } | null = null

export function TopicSectionDraggableLi({
  reorderMode,
  dragScope,
  index,
  className,
  onMove,
  children,
  disabled = false,
}: TopicSectionDraggableLiProps) {
  const dragFromRef = useRef<number | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const canDrag = reorderMode && !disabled

  function handleDragStart(e: React.DragEvent) {
    if (!canDrag) return
    dragFromRef.current = index
    activeTopicSectionDrag = { scope: dragScope, fromIndex: index }
    setDraggingIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `${dragScope}:${index}`)
  }

  function handleDragEnd() {
    dragFromRef.current = null
    activeTopicSectionDrag = null
    setDraggingIndex(null)
    setDragOverIndex(null)
  }

  function handleDragOver(e: React.DragEvent) {
    if (!canDrag || activeTopicSectionDrag == null) return
    if (activeTopicSectionDrag.scope !== dragScope) return
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDrop(e: React.DragEvent) {
    if (!canDrag) return
    e.preventDefault()
    const from =
      activeTopicSectionDrag?.scope === dragScope
        ? activeTopicSectionDrag.fromIndex
        : dragFromRef.current
    dragFromRef.current = null
    activeTopicSectionDrag = null
    setDraggingIndex(null)
    setDragOverIndex(null)
    if (from == null || from === index) return
    onMove(dragScope, from, index)
  }

  return (
    <li
      className={`${className}${draggingIndex === index ? ' is-dragging' : ''}${
        dragOverIndex === index ? ' is-drag-over' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={() => {
        if (dragOverIndex === index) setDragOverIndex(null)
      }}
      onDrop={handleDrop}
    >
      {canDrag ? (
        <button
          type="button"
          className="departments-settings__drag"
          draggable
          title="Перетащите для изменения порядка"
          aria-label="Перетащите строку"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          ⋮⋮
        </button>
      ) : null}
      {children}
    </li>
  )
}
