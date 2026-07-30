import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Search } from './components/Search'
import { TopicList } from './components/TopicList'
import { Viewer } from './components/Viewer'
import { TopicEditorModal } from './components/TopicEditorModal'
import { AuthScreen } from './components/AuthScreen'
import { SettingsPage } from './components/SettingsPage'
import { getItems } from './lib/data'
import { searchItems } from './lib/search'
import type { DepartmentId, GuideFile, GuideItem, PublicUser, SyncStatus } from './types'
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
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSync)
  const [pushing, setPushing] = useState(false)

  useEffect(() => {
    void window.spravochnik.getCurrentUser().then(setUser)
    void window.spravochnik.getSyncStatus().then(setSyncStatus)
    return window.spravochnik.onSyncStatus(setSyncStatus)
  }, [])

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
    if (syncStatus.code === 'up_to_date' || syncStatus.code === 'pending') {
      void window.spravochnik.loadGuide(departmentId).then(setGuide).catch(() => undefined)
    }
  }, [syncStatus.code, departmentId, user])

  const items: GuideItem[] = useMemo(() => (guide ? getItems(guide) : []), [guide])

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  )

  const searchHits = useMemo(() => {
    const q = query.trim()
    if (!q) return null
    return searchItems(items, q)
  }, [items, query])

  const canEdit = user?.role === 'editor' || user?.role === 'admin'

  const loadDeptItems = useCallback(async (id: DepartmentId) => {
    const data = await window.spravochnik.loadGuide(id)
    return getItems(data)
  }, [])

  async function handleSave(payload: {
    departmentId: DepartmentId
    question: string
    answer: string
    parent_id: number | null
    id?: number
  }) {
    if (editorMode === 'edit' && payload.id != null) {
      const data = await window.spravochnik.updateItem({
        departmentId: payload.departmentId,
        item: {
          id: payload.id,
          question: payload.question,
          answer: payload.answer,
          parent_id: payload.parent_id,
          has_children: selected?.has_children ?? false,
          photos: selected?.photos ?? [],
          documents: selected?.documents ?? [],
        },
      })
      if (payload.departmentId === departmentId) {
        setGuide(data)
        setSelectedId(payload.id)
      } else {
        setDepartmentId(payload.departmentId)
      }
      return
    }

    const data = await window.spravochnik.saveItem({
      departmentId: payload.departmentId,
      item: {
        question: payload.question,
        answer: payload.answer,
        parent_id: payload.parent_id,
        has_children: false,
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
    } else {
      setDepartmentId(payload.departmentId)
    }
  }

  async function handlePush() {
    setPushing(true)
    try {
      const status = await window.spravochnik.pushSync()
      setSyncStatus(status)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки')
    } finally {
      setPushing(false)
    }
  }

  async function handleLogout() {
    await window.spravochnik.logout()
    setUser(null)
    setView('main')
  }

  if (user === undefined) {
    return <div className="boot-screen">Загрузка…</div>
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />
  }

  if (view === 'settings') {
    return <SettingsPage onBack={() => setView('main')} />
  }

  const deptLabel = DEPARTMENTS.find((d) => d.id === departmentId)?.label ?? ''

  return (
    <div className="app-shell">
      <Header
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        onAdd={() => {
          setEditorMode('add')
          setEditorOpen(true)
        }}
        onOpenSettings={() => setView('settings')}
        user={user}
        syncStatus={syncStatus}
        canEdit={!!canEdit}
        onLogout={() => void handleLogout()}
        onPush={() => void handlePush()}
        pushing={pushing}
      />

      <div className="app-body">
        <aside className="sidebar">
          <Search value={query} onChange={setQuery} />
          <div className="sidebar__list">
            {loading ? (
              <div className="empty-hint">Загрузка…</div>
            ) : error ? (
              <div className="form-error">{error}</div>
            ) : (
              <TopicList
                items={items}
                selectedId={selectedId}
                onSelect={setSelectedId}
                searchHits={searchHits}
              />
            )}
          </div>
          <div className="sidebar__footer">{deptLabel}</div>
        </aside>

        <main className="content">
          <Viewer
            item={selected}
            canEdit={!!canEdit && !!selected}
            onEdit={() => {
              setEditorMode('edit')
              setEditorOpen(true)
            }}
          />
        </main>
      </div>

      <TopicEditorModal
        open={editorOpen}
        mode={editorMode}
        items={items}
        departmentId={departmentId}
        initial={editorMode === 'edit' ? selected : null}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDepartmentPreview={loadDeptItems}
      />
    </div>
  )
}
