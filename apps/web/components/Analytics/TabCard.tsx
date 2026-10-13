'use client'
import React from 'react'
import { ChartCard, SectionCard } from './Card'
import { TrendChart } from './TrendChart'
import { BarsChart } from './BarsChart'
import { RankedBars } from './RankedBars'
import { DataTable, Column } from './DataTable'
import { ChartSkeleton, Skeleton } from './Feedback'
import { formatNumber } from './chartTheme'
import { cn } from '@/lib/utils'
import type { AnalyticsCard, CardColumn, CardFormat } from '@services/analytics/tabs'

function formatterFor(format?: CardFormat) {
  if (format === 'percent') return (v: number) => `${v}%`
  if (format === 'minutes') return (v: number) => `${v} min`
  return (v: number) => formatNumber(v)
}

/**
 * Vertical bars use the category name on the axis, so long course titles collide.
 * Shorten past this many characters and let the tooltip carry the full name.
 */
const MAX_AXIS_LABEL = 16

function truncateAxisLabel(value: any) {
  const label = String(value ?? '')
  return label.length > MAX_AXIS_LABEL ? `${label.slice(0, MAX_AXIS_LABEL - 1)}…` : label
}

function initials(name: string) {
  return String(name || '')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(value: any) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Maps the API's column descriptors onto `DataTable` columns.
 * `value` is required for sorting; `variant` adds the cell rendering the API
 * can't express (mono paths, signed deltas, avatars, status dots, dates).
 */
function toTableColumns(columns: CardColumn[]): Column<Record<string, any>>[] {
  return columns.map((c) => {
    const col: Column<Record<string, any>> = {
      key: c.key,
      header: c.header,
      align: c.align,
      width: c.width,
      sortable: c.sortable,
      value: c.sortable ? (row) => row[c.key] : undefined,
    }
    if (c.variant === 'mono') {
      col.render = (row) => <span className="font-mono text-xs text-gray-700">{row[c.key]}</span>
    } else if (c.variant === 'delta') {
      col.render = (row) => {
        const value = Number(row[c.key] ?? 0)
        return (
          <span className="tabular-nums text-gray-600">
            {value > 0 ? '+' : ''}
            {value}%
          </span>
        )
      }
    } else if (c.variant === 'percent') {
      col.render = (row) => <span className="tabular-nums text-gray-700">{row[c.key]}%</span>
    } else if (c.variant === 'person') {
      col.render = (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-[30px] h-[30px] shrink-0 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold flex items-center justify-center">
            {initials(String(row[c.key] ?? ''))}
          </span>
          <span className="font-medium text-gray-900 truncate">{row[c.key]}</span>
        </div>
      )
    } else if (c.variant === 'username') {
      col.render = (row) => <span className="text-gray-500">@{row[c.key]}</span>
    } else if (c.variant === 'status') {
      col.render = (row) => (
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded ${row[c.key] ? 'bg-green-500' : 'bg-red-500'}`} />
          {row[c.key] ? 'Verified' : 'Unverified'}
        </span>
      )
    } else if (c.variant === 'date') {
      col.render = (row) => <span className="text-[13px] text-gray-400">{formatDate(row[c.key])}</span>
    }
    return col
  })
}

/**
 * Renders one API card onto the locked component library.
 *
 * This is the single place that knows how a `kind` maps to a component, so the
 * tab bodies only own their grid layout — swapping a tab to real data is then
 * a few lines.
 */
export function TabCard({
  card,
  loading,
  className,
  actionsColumn,
}: {
  card?: AnalyticsCard
  loading?: boolean
  className?: string
  /** Optional trailing cell, for tables whose rows open a detail view. */
  actionsColumn?: (row: Record<string, any>) => React.ReactNode
}) {
  if (!card) {
    return (
      <div
        className={cn(
          'bg-white rounded-xl border border-gray-100 shadow-sm p-6',
          className
        )}
      >
        <Skeleton className="h-3 w-28" />
        <div className="mt-5">{loading ? <ChartSkeleton /> : <Skeleton className="h-[260px] w-full" />}</div>
      </div>
    )
  }

  if (card.kind === 'table') {
    const columns = toTableColumns(card.columns ?? [])
    if (actionsColumn) {
      columns.push({
        key: '__actions',
        header: '',
        width: '48px',
        align: 'right',
        render: (row) => actionsColumn(row),
      })
    }
    return (
      <SectionCard title={card.title || undefined} className={className} bleed>
        <DataTable columns={columns} rows={card.rows ?? []} />
      </SectionCard>
    )
  }

  const formatter = formatterFor(card.format)

  return (
    <ChartCard
      title={card.title}
      className={className}
      actions={card.heading ? <span className="text-xs text-gray-400">{card.heading}</span> : undefined}
    >
      {card.kind === 'trend' && (
        <TrendChart
          data={card.data ?? []}
          xKey={card.xKey ?? 'label'}
          series={card.series ?? []}
          formatter={formatter}
        />
      )}
      {card.kind === 'bars' && (
        <BarsChart
          data={card.data ?? []}
          xKey={card.xKey ?? 'label'}
          series={card.series ?? []}
          formatter={formatter}
          xTickFormatter={truncateAxisLabel}
        />
      )}
      {card.kind === 'ranked' && (
        <RankedBars
          data={card.data ?? []}
          categoryKey={card.categoryKey ?? 'name'}
          valueKey={card.valueKey ?? 'value'}
          formatter={formatter}
        />
      )}
    </ChartCard>
  )
}

export default TabCard
