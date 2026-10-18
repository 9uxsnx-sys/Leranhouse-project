'use client'
import React from 'react'
import { cn } from '@/lib/utils'

/**
 * The single card shell used everywhere in the dashboard.
 * Keep this in one place — the home page tiles import it too, so the border,
 * radius and shadow can never drift between "cards" and "section cards".
 */
export const CARD_SHELL = 'bg-white rounded-xl border border-gray-100 shadow-sm'

/**
 * The white section card used across the analytics tabs.
 * Section heading style matches the rest of the platform.
 */
export function SectionCard({
  title,
  right,
  children,
  className,
  bodyClassName,
  bleed,
}: {
  title?: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  /** Full-bleed body: drops the horizontal card padding so table rows hover edge-to-edge. */
  bleed?: boolean
}) {
  return (
    <div
      className={cn(
        CARD_SHELL,
        bleed ? 'pt-6 pb-2.5 overflow-hidden' : 'p-6',
        className
      )}
    >
      {(title || right) && (
        <div className={cn('flex items-center justify-between mb-5', bleed && 'px-6')}>
          {title ? (
            <h3 className="text-[13px] font-semibold tracking-wide uppercase text-gray-500">{title}</h3>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}

/**
 * Card shell for a standalone table (no section title).
 * Adds the small top gutter the borderless table needs, and lets the caller
 * render a footer (pagination, totals) inside the same white card.
 */
export function TableCard({
  children,
  footer,
  className,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(CARD_SHELL, 'overflow-hidden pt-4', className)}>
      {children}
      {footer && <div className="border-t border-gray-100 px-6 py-3">{footer}</div>}
    </div>
  )
}

/**
 * A section card whose body is a single chart of a fixed height.
 */
export function ChartCard({
  title,
  actions,
  height = 260,
  children,
  className,
}: {
  title: string
  actions?: React.ReactNode
  height?: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(CARD_SHELL, 'p-6', className)}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-semibold tracking-wide uppercase text-gray-500">{title}</h3>
        {actions}
      </div>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  )
}
