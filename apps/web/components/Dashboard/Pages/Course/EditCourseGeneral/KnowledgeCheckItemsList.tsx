import React, { useState, memo, useCallback, useMemo } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'

interface KnowledgeCheckItem {
  question: string
  answer: string
}

interface KnowledgeCheckItemsListProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

const parseItems = (value: string): KnowledgeCheckItem[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (it: any): it is KnowledgeCheckItem =>
          it && typeof it === 'object' && typeof it.question === 'string'
      )
    }
  } catch {
    // fall through
  }
  return []
}

const KnowledgeCheckItemsList = ({ value, onChange, error }: KnowledgeCheckItemsListProps) => {
  const items = useMemo(() => parseItems(value), [value])
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const commit = useCallback(
    (next: KnowledgeCheckItem[]) => {
      onChange(JSON.stringify(next))
    },
    [onChange]
  )

  const addItem = useCallback(() => {
    commit([...items, { question: '', answer: '' }])
  }, [items, commit])

  const removeItem = useCallback(
    (idx: number) => {
      commit(items.filter((_, i) => i !== idx))
    },
    [items, commit]
  )

  const updateField = useCallback(
    (idx: number, field: keyof KnowledgeCheckItem, value: string) => {
      const updated = items.map((it, i) =>
        i === idx ? { ...it, [field]: value } : it
      )
      commit(updated)
    },
    [items, commit]
  )

  const onDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onDrop = (targetIdx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); return }
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    commit(next)
    setDragIdx(null)
  }

  const isEmpty = items.length === 0

  return (
    <div className="space-y-1.5">
      <div className="rounded-xl border border-gray-200 bg-ui-bg-field">
        {isEmpty && (
          <div className="px-4 py-8 text-center">
            <div className="text-sm text-gray-400 mb-1">No knowledge checks yet</div>
            <div className="text-xs text-gray-300">
              Click &ldquo;Add&rdquo; below to create the first one.
            </div>
          </div>
        )}

        {items.map((item, idx) => {
          const isDragging = dragIdx === idx
          return (
            <div
              key={idx}
              className={`relative border-b border-gray-200 last:border-b-0 px-2.5 py-2 ${isDragging ? 'opacity-40' : ''}`}
              onDragOver={onDragOver}
              onDrop={onDrop(idx)}
            >
              {/* Drag handle — vertically centered between the two rows */}
              <div
                draggable
                onDragStart={onDragStart(idx)}
                onDragEnd={() => setDragIdx(null)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-0.5"
                title="Drag to reorder"
              >
                <GripVertical size={14} />
              </div>

              {/* Row 1: Question + Delete */}
              <div className="flex items-center gap-2 pl-7">
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => updateField(idx, 'question', e.target.value)}
                  placeholder="Question"
                  className="flex-1 min-w-0 text-sm text-gray-700 bg-transparent border-none outline-none placeholder:text-gray-300 py-1"
                />

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Row 2: Answer input */}
              <div className="flex items-center gap-2 pl-7">
                <input
                  type="text"
                  value={item.answer}
                  onChange={(e) => updateField(idx, 'answer', e.target.value)}
                  placeholder="Answer"
                  className="flex-1 min-w-0 text-sm text-gray-700 bg-transparent border-none outline-none placeholder:text-gray-300 py-1"
                />
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors rounded-b-xl"
        >
          <Plus size={13} className="text-blue-500 shrink-0" />
          Add knowledge check
        </button>
      </div>

      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  )
}

export default memo(KnowledgeCheckItemsList)
