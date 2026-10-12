'use client'
import React from 'react'
import { ChartCard, SectionCard } from '@components/Analytics/Card'
import { TrendChart } from '@components/Analytics/TrendChart'
import { BarsChart } from '@components/Analytics/BarsChart'
import { RankedBars } from '@components/Analytics/RankedBars'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { formatNumber } from '@components/Analytics/chartTheme'
import {
  podcastListeningTrend,
  podcastEpisodePlays,
  podcastEpisodeCompletion,
  podcastLengthVsListened,
  podcastSeriesProgress,
  podcastEpisodes,
} from '@components/Dashboard/Analytics/mockAnalytics'

const episodeColumns: Column<(typeof podcastEpisodes)[number]>[] = [
  { key: 'title', header: 'Episode', render: (r) => <span className="font-medium text-gray-900">{r.title}</span> },
  { key: 'status', header: 'Status', width: '130px', render: (r) => <span className="text-gray-500">{r.status}</span> },
  { key: 'duration', header: 'Duration', align: 'right', width: '130px', render: (r) => <span className="tabular-nums text-gray-500">{r.duration}</span> },
  {
    key: 'plays',
    header: 'Plays',
    align: 'right',
    sortable: true,
    value: (r) => r.plays,
    render: (r) => <span className="tabular-nums">{formatNumber(r.plays)}</span>,
  },
  {
    key: 'completion',
    header: 'Completion',
    align: 'right',
    width: '150px',
    sortable: true,
    value: (r) => r.completion,
    render: (r) => <span className="tabular-nums text-gray-500">{r.completion}%</span>,
  },
]

/**
 * Podcasts — "is anyone listening?" Chart-first, entity-scoped by the
 * podcast selector in the action row. Hero trend, two 2-up rows, then the table.
 */
export function PodcastsTab({ podcast = 'all' }: { podcast?: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Row 1 — full width */}
      <ChartCard
        title="Listening over time"
        className="lg:col-span-12"
        actions={<span className="text-xs text-gray-400">5 episodes · 12.4k plays</span>}
      >
        <TrendChart
          data={podcastListeningTrend}
          xKey="label"
          series={[
            { key: 'starts', name: 'Episode starts' },
            { key: 'completions', name: 'Completions' },
          ]}
          formatter={formatNumber}
        />
      </ChartCard>

      {/* Row 2 — split */}
      <ChartCard
        title="Episode plays"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">top {podcastEpisodePlays.length}</span>}
      >
        <RankedBars data={podcastEpisodePlays} categoryKey="name" valueKey="value" formatter={formatNumber} />
      </ChartCard>

      <ChartCard
        title="Episode completion"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">finished / started</span>}
      >
        <RankedBars data={podcastEpisodeCompletion} categoryKey="name" valueKey="value" formatter={(v) => `${v}%`} />
      </ChartCard>

      {/* Row 3 — split */}
      <ChartCard
        title="Episode length vs listened"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">minutes</span>}
      >
        <BarsChart
          data={podcastLengthVsListened}
          xKey="name"
          series={[
            { key: 'length', name: 'Episode length' },
            { key: 'listened', name: 'Avg listened' },
          ]}
          formatter={(v) => `${v}m`}
        />
      </ChartCard>

      <ChartCard
        title="Series progress"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">of listeners</span>}
      >
        <BarsChart
          data={podcastSeriesProgress}
          xKey="name"
          series={[{ key: 'value', name: 'Listeners' }]}
          formatter={formatNumber}
        />
      </ChartCard>

      {/* Row 4 — full width table */}
      <SectionCard className="lg:col-span-12" bleed>
        <DataTable columns={episodeColumns} rows={podcastEpisodes} />
      </SectionCard>
    </div>
  )
}
