'use client'
import React from 'react'
import { ChartCard } from '@components/Analytics/Card'
import { TrendChart } from '@components/Analytics/TrendChart'
import { BarsChart } from '@components/Analytics/BarsChart'
import { RankedBars } from '@components/Analytics/RankedBars'
import {
  activityTrend,
  completionRanked,
  enrollmentFunnel,
  enrollmentsTrend,
  topCourses,
} from '@components/Dashboard/Analytics/mockAnalytics'

/**
 * Overview — org-wide health. Chart-only (no KPI cards).
 * Row 1: full-width activity trend. Rows 2 & 3: two cards each.
 */
export function OverviewTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Row 1 — full width */}
      <ChartCard title="Activity over time" className="lg:col-span-12">
        <TrendChart
          data={activityTrend}
          xKey="label"
          series={[
            { key: 'learners', name: 'Active learners' },
            { key: 'signups', name: 'New signups' },
          ]}
        />
      </ChartCard>

      {/* Row 2 — split */}
      <ChartCard title="Enrollments over time" className="lg:col-span-6">
        <BarsChart data={enrollmentsTrend} xKey="label" series={[{ key: 'value', name: 'Enrollments' }]} />
      </ChartCard>

      <ChartCard title="Enrollment by stage" className="lg:col-span-6">
        <BarsChart data={enrollmentFunnel} xKey="label" series={[{ key: 'value', name: 'Users' }]} />
      </ChartCard>

      {/* Row 3 — split */}
      <ChartCard title="Top courses" className="lg:col-span-6">
        <RankedBars data={topCourses} categoryKey="name" valueKey="value" />
      </ChartCard>

      <ChartCard title="Completion by course" className="lg:col-span-6">
        <RankedBars data={completionRanked} categoryKey="name" valueKey="value" formatter={(v) => `${v}%`} />
      </ChartCard>
    </div>
  )
}
