'use client'
import React from 'react'
import { SectionCard } from '@components/Analytics/Card'
import { EmptyState } from '@components/Analytics/Feedback'
import { TabCard } from '@components/Analytics/TabCard'
import { useAnalyticsTab } from '@services/analytics/tabs'
import { useTranslation } from 'react-i18next'

/** The detail-table views the action-row cycle button steps through. */
export const COMMUNITY_TABLES: { id: string; labelKey: string }[] = [
  { id: 'contributors', labelKey: 'analytics.community_tables.contributors' },
  { id: 'discussions', labelKey: 'analytics.community_tables.top_discussions' },
  { id: 'questions', labelKey: 'analytics.community_tables.unanswered' },
]

/**
 * Community — "is the community alive?" Chart-first, entity-scoped by the
 * community selector in the action row. The two charts always stay; the detail
 * table below is picked by the cycle button in the action row (`view` param).
 */
export function CommunityTab({
  range = '30d',
  community = 'all',
  table = 'contributors',
}: {
  range?: string
  community?: string
  table?: string
}) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAnalyticsTab('community', range, community, { view: table })
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
      {/* Charts — always visible, full width */}
      <TabCard card={cards?.community_activity_trend} loading={isLoading} className="lg:col-span-12" />
      <TabCard card={cards?.community_by_label} loading={isLoading} className="lg:col-span-12" />

      {/* Detail table — full width, swapped from the action row */}
      <TabCard card={cards?.community_detail_table} loading={isLoading} className="lg:col-span-12" />
    </div>
  )
}
