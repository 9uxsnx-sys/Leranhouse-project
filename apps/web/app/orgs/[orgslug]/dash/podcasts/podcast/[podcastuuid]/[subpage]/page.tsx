'use client'
import React, { use } from 'react'
import { PodcastProvider, usePodcast } from '@components/Contexts/PodcastContext'
import { motion } from 'motion/react'
import EditPodcastGeneral from '@components/Dashboard/Pages/Podcast/EditPodcastGeneral/EditPodcastGeneral'
import EditPodcastEpisodes from '@components/Dashboard/Pages/Podcast/EditPodcastEpisodes/EditPodcastEpisodes'
import PodcastDistribution from '@components/Dashboard/Pages/Podcast/PodcastDistribution/PodcastDistribution'
import { getUriWithOrg } from '@services/config/config'
import { useTranslation } from 'react-i18next'
import { PageTabs } from '@components/ui/page-tabs'
import { SectionIcon } from '@components/ui/icons'

export type PodcastOverviewParams = {
  orgslug: string
  podcastuuid: string
  subpage: string
}

function PodcastPageTitle() {
  const { podcast, isLoading } = usePodcast()
  return (
    <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">
      {isLoading ? '...' : podcast?.name || 'Podcast'}
    </h1>
  )
}

function PodcastOverviewPage(props: { params: Promise<PodcastOverviewParams> }) {
  const { t } = useTranslation()
  const params = use(props.params)

  function getEntirePodcastUUID(podcastuuid: string) {
    return `podcast_${podcastuuid}`
  }

  const podcastuuid = getEntirePodcastUUID(params.podcastuuid)

  const tabs = [
    {
      key: 'general',
      label: t('podcasts.dashboard.tabs.general'),
      icon: SectionIcon.general,
      href: `/dash/podcasts/podcast/${params.podcastuuid}/general`,
    },
    {
      key: 'content',
      label: t('podcasts.dashboard.tabs.episodes'),
      icon: SectionIcon.episodes,
      href: `/dash/podcasts/podcast/${params.podcastuuid}/content`,
    },
    {
      key: 'distribution',
      label: t('podcasts.dashboard.tabs.distribution'),
      icon: SectionIcon.distribution,
      href: `/dash/podcasts/podcast/${params.podcastuuid}/distribution`,
    },
  ]

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8]">
      <PodcastProvider podcastuuid={podcastuuid}>
        {/* Row 1: Page title */}
        <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8">
          <PodcastPageTitle />
        </div>

        {/* Row 2: Pill-style tab bar */}
        <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
          <PageTabs
            variant="pill"
            indicatorId="podcast-settings-tabs"
            active={params.subpage}
            tabs={tabs.map((tab) => ({
              id: tab.key,
              label: tab.label,
              icon: tab.icon,
              href: getUriWithOrg(params.orgslug, '') + tab.href,
            }))}
          />
        </div>

        {/* Row 3: Content */}
        <div className="w-full mx-auto max-w-7xl mt-8 pb-10 px-4 sm:px-6 lg:px-8">
          <main className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, type: 'spring', stiffness: 80 }}
              className="space-y-8 rounded-xl"
            >
              {params.subpage === 'general' && (
                <EditPodcastGeneral orgslug={params.orgslug} />
              )}
              {params.subpage === 'content' && (
                <EditPodcastEpisodes orgslug={params.orgslug} podcastuuid={podcastuuid} />
              )}
              {params.subpage === 'distribution' && (
                <PodcastDistribution orgslug={params.orgslug} podcastuuid={podcastuuid} />
              )}
            </motion.div>
          </main>
        </div>
      </PodcastProvider>
    </div>
  )
}

export default PodcastOverviewPage
