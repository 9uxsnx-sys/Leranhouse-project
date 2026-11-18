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
      <ConceptIcon.search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-dk-fg-3 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-7 ps-8 pe-2 text-sm text-gray-700 dark:text-dk-fg-1 bg-white dark:bg-dk-card shadow-borders-base rounded-md placeholder:text-gray-500 dark:placeholder:text-dk-fg-3 focus:outline-none"
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
    <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-gray-50/80 dark:bg-dk-card">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange?.(o)}
          className={cn(
            'px-2.5 py-1 text-xs rounded-lg border transition-colors',
            value === o
              ? 'bg-white dark:bg-dk-raised border-neutral-200/80 dark:border-dk-line-strong text-ui-fg-base font-semibold shadow-sm'
              : 'border-transparent text-gray-500 dark:text-dk-fg-3 font-medium hover:text-gray-700 dark:hover:text-dk-fg-1'
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
          className="bg-white dark:bg-dk-card hover:bg-gray-50 dark:hover:bg-dk-raised shadow-borders-base"
          aria-label="Filter"
          title="Filter"
        >
          <ConceptIcon.filter size={14} />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] rounded-lg border border-gray-200 dark:border-dk-line-strong bg-white dark:bg-dk-raised p-1 shadow-md">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => onChange?.(o.value)}
            data-active={o.value === value}
            className="text-sm rounded-md px-2.5 py-1.5 cursor-pointer text-gray-700 dark:text-dk-fg-2 data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-dk-track focus:bg-gray-100 dark:focus:bg-dk-track data-[active=true]:bg-gray-100 dark:data-[active=true]:bg-dk-track"
          >
            <span className="truncate">{o.label}</span>
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
