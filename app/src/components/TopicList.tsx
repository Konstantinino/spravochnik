import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { GuideItem, SupportParty } from '../types'
import { SUPPORT_PARTIES, SUPPORT_PARTY_LABELS } from '../types'
import {
  buildTree,
  getAncestorIds,
  getChildren,
  getItemParty,
  topicDisplayLabel,
} from '../lib/data'
import type { TopicSearchFilter } from '../lib/search'

/** Matches default `.topic-item` horizontal margin */
const BASE_MARGIN_X = 8
/** Inner pad before toggle on root rows only */
const ROOT_PAD = 12
const TOGGLE_W = 28
/** Gap between guide line and outer left edge of child row */
const GUIDE_GAP = 8

function rowMarginLeft(depth: number): number {
  if (depth <= 0) return BASE_MARGIN_X
  return guideX(depth - 1) + GUIDE_GAP
}

/** X of guide under the expand arrow of a row at `depth` */
function guideX(depth: number): number {
  if (depth <= 0) return BASE_MARGIN_X + ROOT_PAD + TOGGLE_W / 2
  return rowMarginLeft(depth) + TOGGLE_W / 2
}

function highlightTitle(text: string, tokens: string[]): ReactNode {
  if (tokens.length === 0) return text

  const lower = text.toLowerCase()
  const ranges: Array<{ start: number; end: number }> = []

  for (const token of tokens) {
    let from = 0
    while (from < text.length) {
      const idx = lower.indexOf(token, from)
      if (idx < 0) break
      ranges.push({ start: idx, end: idx + token.length })
      from = idx + Math.max(token.length, 1)
    }
  }

  if (ranges.length === 0) return text

  ranges.sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: Array<{ start: number; end: number }> = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end)
    } else {
      merged.push({ ...r })
    }
  }

  const parts: ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const r of merged) {
    if (r.start > cursor) parts.push(text.slice(cursor, r.start))
    parts.push(
      <mark key={key++} className="find-hit">
        {text.slice(r.start, r.end)}
      </mark>,
    )
    cursor = r.end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

interface TopicListProps {
  items: GuideItem[]
  selectedId: number | null
  onSelect: (id: number) => void
  searchFilter: TopicSearchFilter | null
  /** Support + «Все»: group root topics under party section headings */
  groupRootsByParty?: boolean
  /** Support filters: root reorder only within the same party */
  rootReorderSameParty?: boolean
  reorderMode?: boolean
  reorderPreparing?: boolean
  reorderLockBanner?: string | null
  canReorder?: boolean
  canEditTopic?: boolean
  onEnterReorderMode?: () => void
  onExitReorderMode?: () => void
  onEditTopic?: (id: number) => void
  onReorderSiblings?: (parentId: number | null, draggedId: number, targetId: number) => void
}

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node
    }
    node = node.parentElement
  }
  return null
}

function isRowVisibleInScroll(row: HTMLElement, scrollEl: HTMLElement): boolean {
  const rowRect = row.getBoundingClientRect()
  const scrollRect = scrollEl.getBoundingClientRect()
  return rowRect.top >= scrollRect.top - 2 && rowRect.bottom <= scrollRect.bottom + 2
}

function scrollRowToListCenter(
  row: HTMLElement,
  scrollEl: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): void {
  const rowRect = row.getBoundingClientRect()
  const scrollRect = scrollEl.getBoundingClientRect()
  const targetTop =
    scrollEl.scrollTop + (rowRect.top - scrollRect.top) - scrollRect.height / 2 + rowRect.height / 2
  const maxTop = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
  scrollEl.scrollTo({
    top: Math.min(maxTop, Math.max(0, targetTop)),
    behavior,
  })
}

