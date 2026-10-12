'use client'
import React from 'react'
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * KPI stat card — final design for the analytics tabs.
 *
 * Locked to a fixed 300 × 150 footprint so it renders identically in any
 * layout (grid, flex, sidebar) and never looks stretched or squashed.
 *
 * Layout: label + icon (top row) → hero number → trend caption.
 */
export interface StatCardProps {
  /** Uppercase micro-title, e.g. "Active learners". */
  label: string
  /** The main figure — the hero of the card. */
  value: React.ReactNode
  /** Percentage change vs the previous period. Sign decides the arrow/color. */
  delta?: number
  /** Muted icon shown top-right (no background). */
  icon?: LucideIcon
  /** Caption after the percentage, e.g. "from last month". */
  changeLabel?: string
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  changeLabel = 'from last month',
}: StatCardProps) {
  const up = (delta ?? 0) >= 0

  return (
    <div className="w-full max-w-[300px] h-[150px] overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {/* Title + icon */}
      <div className="flex h-7 items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 truncate">{label}</p>
        {Icon && <Icon size={16} className="text-gray-300 shrink-0" strokeWidth={1.75} />}
      </div>

      {/* Hero number */}
      <p className="mt-2.5 text-[32px] leading-none font-semibold tracking-tight text-gray-900 tabular-nums">
        {value}
      </p>

      {/* Trend caption */}
      {typeof delta === 'number' && (
        <div className="mt-3 flex items-center gap-1.5 text-[13px]">
          {up ? (
            <TrendingUp size={15} className="text-emerald-600" />
          ) : (
            <TrendingDown size={15} className="text-rose-600" />
          )}
          <span className={cn('font-medium', up ? 'text-emerald-600' : 'text-rose-600')}>
            {up ? '+' : ''}
            {delta}%
          </span>
          <span className="text-gray-400">{changeLabel}</span>
        </div>
      )}
    </div>
  )
}

export default StatCard
