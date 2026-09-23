import React, { useState, memo, useCallback, useMemo, useRef } from 'react'
import { Plus, X, GripVertical, UploadCloud, Link2 } from 'lucide-react'

interface ResourceItem {
  name: string
  url: string
}

interface ResourceItemsListProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

const parseItems = (value: string): ResourceItem[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (it: any): it is ResourceItem =>
          it && typeof it === 'object' && typeof it.name === 'string'
      )
    }
  } catch {
    // fall through
  }
  return []
}

const ResourceItemsList = ({ value, onChange, error }: ResourceItemsListProps) => {
  const items = useMemo(() => parseItems(value), [value])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [expandedUrl, setExpandedUrl] = useState<Record<number, boolean>>({})
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const commit = useCallback(
    (next: ResourceItem[]) => {
      onChange(JSON.stringify(next))
    },
    [onChange]
  )

  const addItem = useCallback(() => {
    commit([...items, { name: '', url: '' }])
  }, [items, commit])

  const removeItem = useCallback(
    (idx: number) => {
      commit(items.filter((_, i) => i !== idx))
    },
    [items, commit]
  )

  const updateField = useCallback(
    (idx: number, field: keyof ResourceItem, value: string) => {
      const updated = items.map((it, i) =>
        i === idx ? { ...it, [field]: value } : it
      )
      commit(updated)
    },
    [items, commit]
  )

  const handleFileSelect = useCallback(
    (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      // For now, store the file name as a placeholder URL
      // Actual upload implementation will go here
      updateField(idx, 'url', file.name)
      if (fileInputRefs.current[idx]) {
        fileInputRefs.current[idx]!.value = ''
      }
    },
    [updateField]
  )

  const toggleUrl = useCallback((idx: number) => {
    setExpandedUrl((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }, [])

  // Drag and drop reordering
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
            <div className="text-sm text-gray-400 mb-1">No resources yet</div>
            <div className="text-xs text-gray-300">
              Click &ldquo;Add&rdquo; below to create the first resource.
            </div>
          </div>
        )}

        {items.map((item, idx) => {
          const isDragging = dragIdx === idx
          const showUrl = expandedUrl[idx] || item.url
          return (
            <div
              key={idx}
              className={`group flex items-center gap-1.5 border-b border-gray-200 last:border-b-0 px-2.5 py-1.5 ${isDragging ? 'opacity-40' : ''}`}
              onDragOver={onDragOver}
              onDrop={onDrop(idx)}
            >
              {/* Drag handle */}
              <div
                draggable
                onDragStart={onDragStart(idx)}
                onDragEnd={() => setDragIdx(null)}
                className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-0.5"
                title="Drag to reorder"
              >
                <GripVertical size={14} />
              </div>

              {/* Name input */}
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateField(idx, 'name', e.target.value)}
                placeholder="Resource name"
                className="flex-1 min-w-0 text-sm text-gray-700 bg-transparent border-none outline-none placeholder:text-gray-300 py-1"
              />

              {/* Hidden file input */}
              <input
                type="file"
                ref={(el) => { fileInputRefs.current[idx] = el }}
                onChange={(e) => handleFileSelect(idx, e)}
                className="hidden"
              />

              {/* Link button → expands into URL input */}
              <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ width: showUrl ? 176 : 28 }}>
                {showUrl ? (
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => updateField(idx, 'url', e.target.value)}
                    placeholder="Paste URL"
                    className="w-40 text-sm text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-0.5 outline-none placeholder:text-gray-300 focus:border-gray-400 transition-colors h-7"
                    autoFocus
                    onBlur={() => {
                      if (!item.url) {
                        setExpandedUrl((prev) => ({ ...prev, [idx]: false }))
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleUrl(idx)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Add link"
                  >
                    <Link2 size={14} />
                  </button>
                )}
              </div>

              {/* Upload icon button */}
              <button
                type="button"
                onClick={() => fileInputRefs.current[idx]?.click()}
                className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Upload file"
              >
                <UploadCloud size={14} />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors rounded-b-xl"
        >
          <Plus size={13} className="text-blue-500 shrink-0" />
          Add resource
        </button>
      </div>

      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  )
}

export default memo(ResourceItemsList)
