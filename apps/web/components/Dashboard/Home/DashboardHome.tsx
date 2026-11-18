'use client'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useAnalyticsTab, useOrgCourses } from '@services/analytics/tabs'
import type { AnalyticsCard } from '@services/analytics/tabs'
import { DateRangeFilter, FilterSelect } from '@components/Analytics/Filters'
import { TabCard } from '@components/Analytics/TabCard'
import PaymentsTable from './PaymentsTable'
import { useMediaQuery } from 'usehooks-ts'

const RANGES = ['7d', '30d', '90d']

/**
 * The API sends English card titles, series names and category labels.
 * Translate them on the client without touching the payload contract.
 */
function localizeCard(
  card: AnalyticsCard | undefined,
  key: string,
  t: (key: string, options?: any) => string
): AnalyticsCard | undefined {
  if (!card) return card
  return {
    ...card,
    title: t(`dashboard.home.charts.${key}.title`, { defaultValue: card.title }),
    series: card.series?.map((series) => ({
      ...series,
      name: t(`dashboard.home.charts.${key}.series.${series.key}`, {
        defaultValue: series.name,
      }),
    })),
    data: card.data?.map((row) => {
      if (!row.name) return row
      const slug = String(row.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
      return {
        ...row,
        name: t(`dashboard.home.charts.${key}.labels.${slug}`, {
          defaultValue: row.name,
        }),
      }
    }),
  }
}

/**
 * Admin home — welcome block, analytics action row, one full-width chart.
 * Everything reuses the components and spacing of the Analytics area.
 */
export default function DashboardHome() {
  const { t } = useTranslation()
  const session = useLHSession() as any

  const username = session?.data?.user?.username || ''

  const [range, setRange] = useState('30d')
  const [course, setCourse] = useState('all')
  const courseOptions = useOrgCourses()

  // Same 1536px (`2xl`) threshold as the listings: from here up the two charts
  // sit stacked beside the payments table, below it they share a row.
  const isWide = useMediaQuery('(min-width: 1536px)', { initializeWithValue: false })

  const { data, isLoading } = useAnalyticsTab(
    'courses',
    range,
    course,
    {},
    true
  )

  const enrollmentTrend = localizeCard(
    data?.cards?.course_enrollment_trend,
    'enrollment_trend',
    t
  )
  const completionFunnel = localizeCard(
    data?.cards?.course_completion_funnel,
    'completion_funnel',
    t
  )
  const learnerProgress = localizeCard(
    data?.cards?.course_learner_progress,
    'learner_progress',
    t
  )

  const rangeLabels = {
    '7d': t('dashboard.home.range.7d'),
    '30d': t('dashboard.home.range.30d'),
    '90d': t('dashboard.home.range.90d'),
  }

  return (
    <div className="pt-8 px-6 pb-10">
      {/* Page title — exact size/weight used by the Courses, Communities and Podcasts listings */}
      <h1 className="text-[28px] font-semibold text-ui-fg-base mb-6">
        {t('dashboard.home.welcome_back')}
        {username ? `, ${username}` : ''}
      </h1>

      {/* Action row */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <DateRangeFilter
          value={range}
          onChange={setRange}
          options={RANGES}
          labels={rangeLabels}
        />
        <FilterSelect value={course} onChange={setCourse} options={courseOptions} />
      </div>

      {/* Full-row chart */}
      <TabCard card={enrollmentTrend} loading={isLoading} />

      {/* Wide: payments (7) with the two charts stacked beside it (5).
          Compact (< 2xl, i.e. where the listings drop to 3 cards): the two
          charts share one row and the payments table moves below them. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-12 gap-6 mt-6">
        <div className="order-3 lg:col-span-2 2xl:order-none 2xl:col-start-1 2xl:col-span-7 2xl:row-start-1 2xl:row-span-2">
          <PaymentsTable />
        </div>
        <div className="order-1 2xl:col-start-8 2xl:col-span-5 2xl:row-start-1">
          <TabCard
            card={completionFunnel}
            loading={isLoading}
            chartHeight={isWide ? 280 : 260}
          />
        </div>
        <div className="order-2 2xl:col-start-8 2xl:col-span-5 2xl:row-start-2">
          <TabCard
            card={learnerProgress}
            loading={isLoading}
            chartHeight={isWide ? 268 : 260}
          />
        </div>
      </div>
    </div>
  )
}
