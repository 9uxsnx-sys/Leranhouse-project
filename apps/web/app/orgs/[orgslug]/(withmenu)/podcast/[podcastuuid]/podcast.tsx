'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import EpisodeCard from '@components/Objects/Podcasts/EpisodeCard'
import { Podcast, PodcastEpisode, PodcastMeta } from '@services/podcasts/podcasts'
import { startPodcast } from '@services/podcasts/trail'
import { Headphones, Loader2, Search, Clock, ArrowUpDown, SortAsc, RefreshCw, BookOpen, Award, User, Play } from 'lucide-react'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { getPodcastThumbnailMediaDirectory, getPodcastBannerMediaDirectory } from '@services/media/media'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from 'usehooks-ts'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { swrFetcher } from '@services/utils/ts/requests'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PodcastClientProps {
  orgslug: string
  org_id: number
  podcastUuid: string
  initialPodcast: Podcast
  initialEpisodes: PodcastEpisode[]
}

export default function PodcastClient({
  orgslug,
  org_id,
  podcastUuid,
  initialPodcast,
  initialEpisodes,
}: PodcastClientProps) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { state } = usePodcastPlayer()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'duration'>('recent')

  // SWR key for fetching podcast meta
  const swrKey = `${getAPIUrl()}podcasts/${podcastUuid}/meta`

  // Use SWR for real-time updates
  const { data, error, isLoading, mutate } = useSWR<PodcastMeta>(
    swrKey,
    (url) => swrFetcher(url, access_token),
    {
      fallbackData: { podcast: initialPodcast, episodes: initialEpisodes },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  const podcast = data?.podcast || initialPodcast
  const episodes = data?.episodes || initialEpisodes
  const totalDurationSeconds = episodes.reduce((sum, ep) => sum + (ep.duration_seconds || 0), 0)
  const meta = (podcast as any).extra_metadata || {}

  // ── Trail / Enrollment ──
  const { data: trailData, mutate: mutateTrail } = useSWR(
    access_token && org_id ? `${getAPIUrl()}trail/org/${org_id}/trail` : null,
    (url) => swrFetcher(url, access_token),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const podcastRun = React.useMemo(() => {
    if (!podcast?.podcast_uuid || !trailData?.runs || !Array.isArray(trailData.runs)) return null
    const cleanPodcastUuid = podcast.podcast_uuid.replace('podcast_', '')
    return trailData.runs.find((run: any) => {
      const cleanRunPodcastUuid = run.podcast?.podcast_uuid?.replace('podcast_', '')
      return cleanRunPodcastUuid === cleanPodcastUuid
    }) || null
  }, [podcast, trailData])

  const isEnrolled = !!podcastRun
  const completedEpisodes = podcastRun?.steps?.length || 0
  const totalEpisodes = episodes.length || 0
  const progressPercent = totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0

  // Build episode progress map from trail steps (for partial progress indicators)
  const episodeProgressMap = React.useMemo(() => {
    const map: Record<string, { playback_position: number; duration: number } | null> = {}
    if (podcastRun?.steps) {
      for (const step of podcastRun.steps) {
        if (step.episode_id && step.data) {
          const pos = step.data.playback_position
          const dur = step.data.duration
          if (pos > 0 && dur > 0) {
            map[step.episode_id] = { playback_position: pos, duration: dur }
          }
        }
      }
    }
    return map
  }, [podcastRun])

  const handleGetAccess = async () => {
    try {
      await startPodcast(podcast.podcast_uuid, orgslug, access_token)
      mutateTrail()
    } catch (e) {
      console.error('Failed to start podcast trail', e)
    }
  }

  // Filter and sort episodes
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (ep) =>
          ep.title?.toLowerCase().includes(query) ||
          ep.description?.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
        break
      case 'duration':
        result.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0))
        break
    }

    return result
  }, [episodes, searchQuery, sortBy])

  // Format duration from seconds to human-readable string
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 min'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  // Add padding at bottom when player is visible
  const bottomPadding = state.isVisible ? (state.isMinimized ? 'pb-20' : 'pb-28') : ''

  if (error) {
    return (
      <GeneralWrapperStyled>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-gray-500">Failed to load podcast</p>
        </div>
      </GeneralWrapperStyled>
    )
  }

  return (
    <GeneralWrapperStyled>
      <div className={bottomPadding}>
        {/* ── HERO BANNER IMAGE (centered, constrained) ── */}
        <div className="relative w-full mx-auto max-w-7xl aspect-[3/1] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-gray-100 ring-1 ring-inset ring-black/5">
          {podcast.banner_image ? (
            <img
              src={getPodcastBannerMediaDirectory(org?.org_uuid, podcast?.podcast_uuid, podcast?.banner_image)}
              alt={podcast.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/5 via-white to-indigo-500/10">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center mx-auto">
                  <Headphones className="w-10 h-10 text-indigo-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Layout - Content Left, Sidebar Right */}
        <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
          <div className="flex flex-col lg:flex-row gap-10 justify-between">
            {/* Main Content - Episodes Feed */}
            <div className="flex-1 min-w-0 max-w-3xl space-y-8">
              {/* ── PODCAST TITLE + STATS ── */}
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-ui-fg-base leading-tight">{podcast.name}</h1>
                {podcast.description && (
                  <p className="text-base text-ui-fg-subtle mt-2 leading-relaxed">
                    {podcast.description}
                  </p>
                )}
                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Badge variant="grey" className="flex items-center gap-1">
                    <Headphones size={12} />
                    {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}
                  </Badge>
                  <Badge variant="grey" className="flex items-center gap-1">
                    <Clock size={12} />
                    {meta.total_duration
                      ? `${meta.total_duration} min`
                      : formatDuration(totalDurationSeconds)}
                  </Badge>
                  {podcast.authors?.length > 0 && (
                    <Badge variant="grey" className="flex items-center gap-1">
                      <User size={12} />
                      {podcast.authors.length} {podcast.authors.length === 1 ? 'host' : 'hosts'}
                    </Badge>
                  )}
                  <Badge variant="grey" className="flex items-center gap-1">
                    <Award size={12} />
                    Premium
                  </Badge>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative w-80">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('podcasts.search_placeholder') || 'Search episodes...'}
                    className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
                  />
                </div>

                {/* Results count */}
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {filteredEpisodes.length} {filteredEpisodes.length === 1 ? 'episode' : 'episodes'}
                </span>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Loading spinner */}
                {isLoading && (
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                )}

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label="Sort episodes">
                      <SortAsc size={15} />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white min-w-0 w-40 p-2">
                    <DropdownMenuItem onClick={() => setSortBy('recent')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                      <Clock size={14} className="text-gray-500" />
                      <span className="text-gray-700">Latest</span>
                      {sortBy === 'recent' && <span className="ml-auto text-gray-400">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('oldest')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                      <Clock size={14} className="text-gray-500" />
                      <span className="text-gray-700">Oldest</span>
                      {sortBy === 'oldest' && <span className="ml-auto text-gray-400">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('duration')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                      <ArrowUpDown size={14} className="text-gray-500" />
                      <span className="text-gray-700">Duration</span>
                      {sortBy === 'duration' && <span className="ml-auto text-gray-400">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Episodes List */}
              {filteredEpisodes.length > 0 ? (
                <div className="space-y-3">
                  {filteredEpisodes.map((episode) => (
                    <EpisodeCard
                      key={episode.episode_uuid}
                      episode={episode}
                      podcast={podcast}
                      savedProgress={episodeProgressMap[episode.id]}
                    />
                  ))}
                </div>
              ) : episodes.length === 0 ? (
                <div className="text-center py-12">
                  <Headphones size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">{t('podcasts.no_episodes')}</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No episodes match your search</p>
                </div>
              )}
            </div>

            {/* Right Sidebar - Podcast Info (Desktop only) */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0">
              <div className="lg:sticky lg:top-8 space-y-4">

                {/* ── SIDEBAR 1: In Progress / Get Access ── */}
                {isEnrolled ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">In Progress</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{progressPercent}% Complete</span>
                      <span className="text-sm text-gray-500">{completedEpisodes}/{totalEpisodes}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <Link href={getUriWithOrg(orgslug, `/podcast/${podcastUuid}`)} className="block w-full mt-4">
                      <Button variant="primary" size="large" className="w-full">
                        <Play size={16} className="mr-1.5" />
                        Continue Listening
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-4">Get Access</h3>
                    <p className="text-sm text-gray-500 mb-2 leading-snug">
                      Get access to all episodes and updates
                    </p>
                    <Button variant="primary" size="large" className="w-full" onClick={handleGetAccess}>
                      Get Access
                    </Button>
                  </div>
                )}

                {/* ── SIDEBAR 2: Podcast Stats ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">This Podcast Includes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Headphones size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600">{episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600">
                        {meta.total_duration
                          ? `${meta.total_duration} min total`
                          : formatDuration(totalDurationSeconds) + ' total'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600">{podcast.authors?.length || 0} {podcast.authors?.length === 1 ? 'host' : 'hosts'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600">Premium content</span>
                    </div>
                  </div>
                </div>

                {/* ── SIDEBAR 3: Host ── */}
                {(podcast.authors && podcast.authors.length > 0) || (meta.hosts && meta.hosts.length > 0) ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Hosted by</h3>
                    <div className="space-y-3">
                      {meta.hosts && meta.hosts.length > 0 ? (
                        meta.hosts.map((host: any, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                              {host.avatar ? (
                                <img src={host.avatar} alt={host.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <User size={14} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{host.name}</p>
                              {host.title && <p className="text-xs text-gray-500">{host.title}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        podcast.authors && podcast.authors.map((author: any, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                              {author.user.avatar_image ? (
                                <img
                                  src={author.user.avatar_image}
                                  alt={`${author.user.first_name} ${author.user.last_name}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <User size={14} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {author.user.first_name} {author.user.last_name}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {author.authorship === 'CREATOR' ? 'Host' : author.authorship.toLowerCase()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {/* ── SIDEBAR 4: Updates ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Updates</h3>
                  <div className="flex items-center gap-3">
                    <RefreshCw size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">
                      Last updated {podcast.update_date ? new Date(podcast.update_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* ── SIDEBAR 5: Community ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">Community</h3>
                  <p className="text-sm text-gray-600">
                    This podcast includes access to a dedicated community where you can discuss, ask questions, and learn together with fellow listeners.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Bottom padding for mobile action bar */}
        {isMobile && <div className="h-4" />}
      </div>
    </GeneralWrapperStyled>
  )
}
