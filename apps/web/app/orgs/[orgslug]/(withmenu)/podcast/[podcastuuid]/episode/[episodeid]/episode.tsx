'use client'

import React, { useMemo, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { Podcast, PodcastEpisode } from '@services/podcasts/podcasts'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useRegisterBreadcrumb } from '@components/Objects/Breadcrumbs/UserBreadcrumbContext'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import EpisodePlayer from '@components/Objects/Podcasts/EpisodePlayer'
import EpisodeOutlineSidebar from '@components/Objects/Podcasts/EpisodeOutlineSidebar'
import { ChevronDown, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useContentLocale } from '@components/Hooks/useCourseTranslation'
import { swrFetcher } from '@services/utils/ts/requests'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EpisodeClientProps {
  orgslug: string
  org_id: number
  podcastUuid: string
  episodeId: string
  initialPodcast: Podcast
  initialEpisodes: PodcastEpisode[]
  initialEpisode: any
  denied?: boolean
}

// ── Episode section definitions ──

const EPISODE_SECTIONS = [
  { id: 'what-youll-learn', labelKey: 'lesson.preview.what_youll_learn' },
  { id: 'episode-player', labelKey: 'lesson.preview.lesson_content' },
  { id: 'about-this-episode', labelKey: 'podcast.episode.about_this_episode' },
  { id: 'key-takeaways', labelKey: 'lesson.preview.key_takeaways' },
  { id: 'whats-next', labelKey: 'activities.whats_next' },
]

// ── On This Page Sidebar (sliding indicator, same as lesson-preview) ──

