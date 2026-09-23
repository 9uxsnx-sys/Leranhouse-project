import React, { useState, memo, useCallback, useMemo } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'

interface TakeawayItem {
  title: string
  items: string[]
}

interface TakeawayItemsListProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

const parseItems = (value: string): TakeawayItem[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (it: any): it is TakeawayItem =>
          it && typeof it === 'object' && typeof it.title === 'string'
      )
    }
  } catch {
    // fall through
  }
  return []
}

const TakeawayItemsList = ({ value, onChange, error }: TakeawayItemsListProps) => {
  const items = useMemo(() => parseItems(value), [value])

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragSub, setDragSub] = useState<{ mainIdx: number; subIdx: number } | null>(null)

  const commit = useCallback(
    (next: TakeawayItem[]) => {
      onChange(JSON.stringify(next))
    },
    [onChange]
  )

  const addMain = useCallback(() => {
    commit([...items, { title: '', items: [''] }])
  }, [items, commit])

  const removeMain = useCallback(
    (idx: number) => {
      commit(items.filter((_, i) => i !== idx))
    },
    [items, commit]
  )

  const updateTitle = useCallback(
    (idx: number, title: string) => {
      const updated = items.map((it, i) => (i === idx ? { ...it, title } : it))
      commit(updated)
    },
    [items, commit]
  )

  const addSubItem = useCallback(
    (idx: number) => {
      const updated = items.map((it, i) =>
        i === idx ? { ...it, items: [...it.items, ''] } : it
      )
      commit(updated)
    },
    [items, commit]
  )

  const updateSubItem = useCallback(
    (idx: number, subIdx: number, text: string) => {
      const updated = items.map((it, i) =>
        i === idx
          ? { ...it, items: it.items.map((s, si) => (si === subIdx ? text : s)) }
          : it
      )
      commit(updated)
    },
    [items, commit]
  )

  const removeSubItem = useCallback(
    (idx: number, subIdx: number) => {
      const updated = items.map((it, i) =>
        i === idx
          ? { ...it, items: it.items.filter((_, si) => si !== subIdx) }
          : it
      )
      commit(updated)
    },
    [items, commit]
  )

  const moveSubItem = useCallback(
    (mainIdx: number, from: number, to: number) => {
      const updated = items.map((it, i) => {
        if (i !== mainIdx) return it
        const next = [...it.items]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return { ...it, items: next }
      })
      commit(updated)
    },
    [items, commit]
  )

  // Drag and drop reordering for main points
  const onMainDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onMainDrop = (targetIdx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); return }
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    commit(next)
    setDragIdx(null)
  }

  // Drag and drop reordering for sub-points
  const onSubDragStart = (mainIdx: number, subIdx: number) => (e: React.DragEvent) => {
    setDragSub({ mainIdx, subIdx })
    e.dataTransfer.effectAllowed = 'move'
  }
  const onSubDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onSubDrop = (mainIdx: number, targetSubIdx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (!dragSub || dragSub.mainIdx !== mainIdx || dragSub.subIdx === targetSubIdx) { setDragSub(null); return }
    moveSubItem(mainIdx, dragSub.subIdx, targetSubIdx)
    setDragSub(null)
  }

  const isEmpty = items.length === 0

  return (
    <div className="space-y-1.5">
      <div className="rounded-xl border border-gray-200 bg-ui-bg-field">
        {isEmpty && (
          <div className="px-4 py-8 text-center">
            <div className="text-sm text-gray-400 mb-1">No takeaways yet</div>
            <div className="text-xs text-gray-300">
              Click &ldquo;Add&rdquo; below to create the first main point.
            </div>
          </div>
        )}

        {items.map((item, idx) => {
          const isDragging = dragIdx === idx
          return (
            <div
              key={idx}
              className={`group border-b border-gray-200 last:border-b-0 ${isDragging ? 'opacity-40' : ''}`}
              onDragOver={onDragOver}
              onDrop={onMainDrop(idx)}
            >
              {/* Main point row */}
              <div className="flex items-start gap-2 px-2.5 pt-2.5 pb-1">
                <div
                  draggable
                  onDragStart={onMainDragStart(idx)}
                  onDragEnd={() => setDragIdx(null)}
                  className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-0.5 mt-1.5"
                  title="Drag to reorder"
                >
                  <GripVertical size={14} />
                </div>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateTitle(idx, e.target.value)}
                  placeholder="Main takeaway point"
                  className="flex-1 min-w-0 text-sm font-medium text-gray-700 bg-transparent border-none outline-none placeholder:text-gray-300 py-1"
                />
                <button
                  type="button"
                  onClick={() => removeMain(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0 mt-0.5"
                  title="Remove"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Sub-points */}
              <div className="ml-10 pb-2 pr-2.5 space-y-1">
                {item.items.map((sub, subIdx) => {
                  const isSubDragging = dragSub?.mainIdx === idx && dragSub?.subIdx === subIdx
                  return (
                    <div
                      key={subIdx}
                      className={`flex items-center gap-2 ${isSubDragging ? 'opacity-40' : ''}`}
                      onDragOver={onSubDragOver}
                      onDrop={onSubDrop(idx, subIdx)}
                    >
                      <div
                        draggable
                        onDragStart={onSubDragStart(idx, subIdx)}
                        onDragEnd={() => setDragSub(null)}
                        className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-0.5"
                        title="Drag to reorder"
                      >
                        <GripVertical size={12} />
                      </div>
                      <input
                        type="text"
                        value={sub}
                        onChange={(e) => updateSubItem(idx, subIdx, e.target.value)}
                        placeholder="Sub-point"
                        className="flex-1 min-w-0 text-sm text-gray-600 bg-transparent border-none outline-none placeholder:text-gray-300 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubItem(idx, subIdx)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors shrink-0"
                        title="Remove sub-point"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={() => addSubItem(idx)}
                  className="text-xs text-gray-500 hover:text-gray-700 py-1"
                >
                  + Add sub-point
                </button>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={addMain}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors rounded-b-xl"
        >
          <Plus size={13} className="text-blue-500 shrink-0" />
          Add main point
        </button>
      </div>

      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  )
}

export default memo(TakeawayItemsList)
