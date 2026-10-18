'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import { ConceptIcon } from '@components/ui/icons'
import { IconButton } from '@components/ui/icon-button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

/** Compact search field for the analytics action row (same style as the Users/Contributors tabs). */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative w-80', className)}>
      <ConceptIcon.search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
      />
    </div>
  )
}

/** Segmented date-range control for the analytics action row. */
export function DateRangeFilter({
  value,
  onChange,
  options = ['7d', '30d', '90d', '12m'],
  labels,
}: {
  value: string
  onChange?: (v: string) => void
  options?: string[]
  /** Optional display labels keyed by option value (the value itself stays the token). */
  labels?: Record<string, string>
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
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  )
}

/**
 * Compact filter dropdown for the analytics action row (community / entity selectors).
 * Icon trigger + the platform's card-styled menu — no native OS popup.
 */
export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange?: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton
          size="small"
          variant="transparent"
          className="bg-white hover:bg-gray-50 shadow-borders-base"
          aria-label="Filter"
          title="Filter"
        >
          <ConceptIcon.filter size={14} />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] rounded-lg border border-gray-200 bg-white p-1 shadow-md">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => onChange?.(o.value)}
            className="justify-between gap-6 text-sm rounded-md px-2.5 py-1.5 cursor-pointer text-gray-700 data-[highlighted]:bg-gray-100 focus:bg-gray-100"
          >
            <span className="truncate">{o.label}</span>
            {o.value === value && <ConceptIcon.check size={14} className="text-gray-500 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
