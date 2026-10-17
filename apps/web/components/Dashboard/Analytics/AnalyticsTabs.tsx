'use client'
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { BarChart3, Repeat2 } from 'lucide-react'
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
import { PageTabs } from '@components/ui/page-tabs'
import { SectionIcon } from '@components/ui/icons'
import { useTranslation } from 'react-i18next'

type TabId = 'overview' | 'learning' | 'audience' | 'learners' | 'courses' | 'podcasts' | 'community'

const TABS: { id: TabId; labelKey: string; icon: React.ElementType }[] = [
  { id: 'overview', labelKey: 'analytics.tabs.overview', icon: SectionIcon.overview },
  { id: 'learning', labelKey: 'analytics.tabs.learning', icon: SectionIcon.learning },
  { id: 'audience', labelKey: 'analytics.tabs.audience', icon: SectionIcon.audience },
  { id: 'learners', labelKey: 'analytics.tabs.learners', icon: SectionIcon.learners },
  { id: 'courses', labelKey: 'analytics.tabs.courses', icon: SectionIcon.courses },
  { id: 'podcasts', labelKey: 'analytics.tabs.podcasts', icon: SectionIcon.podcasts },
  { id: 'community', labelKey: 'analytics.tabs.community', icon: SectionIcon.community },
]

/**
 * The Analytics area — a left-to-right tab bar (same pill style as the dashboard
 * settings pages) over a shared action row, with every tab built from the locked
 * analytics components.
 */
export default function AnalyticsTabs() {
  const { t } = useTranslation()
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
        icon={BarChart3}
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
        <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">{t('analytics.title')}</h1>
      </div>

      {/* Row 2: Pill-style tab bar */}
      <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
        <PageTabs
          variant="pill"
          indicatorId="analytics-tabs"
          active={tab}
          onSelect={(id) => setTab(id as TabId)}
          tabs={TABS.map((item) => ({ id: item.id, label: t(item.labelKey), icon: item.icon }))}
        />
      </div>

      {/* Row 3: Action row + content */}
      <div className="max-w-7xl mx-auto w-full pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <AnalyticsToolbar range={range} onRangeChange={setRange}>
            {tab === 'learners' && (
              <SearchInput value={query} onChange={setQuery} placeholder={t('analytics.learners_tab.search_placeholder')} />
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
                  title={t('analytics.learners_tab.switch_table')}
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-sm text-gray-700 bg-white shadow-borders-base rounded-md hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  <Repeat2 size={14} className="text-gray-400" />
                  {t(COMMUNITY_TABLES[communityTable].labelKey)}
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
