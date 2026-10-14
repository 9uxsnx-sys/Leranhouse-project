'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import ToolTip from '@components/Objects/StyledElements/Tooltip/Tooltip'

export interface PageTab {
  id: string
  label: string
  icon?: React.ElementType
  /** When present the tab renders as a link; otherwise as a button (state-driven tabs). */
  href?: string
  /** Plan-locked or not-yet-available tabs. */
  disabled?: boolean
  /** Optional trailing element, e.g. a plan badge. */
  badge?: React.ReactNode
  /** Native tooltip, useful on disabled tabs. */
  title?: string
  /** Rich tooltip shown on a disabled tab (e.g. why access is denied). */
  tooltip?: React.ReactNode
}

interface PageTabsProps {
  tabs: PageTab[]
  /** The `id` of the active tab. */
  active: string
  /**
   * `pill` — the segmented control used by the settings pages.
   * `underline` — the tab strip used by payments / boards / assignments.
   */
  variant?: 'pill' | 'underline'
  /**
   * Unique per tab bar. The sliding indicator animates between tabs that share a
   * `layoutId`, so two bars on screen must never share one.
   */
  indicatorId: string
  /** Required for state-driven tabs (those without an `href`). */
  onSelect?: (id: string) => void
  className?: string
}

/**
 * PageTabs — the single tab bar for the dashboard.
 *
 * Replaces five copy-pasted pill bars plus three different underline
 * implementations, so every settings area behaves and looks the same.
 */
function PageTabs({
  tabs,
  active,
  variant = 'pill',
  indicatorId,
  onSelect,
  className,
}: PageTabsProps) {
  const isPill = variant === 'pill'

  return (
    <div
      role="tablist"
      className={cn(
        isPill
          ? 'bg-gray-50/80 rounded-xl p-1 flex items-center w-full overflow-x-auto'
          : 'flex items-center gap-1 border-b border-gray-200 w-fit',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active
        const Icon = tab.icon

        const inner = (
          <>
            {isActive && isPill && (
              <motion.div
                layoutId={indicatorId}
                className="absolute inset-0 bg-white rounded-lg shadow-sm border border-neutral-200/80"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
              {Icon ? <Icon size={16} aria-hidden="true" /> : null}
              {tab.label}
              {tab.badge}
            </span>
          </>
        )

        const classes = cn(
          'relative text-sm font-medium transition-colors flex items-center justify-center gap-2',
          isPill ? 'flex-1 px-4 py-2 rounded-lg' : 'px-3 py-2.5 border-b-2 -mb-px',
          isActive
            ? isPill
              ? 'text-ui-fg-base'
              : 'text-ui-fg-base border-ui-fg-base'
            : isPill
              ? 'text-gray-500 hover:text-gray-700'
              : 'text-gray-500 border-transparent hover:text-gray-700',
          tab.disabled && 'opacity-50 cursor-not-allowed',
          // A tooltip needs hover, so keep pointer events alive when one is set.
          tab.disabled && !tab.tooltip && 'pointer-events-none'
        )

        // Locked tab with an explanation: non-interactive element inside the styled
        // tooltip, so the reason is readable on hover.
        if (tab.disabled && tab.tooltip) {
          return (
            <ToolTip key={tab.id} content={tab.tooltip}>
              <div role="tab" aria-selected={false} aria-disabled="true" className={classes}>
                {inner}
              </div>
            </ToolTip>
          )
        }

        if (tab.href && !tab.disabled) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch={false}
              role="tab"
              aria-selected={isActive}
              title={tab.title}
              className={classes}
            >
              {inner}
            </Link>
          )
        }

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            title={tab.title}
            onClick={() => !tab.disabled && onSelect?.(tab.id)}
            className={classes}
          >
            {inner}
          </button>
        )
      })}
    </div>
  )
}

export { PageTabs }
