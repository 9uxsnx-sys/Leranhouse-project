'use client'
import React from 'react'
import { ChartCard, SectionCard } from '@components/Analytics/Card'
import { TrendChart } from '@components/Analytics/TrendChart'
import { BarsChart } from '@components/Analytics/BarsChart'
import { RankedBars } from '@components/Analytics/RankedBars'
import { DataTable, Column } from '@components/Analytics/DataTable'
import { formatNumber } from '@components/Analytics/chartTheme'
import {
  courseEnrollmentTrend,
  courseCompletionFunnel,
  courseProgressDistribution,
  courseLessonDropoff,
  courseTimePerLesson,
  courseStudents,
} from '@components/Dashboard/Analytics/mockAnalytics'

const studentColumns: Column<(typeof courseStudents)[number]>[] = [
  { key: 'name', header: 'Learner', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
  { key: 'email', header: 'Email', render: (r) => <span className="truncate text-gray-500">{r.email}</span> },
  { key: 'enrolled', header: 'Enrolled', width: '150px', render: (r) => <span className="text-gray-500">{r.enrolled}</span> },
  {
    key: 'progress',
    header: 'Progress',
    align: 'right',
    width: '120px',
    sortable: true,
    value: (r) => r.progress,
    render: (r) => <span className="tabular-nums text-gray-700">{r.progress}%</span>,
  },
  { key: 'status', header: 'Status', width: '130px', render: (r) => <span className="text-gray-500">{r.status}</span> },
]

/**
 * Courses — "how is this course doing?" Chart-first, entity-scoped by the
 * course selector in the action row. Hero trend, two 2-up rows, then the table.
 */
export function CoursesTab({ course = 'all' }: { course?: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Row 1 — full width */}
      <ChartCard
        title="Enrollments over time"
        className="lg:col-span-12"
        actions={<span className="text-xs text-gray-400">245 students · 210 active</span>}
      >
        <TrendChart
          data={courseEnrollmentTrend}
          xKey="label"
          series={[
            { key: 'enrollments', name: 'New enrollments' },
            { key: 'active', name: 'Active learners' },
          ]}
          formatter={formatNumber}
        />
      </ChartCard>

      {/* Row 2 — split */}
      <ChartCard
        title="Completion funnel"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">68% completion</span>}
      >
        <BarsChart
          data={courseCompletionFunnel}
          xKey="name"
          series={[{ key: 'value', name: 'Learners' }]}
          formatter={formatNumber}
        />
      </ChartCard>

      <ChartCard
        title="Learner progress"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">of enrolled learners</span>}
      >
        <BarsChart
          data={courseProgressDistribution}
          xKey="name"
          series={[{ key: 'value', name: 'Learners' }]}
          formatter={formatNumber}
        />
      </ChartCard>

      {/* Row 3 — split */}
      <ChartCard
        title="Lesson drop-off"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">views per lesson</span>}
      >
        <RankedBars data={courseLessonDropoff} categoryKey="name" valueKey="value" formatter={formatNumber} />
      </ChartCard>

      <ChartCard
        title="Time per lesson"
        className="lg:col-span-6"
        actions={<span className="text-xs text-gray-400">avg minutes</span>}
      >
        <RankedBars data={courseTimePerLesson} categoryKey="name" valueKey="value" formatter={(v) => `${v}m`} />
      </ChartCard>

      {/* Row 4 — full width table */}
      <SectionCard className="lg:col-span-12" bleed>
        <DataTable columns={studentColumns} rows={courseStudents} />
      </SectionCard>
    </div>
  )
}
