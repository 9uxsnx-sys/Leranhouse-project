'use client'
import React, { useMemo, useState } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: React.ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
  sortable?: boolean
  /** value used for sorting */
  value?: (row: T) => string | number
  render?: (row: T) => React.ReactNode
}

/**
 * Analytics data table — final design for the analytics tabs.
 *
 * The table always lives inside a SectionCard / TableCard, which owns the title,
 * so the table itself is borderless and chrome-free: only hairline `gray-100`
 * separators (header underline + row dividers) and a soft gray hover. Headers
 * reuse the platform's section-title style (13px / uppercase / gray-500) and
 * every cell has even `px-4` gutters so right-aligned columns never collide
 * with the next header.
 *
 * Row shapes are fully driven by the column model (`render`), which is how the
 * richer tables (checkbox select, avatar + name, role dropdown, status dot,
 * actions) are built without any table-specific code here.
 *
 * Optional selection, row clicks and a footer (pagination) are supported so the
 * same component can replace the older bordered tables across the dashboard.
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  initialSortKey,
  rowClassName,
  selectable = false,
  getRowId,
  selectedIds,
  onSelectionChange,
  onRowClick,
  isRowSelectable,
  footer,
}: {
  columns: Column<T>[]
  rows: T[]
  initialSortKey?: string
  rowClassName?: (row: T) => string
  /** Adds a leading checkbox column. Requires `selectedIds` + `onSelectionChange`. */
  selectable?: boolean
  getRowId?: (row: T) => string | number
  selectedIds?: Set<string | number>
  onSelectionChange?: (next: Set<string | number>) => void
  onRowClick?: (row: T) => void
  isRowSelectable?: (row: T) => boolean
  /** Rendered under the table, inside the card — pagination, totals, etc. */
  footer?: React.ReactNode
}) {
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey ?? null)
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.value) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = col.value!(a)
      const bv = col.value!(b)
      if (av < bv) return dir === 'asc' ? -1 : 1
      if (av > bv) return dir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sortKey, dir, columns])

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable || !col.value) return
    if (sortKey === col.key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setDir('desc')
    }
  }

  // Logical alignment: `end` is the right edge in LTR and the left edge in RTL,
  // so numeric/date columns stay on the inline end when the page flips.
  const alignClass = (a?: Column<T>['align']) =>
    a === 'right' ? 'text-end' : a === 'center' ? 'text-center' : 'text-start'

  const selectionEnabled = selectable && Boolean(selectedIds) && Boolean(onSelectionChange)
  const rowId = (row: T) => (getRowId ? getRowId(row) : (row.id as string | number))
  const selectableRows = isRowSelectable ? sorted.filter(isRowSelectable) : sorted
  const selectedCount = selectableRows.filter((row) => selectedIds?.has(rowId(row))).length
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length
  const someSelected = selectedCount > 0 && !allSelected

  const toggleAll = () => {
    if (!selectionEnabled) return
    const next = new Set(selectedIds)
    if (allSelected) {
      selectableRows.forEach((row) => next.delete(rowId(row)))
    } else {
      selectableRows.forEach((row) => next.add(rowId(row)))
    }
    onSelectionChange?.(next)
  }

  const toggleRow = (row: T) => {
    if (!selectionEnabled) return
    const id = rowId(row)
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange?.(next)
  }

  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row)
    } else if (selectionEnabled && (!isRowSelectable || isRowSelectable(row))) {
      toggleRow(row)
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              {selectionEnabled && (
                <th className="w-[40px] pb-2.5 pl-6 pr-0 text-start align-middle">
                  <span className="flex items-center justify-center w-4 h-4">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                    />
                  </span>
                </th>
              )}
              {columns.map((col) => {
                const canSort = Boolean(col.sortable && col.value)
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={canSort ? () => toggleSort(col) : undefined}
                    className={cn(
                      'px-6 pb-2.5 text-[13px] font-semibold tracking-wide uppercase text-gray-500 whitespace-nowrap align-middle',
                      selectionEnabled && col === columns[0] && 'pl-4',
                      alignClass(col.align),
                      canSort && 'cursor-pointer select-none transition-colors hover:text-gray-700'
                    )}
                  >
                    <span className={cn('inline-flex items-center gap-1.5', col.align === 'right' && 'flex-row-reverse')}>
                      {col.header}
                      {canSort && (
                        <ArrowUpDown
                          size={12}
                          className={cn(sortKey === col.key ? 'text-gray-600' : 'text-gray-300')}
                        />
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row, i) => {
              const selected = selectionEnabled && selectedIds!.has(rowId(row))
              return (
                <tr
                  key={i}
                  onClick={onRowClick || selectionEnabled ? () => handleRowClick(row) : undefined}
                  className={cn(
                    'transition-colors hover:bg-gray-50/70',
                    (onRowClick || selectionEnabled) && 'cursor-pointer',
                    selected && 'bg-gray-50',
                    rowClassName?.(row)
                  )}
                >
                  {selectionEnabled && (
                    <td
                      className="w-[40px] pl-6 pr-0 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="flex items-center justify-center w-4 h-4">
                        <Checkbox
                          checked={Boolean(selected)}
                          onChange={() => toggleRow(row)}
                          disabled={isRowSelectable ? !isRowSelectable(row) : false}
                        />
                      </span>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-6 py-3.5 align-middle text-sm text-gray-700',
                        selectionEnabled && col === columns[0] && 'pl-4',
                        alignClass(col.align)
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {footer && <div className="border-t border-gray-100 px-6 py-3">{footer}</div>}
    </div>
  )
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center justify-center cursor-pointer w-4 h-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-full h-full rounded border border-gray-300 bg-white peer-checked:bg-gray-600 peer-checked:border-gray-600 flex items-center justify-center transition-colors peer-disabled:opacity-40">
        {!checked && indeterminate ? (
          <span className="w-2 h-[2px] rounded bg-gray-500" />
        ) : (
          <Check size={12} className="text-white hidden peer-checked:block" strokeWidth={3} />
        )}
      </div>
    </label>
  )
}

export default DataTable
