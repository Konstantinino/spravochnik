import { useCallback, useEffect, useMemo, useRef, useState, Component, type ReactNode } from 'react'
import { Header } from './components/Header'
import { Search } from './components/Search'
import { TopicList } from './components/TopicList'
import { Viewer } from './components/Viewer'
import { TopicEditorModal } from './components/TopicEditorModal'
import { AuthScreen } from './components/AuthScreen'
import { SettingsPage } from './components/SettingsPage'
import { SyncConflictModal } from './components/SyncConflictModal'
import { getItems, filterItemsByView, getItemParty, isArchived } from './lib/data'
import { buildTopicSearchFilter } from './lib/search'
import {
  loadSavedDepartment,
  saveDepartment,
  loadSavedListFilter,
  saveListFilter,
} from './lib/prefs'
import type {
  ConflictResolution,
  DepartmentId,
  GuideFile,
  GuideItem,
  ImageDisplayMap,
  PublicUser,
  SupportParty,
  TopicViewFilter,
  SyncStatus,
} from './types'
import {
  DEPARTMENTS,
  DEPT_VIEW_FILTERS,
  SUPPORT_VIEW_FILTERS,
  isSupportParty,
  normalizeWorkDepartmentId,
  isStaffRole,
  canEditDepartment,
} from './types'

const defaultSync: SyncStatus = {
  code: 'idle',
  label: 'Готово',
  hasPendingChanges: false,
}

class SettingsErrorBoundary extends Component<
  { children: ReactNode; onBack: () => void },
  { error: string | null }
