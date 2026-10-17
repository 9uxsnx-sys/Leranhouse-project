'use client'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { usePlan } from '@components/Hooks/usePlan'
import { planMeetsRequirement } from '@services/plans/plans'
import { useAnalyticsTab, useOrgCourses } from '@services/analytics/tabs'
import type { AnalyticsCard } from '@services/analytics/tabs'
import { DateRangeFilter, FilterSelect } from '@components/Analytics/Filters'
import { TabCard } from '@components/Analytics/TabCard'
import { SectionCard } from '@components/Analytics/Card'
import PaymentsTable from './PaymentsTable'

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
  const plan = usePlan()
  const analyticsEnabled = planMeetsRequirement(plan, 'standard')

  const [range, setRange] = useState('30d')
  const [course, setCourse] = useState('all')
  const courseOptions = useOrgCourses()

  const { data, isLoading } = useAnalyticsTab(
    'courses',
    range,
    course,
    {},
    analyticsEnabled
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
      {analyticsEnabled ? (
        <TabCard card={enrollmentTrend} loading={isLoading} />
      ) : (
        <SectionCard title={t('dashboard.home.analytics')}>
          <p className="text-xs text-gray-500 py-4">
            {t('dashboard.home.analytics_locked_description')}
          </p>
        </SectionCard>
      )}

      {/* Row 2 — payments (UI only) + completion funnel */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className={`col-span-12 ${analyticsEnabled ? 'lg:col-span-7' : ''}`}>
          <PaymentsTable />
        </div>
        {analyticsEnabled && (
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between gap-6">
            <TabCard
              card={completionFunnel}
              loading={isLoading}
              chartHeight={280}
            />
            <TabCard card={learnerProgress} loading={isLoading} chartHeight={268} />
          </div>
        )}
      </div>
    </div>
  )
}
