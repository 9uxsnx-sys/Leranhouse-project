'use client'
import React from 'react'
import { SectionCard } from '@components/Analytics/Card'
import { EmptyState } from '@components/Analytics/Feedback'
import { TabCard } from '@components/Analytics/TabCard'
import { useAnalyticsTab } from '@services/analytics/tabs'

/**
 * Courses — "how is this course doing?" Chart-first, entity-scoped by the
 * course selector in the action row (`entity` = course uuid, or `all`).
 * Hero trend, two 2-up rows, then the students table.
 */
export function CoursesTab({ range = '30d', course = 'all' }: { range?: string; course?: string }) {
  const { data, isLoading, error } = useAnalyticsTab('courses', range, course)
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
      <TabCard card={cards?.course_enrollment_trend} loading={isLoading} className="lg:col-span-12" />

      {/* Row 2 — split */}
      <TabCard card={cards?.course_completion_funnel} loading={isLoading} className="lg:col-span-6" />
      <TabCard card={cards?.course_learner_progress} loading={isLoading} className="lg:col-span-6" />

      {/* Row 3 — split */}
      <TabCard card={cards?.course_lesson_dropoff} loading={isLoading} className="lg:col-span-6" />
      <TabCard card={cards?.course_time_per_lesson} loading={isLoading} className="lg:col-span-6" />

      {/* Row 4 — full width table */}
      <TabCard card={cards?.course_students} loading={isLoading} className="lg:col-span-12" />
    </div>
  )
}
