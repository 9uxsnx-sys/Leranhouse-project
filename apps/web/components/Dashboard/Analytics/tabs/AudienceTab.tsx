'use client'
import React from 'react'
import { ChartCard, SectionCard } from '@components/Analytics/Card'
import { TrendChart } from '@components/Analytics/TrendChart'
import { BarsChart } from '@components/Analytics/BarsChart'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { formatNumber } from '@components/Analytics/chartTheme'
import { devices, sources, topPages, trafficTrend } from '@components/Dashboard/Analytics/mockAnalytics'

const mmss = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`

const pageColumns: Column<(typeof topPages)[number]>[] = [
  { key: 'path', header: 'Page', render: (r) => <span className="font-mono text-xs text-gray-700">{r.path}</span> },
  { key: 'views', header: 'Views', align: 'right', sortable: true, value: (r) => r.views, render: (r) => <span className="tabular-nums">{formatNumber(r.views)}</span> },
  {
    key: 'visitors',
    header: 'Visitors',
    align: 'right',
    sortable: true,
    value: (r) => r.visitors,
    render: (r) => <span className="tabular-nums text-gray-500">{formatNumber(r.visitors)}</span>,
  },
  {
    key: 'avgTime',
    header: 'Avg time',
    align: 'right',
    sortable: true,
    value: (r) => r.avgTime,
    render: (r) => <span className="tabular-nums text-gray-600">{mmss(r.avgTime)}</span>,
  },
  {
    key: 'change',
    header: 'Change',
    align: 'right',
    sortable: true,
    value: (r) => r.change,
    render: (r) => (
      <span className="tabular-nums text-gray-600">
        {r.change > 0 ? '+' : ''}
        {r.change}%
      </span>
    ),
  },
]

/**
 * Audience — "where does traffic come from?" Chart-only.
 * Row 1 full width, then a 2-up row, then the detail table.
 */
export function AudienceTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Row 1 — full width */}
      <ChartCard
        title="Traffic over time"
        className="lg:col-span-12"
        actions={<span className="text-xs text-gray-400">24.6k visits · 68% new</span>}
      >
        <TrendChart
          data={trafficTrend}
          xKey="label"
          series={[
            { key: 'visits', name: 'Visits' },
            { key: 'visitors', name: 'Unique visitors' },
          ]}
          formatter={formatNumber}
        />
      </ChartCard>

      {/* Row 2 — split */}
      <ChartCard
        title="Sources"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">top {sources.length}</span>}
      >
        <BarsChart data={sources} xKey="name" series={[{ key: 'value', name: 'Visitors' }]} formatter={formatNumber} />
      </ChartCard>

      <ChartCard
        title="Devices"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">62% mobile</span>}
      >
        <BarsChart data={devices} xKey="name" series={[{ key: 'value', name: 'Share' }]} formatter={(v) => `${v}%`} />
      </ChartCard>

      {/* Row 3 — full width */}
      <SectionCard title="Top pages" className="lg:col-span-12" bleed>
        <DataTable columns={pageColumns} rows={topPages} />
      </SectionCard>
    </div>
  )
}
