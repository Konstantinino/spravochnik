import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  type ReactElement,
  type ReactNode,
  type UIEvent,
} from 'react'
import { NBSP_MARKDOWN_ENTITY, insertNbspEntityAtCursor, focusSelection } from '../lib/textInsert'

interface TextareaWithNbspButtonProps {
  value: string
  onValueChange: (next: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  children: ReactNode
}

function highlightNbspEntities(text: string): ReactNode[] {
  if (!text) return ['']
  const parts = text.split(/(&#160;)/g)
  return parts.map((part, index) =>
    part === NBSP_MARKDOWN_ENTITY ? (
      <mark key={index} className="nbsp-entity-mark">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export function TextareaWithNbspButton({
  value,
  onValueChange,
  textareaRef,
  children,
}: TextareaWithNbspButtonProps) {
  const highlightRef = useRef<HTMLDivElement>(null)

  function syncScrollFromTextarea(el: HTMLTextAreaElement) {
    const layer = highlightRef.current
    if (!layer) return
    layer.scrollTop = el.scrollTop
    layer.scrollLeft = el.scrollLeft
  }

  function handleTextareaScroll(e: UIEvent<HTMLTextAreaElement>) {
    syncScrollFromTextarea(e.currentTarget)
  }

  function insertNbsp() {
    const { next, selectStart, selectEnd } = insertNbspEntityAtCursor(
      value,
      textareaRef.current,
    )
    onValueChange(next)
    focusSelection(textareaRef.current, selectStart, selectEnd)
  }

  const textareaChild = Children.only(children)
  type TextareaEl = ReactElement<{
    className?: string
    onScroll?: (e: UIEvent<HTMLTextAreaElement>) => void
  }>
  const enhancedTextarea = isValidElement(textareaChild)
    ? cloneElement(textareaChild as TextareaEl, {
        className: [(textareaChild as TextareaEl).props.className, 'viewer__textarea--edit-overlay']
          .filter(Boolean)
          .join(' '),
        onScroll: (e: UIEvent<HTMLTextAreaElement>) => {
          handleTextareaScroll(e)
          ;(textareaChild as TextareaEl).props.onScroll?.(e)
        },
      })
    : textareaChild

  return (
    <div className="viewer__textarea-wrap">
      <button
        type="button"
        className="viewer__nbsp-btn"
        title="Типограф в месте курсора"
        aria-label="Типограф в месте курсора"
        onClick={insertNbsp}
      >
        <svg
          className="viewer__nbsp-btn-icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M18 2H6a2 2 0 0 0-2 2v16l8-3 8 3V4a2 2 0 0 0-2-2zM18 4.5L12 6.75V16.5L18 14.25V4.5z"
          />
          <g transform="matrix(-1 0 0 1 24 0)">
            <path fill="currentColor" d="M18 4.5L12 6.75V16.5L18 14.25V4.5z" />
          </g>
        </svg>
      </button>
      <div className="viewer__textarea-stack">
        <div ref={highlightRef} className="viewer__textarea-highlight" aria-hidden="true">
          {highlightNbspEntities(value)}
        </div>
        {enhancedTextarea}
      </div>
    </div>
  )
}
