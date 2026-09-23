import React, { useState, useRef, memo, useCallback, useMemo } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';

interface LearningItem {
  id: string;
  text: string;
}

interface LearningItemsListProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const parseItems = (value: string): LearningItem[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((it): it is LearningItem => it && typeof it === 'object' && typeof it.id === 'string');
    }
  } catch {
    // fall through
  }
  return [];
};

const newId = () => `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const LearningItemsList = ({ value, onChange, error }: LearningItemsListProps) => {
  // Fully controlled: items are always derived from `value`.
  // Tab switches and remounts stay in sync without a local shadow copy.
  const items = useMemo(() => parseItems(value), [value]);

  const [dragId, setDragId] = useState<string | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const commit = useCallback((next: LearningItem[]) => {
    onChange(JSON.stringify(next));
  }, [onChange]);

  const addItem = useCallback(() => {
    const id = newId();
    commit([...items, { id, text: '' }]);
    setTimeout(() => inputRefs.current[id]?.focus(), 0);
  }, [items, commit]);

  const removeItem = useCallback((id: string) => {
    commit(items.filter(it => it.id !== id));
  }, [items, commit]);

  const updateText = useCallback((id: string, text: string) => {
    commit(items.map(it => it.id === id ? { ...it, text } : it));
  }, [items, commit]);

  // Drag and drop reordering
  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const from = items.findIndex(it => it.id === dragId);
    const to = items.findIndex(it => it.id === targetId);
    if (from === -1 || to === -1) { setDragId(null); return; }
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
    setDragId(null);
  };

  const isEmpty = items.length === 0;

  return (
    <div className="space-y-1.5">
      <div className="rounded-xl border border-gray-200 bg-ui-bg-field">
        {isEmpty && (
          <div className="px-4 py-8 text-center">
            <div className="text-sm text-gray-400 mb-1">No learning objectives yet</div>
            <div className="text-xs text-gray-300">Click &ldquo;Add&rdquo; below to create the first one.</div>
          </div>
        )}

        {items.map((item) => {
          const isDragging = dragId === item.id;
          return (
            <div
              key={item.id}
              className={`group relative border-b border-gray-200 ${isDragging ? 'opacity-40' : ''}`}
              onDragOver={onDragOver}
              onDrop={onDrop(item.id)}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                {/* Drag handle */}
                <div
                  draggable
                  onDragStart={onDragStart(item.id)}
                  onDragEnd={() => setDragId(null)}
                  className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-0.5"
                  title="Drag to reorder"
                >
                  <GripVertical size={14} />
                </div>

                {/* Text input */}
                <input
                  ref={(el) => { inputRefs.current[item.id] = el; }}
                  type="text"
                  value={item.text}
                  onChange={(e) => updateText(item.id, e.target.value)}
                  placeholder="What will learners achieve?"
                  className="flex-1 min-w-0 text-sm text-gray-700 bg-transparent border-none outline-none placeholder:text-gray-300 py-1"
                />

                {/* Action buttons — always visible but muted */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors rounded-b-xl"
        >
          <Plus size={13} className="text-blue-500 shrink-0" />
          Add learning objective
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}
    </div>
  );
};

export default memo(LearningItemsList);