function OnThisPageSidebar({
  activeSection,
  sections = EPISODE_SECTIONS,
}: {
  activeSection: string
  sections?: { id: string; labelKey: string }[]
}) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorTop, setIndicatorTop] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const activeBtn = containerRef.current.querySelector(
      `[data-section="${activeSection}"]`
    ) as HTMLElement | null
    if (activeBtn) {
      setIndicatorTop(activeBtn.offsetTop + activeBtn.offsetHeight / 2 - 8)
    }
  }, [activeSection])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div>
      <div ref={containerRef} className="relative space-y-0.5">
        <span
          className="absolute start-0 w-[3px] h-4 bg-ui-fg-base rounded-full pointer-events-none transition-all duration-300 ease-in-out"
          style={{ top: indicatorTop }}
        />
        {sections.map((section) => (
          <button
            key={section.id}
            data-section={section.id}
            onClick={() => scrollTo(section.id)}
            className="group relative w-full text-start py-1 text-[14px] transition-colors"
          >
            <span
              className={cn(
                'inline-block ps-4 transition-colors',
                activeSection === section.id
                  ? 'text-ui-fg-base font-medium'
                  : 'text-ui-fg-subtle group-hover:text-ui-fg-base'
              )}
            >
              {t(section.labelKey)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Episode Client ──

export default function EpisodeClient({
  orgslug,
  org_id,
  podcastUuid,
  episodeId,
  initialPodcast,
  initialEpisodes,
  initialEpisode,
  denied = false,
}: EpisodeClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { state, playEpisode } = usePodcastPlayer()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const contentLocale = useContentLocale()

  // SWR for real-time data — locale-aware so a language switch re-fetches
  // the translated podcast, episode list and episode content.
  const swrKey = `${getAPIUrl()}podcasts/${podcastUuid}/meta?locale=${contentLocale}`
  const { data, error } = useSWR(
    swrKey,
    (url) => swrFetcher(url, access_token),
    {
      fallbackData: { podcast: initialPodcast, episodes: initialEpisodes },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
      errorRetryCount: 0,
      shouldRetryOnError: false,
    }
  )

  const { data: swrEpisode } = useSWR(
    () => episodeId
      ? `${getAPIUrl()}podcasts/episodes/${episodeId}?locale=${contentLocale}`
      : null,
    (url: string) => swrFetcher(url, access_token),
    {
      fallbackData: initialEpisode,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      errorRetryCount: 0,
      shouldRetryOnError: false,
    }
  )

  const podcast = data?.podcast || initialPodcast
  const episodes = data?.episodes || initialEpisodes
  const episode = swrEpisode || initialEpisode

  // Trail data for progress tracking
  const { data: trailData } = useSWR(
    access_token && org_id
      ? `${getAPIUrl()}trail/org/${org_id}/trail`
      : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  // Register breadcrumb
  useRegisterBreadcrumb([
    { label: t('podcasts.podcasts'), href: '/podcasts' },
    {
      label:
        podcast?.name || t('navigation.breadcrumb.podcast_fallback'),
      href: `/podcast/${podcastUuid.replace('podcast_', '')}`,
    },
    {
      label:
        episode?.title ||
        t('navigation.breadcrumb.episode_fallback', 'Episode'),
    },
  ])

  // Auto-set the episode in the player context when the page loads
  useEffect(() => {
    if (
      episode &&
      podcast &&
      state.currentEpisode?.episode_uuid !== episode.episode_uuid
    ) {
      playEpisode(episode, podcast)
    }
  }, [episode?.episode_uuid, podcast?.podcast_uuid])

  // Find current episode index for prev/next navigation
  const { prevEpisode, nextEpisode } = useMemo(() => {
    if (!episode || !episodes.length)
      return { prevEpisode: null, nextEpisode: null }

    const currentIndex = episodes.findIndex(
      (ep: PodcastEpisode) => ep.episode_uuid === episode.episode_uuid
    )

    return {
      prevEpisode: currentIndex > 0 ? episodes[currentIndex - 1] : null,
      nextEpisode:
        currentIndex < episodes.length - 1
          ? episodes[currentIndex + 1]
          : null,
    }
  }, [episode, episodes])

  const navigateToEpisode = (ep: PodcastEpisode) => {
    const cleanUuid = ep.episode_uuid.replace('episode_', '')
    const cleanPodcastUuid = podcastUuid.replace('podcast_', '')
    router.push(
      getUriWithOrg(orgslug, '') +
        `/podcast/${cleanPodcastUuid}/episode/${cleanUuid}`
    )
  }

  // Extract metadata from episode extra_metadata
  const meta = (episode as any)?.extra_metadata || {}
  const learningObjectives: string[] = meta.learning_objectives || []
  const keyPoints: Array<{ title: string; items: string[] }> =
    meta.key_points || []


  // Visible sections (filtered by content availability)
  const visibleSections = EPISODE_SECTIONS.filter((section) => {
    if (section.id === 'what-youll-learn') return learningObjectives.length > 0
    if (section.id === 'about-this-episode') return !!episode?.description
    if (section.id === 'key-takeaways') return keyPoints.length > 0
    if (section.id === 'whats-next') return !!nextEpisode
    return true // episode-player always visible
  })

  // On-this-page scroll tracking
  const [activeSection, setActiveSection] = useState(
    () =>
      visibleSections.length > 0
        ? visibleSections[0].id
        : 'episode-player'
  )

  useEffect(() => {
    const sectionIds = EPISODE_SECTIONS.map((s) => s.id)
    const SENTINEL_ID = 'page-end-sentinel'

    const observer = new IntersectionObserver(
      (entries) => {
        let bestId = ''
        let minDist = Infinity
        let sentinelVisible = false

        for (const entry of entries) {
          if (entry.target.id === SENTINEL_ID) {
            if (entry.isIntersecting) sentinelVisible = true
            continue
          }

          if (entry.isIntersecting) {
            const dist = Math.abs(entry.boundingClientRect.top)
            if (dist < minDist) {
              minDist = dist
              bestId = entry.target.id
            }
          }
        }

        if (sentinelVisible) {
          setActiveSection(sectionIds[sectionIds.length - 1])
        } else if (bestId) {
          setActiveSection(bestId)
        }
      },
      { rootMargin: '-80px 0px -20% 0px' }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    const sentinel = document.getElementById(SENTINEL_ID)
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [episode])

  // Reset active section when navigating to a new episode
  useEffect(() => {
    if (visibleSections.length > 0) {
      setActiveSection(visibleSections[0].id)
    }
  }, [episode])

  // ── Error / denied states ──

  if (denied) {
    return (
      <GeneralWrapperStyled>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">
            {t('podcast.page.no_permission')}
          </p>
        </div>
      </GeneralWrapperStyled>
    )
  }

  if (error || !episode) {
    return (
      <GeneralWrapperStyled>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">
            {t('podcast.page.failed_to_load')}
          </p>
        </div>
      </GeneralWrapperStyled>
    )
  }

  const cleanPodcastUuid = podcastUuid.replace('podcast_', '')

  return (
    <GeneralWrapperStyled className="pb-0">
      {/* ── Page Title ── */}
      <h1 dir="auto" className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight max-w-7xl mx-auto mt-4">
        {episode.title}
      </h1>

      {/* ── CONTENT (two-column layout) ── */}
      <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-10 justify-between">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-12">
            {/* 1. What You'll Learn (first, like lesson page) */}
            {learningObjectives.length > 0 && (
              <section id="what-youll-learn" className="scroll-mt-24">
                <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-5">
                  <div className="flex flex-col gap-0.5">
                    <Heading level="h2">{t('lesson.preview.what_youll_learn')}</Heading>
                    <Text size="base" className="text-ui-fg-muted">{t('lesson.preview.what_youll_learn_lead')}</Text>
                  </div>
                  <ul className="mt-3 space-y-2 ps-3">
                    {learningObjectives.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ui-fg-muted shrink-0">&bull;</span>
                        <Text size="base" className="text-[16px]">{item}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* 2. Episode Content (with heading, same as lesson video section) */}
            <section id="episode-player" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5">
                {t('lesson.preview.lesson_content', 'Episode Content')}
              </Heading>
              <EpisodePlayer episode={episode} podcast={podcast} />
            </section>

            {/* 3. About This Episode (no card — clean text like About This Course) */}
            {episode.description && (
              <section id="about-this-episode" className="scroll-mt-24">
                <Heading level="h1" className="!text-2xl mb-4">
                  {t('podcast.episode.about_this_episode', 'About This Episode')}
                </Heading>
                <div dir="auto" className="space-y-4">
                  {episode.description
                    .replace(/\r\n/g, '\n')
                    .split('\n\n')
                    .filter((p: string) => p.trim())
                    .map((paragraph: string, idx: number) => (
                      <Text key={idx} size="base" className="text-ui-fg-subtle leading-relaxed block">
                        {paragraph.trim()}
                      </Text>
                    ))}
                </div>
              </section>
            )}

            {/* 4. Key Takeaways (same pattern as lesson page) */}
            {keyPoints.length > 0 && (
              <section id="key-takeaways" className="scroll-mt-24">
                <Heading level="h1" className="!text-2xl mb-5">
                  {t('lesson.preview.key_takeaways', 'Key Takeaways')}
                </Heading>
                <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-5">
                  <ul className="space-y-4">
                    {keyPoints.map(
                      (
                        point: { title: string; items: string[] },
                        idx: number
                      ) => (
                        <li key={idx}>
                          <Text
                            weight="plus"
                            size="base"
                            className="text-ui-fg-base block"
                          >
                            {point.title}
                          </Text>
                          {point.items && point.items.length > 0 && (
                            <ul className="mt-2 space-y-1.5 ps-5">
                              {point.items.map(
                                (item: string, iidx: number) => (
                                  <li
                                    key={iidx}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="text-ui-fg-muted shrink-0">
                                      &bull;
                                    </span>
                                    <Text
                                      size="base"
                                      className="text-ui-fg-subtle text-[16px]"
                                    >
                                      {item}
                                    </Text>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </section>
            )}

            {/* 5. What's Next (same pattern as lesson) */}
            <section id="whats-next" className="scroll-mt-24">
              <Heading level="h1" className="!text-2xl mb-5">
                {t('activities.whats_next', "What's Next")}
              </Heading>
              {nextEpisode ? (
                <div
                  className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 cursor-pointer hover:bg-gray-50/60 transition-colors"
                  onClick={() => navigateToEpisode(nextEpisode)}
                >
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-ui-fg-muted mt-0.5 shrink-0" />
                    <div>
                      <Text className="font-medium text-ui-fg-base mb-1">
                        {nextEpisode.title}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {t('podcast.episode.continue_listening', 'Continue listening')}
                      </Text>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-ui-fg-muted mt-0.5 shrink-0" />
                    <div>
                      <Text className="font-medium text-ui-fg-base mb-1">
                        {t('podcast.episode.all_caught_up', "You're all caught up!")}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {t(
                          'podcast.episode.no_more_episodes',
                          'No more episodes in this podcast.'
                        )}
                      </Text>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 5. Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                size="small"
                className="gap-1.5"
                onClick={() =>
                  prevEpisode && navigateToEpisode(prevEpisode)
                }
                disabled={!prevEpisode}
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t('common.previous', 'Previous')}
              </Button>

              {nextEpisode ? (
                <Button
                  variant="ghost"
                  size="small"
                  className="gap-1.5"
                  onClick={() => navigateToEpisode(nextEpisode)}
                >
                  {t('common.next', 'Next')}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
              ) : (
                <div />
              )}
            </div>

            {/* Sentinel for On This Page sidebar */}
            <div id="page-end-sentinel" className="h-1" />
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              <EpisodeOutlineSidebar
                episodes={episodes}
                currentEpisodeId={episode.episode_uuid}
                orgslug={orgslug}
                podcastUuid={podcastUuid}
                trailData={trailData}
              />
              <OnThisPageSidebar
                activeSection={activeSection}
                sections={visibleSections}
              />
            </div>
          </div>
        </div>
      </div>
    </GeneralWrapperStyled>
  )
}