function waitForScrollEnd(
  scrollEl: HTMLElement,
  options?: { timeoutMs?: number; settleMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 2500
  const settleMs = options?.settleMs ?? 100
  const startScrollTop = scrollEl.scrollTop

  return new Promise((resolve) => {
    let finished = false
    let settledTimer: ReturnType<typeof setTimeout> | undefined
    let sawScroll = false

    function finish() {
      if (finished) return
      finished = true
      scrollEl.removeEventListener('scroll', onScroll)
      scrollEl.removeEventListener('scrollend', onScrollEnd)
      if (settledTimer) clearTimeout(settledTimer)
      clearTimeout(noScrollTimer)
      clearTimeout(timeoutTimer)
      resolve()
    }

    function onScrollEnd() {
      finish()
    }

    function onScroll() {
      sawScroll = true
      if (settledTimer) clearTimeout(settledTimer)
      settledTimer = setTimeout(finish, settleMs)
    }

    const noScrollTimer = setTimeout(() => {
      if (!sawScroll && scrollEl.scrollTop === startScrollTop) finish()
    }, 150)

    const timeoutTimer = setTimeout(finish, timeoutMs)

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    if ('onscrollend' in window) {
      scrollEl.addEventListener('scrollend', onScrollEnd, { once: true })
    }
  })
}

const REORDER_DRAG_THRESHOLD_PX = 4
const AUTO_SCROLL_EDGE_PX = 56
const AUTO_SCROLL_MAX_PX = 18
const REORDER_FOCUS_FLASH_MS = 600

type ReorderPending = {
  id: number
  x: number
  y: number
  offsetX: number
  offsetY: number
  width: number
  label: string
}

type ReorderDragSession = {
  offsetX: number
  offsetY: number
  width: number
  label: string
}

type ReorderDragGhost = {
  label: string
  x: number
  y: number
  width: number
}

function topicIdFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y)?.closest('[data-topic-id]')
  if (!el) return null
  const id = Number(el.getAttribute('data-topic-id'))
  return Number.isFinite(id) ? id : null
}

function autoScrollContainer(scrollEl: HTMLElement, clientY: number): void {
  const rect = scrollEl.getBoundingClientRect()
  if (clientY < rect.top + AUTO_SCROLL_EDGE_PX) {
    const t = (rect.top + AUTO_SCROLL_EDGE_PX - clientY) / AUTO_SCROLL_EDGE_PX
    scrollEl.scrollTop -= Math.ceil(t * AUTO_SCROLL_MAX_PX)
  } else if (clientY > rect.bottom - AUTO_SCROLL_EDGE_PX) {
    const t = (clientY - (rect.bottom - AUTO_SCROLL_EDGE_PX)) / AUTO_SCROLL_EDGE_PX
    scrollEl.scrollTop += Math.ceil(t * AUTO_SCROLL_MAX_PX)
  }
}

function groupRootsByPartySections(
  roots: GuideItem[],
): Array<{ party: SupportParty; items: GuideItem[] }> {
  const byParty = new Map<SupportParty, GuideItem[]>()
  for (const party of SUPPORT_PARTIES) byParty.set(party, [])
  for (const item of roots) {
    byParty.get(getItemParty(item))!.push(item)
  }
  return SUPPORT_PARTIES.map((party) => ({
    party,
    items: byParty.get(party) ?? [],
  })).filter((section) => section.items.length > 0)
}

