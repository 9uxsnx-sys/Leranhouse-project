'use client'

import React, { useState, useMemo } from 'react'
import useSWR from 'swr'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import { PodcastSidebar } from '@components/Objects/Podcasts/PodcastSidebar'
import EpisodeCard from '@components/Objects/Podcasts/EpisodeCard'
import { Podcast, PodcastEpisode, PodcastMeta } from '@services/podcasts/podcasts'
import { Headphones, Loader2, Search, Clock, ArrowUpDown, SortAsc } from 'lucide-react'
import { getAPIUrl } from '@services/config/config'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from 'usehooks-ts'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { swrFetcher } from '@services/utils/ts/requests'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'

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
        {/* Layout - Content Left, Sidebar Right */}
        <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
          <div className="flex flex-col lg:flex-row gap-10 justify-between">
            {/* Main Content - Episodes Feed */}
            <div className="flex-1 min-w-0 max-w-3xl space-y-8">
              {/* Mobile header */}
              <div className="md:hidden">
                <h1 className="text-xl font-bold text-gray-900">{podcast.name}</h1>
                {podcast.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {podcast.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Headphones size={16} />
                  <span>
                    {episodes.length}{' '}
                    {episodes.length === 1 ? 'episode' : 'episodes'}
                  </span>
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
              <div className="bg-white nice-shadow rounded-lg overflow-hidden">
                {/* Episode list */}
                {filteredEpisodes.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredEpisodes.map((episode) => (
                      <EpisodeCard
                        key={episode.episode_uuid}
                        episode={episode}
                        podcast={podcast}
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
            </div>

            {/* Right Sidebar - Podcast Info (Desktop only) */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0">
              <div className="lg:sticky lg:top-8 space-y-4">
                <PodcastSidebar podcast={podcast} />
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
