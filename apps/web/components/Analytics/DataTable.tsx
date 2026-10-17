'use client'
import React, { useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
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
 * The table always lives inside a SectionCard, which owns the title, so the table
 * itself is borderless and chrome-free: only hairline `gray-100` separators
 * (header underline + row dividers) and a soft gray hover. Headers reuse the
 * platform's section-title style (13px / uppercase / gray-500) and every cell has
 * even `px-4` gutters so right-aligned columns never collide with the next header.
 *
 * Row shapes are fully driven by the column model (`render`), which is how the
 * richer tables (checkbox select, avatar + name, role dropdown, status dot,
 * actions) are built without any table-specific code here.
 *
 * No pagination: rows render in full and the card grows with the list.
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  initialSortKey,
  rowClassName,
}: {
  columns: Column<T>[]
  rows: T[]
  initialSortKey?: string
  rowClassName?: (row: T) => string
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => {
              const canSort = Boolean(col.sortable && col.value)
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={canSort ? () => toggleSort(col) : undefined}
                  className={cn(
                    'px-6 pb-2.5 text-[13px] font-semibold tracking-wide uppercase text-gray-500 whitespace-nowrap align-middle',
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
          {sorted.map((row, i) => (
            <tr key={i} className={cn('transition-colors hover:bg-gray-50/70', rowClassName?.(row))}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-6 py-3.5 align-middle text-sm text-gray-700',
                    alignClass(col.align)
                  )}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