function TreeNode({
  item,
  items,
  selectedId,
  onSelect,
  depth,
  searchFilter,
  reorderMode,
  draggingId,
  onReorderMouseDown,
  dragOverId,
  flashFocusId,
  expandFolderIds,
  onDismissExpandFolder,
}: {
  item: GuideItem
  items: GuideItem[]
  selectedId: number | null
  onSelect: (id: number) => void
  depth: number
  searchFilter: TopicSearchFilter | null
  reorderMode: boolean
  draggingId: number | null
  onReorderMouseDown?: (id: number, e: React.MouseEvent) => void
  dragOverId: number | null
  flashFocusId: number | null
  expandFolderIds?: Set<number>
  onDismissExpandFolder?: (id: number) => void
}) {
  const allChildren = getChildren(items, item.id)
  const children = searchFilter
    ? allChildren.filter((c) => searchFilter.visibleIds.has(c.id))
    : allChildren
  const isFolder = children.length > 0
  const [manualOpen, setManualOpen] = useState(false)
  const forceOpen = expandFolderIds?.has(item.id) ?? false
  const open = searchFilter
    ? children.length > 0
    : manualOpen || forceOpen
  const match = searchFilter?.matchById.get(item.id)
  const title = item.question || 'Без названия'
  const label = (() => {
    if (!match || !searchFilter) return title
    const titleLower = title.toLowerCase()
    if (searchFilter.tokens.some((t) => titleLower.includes(t))) {
      return highlightTitle(title, searchFilter.tokens)
    }
    if (match.inBody) {
      return <mark className="find-hit">{title}</mark>
    }
    return title
  })()

  return (
    <li>
      <div
        data-topic-id={item.id}
        className={[
          'topic-item',
          selectedId === item.id && !reorderMode ? 'is-selected' : '',
          isFolder ? 'is-folder' : '',
          reorderMode ? 'is-reorder-mode' : '',
          dragOverId === item.id ? 'is-drag-over' : '',
          draggingId === item.id ? 'is-dragging' : '',
          flashFocusId === item.id ? 'is-reorder-focus-flash' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          marginLeft: `${rowMarginLeft(depth)}px`,
          paddingLeft: depth === 0 ? `${ROOT_PAD}px` : 0,
        }}
        onMouseDown={(e) => {
          if (!reorderMode || e.button !== 0) return
          e.preventDefault()
          onReorderMouseDown?.(item.id, e)
        }}
      >
        {isFolder ? (
          <button
            type="button"
            className="topic-item__toggle"
            aria-label={open ? 'Свернуть' : 'Развернуть'}
            onClick={() => {
              if (searchFilter || reorderMode) return
              if (open) {
                if (forceOpen) onDismissExpandFolder?.(item.id)
                setManualOpen(false)
              } else {
                setManualOpen(true)
              }
            }}
            tabIndex={reorderMode ? -1 : 0}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="topic-item__spacer" />
        )}
        <button
          type="button"
          className="topic-item__label"
          onClick={() => {
            if (reorderMode) return
            onSelect(item.id)
          }}
          tabIndex={reorderMode ? -1 : 0}
        >
          {label}
        </button>
      </div>
      {isFolder && open && children.length > 0 && (
        <ul
          className="topic-tree"
          style={{ ['--guide-x' as string]: `${guideX(depth)}px` }}
        >
          {children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              items={items}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
              searchFilter={searchFilter}
              reorderMode={reorderMode}
              draggingId={draggingId}
              onReorderMouseDown={onReorderMouseDown}
              dragOverId={dragOverId}
              flashFocusId={flashFocusId}
              expandFolderIds={expandFolderIds}
              onDismissExpandFolder={onDismissExpandFolder}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function renderTreeNode(
  item: GuideItem,
  props: {
    items: GuideItem[]
    selectedId: number | null
    onSelect: (id: number) => void
    searchFilter: TopicSearchFilter | null
    reorderMode: boolean
    onReorderSiblings?: (parentId: number | null, draggedId: number, targetId: number) => void
    draggingId: number | null
    onReorderMouseDown?: (id: number, e: React.MouseEvent) => void
    dragOverId: number | null
    flashFocusId: number | null
    expandFolderIds?: Set<number>
    onDismissExpandFolder?: (id: number) => void
  },
) {
  return (
    <TreeNode
      key={item.id}
      item={item}
      items={props.items}
      selectedId={props.selectedId}
      onSelect={props.onSelect}
      depth={0}
      searchFilter={props.searchFilter}
      reorderMode={props.reorderMode}
      draggingId={props.draggingId}
      onReorderMouseDown={props.onReorderMouseDown}
      dragOverId={props.dragOverId}
      flashFocusId={props.flashFocusId}
      expandFolderIds={props.expandFolderIds}
      onDismissExpandFolder={props.onDismissExpandFolder}
    />
  )
}

export function TopicList({
  items,
  selectedId,
  onSelect,
  searchFilter,
  groupRootsByParty = false,
  rootReorderSameParty = false,
  reorderMode = false,
  reorderPreparing = false,
  reorderLockBanner = null,
  canReorder = false,
  canEditTopic = false,
  onEnterReorderMode,
  onExitReorderMode,
  onEditTopic,
  onReorderSiblings,
}: TopicListProps) {
  const [ctxMenu, setCtxMenu] = useState<{
    x: number
    y: number
    topicId: number | null
  } | null>(null)
  const ctxMenuRef = useRef<HTMLDivElement>(null)
  const [reorderFocusId, setReorderFocusId] = useState<number | null>(null)
  const [flashFocusId, setFlashFocusId] = useState<number | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [dragGhost, setDragGhost] = useState<ReorderDragGhost | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const scrollElRef = useRef<HTMLElement | null>(null)
  const reorderPendingRef = useRef<ReorderPending | null>(null)
  const dragSessionRef = useRef<ReorderDragSession | null>(null)
  const draggingIdRef = useRef<number | null>(null)
  const pendingReorderFocusRef = useRef<number | null>(null)
  const wasReorderModeRef = useRef(false)
  const hadSearchFilterRef = useRef(false)
  const [expandFolderIds, setExpandFolderIds] = useState<Set<number>>(() => new Set())
  const [scrollToTopicId, setScrollToTopicId] = useState<number | null>(null)

  useEffect(() => {
    draggingIdRef.current = draggingId
  }, [draggingId])

  useEffect(() => {
    scrollElRef.current = findScrollParent(listRef.current)
  })

  useEffect(() => {
    if (!ctxMenu) return
    function close(e: Event) {
      if (e.type === 'keydown') {
        setCtxMenu(null)
        return
      }
      const target = e.target
      if (target instanceof Node && ctxMenuRef.current?.contains(target)) return
      setCtxMenu(null)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', close)
    }
  }, [ctxMenu])

  useEffect(() => {
    const wasReorderMode = wasReorderModeRef.current
    wasReorderModeRef.current = reorderMode

    if (reorderMode && !wasReorderMode) {
      const focusId = pendingReorderFocusRef.current ?? selectedId ?? null
      pendingReorderFocusRef.current = null
      setReorderFocusId(focusId)
      return
    }

    if (!reorderMode && wasReorderMode) {
      setDraggingId(null)
      setDragOverId(null)
      setDragGhost(null)
      setReorderFocusId(null)
      setFlashFocusId(null)
      reorderPendingRef.current = null
      dragSessionRef.current = null
    }
  }, [reorderMode, selectedId])

  const dismissExpandFolder = useCallback((id: number) => {
    setExpandFolderIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  useEffect(() => {
    const hasSearch = searchFilter != null
    if (hadSearchFilterRef.current && !hasSearch && selectedId != null) {
      setExpandFolderIds(new Set(getAncestorIds(items, selectedId)))
      setScrollToTopicId(selectedId)
    }
    hadSearchFilterRef.current = hasSearch
  }, [searchFilter, selectedId, items])

  useEffect(() => {
    if (scrollToTopicId == null) return

    let cancelled = false

    void (async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      if (cancelled) return

      const row = listRef.current?.querySelector(
        `[data-topic-id="${scrollToTopicId}"]`,
      ) as HTMLElement | null
      if (!row) {
        setScrollToTopicId(null)
        return
      }

      const scrollEl = scrollElRef.current ?? findScrollParent(listRef.current)
      if (scrollEl) {
        scrollRowToListCenter(row, scrollEl, 'smooth')
        await waitForScrollEnd(scrollEl)
      } else {
        row.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }

      if (!cancelled) setScrollToTopicId(null)
    })()

    return () => {
      cancelled = true
    }
  }, [scrollToTopicId, expandFolderIds])

  useEffect(() => {
    if (!reorderMode || reorderFocusId == null) return

    let cancelled = false
    let flashTimer: ReturnType<typeof setTimeout> | undefined

    void (async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      if (cancelled) return

      const row = listRef.current?.querySelector(
        `[data-topic-id="${reorderFocusId}"]`,
      ) as HTMLElement | null
      if (!row) return

      const scrollEl = scrollElRef.current ?? findScrollParent(listRef.current)
      const needsScroll = scrollEl != null && !isRowVisibleInScroll(row, scrollEl)

      if (needsScroll && scrollEl) {
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        await waitForScrollEnd(scrollEl)
      } else {
        row.scrollIntoView({ block: 'nearest', behavior: 'auto' })
      }

      if (cancelled) return
      setFlashFocusId(reorderFocusId)
      flashTimer = setTimeout(() => setFlashFocusId(null), REORDER_FOCUS_FLASH_MS)
    })()

    return () => {
      cancelled = true
      if (flashTimer) clearTimeout(flashTimer)
    }
  }, [reorderMode, reorderFocusId])

  function updateDragGhost(clientX: number, clientY: number) {
    const session = dragSessionRef.current
    if (!session) return
    setDragGhost({
      label: session.label,
      width: session.width,
      x: clientX - session.offsetX,
      y: clientY - session.offsetY,
    })
  }

  const canDropOnTarget = useCallback(
    (draggedId: number, targetId: number): boolean => {
      if (draggedId === targetId) return false
      const dragged = items.find((entry) => entry.id === draggedId)
      const target = items.find((entry) => entry.id === targetId)
      if (!dragged || !target) return false
      if ((dragged.parent_id ?? null) !== (target.parent_id ?? null)) return false
      if (rootReorderSameParty && (dragged.parent_id ?? null) === null) {
        return getItemParty(dragged) === getItemParty(target)
      }
      return true
    },
    [rootReorderSameParty, items],
  )

  const handleDropOnItem = useCallback(
    (targetId: number) => {
      const activeId = draggingIdRef.current
      if (activeId == null || !canDropOnTarget(activeId, targetId)) return
      const dragged = items.find((entry) => entry.id === activeId)
      if (!dragged) return
      onReorderSiblings?.(dragged.parent_id ?? null, activeId, targetId)
    },
    [canDropOnTarget, items, onReorderSiblings],
  )

  const handleReorderMouseDown = useCallback(
    (id: number, e: React.MouseEvent) => {
      const row = e.currentTarget as HTMLElement
      const rect = row.getBoundingClientRect()
      const item = items.find((entry) => entry.id === id)
      reorderPendingRef.current = {
        id,
        x: e.clientX,
        y: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        width: rect.width,
        label: item ? topicDisplayLabel(item) : 'Без названия',
      }
    },
    [items],
  )

  /** Pointer reorder (not HTML5 drag) so wheel scroll works while moving a topic. */
  useEffect(() => {
    if (!reorderMode) {
      document.body.classList.remove('topic-reorder-dragging', 'topic-reorder-drop-ok')
      return
    }

    function clearReorderDragCursor() {
      document.body.classList.remove('topic-reorder-dragging', 'topic-reorder-drop-ok')
    }

    function clearReorderPointer() {
      reorderPendingRef.current = null
      dragSessionRef.current = null
      draggingIdRef.current = null
      setDraggingId(null)
      setDragOverId(null)
      setDragGhost(null)
      clearReorderDragCursor()
    }

    function updateHoverTarget(clientX: number, clientY: number) {
      const activeId = draggingIdRef.current
      if (activeId == null) {
        clearReorderDragCursor()
        return
      }

      document.body.classList.add('topic-reorder-dragging')
      const targetId = topicIdFromPoint(clientX, clientY)
      const canDrop = targetId != null && canDropOnTarget(activeId, targetId)

      if (canDrop) {
        document.body.classList.add('topic-reorder-drop-ok')
        setDragOverId(targetId)
      } else {
        document.body.classList.remove('topic-reorder-drop-ok')
        setDragOverId(null)
      }
    }

    function onMouseMove(e: MouseEvent) {
      const pending = reorderPendingRef.current
      const scrollEl = scrollElRef.current

      if (pending && draggingIdRef.current == null) {
        const dx = e.clientX - pending.x
        const dy = e.clientY - pending.y
        if (dx * dx + dy * dy >= REORDER_DRAG_THRESHOLD_PX * REORDER_DRAG_THRESHOLD_PX) {
          draggingIdRef.current = pending.id
          dragSessionRef.current = {
            offsetX: pending.offsetX,
            offsetY: pending.offsetY,
            width: pending.width,
            label: pending.label,
          }
          setDraggingId(pending.id)
          updateDragGhost(e.clientX, e.clientY)
        }
      }

      if (draggingIdRef.current != null) {
        if (scrollEl) autoScrollContainer(scrollEl, e.clientY)
        updateDragGhost(e.clientX, e.clientY)
        updateHoverTarget(e.clientX, e.clientY)
      }
    }

    function onMouseUp(e: MouseEvent) {
      if (draggingIdRef.current != null) {
        const targetId = topicIdFromPoint(e.clientX, e.clientY)
        if (targetId != null) handleDropOnItem(targetId)
      }
      clearReorderPointer()
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      clearReorderPointer()
    }
  }, [reorderMode, canDropOnTarget, handleDropOnItem])

  const roots = buildTree(items).filter(
    (item) => !searchFilter || searchFilter.visibleIds.has(item.id),
  )
  const showPartySections = groupRootsByParty
  const partySections = showPartySections ? groupRootsByPartySections(roots) : []

  function openContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    const topicId = topicIdFromPoint(e.clientX, e.clientY)
    if (reorderMode) {
      setCtxMenu({ x: e.clientX, y: e.clientY, topicId })
      return
    }
    if (topicId == null) return
    if (!canReorder && !canEditTopic) return
    setCtxMenu({ x: e.clientX, y: e.clientY, topicId })
  }

  function beginReorderMode() {
    if (reorderPreparing || ctxMenu?.topicId == null) return
    pendingReorderFocusRef.current = ctxMenu.topicId
    setCtxMenu(null)
    onEnterReorderMode?.()
  }

  function beginEditTopic() {
    if (ctxMenu?.topicId == null) return
    const topicId = ctxMenu.topicId
    setCtxMenu(null)
    onEditTopic?.(topicId)
  }

  const treeNodeProps = {
    items,
    selectedId,
    onSelect,
    searchFilter,
    reorderMode,
    onReorderSiblings,
    draggingId,
    onReorderMouseDown: handleReorderMouseDown,
    dragOverId,
    flashFocusId,
    expandFolderIds,
    onDismissExpandFolder: dismissExpandFolder,
  }

  if (searchFilter && roots.length === 0) {
    return <div className="empty-hint">Ничего не найдено</div>
  }

  if (roots.length === 0) {
    return <div className="empty-hint">В этом отделе пока нет тем</div>
  }

  return (
    <>
      {reorderLockBanner ? (
        <div className="topic-reorder-lock-banner" role="alert">
          {reorderLockBanner}
        </div>
      ) : null}
      <ul
        ref={listRef}
        className={`topic-tree topic-list${reorderMode ? ' is-reorder-active' : ''}`}
        onContextMenu={openContextMenu}
      >
        {showPartySections
          ? partySections.map(({ party, items: sectionRoots }) => (
              <li key={party} className="topic-party-section">
                <div className="topic-party-section__heading">{SUPPORT_PARTY_LABELS[party]}</div>
                <ul className="topic-party-section__list">
                  {sectionRoots.map((item) => renderTreeNode(item, treeNodeProps))}
                </ul>
              </li>
            ))
          : roots.map((item) => renderTreeNode(item, treeNodeProps))}
      </ul>

      {dragGhost &&
        createPortal(
          <div
            className="topic-reorder-ghost"
            style={{
              left: dragGhost.x,
              top: dragGhost.y,
              width: dragGhost.width,
            }}
            aria-hidden
          >
            <span className="topic-reorder-ghost__spacer" />
            <span className="topic-reorder-ghost__label">{dragGhost.label}</span>
          </div>,
          document.body,
        )}

      {ctxMenu && (
        <div
          ref={ctxMenuRef}
          className="image-ctx-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          role="menu"
        >
          {reorderMode ? (
            <button
              type="button"
              className="image-ctx-menu__item"
              role="menuitem"
              onClick={() => {
                setCtxMenu(null)
                onExitReorderMode?.()
              }}
            >
              Завершить редактирование
            </button>
          ) : (
            <>
              {canReorder ? (
                <button
                  type="button"
                  className="image-ctx-menu__item"
                  role="menuitem"
                  disabled={reorderPreparing || ctxMenu.topicId == null}
                  onClick={() => beginReorderMode()}
                >
                  {reorderPreparing ? 'Загрузка порядка…' : 'Редактировать порядок'}
                </button>
              ) : null}
              {canEditTopic ? (
                <button
                  type="button"
                  className="image-ctx-menu__item"
                  role="menuitem"
                  disabled={ctxMenu.topicId == null}
                  onClick={() => beginEditTopic()}
                >
                  Редактировать тему
                </button>
              ) : null}
            </>
          )}
        </div>
      )}
    </>
  )
}
