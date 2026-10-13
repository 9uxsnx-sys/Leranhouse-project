'use client'
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { BookOpen, ChartBar, Globe, GraduationCap, LineChart, MessagesSquare, Mic, Repeat2, Users } from 'lucide-react'
import { isFeatureAvailable } from '@services/plans/plans'
import { usePlan } from '@components/Hooks/usePlan'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import { AnalyticsToolbar, FilterSelect, SearchInput } from '@components/Analytics/Filters'
import { OverviewTab } from '@components/Dashboard/Analytics/tabs/OverviewTab'
import { LearningTab } from '@components/Dashboard/Analytics/tabs/LearningTab'
import { CoursesTab } from '@components/Dashboard/Analytics/tabs/CoursesTab'
import { PodcastsTab } from '@components/Dashboard/Analytics/tabs/PodcastsTab'
import { AudienceTab } from '@components/Dashboard/Analytics/tabs/AudienceTab'
import { LearnersTab } from '@components/Dashboard/Analytics/tabs/LearnersTab'
import { CommunityTab, COMMUNITY_TABLES } from '@components/Dashboard/Analytics/tabs/CommunityTab'
import { useOrgCommunities, useOrgCourses, useOrgPodcasts } from '@services/analytics/tabs'

type TabId = 'overview' | 'learning' | 'audience' | 'learners' | 'courses' | 'podcasts' | 'community'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LineChart },
  { id: 'learning', label: 'Learning', icon: GraduationCap },
  { id: 'audience', label: 'Audience', icon: Globe },
  { id: 'learners', label: 'Learners', icon: Users },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'podcasts', label: 'Podcasts', icon: Mic },
  { id: 'community', label: 'Community', icon: MessagesSquare },
]

/**
 * The Analytics area — a left-to-right tab bar (same pill style as the dashboard
 * settings pages) over a shared action row, with every tab built from the locked
 * analytics components.
 */
export default function AnalyticsTabs() {
  const [tab, setTab] = useState<TabId>('overview')
  const [range, setRange] = useState('30d')
  const [query, setQuery] = useState('')
  const [community, setCommunity] = useState('all')
  const [communityTable, setCommunityTable] = useState(0)
  const [course, setCourse] = useState('all')
  const [podcast, setPodcast] = useState('all')
  const plan = usePlan()
  const isAnalyticsAvailable = isFeatureAvailable('analytics', plan)
  const courseOptions = useOrgCourses()
  const podcastOptions = useOrgPodcasts()
  const communityOptions = useOrgCommunities()

  if (!isAnalyticsAvailable) {
    return (
      <PlanRestrictedFeature
        currentPlan={plan}
        requiredPlan="standard"
        icon={ChartBar}
        titleKey="common.plans.feature_restricted.analytics.title"
        descriptionKey="common.plans.feature_restricted.analytics.description"
        fullScreen
      >
        <></>
      </PlanRestrictedFeature>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8]">
      {/* Row 1: Page title */}
      <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">Analytics</h1>
      </div>

      {/* Row 2: Pill-style tab bar */}
      <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-50/80 rounded-xl p-1 flex items-center w-full overflow-x-auto">
          {TABS.map((t) => {
            const isActive = tab === t.id
            const Icon = t.icon
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className="flex-1 relative min-w-fit">
                <div
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isActive ? 'text-ui-fg-base' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="analytics-tab-indicator"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm border border-neutral-200/80"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    <Icon size={16} />
                    <span>{t.label}</span>
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 3: Action row + content */}
      <div className="max-w-7xl mx-auto w-full pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <AnalyticsToolbar range={range} onRangeChange={setRange}>
            {tab === 'learners' && (
              <SearchInput value={query} onChange={setQuery} placeholder="Search learners…" />
            )}
            {tab === 'courses' && (
              <FilterSelect value={course} onChange={setCourse} options={courseOptions} />
            )}
            {tab === 'podcasts' && (
              <FilterSelect value={podcast} onChange={setPodcast} options={podcastOptions} />
            )}
            {tab === 'community' && (
              <>
                <FilterSelect value={community} onChange={setCommunity} options={communityOptions} />
                <button
                  type="button"
                  onClick={() => setCommunityTable((i) => (i + 1) % COMMUNITY_TABLES.length)}
                  title="Switch table"
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-sm text-gray-700 bg-white shadow-borders-base rounded-md hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  <Repeat2 size={14} className="text-gray-400" />
                  {COMMUNITY_TABLES[communityTable].label}
                </button>
              </>
            )}
          </AnalyticsToolbar>
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="space-y-6"
        >
          {tab === 'overview' && <OverviewTab range={range} />}
          {tab === 'learning' && <LearningTab range={range} />}
          {tab === 'audience' && <AudienceTab range={range} />}
          {tab === 'learners' && <LearnersTab range={range} query={query} />}
          {tab === 'courses' && <CoursesTab range={range} course={course} />}
          {tab === 'podcasts' && <PodcastsTab range={range} podcast={podcast} />}
          {tab === 'community' && (
            <CommunityTab range={range} community={community} table={COMMUNITY_TABLES[communityTable].id} />
          )}
        </motion.div>
      </div>
    </div>
  )
}
