import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
} from './types'

const defaultSync: SyncStatus = {
  code: 'idle',
  label: 'Готово',
  hasPendingChanges: false,
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

  useEffect(() => {
    void window.spravochnik.getCurrentUser().then((u) => {
      if (u) {
        const saved = loadSavedDepartment(u.id)
        if (saved) setDepartmentId(saved)
        const canEditUser = u.role === 'editor' || u.role === 'admin'
        setListFilter(resolveListFilter(u.id, saved ?? 'support', canEditUser))
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
    })
  }, [])

  function handleDepartmentChange(id: DepartmentId) {
    setDepartmentId(id)
    setNavHistory([])
    if (user) {
      saveDepartment(user.id, id)
      const canEditUser = user.role === 'editor' || user.role === 'admin'
      setListFilter(resolveListFilter(user.id, id, canEditUser))
    } else {
      setListFilter('all')
    }
  }

  function handleAuthenticated(u: PublicUser) {
    const saved = loadSavedDepartment(u.id)
    const dept = saved ?? 'support'
    if (saved) setDepartmentId(saved)
    else setDepartmentId('support')
    const canEditUser = u.role === 'editor' || u.role === 'admin'
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

  useEffect(() => {
    if (!user) return
    void load(departmentId)
  }, [departmentId, load, user])

  // After background sync, refresh current department quietly
  useEffect(() => {
    if (!user) return
    if (
      syncStatus.code === 'up_to_date' ||
      syncStatus.code === 'pending' ||
      syncStatus.code === 'conflict'
    ) {
      void window.spravochnik.loadGuide(departmentId).then(setGuide).catch(() => undefined)
    }
  }, [syncStatus.code, departmentId, user])

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

  const canEdit = user?.role === 'editor' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

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

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  )

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
    if (selectedId == null) return
    if (!items.some((i) => i.id === selectedId)) {
      setSelectedId(null)
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
      setSelectedId(payload.id)
      if (
        payload.departmentId === 'support' &&
        payload.party &&
        listFilter !== 'all' &&
        listFilter !== 'archive'
      ) {
        handleListFilterChange(payload.party)
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
      setSelectedId(newest.id)
      setQuery('')
      if (
        payload.departmentId === 'support' &&
        payload.party &&
        listFilter !== 'all' &&
        listFilter !== 'archive'
      ) {
        handleListFilterChange(payload.party)
      }
    } else {
      setDepartmentId(payload.departmentId)
    }
  }

  async function handleInlineSave(payload: {
    question: string
    answer: string
    parent_id: number | null
    party?: SupportParty
  }) {
    if (!selected) return
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
    if (
      departmentId === 'support' &&
      payload.party &&
      listFilter !== 'all' &&
      listFilter !== 'archive'
    ) {
      handleListFilterChange(payload.party)
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
    const data = await window.spravochnik.updateItem({
      departmentId,
      item: {
        ...selected,
        image_display: image_display ?? {},
      },
    })
    setGuide(data)
  }

  async function handleDelete() {
    if (!selected) return
    const data = await window.spravochnik.deleteItem({
      departmentId,
      id: selected.id,
    })
    setGuide(data)
    setSelectedId(null)
    setNavHistory([])
  }

  if (user === undefined) {
    return <div className="boot-screen">Загрузка…</div>
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  if (view === 'settings') {
    return <SettingsPage onBack={() => setView('main')} />
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
            showListFilter
            listFilter={listFilter}
            filterOptions={filterOptions}
            onListFilterChange={handleListFilterChange}
            onAdd={() => {
              setEditorMode('add')
              setEditorInitial(null)
              setEditorParentId(null)
              setEditorOpen(true)
            }}
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
            onNavigateToTopic={navigateToTopic}
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
        items={visibleItems}
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
