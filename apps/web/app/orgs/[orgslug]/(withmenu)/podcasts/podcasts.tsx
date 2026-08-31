'use client'
import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Headphones, ChevronLeft, ChevronRight } from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { PodcastCard } from '@components/Objects/Thumbnails/PodcastCard'
import PodcastCardShowcase from '@components/Objects/Thumbnails/PodcastCardShowcase'
import { searchMatchesAny } from '@/lib/search/normalize'
import { PodcastWithEpisodeCount } from '@services/podcasts/podcasts'
import FeatureDisabledView from '@components/Dashboard/Shared/FeatureDisabled/FeatureDisabledView'

// Medusa components
import { IconButton } from '@/components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const removePodcastPrefix = (podcast_uuid: string) => podcast_uuid.replace('podcast_', '')

interface PodcastsClientProps {
  orgslug: string
  org_id: number
  initialPodcasts: PodcastWithEpisodeCount[]
}

export default function PodcastsClient({
  orgslug,
  org_id,
  initialPodcasts,
}: PodcastsClientProps) {
  const { t } = useTranslation()
  const allPodcasts = initialPodcasts
  const org = useOrg() as any

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Filter state
  const [filterVisibility, setFilterVisibility] = useState<string>('all')

  // Filter podcasts based on search and visibility
  const filteredPodcasts = useMemo(() => {
    let podcasts = allPodcasts

    // Visibility filter
    if (filterVisibility === 'public') {
      podcasts = podcasts.filter((p: any) => p.public === true)
    } else if (filterVisibility === 'private') {
      podcasts = podcasts.filter((p: any) => p.public === false)
    }

    // Search filter
    if (searchQuery.trim()) {
      podcasts = podcasts.filter((podcast: any) =>
        searchMatchesAny([podcast.name, podcast.description, podcast.tags], searchQuery)
      )
    }

    return podcasts
  }, [allPodcasts, searchQuery, filterVisibility])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Reset to page 1 when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterVisibility])

  // Calculate pagination
  const totalPages = Math.ceil(filteredPodcasts.length / itemsPerPage)
  const paginatedPodcasts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredPodcasts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredPodcasts, currentPage, itemsPerPage])

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getVisiblePageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <FeatureDisabledView
      featureName="podcasts"
      orgslug={orgslug}
      icon={Headphones}
      context="public"
    >
      <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', minHeight: '100dvh' }}>
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold text-ui-fg-base">
            {t('podcasts.podcasts')}
          </h1>
        </div>

        {/* Search + Filter toolbar (only if podcasts exist) */}
        {allPodcasts.length > 0 && (
          <div className="flex items-center gap-3 mb-8">
            {/* Search + results count group (left side) */}
            <div className="flex items-center gap-3">
              {/* Search bar */}
              <div className="relative w-80">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('podcasts.search_placeholder')}
                  className="w-full h-7 pl-8 pr-2 text-sm bg-white shadow-borders-base rounded-md placeholder:text-gray-400 focus:outline-none"
                />
              </div>

              {/* Search results count */}
              {searchQuery && (
                <span className="txt-compact-xsmall text-ui-fg-muted whitespace-nowrap">
                  {t('podcasts.search_results', { count: filteredPodcasts.length, query: searchQuery })}
                </span>
              )}
            </div>

            {/* Spacer pushes filter to the right */}
            <div className="flex-1" />

            {/* Filter — Medusa IconButton + DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label={t('podcasts.filter_podcasts')}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5h10M4.5 7.5h6M6.5 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white min-w-0 w-28">
                <DropdownMenuItem onClick={() => setFilterVisibility('all')}>
                  {t('podcasts.all_podcasts') || 'All Podcasts'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterVisibility('public')}>
                  {t('podcasts.public') || 'Public'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterVisibility('private')}>
                  {t('podcasts.private') || 'Private'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Card design showcase */}
        {allPodcasts.length > 0 && (
          <PodcastCardShowcase podcasts={allPodcasts} />
        )}

        {/* Grid area */}
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedPodcasts.map((podcast: PodcastWithEpisodeCount) => (
              <PodcastCard
                key={podcast.podcast_uuid}
                id={removePodcastPrefix(podcast.podcast_uuid)}
                title={podcast.name}
                description={podcast.description || ''}
                thumbnailImage={podcast.thumbnail_image || ''}
                episodeCount={podcast.episode_count || 0}
                totalDurationSeconds={podcast.total_duration_seconds || 0}
                creationDate={podcast.creation_date || ''}
                org_uuid={org?.org_uuid}
                href={`/orgs/${orgslug}/podcast/${removePodcastPrefix(podcast.podcast_uuid)}`}
              />
            ))}

            {/* Empty state — search with no results */}
            {filteredPodcasts.length === 0 && searchQuery && (
              <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
                <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                  <Headphones className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                  {t('podcasts.no_search_results')}
                </h2>
                <p className="txt-compact-small text-ui-fg-muted">
                  {t('podcasts.try_different_search')}
                </p>
              </div>
            )}

            {/* Empty state — no podcasts at all */}
            {allPodcasts.length === 0 && !searchQuery && (
              <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
                <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                  <Headphones className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
                </div>
                <h1 className="text-xl font-semibold text-ui-fg-base mb-2">
                  {t('podcasts.no_podcasts')}
                </h1>
                <p className="txt-compact-small text-ui-fg-muted mb-6 text-center max-w-xs">
                  {t('podcasts.no_podcasts_description')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-6 pb-0">
            <Button
              variant="transparent"
              size="small"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">{t('pagination.previous')}</span>
            </Button>

            <div className="flex items-center gap-1 mx-2">
              {getVisiblePageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 py-1 txt-compact-small text-ui-fg-muted">...</span>
                  ) : (
                    <button
                      onClick={() => goToPage(page as number)}
                      className={`w-7 h-7 txt-compact-small-plus rounded-md transition-colors ${
                        currentPage === page
                          ? 'bg-ui-bg-base shadow-borders-base text-ui-fg-base'
                          : 'text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-base-hover'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <Button
              variant="transparent"
              size="small"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline mr-1">{t('pagination.next')}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </FeatureDisabledView>
  )
}