> {
  state = { error: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message || 'Ошибка экрана настроек' }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="settings-page">
          <div className="settings-page__bar">
            <button type="button" className="btn btn-secondary" onClick={this.props.onBack}>
              ← Назад
            </button>
            <h1>Настройки</h1>
          </div>
          <div className="settings-page__content">
            <div className="form-error">{this.state.error}</div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function resolveUserDepartment(u: PublicUser): DepartmentId {
  const saved = loadSavedDepartment(u.id)
  if (saved) {
    if (isStaffRole(u.role) || saved !== 'templates') {
      return saved
    }
  }
  return normalizeWorkDepartmentId(u.departmentId)
}

function resolveListFilter(
  userId: string,
  departmentId: DepartmentId,
  canEdit: boolean,
): TopicViewFilter {
  const saved = loadSavedListFilter(userId, departmentId)
  if (saved === 'archive' && !canEdit) return 'all'
  if (departmentId === 'support') {
    if (saved === 'archive' || saved === 'all' || isSupportParty(saved)) return saved!
    return 'all'
  }
  if (saved === 'archive' || saved === 'all') return saved
  return 'all'
}

export default function App() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined)
  const [view, setView] = useState<'main' | 'settings'>('main')
  const [departmentId, setDepartmentId] = useState<DepartmentId>('support')
  const [guide, setGuide] = useState<GuideFile | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [searchInBody, setSearchInBody] = useState(false)
  const [listFilter, setListFilter] = useState<TopicViewFilter>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add')
  const [editorParentId, setEditorParentId] = useState<number | null>(null)
  const [editorInitial, setEditorInitial] = useState<GuideItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSync)
  const [pushing, setPushing] = useState(false)
  const [busyLeft, setBusyLeft] = useState<number | null>(null)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [navHistory, setNavHistory] = useState<number[]>([])
  const pushInFlight = useRef(false)
  /** Skip auto-deselect while save/reload settles (avoid race with background sync). */
  const keepSelectedIdRef = useRef<number | null>(null)
  /** Snapshot of topic before inline edit; consumed on successful save. */
  const editSnapshotRef = useRef<GuideItem | null>(null)
  const [localUndo, setLocalUndo] = useState<{
    departmentId: DepartmentId
    topicId: number
    item: GuideItem
  } | null>(null)
  const [resettingTopic, setResettingTopic] = useState(false)

  useEffect(() => {
    void window.spravochnik.getCurrentUser().then((u) => {
      if (u) {
        const dept = resolveUserDepartment(u)
        setDepartmentId(dept)
        const canEditUser = canEditDepartment(u.role, u.departmentId, dept)
        setListFilter(resolveListFilter(u.id, dept, canEditUser))
      }
      setUser(u)
    })
    void window.spravochnik.getSyncStatus().then((status) => {
      setSyncStatus(status)
      if (status.code === 'conflict' && (status.conflicts?.length ?? 0) > 0) {
        setConflictOpen(true)
      }
    })
    return window.spravochnik.onSyncStatus((status) => {
      setSyncStatus(status)
      if (status.code === 'conflict' && (status.conflicts?.length ?? 0) > 0) {
        setConflictOpen(true)
      }
      if (status.code === 'up_to_date' || status.code === 'pending') {
        void window.spravochnik.getCurrentUser().then((u) => {
          if (!u) return
          // Avoid new object identity on every sync — that re-triggers load() and clears selection.
          setUser((prev) => {
            if (
              prev &&
              prev.id === u.id &&
              prev.role === u.role &&
              prev.departmentId === u.departmentId &&
              prev.name === u.name &&
              prev.email === u.email
            ) {
              return prev
            }
            return u
          })
        })
      }
    })
  }, [])

  function handleDepartmentChange(id: DepartmentId) {
    if (user && !isStaffRole(user.role) && id === 'templates') return
    setDepartmentId(id)
    setNavHistory([])
    if (user) {
      saveDepartment(user.id, id)
      const canEditUser = canEditDepartment(user.role, user.departmentId, id)
      setListFilter(resolveListFilter(user.id, id, canEditUser))
    } else {
      setListFilter('all')
    }
  }

  function handleAuthenticated(u: PublicUser) {
    const dept = resolveUserDepartment(u)
    setDepartmentId(dept)
    saveDepartment(u.id, dept)
    const canEditUser = canEditDepartment(u.role, u.departmentId, dept)
    setListFilter(resolveListFilter(u.id, dept, canEditUser))
    setUser(u)
  }

  function handleListFilterChange(filter: TopicViewFilter) {
    setListFilter(filter)
    setQuery('')
    setSelectedId(null)
    setNavHistory([])
    if (user) saveListFilter(user.id, departmentId, filter)
  }

  /** After save: align party filter without deselecting the open topic. */
  function syncListFilterAfterPartySave(party: SupportParty) {
    if (listFilter === 'all' || listFilter === 'archive' || listFilter === party) return
    setListFilter(party)
    if (user) saveListFilter(user.id, departmentId, party)
  }

  function closeTopic() {
    setSelectedId(null)
    setNavHistory([])
  }

  const load = useCallback(async (id: DepartmentId) => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.spravochnik.loadGuide(id)
      setGuide(data)
      setSelectedId(null)
      setQuery('')
    } catch (e) {
      setGuide(null)
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  // Reload guide only when department or logged-in user *id* changes — not on every
  // sync-driven PublicUser object refresh (that used to wipe selectedId via load()).
  useEffect(() => {
    if (!user) return
    void load(departmentId)
  }, [departmentId, load, user?.id])

  // After background sync, refresh current department quietly (keep open topic)
  useEffect(() => {
    if (!user) return
    if (
      syncStatus.code === 'up_to_date' ||
      syncStatus.code === 'pending' ||
      syncStatus.code === 'conflict'
    ) {
      void window.spravochnik.loadGuide(departmentId).then((data) => {
        setGuide(data)
        setSelectedId((current) => {
          const prefer = keepSelectedIdRef.current ?? current
          if (prefer == null) return null
          const list = getItems(data)
          return list.some((i) => Number(i.id) === Number(prefer)) ? prefer : null
        })
      }).catch(() => undefined)
    }
  }, [syncStatus.code, syncStatus.lastPulledAt, departmentId, user?.id])

  async function runPush() {
    if (pushInFlight.current) return
    pushInFlight.current = true
    setPushing(true)
    try {
      const status = await window.spravochnik.pushSync()
      setSyncStatus(status)
      if (status.code === 'conflict' && (status.conflicts?.length ?? 0) > 0) {
        setConflictOpen(true)
      }
      if (status.code === 'up_to_date') {
        const data = await window.spravochnik.loadGuide(departmentId)
        setGuide(data)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки')
    } finally {
      setPushing(false)
      pushInFlight.current = false
    }
  }

  // Auto-retry when sync lock is busy
  useEffect(() => {
    if (syncStatus.code !== 'busy') {
      setBusyLeft(null)
      return
    }
    let left = syncStatus.retryAfterSec ?? 20
    setBusyLeft(left)
    const timer = window.setInterval(() => {
      left -= 1
      setBusyLeft(left)
      if (left <= 0) {
        window.clearInterval(timer)
        void runPush()
      }
    }, 1000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retry only when busy status arrives
  }, [syncStatus.code, syncStatus.retryAfterSec, syncStatus.lockBy])

  async function handlePush() {
    await runPush()
  }

  async function handleResolveConflicts(resolutions: ConflictResolution[]) {
    setPushing(true)
    try {
      const status = await window.spravochnik.resolveSyncConflicts(resolutions)
      setSyncStatus(status)
      if (status.code === 'error') {
        throw new Error(status.detail || status.label)
      }
      if (status.code === 'busy') {
        setConflictOpen(false)
        return
      }
      if (status.code === 'conflict' && (status.conflicts?.length ?? 0) > 0) {
        setConflictOpen(true)
      } else {
        setConflictOpen(false)
      }
      const data = await window.spravochnik.loadGuide(departmentId)
      setGuide(data)
    } finally {
      setPushing(false)
    }
  }

  async function handleLogout() {
    await window.spravochnik.logout()
    setUser(null)
    setView('main')
  }

  const items: GuideItem[] = useMemo(() => (guide ? getItems(guide) : []), [guide])

  const canEdit = canEditDepartment(user?.role, user?.departmentId, departmentId)
  const isAdmin = isStaffRole(user?.role)

  const visibleItems: GuideItem[] = useMemo(
    () => filterItemsByView(items, listFilter),
    [items, listFilter],
  )

  const filterOptions: TopicViewFilter[] = useMemo(() => {
    const base =
      departmentId === 'support' ? [...SUPPORT_VIEW_FILTERS] : [...DEPT_VIEW_FILTERS]
    if (canEdit) base.push('archive')
    return base
  }, [departmentId, canEdit])

  const selected = useMemo(() => {
    if (selectedId == null) return null
    return items.find((i) => Number(i.id) === Number(selectedId)) ?? null
  }, [items, selectedId])

  const showLocalReset = Boolean(
    canEdit &&
      localUndo &&
      localUndo.departmentId === departmentId &&
      selectedId != null &&
      localUndo.topicId === selectedId,
  )

  function pinSelectedTopic(id: number) {
    keepSelectedIdRef.current = id
    setSelectedId(id)
  }

  function releasePinnedTopic(id: number) {
    if (keepSelectedIdRef.current === id) {
      keepSelectedIdRef.current = null
    }
  }

  function selectTopicFromSidebar(id: number) {
    setNavHistory([])
    setSelectedId(id)
  }

  function navigateToTopic(id: number) {
    const topic = items.find((i) => i.id === id)
    if (!topic || id === selectedId) return
    setNavHistory((history) => (selectedId != null ? [...history, selectedId] : history))
    if (!visibleItems.some((i) => i.id === id)) {
      if (isArchived(topic)) {
        if (canEdit) setListFilter('archive')
      } else if (listFilter === 'archive') {
        setListFilter('all')
      } else if (departmentId === 'support' && isSupportParty(listFilter)) {
        setListFilter('all')
      }
    }
    setSelectedId(id)
  }

  function navigateBack() {
    setNavHistory((history) => {
      if (history.length === 0) return history
      const next = [...history]
      const prevId = next.pop()!
      const prev = items.find((i) => i.id === prevId)
      if (prev && !visibleItems.some((i) => i.id === prevId)) {
        if (isArchived(prev)) {
          if (canEdit) setListFilter('archive')
        } else if (listFilter === 'archive') {
          setListFilter('all')
        } else if (departmentId === 'support' && isSupportParty(listFilter)) {
          setListFilter('all')
        }
      }
      setSelectedId(prevId)
      return next
    })
  }

  useEffect(() => {
    const pinned = keepSelectedIdRef.current
    if (pinned == null) return
    if (items.some((i) => Number(i.id) === Number(pinned))) {
      keepSelectedIdRef.current = null
    }
  }, [items])

  useEffect(() => {
    if (selectedId == null) return
    if (keepSelectedIdRef.current != null && Number(keepSelectedIdRef.current) === Number(selectedId)) {
      return
    }
    if (!items.some((i) => Number(i.id) === Number(selectedId))) {
      setSelectedId(null)
      setNavHistory([])
    }
  }, [items, selectedId])

  const searchFilter = useMemo(
    () => buildTopicSearchFilter(visibleItems, query, { searchInBody }),
    [visibleItems, query, searchInBody],
  )

  const displaySyncStatus: SyncStatus = useMemo(() => {
    if (syncStatus.code === 'busy' && busyLeft != null) {
      return {
        ...syncStatus,
        label: `Синхронизация временно занята (${busyLeft} с)`,
        detail:
          syncStatus.lockBy != null
            ? `Сейчас синхронизирует: ${syncStatus.lockBy}`
            : syncStatus.detail,
      }
    }
    return syncStatus
  }, [syncStatus, busyLeft])

  async function handleSave(payload: {
    departmentId: DepartmentId
    question: string
    answer: string
    parent_id: number | null
    party?: SupportParty
    id?: number
    draftId?: string
  }) {
    if (payload.id != null) {
      const existing = items.find((i) => i.id === payload.id)
      if (!existing) throw new Error('Тема не найдена')
      pinSelectedTopic(payload.id)
      const data = await window.spravochnik.updateItem({
        departmentId: payload.departmentId,
        item: {
          ...existing,
          question: payload.question,
          answer: payload.answer,
          parent_id: payload.parent_id,
          party: payload.party ?? existing.party,
        },
      })
      setGuide(data)
      pinSelectedTopic(payload.id)
      if (payload.departmentId === 'support' && payload.party) {
        syncListFilterAfterPartySave(payload.party)
      }
      return
    }

    const data = await window.spravochnik.saveItem({
      departmentId: payload.departmentId,
      draftId: payload.draftId,
      item: {
        question: payload.question,
        answer: payload.answer,
        parent_id: payload.parent_id,
        has_children: false,
        party: payload.party,
        photos: [],
        documents: [],
      },
    })
    if (payload.departmentId === departmentId) {
      setGuide(data)
      const list = getItems(data)
      const newest = list.reduce((a, b) => (a.id > b.id ? a : b))
      pinSelectedTopic(newest.id)
      setQuery('')
      if (payload.departmentId === 'support' && payload.party) {
        syncListFilterAfterPartySave(payload.party)
      }
    } else {
      setDepartmentId(payload.departmentId)
    }
  }

  function handleEditStart(item: GuideItem) {
    editSnapshotRef.current = item
  }

  async function handleInlineSave(payload: {
    question: string
    answer: string
    parent_id: number | null
    party?: SupportParty
  }) {
    if (!selected) return
    const topicId = selected.id
    const snapshot = editSnapshotRef.current
    pinSelectedTopic(topicId)
    try {
      const data = await window.spravochnik.updateItem({
        departmentId,
        item: {
          ...selected,
          question: payload.question,
          answer: payload.answer,
          parent_id: payload.parent_id,
          party: payload.party ?? selected.party,
        },
      })
      setGuide(data)
      pinSelectedTopic(topicId)
      if (snapshot?.id === topicId) {
        setLocalUndo({ departmentId, topicId, item: snapshot })
      }
      editSnapshotRef.current = null
      if (departmentId === 'support' && payload.party) {
        syncListFilterAfterPartySave(payload.party)
      }
    } catch (e) {
      releasePinnedTopic(topicId)
      throw e
    }
  }

  async function handleLocalReset() {
    if (!localUndo || !canEdit) return
    if (
      !window.confirm(
        'Сбросить последние изменения этой темы и вернуть версию до сохранения с этого компьютера?',
      )
    ) {
      return
    }
    const { departmentId: undoDept, item } = localUndo
    setResettingTopic(true)
    pinSelectedTopic(item.id)
    try {
      const data = await window.spravochnik.updateItem({
        departmentId: undoDept,
        item,
      })
      if (undoDept === departmentId) {
        setGuide(data)
      }
      pinSelectedTopic(item.id)
      setLocalUndo(null)
      editSnapshotRef.current = null
    } catch (e) {
      releasePinnedTopic(item.id)
      window.alert(e instanceof Error ? e.message : 'Не удалось сбросить изменения')
    } finally {
      setResettingTopic(false)
    }
  }

  async function handleToggleArchive() {
    if (!selected || !canEdit) return
    const nextArchived = !selected.archived
    const data = await window.spravochnik.updateItem({
      departmentId,
      item: {
        ...selected,
        archived: nextArchived,
      },
    })
    setGuide(data)
    if (nextArchived && listFilter !== 'archive') {
      setSelectedId(null)
      setNavHistory([])
    }
  }

  async function handleSaveImageDisplay(image_display: ImageDisplayMap | undefined) {
    if (!selected) return
    const topicId = selected.id
    pinSelectedTopic(topicId)
    try {
      const data = await window.spravochnik.updateItem({
        departmentId,
        item: {
          ...selected,
          image_display: image_display ?? {},
        },
      })
      setGuide(data)
      pinSelectedTopic(topicId)
    } catch (e) {
      releasePinnedTopic(topicId)
      throw e
    }
  }

  async function handleDelete() {
    if (!selected) return
    const deletedId = selected.id
    const data = await window.spravochnik.deleteItem({
      departmentId,
      id: deletedId,
    })
    setGuide(data)
    setSelectedId(null)
    setNavHistory([])
    if (localUndo?.topicId === deletedId) {
      setLocalUndo(null)
      editSnapshotRef.current = null
    }
  }

  if (user === undefined) {
    return <div className="boot-screen">Загрузка…</div>
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  if (view === 'settings') {
    return (
      <SettingsErrorBoundary onBack={() => setView('main')}>
        <SettingsPage
          onBack={() => setView('main')}
          currentUser={user}
          onCurrentUserChange={(next) => {
            if (!next) {
              void handleLogout()
              return
            }
            handleAuthenticated(next)
          }}
        />
      </SettingsErrorBoundary>
    )
  }

  // Block UI only while uploading local changes — startup/background pull stays interactive
  const syncBlocking = pushing || busyLeft != null

  const deptLabel = DEPARTMENTS.find((d) => d.id === departmentId)?.label ?? ''

  const editorDefaultParty: SupportParty = (() => {
    if (editorParentId != null) {
      const parent = items.find((i) => i.id === editorParentId)
      if (parent) return getItemParty(parent)
    }
    return isSupportParty(listFilter) ? listFilter : 'supplier'
  })()

  return (
    <div className={`app-shell${syncBlocking ? ' app-shell--sync-busy' : ''}`}>
      <Header
        departmentId={departmentId}
        onDepartmentChange={handleDepartmentChange}
        onOpenSettings={() => setView('settings')}
        user={user}
        syncStatus={displaySyncStatus}
        canEdit={!!canEdit}
        onLogout={() => void handleLogout()}
        onPush={() => void handlePush()}
        pushing={pushing || busyLeft != null}
        interactionLocked={syncBlocking}
      />

      <div className="app-body">
        <aside className="sidebar">
          <Search
            value={query}
            onChange={setQuery}
            canAdd={!!canEdit}
            searchInBody={searchInBody}
            onSearchInBodyChange={setSearchInBody}
            showListFilter={filterOptions.length > 1}
            listFilter={listFilter}
            filterOptions={filterOptions}
            onListFilterChange={handleListFilterChange}
            onAdd={() => {
              setEditorMode('add')
              setEditorInitial(null)
              setEditorParentId(null)
              setEditorOpen(true)
            }}
            showReset={showLocalReset}
            onReset={() => void handleLocalReset()}
            resetting={resettingTopic}
          />
          <div className="sidebar__list">
            {loading ? (
              <div className="empty-hint">Загрузка…</div>
            ) : error ? (
              <div className="form-error">{error}</div>
            ) : (
              <TopicList
                items={visibleItems}
                selectedId={selectedId}
                onSelect={selectTopicFromSidebar}
                searchFilter={searchFilter}
              />
            )}
          </div>
          <div className="sidebar__footer">{deptLabel}</div>
        </aside>

        <main className="content">
          <Viewer
            item={selected}
            items={visibleItems}
            allItems={items}
            departmentId={departmentId}
            canEdit={!!canEdit && !!selected}
            isAdmin={!!isAdmin && !!selected}
            canGoBack={navHistory.length > 0}
            onBack={navigateBack}
            onClose={closeTopic}
            onNavigateToTopic={navigateToTopic}
            onEditStart={handleEditStart}
            onSave={handleInlineSave}
            onSaveImageDisplay={handleSaveImageDisplay}
            onDelete={handleDelete}
            onToggleArchive={canEdit ? () => void handleToggleArchive() : undefined}
            onAddSubtopic={() => {
              if (!selected) return
              setEditorMode('add')
              setEditorInitial(null)
              setEditorParentId(selected.id)
              setEditorOpen(true)
            }}
          />
        </main>
      </div>

      <TopicEditorModal
        open={editorOpen}
        mode={editorMode}
        departmentId={departmentId}
        parentId={editorParentId}
        items={items}
        defaultParty={editorDefaultParty}
        initial={editorInitial}
        onClose={() => {
          setEditorOpen(false)
          setEditorInitial(null)
        }}
        onSave={handleSave}
      />

      {conflictOpen && (syncStatus.conflicts?.length ?? 0) > 0 && (
        <SyncConflictModal
          conflicts={syncStatus.conflicts!}
          onResolve={handleResolveConflicts}
          onClose={() => setConflictOpen(false)}
        />
      )}
    </div>
  )
}
