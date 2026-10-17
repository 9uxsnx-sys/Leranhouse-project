'use client'
import React from 'react'
import { SectionCard } from '@components/Analytics/Card'
import { EmptyState } from '@components/Analytics/Feedback'
import { TabCard } from '@components/Analytics/TabCard'
import { useAnalyticsTab } from '@services/analytics/tabs'
import { useTranslation } from 'react-i18next'

/**
 * Learning — "are learners using the content?" Chart-only (no KPI cards).
 *
 * Card contents come from `GET /analytics/tabs/learning`; this file owns only
 * the grid layout: a full-width hero, then two 2-up rows.
 */
export function LearningTab({ range = '30d' }: { range?: string }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAnalyticsTab('learning', range)
  const cards = data?.cards

  if (error) {
    return (
      <SectionCard>
        <EmptyState
          title={t('analytics.common.error_title')}
          description={t('analytics.common.error_description')}
        />
      </SectionCard>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Row 1 — full width */}
      <TabCard card={cards?.learning_trend} loading={isLoading} className="lg:col-span-12" />

      {/* Row 2 — split */}
      <TabCard card={cards?.completion_by_course} loading={isLoading} className="lg:col-span-6" />
      <TabCard card={cards?.lesson_dropoff} loading={isLoading} className="lg:col-span-6" />

      {/* Row 3 — split */}
      <TabCard card={cards?.time_on_activity} loading={isLoading} className="lg:col-span-6" />
      <TabCard card={cards?.content_type_effectiveness} loading={isLoading} className="lg:col-span-6" />
    </div>
  )
}
