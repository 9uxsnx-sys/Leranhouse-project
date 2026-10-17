'use client'
import React from 'react'
import { SectionCard } from '@components/Analytics/Card'
import { EmptyState } from '@components/Analytics/Feedback'
import { TabCard } from '@components/Analytics/TabCard'
import { useAnalyticsTab } from '@services/analytics/tabs'
import { useTranslation } from 'react-i18next'

/**
 * Podcasts — "is anyone listening?" Chart-first, entity-scoped by the podcast
 * selector in the action row (`entity` = podcast uuid, or `all`).
 * Hero trend, two 2-up rows, then the episodes table.
 */
export function PodcastsTab({ range = '30d', podcast = 'all' }: { range?: string; podcast?: string }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAnalyticsTab('podcasts', range, podcast)
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
      <TabCard card={cards?.podcast_listening_trend} loading={isLoading} className="lg:col-span-12" />

      {/* Row 2 — split */}
      <TabCard card={cards?.podcast_episode_plays} loading={isLoading} className="lg:col-span-6" />
      <TabCard card={cards?.podcast_episode_completion} loading={isLoading} className="lg:col-span-6" />

      {/* Row 3 — split */}
      <TabCard card={cards?.podcast_length_vs_listened} loading={isLoading} className="lg:col-span-6" />
      <TabCard card={cards?.podcast_series_progress} loading={isLoading} className="lg:col-span-6" />

      {/* Row 4 — full width table */}
      <TabCard card={cards?.podcast_episodes} loading={isLoading} className="lg:col-span-12" />
    </div>
  )
}
