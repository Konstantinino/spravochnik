import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Search } from './components/Search'
import { TopicList } from './components/TopicList'
import { Viewer } from './components/Viewer'
import { AddModal } from './components/AddModal'
import { getItems } from './lib/data'
import { searchItems } from './lib/search'
import type { DepartmentId, GuideFile, GuideItem } from './types'
import { DEPARTMENTS } from './types'

export default function App() {
  const [departmentId, setDepartmentId] = useState<DepartmentId>('support')
  const [guide, setGuide] = useState<GuideFile | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    void load(departmentId)
  }, [departmentId, load])

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

  async function handleSave(payload: {
    question: string
    answer: string
    parent_id: number | null
  }) {
    const data = await window.spravochnik.saveItem({
      departmentId,
      item: {
        question: payload.question,
        answer: payload.answer,
        parent_id: payload.parent_id,
        has_children: false,
        photos: [],
        documents: [],
      },
    })
    setGuide(data)
    const list = getItems(data)
    const newest = list.reduce((a, b) => (a.id > b.id ? a : b))
    setSelectedId(newest.id)
    setQuery('')
  }

  const deptLabel = DEPARTMENTS.find((d) => d.id === departmentId)?.label ?? ''

  return (
    <div className="app-shell">
      <Header
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        onAdd={() => setAddOpen(true)}
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
          <Viewer item={selected} />
        </main>
      </div>

      <AddModal
        open={addOpen}
        items={items}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
