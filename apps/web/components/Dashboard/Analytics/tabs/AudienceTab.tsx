'use client'
import React from 'react'
import { SectionCard } from '@components/Analytics/Card'
import { EmptyState } from '@components/Analytics/Feedback'
import { TabCard } from '@components/Analytics/TabCard'
import { useAnalyticsTab } from '@services/analytics/tabs'

/**
 * Audience — "where does traffic come from?" Chart-only (no KPI cards).
 *
 * Card contents come from `GET /analytics/tabs/audience`; this file owns only
 * the grid layout: a full-width hero, a 2-up row, then the detail table.
 */
export function AudienceTab({ range = '30d' }: { range?: string }) {
  const { data, isLoading, error } = useAnalyticsTab('audience', range)
  const cards = data?.cards

  if (error) {
    return (
      <SectionCard>
        <EmptyState
          title="Couldn't load analytics"
          description="Please try again in a moment."
        />
      </SectionCard>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Row 1 — full width */}
      <TabCard card={cards?.traffic_trend} loading={isLoading} className="lg:col-span-12" />

      {/* Row 2 — split */}
      <TabCard card={cards?.sources} loading={isLoading} className="lg:col-span-6" />
      <TabCard card={cards?.devices} loading={isLoading} className="lg:col-span-6" />

      {/* Row 3 — full width */}
      <TabCard card={cards?.top_pages} loading={isLoading} className="lg:col-span-12" />
    </div>
  )
}
