'use client'
import React from 'react'
import { ChartCard } from '@components/Analytics/Card'
import { TrendChart } from '@components/Analytics/TrendChart'
import { BarsChart } from '@components/Analytics/BarsChart'
import {
  completionRanked,
  contentTypeEffectiveness,
  learningTrend,
  lessonFunnel,
  timeOnActivity,
} from '@components/Dashboard/Analytics/mockAnalytics'

/**
 * Learning — "are learners using the content?" Chart-only.
 * Row 1 full width, then two 2-up rows.
 */
export function LearningTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Row 1 — full width */}
      <ChartCard title="Course starts & completions" className="lg:col-span-12">
        <TrendChart
          data={learningTrend}
          xKey="label"
          series={[
            { key: 'starts', name: 'Course starts' },
            { key: 'completions', name: 'Completions' },
          ]}
        />
      </ChartCard>

      {/* Row 2 — split */}
      <ChartCard title="Completion by course" className="lg:col-span-6">
        <BarsChart
          data={completionRanked}
          xKey="name"
          series={[{ key: 'value', name: 'Completion' }]}
          formatter={(v) => `${v}%`}
          xTickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
        />
      </ChartCard>

      <ChartCard title="Lesson drop-off" className="lg:col-span-6">
        <BarsChart data={lessonFunnel} xKey="label" series={[{ key: 'value', name: 'Learners' }]} />
      </ChartCard>

      {/* Row 3 — split */}
      <ChartCard title="Time on activity" className="lg:col-span-6">
        <BarsChart data={timeOnActivity} xKey="name" series={[{ key: 'value', name: 'Minutes' }]} formatter={(v) => `${v} min`} />
      </ChartCard>

      <ChartCard title="Content type effectiveness" className="lg:col-span-6">
        <BarsChart
          data={contentTypeEffectiveness}
          xKey="name"
          series={[{ key: 'value', name: 'Completion' }]}
          formatter={(v) => `${v}%`}
        />
      </ChartCard>
    </div>
  )
}
