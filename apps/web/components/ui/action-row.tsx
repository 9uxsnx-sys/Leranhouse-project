'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ActionRow — the single toolbar row every dashboard list page uses.
 *
 * Replaces the five bespoke toolbars that had drifted apart (different gaps,
 * different spacers, with/without `justify-between`). Layout: search on the
 * inline-start, actions pushed to the inline-end.
 *
 * All spacing uses logical properties (`ps-`/`start-`), so it mirrors correctly
 * under RTL without changes.
 *
 * @example
 * <ActionRow>
 *   <ActionRowSearch value={q} onValueChange={setQ} placeholder={t('courses.search_courses')} />
 *   <ActionRowSpacer />
 *   <ActionRowActions>
 *     <Button variant="primary" size="small" onClick={openCreate}>…</Button>
 *   </ActionRowActions>
 * </ActionRow>
 */
const ActionRow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col sm:flex-row sm:items-center gap-3 mb-8', className)}
      {...props}
    />
  )
)
ActionRow.displayName = 'ActionRow'

/** Pushes everything after it to the far end of the row. Collapses when stacked. */
const ActionRowSpacer = () => <div className="hidden sm:block flex-1" aria-hidden="true" />
ActionRowSpacer.displayName = 'ActionRowSpacer'

/** Right-hand cluster — keeps the gap between action buttons identical everywhere. */
const ActionRowActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2 shrink-0', className)} {...props} />
  )
)
ActionRowActions.displayName = 'ActionRowActions'

interface ActionRowSearchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className'> {
  value: string
  onValueChange: (value: string) => void
  /** Optional result summary rendered next to the input, e.g. `3 results for "math"`. */
  summary?: React.ReactNode
  className?: string
}

/** Search input with the leading icon. The icon + padding are logical, so both mirror under RTL. */
const ActionRowSearch = React.forwardRef<HTMLInputElement, ActionRowSearchProps>(
  ({ value, onValueChange, summary, className, ...props }, ref) => (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative w-full sm:w-80">
        <Search
          className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full h-7 ps-8 pe-2 text-sm bg-white shadow-borders-base rounded-md placeholder:text-gray-400 focus:outline-none"
          {...props}
        />
      </div>
      {summary ? (
        <span className="txt-compact-xsmall text-ui-fg-muted whitespace-nowrap">{summary}</span>
      ) : null}
    </div>
  )
)
ActionRowSearch.displayName = 'ActionRowSearch'

export { ActionRow, ActionRowSpacer, ActionRowActions, ActionRowSearch }
