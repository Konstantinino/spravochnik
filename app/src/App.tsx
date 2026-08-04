import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Search } from './components/Search'
import { TopicList } from './components/TopicList'
import { Viewer } from './components/Viewer'
import { TopicEditorModal } from './components/TopicEditorModal'
import { AuthScreen } from './components/AuthScreen'
import { SettingsPage } from './components/SettingsPage'
import { SyncConflictModal } from './components/SyncConflictModal'
import { getItems, filterItemsByParty, getItemParty } from './lib/data'
import { buildTopicSearchFilter } from './lib/search'
import { loadSavedDepartment, saveDepartment } from './lib/prefs'
import type {
  ConflictResolution,
  DepartmentId,
  GuideFile,
  GuideItem,
  ImageDisplayMap,
  PublicUser,
  SupportParty,
  SyncStatus,
} from './types'
import { DEPARTMENTS } from './types'

const defaultSync: SyncStatus = {
  code: 'idle',
  label: 'Готово',
  hasPendingChanges: false,
}

export default function App() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined)
  const [view, setView] = useState<'main' | 'settings'>('main')
  const [departmentId, setDepartmentId] = useState<DepartmentId>('support')
  const [guide, setGuide] = useState<GuideFile | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [searchInBody, setSearchInBody] = useState(false)
  const [supportParty, setSupportParty] = useState<SupportParty>('supplier')
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
  const pushInFlight = useRef(false)

  useEffect(() => {
    void window.spravochnik.getCurrentUser().then((u) => {
      if (u) {
        const saved = loadSavedDepartment(u.id)
        if (saved) setDepartmentId(saved)
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
    setSupportParty('supplier')
    if (user) saveDepartment(user.id, id)
  }

  function handleAuthenticated(u: PublicUser) {
    const saved = loadSavedDepartment(u.id)
    if (saved) setDepartmentId(saved)
    else setDepartmentId('support')
    setUser(u)
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

  const visibleItems: GuideItem[] = useMemo(() => {
    if (departmentId !== 'support') return items
    return filterItemsByParty(items, supportParty)
  }, [items, departmentId, supportParty])

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  )

  useEffect(() => {
    if (selectedId == null) return
    if (!visibleItems.some((i) => i.id === selectedId)) {
      setSelectedId(null)
    }
  }, [visibleItems, selectedId])

  const searchFilter = useMemo(
    () => buildTopicSearchFilter(visibleItems, query, { searchInBody }),
    [visibleItems, query, searchInBody],
  )

  const canEdit = user?.role === 'editor' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

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
      if (payload.departmentId === 'support' && payload.party) {
        setSupportParty(payload.party)
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
      if (payload.departmentId === 'support' && payload.party) {
        setSupportParty(payload.party)
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
    if (departmentId === 'support' && payload.party) {
      setSupportParty(payload.party)
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
    return supportParty
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
            showPartyFilter={departmentId === 'support'}
            partyFilter={supportParty}
            onPartyFilterChange={(party) => {
              setSupportParty(party)
              setQuery('')
              setSelectedId(null)
            }}
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
                onSelect={setSelectedId}
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
            departmentId={departmentId}
            canEdit={!!canEdit && !!selected}
            isAdmin={!!isAdmin && !!selected}
            onSelect={setSelectedId}
            onSave={handleInlineSave}
            onSaveImageDisplay={handleSaveImageDisplay}
            onDelete={handleDelete}
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
