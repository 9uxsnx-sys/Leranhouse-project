'use client'
import React from 'react'
import { ChartCard, SectionCard } from '@components/Analytics/Card'
import { TrendChart } from '@components/Analytics/TrendChart'
import { BarsChart } from '@components/Analytics/BarsChart'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { formatNumber } from '@components/Analytics/chartTheme'
import {
  discussionsTrend,
  discussionsByLabel,
  topContributors,
  topDiscussions,
  unansweredQuestions,
} from '@components/Dashboard/Analytics/mockAnalytics'

const contributorColumns: Column<(typeof topContributors)[number]>[] = [
  { key: 'name', header: 'Member', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
  { key: 'discussions', header: 'Discussions', align: 'right', sortable: true, value: (r) => r.discussions, render: (r) => <span className="tabular-nums">{r.discussions}</span> },
  { key: 'comments', header: 'Comments', align: 'right', sortable: true, value: (r) => r.comments, render: (r) => <span className="tabular-nums">{r.comments}</span> },
  { key: 'reactions', header: 'Reactions', align: 'right', sortable: true, value: (r) => r.reactions, render: (r) => <span className="tabular-nums text-gray-500">{r.reactions}</span> },
]

const discussionColumns: Column<(typeof topDiscussions)[number]>[] = [
  { key: 'title', header: 'Discussion', render: (r) => <span className="font-medium text-gray-900">{r.title}</span> },
  { key: 'label', header: 'Label', width: '150px', render: (r) => <span className="text-gray-500">{r.label}</span> },
  { key: 'replies', header: 'Replies', align: 'right', sortable: true, value: (r) => r.replies, render: (r) => <span className="tabular-nums">{r.replies}</span> },
  { key: 'upvotes', header: 'Upvotes', align: 'right', sortable: true, value: (r) => r.upvotes, render: (r) => <span className="tabular-nums text-gray-500">{r.upvotes}</span> },
]

const questionColumns: Column<(typeof unansweredQuestions)[number]>[] = [
  { key: 'title', header: 'Question', render: (r) => <span className="font-medium text-gray-900">{r.title}</span> },
  { key: 'author', header: 'Asked by', width: '180px', render: (r) => <span className="text-gray-500">{r.author}</span> },
  { key: 'age', header: 'Age', align: 'right', width: '120px', render: (r) => <span className="text-gray-500">{r.age}</span> },
  { key: 'upvotes', header: 'Upvotes', align: 'right', sortable: true, value: (r) => r.upvotes, render: (r) => <span className="tabular-nums text-gray-500">{r.upvotes}</span> },
]

/** The detail-table views the action-row cycle button steps through. */
export const COMMUNITY_TABLES: { id: string; label: string }[] = [
  { id: 'contributors', label: 'Contributors' },
  { id: 'discussions', label: 'Top discussions' },
  { id: 'questions', label: 'Unanswered' },
]

/**
 * Community — "is the community alive?" Chart-first, entity-scoped by the
 * community selector in the action row. The two charts always stay; the detail
 * table below is picked by the cycle button in the action row.
 */
export function CommunityTab({ community = 'all', table = 'contributors' }: { community?: string; table?: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Charts — always visible, full width */}
      <ChartCard
        title="Activity over time"
        className="lg:col-span-12"
        actions={<span className="text-xs text-gray-400">103 discussions · 486 comments</span>}
      >
        <TrendChart
          data={discussionsTrend}
          xKey="label"
          series={[
            { key: 'discussions', name: 'Discussions' },
            { key: 'comments', name: 'Comments' },
          ]}
          formatter={formatNumber}
        />
      </ChartCard>

      <ChartCard
        title="Discussions by label"
        className="lg:col-span-12"
        actions={<span className="text-xs text-gray-400">across {discussionsByLabel.length} labels</span>}
      >
        <BarsChart
          data={discussionsByLabel}
          xKey="name"
          series={[{ key: 'value', name: 'Discussions' }]}
          formatter={formatNumber}
        />
      </ChartCard>

      {/* Detail table — full width, swapped from the action row */}
      <SectionCard className="lg:col-span-12" bleed>
        {table === 'contributors' && <DataTable columns={contributorColumns} rows={topContributors} />}
        {table === 'discussions' && <DataTable columns={discussionColumns} rows={topDiscussions} />}
        {table === 'questions' && <DataTable columns={questionColumns} rows={unansweredQuestions} />}
      </SectionCard>
    </div>
  )
}
