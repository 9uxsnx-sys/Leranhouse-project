'use client'

import React, { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { Podcast, PodcastEpisode } from '@services/podcasts/podcasts'
import { getEpisode } from '@services/podcasts/episodes'
import { getPodcastThumbnailMediaDirectory, getUserAvatarMediaDirectory } from '@services/media/media'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useRegisterBreadcrumb } from '@components/Objects/Breadcrumbs/UserBreadcrumbContext'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import EpisodePlayer from '@components/Objects/Podcasts/EpisodePlayer'
import EpisodeOutlineSidebar from '@components/Objects/Podcasts/EpisodeOutlineSidebar'
import UserAvatar from '@components/Objects/UserAvatar'
import { ChevronLeft, ChevronRight, Headphones, Clock, FileText, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { swrFetcher } from '@services/utils/ts/requests'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'

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

  // SWR for real-time data
  const swrKey = `${getAPIUrl()}podcasts/${podcastUuid}/meta?locale=en`
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

  const podcast = data?.podcast || initialPodcast
  const episodes = data?.episodes || initialEpisodes
  const episode = initialEpisode

  // Trail data for progress tracking
  const { data: trailData } = useSWR(
    access_token && org_id ? `${getAPIUrl()}trail/org/${org_id}/trail` : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  // Register breadcrumb
  useRegisterBreadcrumb([
    { label: t('podcasts.podcasts'), href: '/podcasts' },
    { label: podcast?.name || t('navigation.breadcrumb.podcast_fallback'), href: `/podcast/${podcastUuid.replace('podcast_', '')}` },
    { label: episode?.title || t('navigation.breadcrumb.episode_fallback', 'Episode') },
  ])

  // Auto-set the episode in the player context when the page loads
  useEffect(() => {
    if (episode && podcast && state.currentEpisode?.episode_uuid !== episode.episode_uuid) {
      playEpisode(episode, podcast)
    }
  }, [episode?.episode_uuid, podcast?.podcast_uuid])

  // Find current episode index for prev/next navigation
  const { prevEpisode, nextEpisode } = useMemo(() => {
    if (!episode || !episodes.length) return { prevEpisode: null, nextEpisode: null }

    const currentIndex = episodes.findIndex(
      (ep: PodcastEpisode) => ep.episode_uuid === episode.episode_uuid
    )

    return {
      prevEpisode: currentIndex > 0 ? episodes[currentIndex - 1] : null,
      nextEpisode: currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null,
    }
  }, [episode, episodes])

  const navigateToEpisode = (ep: PodcastEpisode) => {
    const cleanUuid = ep.episode_uuid.replace('episode_', '')
    const cleanPodcastUuid = podcastUuid.replace('podcast_', '')
    router.push(getUriWithOrg(orgslug, '') + `/podcast/${cleanPodcastUuid}/episode/${cleanUuid}`)
  }

  // Extract key_points from episode extra_metadata
  const meta = (episode as any)?.extra_metadata || {}
  const keyPoints: Array<{ title: string; items: string[] }> = meta.key_points || []

  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return ''
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes} min`
  }

  if (denied) {
    return (
      <GeneralWrapperStyled>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">{t('podcast.page.no_permission')}</p>
        </div>
      </GeneralWrapperStyled>
    )
  }

  if (error || !episode) {
    return (
      <GeneralWrapperStyled>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">{t('podcast.page.failed_to_load')}</p>
        </div>
      </GeneralWrapperStyled>
    )
  }

  const cleanPodcastUuid = podcastUuid.replace('podcast_', '')

  return (
    <GeneralWrapperStyled>
      <div className="space-y-5 pt-0 relative">
        {/* ── Simplified Header ── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={getUriWithOrg(orgslug, '') + `/podcast/${cleanPodcastUuid}`}
              className="text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors mb-0.5 inline-block"
            >
              {podcast?.name || t('podcasts.podcasts')}
            </Link>
            <h1 dir="auto" className="font-bold text-gray-950 text-xl sm:text-3xl first-letter:uppercase">
              {episode.title}
            </h1>
            {/* Episode meta */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="grey" className="flex items-center gap-1">
                <Headphones size={12} />
                {t('podcast.episode.episode_label', 'Episode')} {episode.episode_number || episode.order}
              </Badge>
              {episode.duration_seconds > 0 && (
                <Badge variant="grey" className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDuration(episode.duration_seconds)}
                </Badge>
              )}
              {podcast?.authors && podcast.authors.filter((a: any) => a.authorship_status === 'ACTIVE').length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {podcast.authors.filter((a: any) => a.authorship_status === 'ACTIVE').slice(0, 3).map((author: any, idx: number) => (
                      <div key={author.user.user_uuid} className="relative" style={{ zIndex: 10 - idx }}>
                        <UserAvatar
                          border="border-2"
                          rounded="rounded-full"
                          avatar_url={author.user.avatar_image ? getUserAvatarMediaDirectory(author.user.user_uuid, author.user.avatar_image) : ''}
                          predefined_avatar={author.user.avatar_image ? undefined : 'empty'}
                          width={22}
                          showProfilePopup={true}
                          userId={author.user.id}
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {podcast.authors.filter((a: any) => a.authorship_status === 'ACTIVE').slice(0, 2).map((a: any) =>
                      a.user.first_name && a.user.last_name ? `${a.user.first_name} ${a.user.last_name}` : `@${a.user.username}`
                    ).join(' & ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT: Content + Sidebar ── */}
        <div className="flex gap-8">
          {/* ═══ LEFT CONTENT AREA ═══ */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* 1. Episode Audio Player */}
            <section id="episode-player">
              <EpisodePlayer episode={episode} podcast={podcast} />
            </section>

            {/* 2. Show Notes */}
            {episode.description && (
              <section id="episode-show-notes">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-gray-900 mb-2">
                    {t('podcast.episode.show_notes', 'Show Notes')}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{episode.description}</p>
                </div>
              </section>
            )}

            {/* 3. Key Points */}
            {keyPoints.length > 0 && (
              <section id="episode-key-points">
                <Heading level="h1" className="!text-2xl mb-4">
                  {t('podcast.episode.key_points', 'Key Points')}
                </Heading>
                <div className="space-y-4">
                  {keyPoints.map((point: { title: string; items: string[] }, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">{point.title}</h3>
                      <ul className="space-y-2">
                        {point.items.map((item: string, itemIdx: number) => (
                          <li key={itemIdx} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Transcript (placeholder) */}
            <section id="episode-transcript">
              <div className="border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">
                  {t('podcast.episode.transcript', 'Transcript')}
                </h2>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                    <FileText size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{t('podcast.episode.transcript_unavailable', 'Transcript not yet available')}</p>
                    <p className="text-[10px] text-gray-400">{t('podcast.episode.transcript_hint', 'Check back later for a full transcript')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. What's Next */}
            {nextEpisode && (
              <section id="episode-whats-next">
                <div className="border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-gray-900 mb-1">{t('activities.whats_next', 'What\'s Next')}</h2>
                  <p className="text-xs text-gray-500 mb-3">{t('activities.up_next', 'Up next')}: {nextEpisode.title}</p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {nextEpisode.episode_number ? `Ep ${nextEpisode.episode_number}: ` : ''}{nextEpisode.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {nextEpisode.duration_seconds > 0 ? formatDuration(nextEpisode.duration_seconds) : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => navigateToEpisode(nextEpisode)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      {t('activities.continue', 'Continue')}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 6. Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2 border-t border-gray-100">
              <div>
                {prevEpisode && (
                  <button
                    onClick={() => navigateToEpisode(prevEpisode)}
                    className="flex items-center gap-1.5 p-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={17} className="shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{t('common.previous')}</span>
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{prevEpisode.title}</span>
                    </div>
                  </button>
                )}
              </div>
              <div>
                {nextEpisode && (
                  <button
                    onClick={() => navigateToEpisode(nextEpisode)}
                    className="flex items-center gap-1.5 p-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">{t('common.next')}</span>
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{nextEpisode.title}</span>
                    </div>
                    <ChevronRight size={17} className="shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="w-72 shrink-0 hidden lg:block">
            <div className="lg:sticky lg:top-8 space-y-6">
              <EpisodeOutlineSidebar
                episodes={episodes}
                currentEpisodeId={episode.episode_uuid}
                orgslug={orgslug}
                podcastUuid={podcastUuid}
                trailData={trailData}
              />
              <OnThisPageSidebar />
            </div>
          </div>
        </div>

        <div style={{ height: '40px' }}></div>
      </div>
    </GeneralWrapperStyled>
  )
}

// ─── On This Page Sidebar ──────────────────────────────────────────
function OnThisPageSidebar() {
  const { t } = useTranslation()
  const [activeId, setActiveId] = React.useState<string>('')

  const sections = [
    { id: 'episode-player', label: t('podcast.episode.audio_player', 'Audio Player') },
    { id: 'episode-show-notes', label: t('podcast.episode.show_notes', 'Show Notes') },
    { id: 'episode-key-points', label: t('podcast.episode.key_points', 'Key Points') },
    { id: 'episode-transcript', label: t('podcast.episode.transcript', 'Transcript') },
    { id: 'episode-whats-next', label: t('activities.whats_next', 'What\'s Next') },
  ]

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{t('activities.on_this_page', 'On This Page')}</h3>
      </div>
      <div className="px-2 py-2 space-y-0.5">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`w-full text-start px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              activeId === id
                ? 'bg-gray-100 text-gray-900 font-semibold'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-medium'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
