'use client'
import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Segmented date-range control for the analytics action row. */
export function DateRangeFilter({
  value,
  onChange,
  options = ['7d', '30d', '90d', '12m'],
}: {
  value: string
  onChange?: (v: string) => void
  options?: string[]
}) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-100">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange?.(o)}
          className={cn(
            'px-2.5 py-1 text-xs rounded-md transition-colors',
            value === o ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-500 font-medium hover:text-gray-900'
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/** Compact select for org / course / plan filters. */
export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange?: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="appearance-none h-8 pl-3 pr-8 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:border-gray-300 transition-colors cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

/** The action row that sits above every analytics tab. */
export function AnalyticsToolbar({
  range,
  onRangeChange,
  children,
}: {
  range: string
  onRangeChange?: (v: string) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">{children}</div>
      <DateRangeFilter value={range} onChange={onRangeChange} />
    </div>
  )
}
