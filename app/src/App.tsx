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
import { loadSavedDepartment, saveDepartment } from './lib/prefs'
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
  const [editorParentId, setEditorParentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSync)
  const [pushing, setPushing] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  useEffect(() => {
    void window.spravochnik.getCurrentUser().then((u) => {
      if (u) {
        const saved = loadSavedDepartment(u.id)
        if (saved) setDepartmentId(saved)
      }
      setUser(u)
    })
    void window.spravochnik.getSyncStatus().then(setSyncStatus)
    return window.spravochnik.onSyncStatus(setSyncStatus)
  }, [])

  function handleDepartmentChange(id: DepartmentId) {
    setDepartmentId(id)
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
  const isAdmin = user?.role === 'admin'

  async function handleSave(payload: {
    departmentId: DepartmentId
    question: string
    answer: string
    parent_id: number | null
    id?: number
  }) {
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

  async function handleInlineSave(payload: { question: string; answer: string }) {
    if (!selected) return
    const data = await window.spravochnik.updateItem({
      departmentId,
      item: {
        ...selected,
        question: payload.question,
        answer: payload.answer,
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

  async function handleDiscard() {
    if (
      !window.confirm(
        'Отменить локальные изменения? Данные будут заменены версией с Яндекс.Диска.',
      )
    ) {
      return
    }
    setDiscarding(true)
    try {
      const status = await window.spravochnik.discardSync()
      setSyncStatus(status)
      const data = await window.spravochnik.loadGuide(departmentId)
      setGuide(data)
      setSelectedId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отмены')
    } finally {
      setDiscarding(false)
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
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  if (view === 'settings') {
    return <SettingsPage onBack={() => setView('main')} />
  }

  const deptLabel = DEPARTMENTS.find((d) => d.id === departmentId)?.label ?? ''

  return (
    <div className="app-shell">
      <Header
        departmentId={departmentId}
        onDepartmentChange={handleDepartmentChange}
        onOpenSettings={() => setView('settings')}
        user={user}
        syncStatus={syncStatus}
        canEdit={!!canEdit}
        onLogout={() => void handleLogout()}
        onPush={() => void handlePush()}
        onDiscard={() => void handleDiscard()}
        pushing={pushing}
        discarding={discarding}
      />

      <div className="app-body">
        <aside className="sidebar">
          <Search
            value={query}
            onChange={setQuery}
            canAdd={!!canEdit}
            onAdd={() => {
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
            items={items}
            canEdit={!!canEdit && !!selected}
            isAdmin={!!isAdmin && !!selected}
            onSelect={setSelectedId}
            onSave={handleInlineSave}
            onDelete={handleDelete}
            onAddSubtopic={() => {
              if (!selected) return
              setEditorParentId(selected.id)
              setEditorOpen(true)
            }}
          />
        </main>
      </div>

      <TopicEditorModal
        open={editorOpen}
        mode="add"
        departmentId={departmentId}
        parentId={editorParentId}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
