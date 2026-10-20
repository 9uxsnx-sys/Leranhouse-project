'use client'

import React, { useState, useMemo } from 'react'
import { Headphones, Mic2, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionRow, ActionRowSearch, ActionRowSpacer, ActionRowActions } from '@components/ui/action-row'
import { ConceptIcon } from '@components/ui/icons'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { PodcastWithEpisodeCount, deletePodcast, removePodcastPrefix } from '@services/podcasts/podcasts'
import { CreatePodcastModal } from '@components/Objects/Modals/Podcasts/CreatePodcastModal'
import { PodcastCard } from '@components/Objects/Thumbnails/PodcastCard'
import { AdminEditOptions } from '@components/Objects/Thumbnails/PodcastThumbnail'
import AuthenticatedClientElement from '@components/Security/AuthenticatedClientElement'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import FeatureDisabledView from '@components/Dashboard/Shared/FeatureDisabled/FeatureDisabledView'
import { usePlan } from '@components/Hooks/usePlan'
import { searchMatchesAny } from '@/lib/search/normalize'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { swrFetcher } from '@services/utils/ts/requests'
import { getAPIUrl } from '@services/config/config'
import { Button } from '@/components/ui/button'
import { IconButton } from '@components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface PodcastsDashClientProps {
  org_id: number
  orgslug: string
  podcasts: PodcastWithEpisodeCount[]
}

type FilterMode = 'all' | 'published' | 'unpublished'

const PodcastsDashClient = ({
  org_id,
  orgslug,
  podcasts,
}: PodcastsDashClientProps) => {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const currentPlan = usePlan()

  // SWR refetch
  const podcastsListUrl = `${getAPIUrl()}podcasts/org_slug/${orgslug}/page/1/limit/100?include_unpublished=true`
  const { data: swrPodcasts, mutate: mutatePodcasts } = useSWR(
    podcastsListUrl,
    (url) => swrFetcher(url, access_token),
    { fallbackData: podcasts, revalidateOnMount: false }
  )
  const effectivePodcasts = swrPodcasts || podcasts

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all')
  const [selectedPodcasts, setSelectedPodcasts] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  const filterLabel = useMemo(() => {
    switch (activeFilter) {
      case 'all': return 'All'
      case 'published': return 'Published'
      case 'unpublished': return 'Unpublished'
    }
  }, [activeFilter])

  const filteredPodcasts = useMemo(() => {
    let items = effectivePodcasts

    switch (activeFilter) {
      case 'published':
        items = items.filter((p) => p.published)
        break
      case 'unpublished':
        items = items.filter((p) => !p.published)
        break
    }

    if (searchQuery.trim()) {
      items = items.filter((p) =>
        searchMatchesAny([p.name, p.description, p.tags], searchQuery)
      )
    }

    return items
  }, [effectivePodcasts, searchQuery, activeFilter])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilter])

  const totalPages = Math.ceil(filteredPodcasts.length / itemsPerPage)
  const paginatedPodcasts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredPodcasts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredPodcasts, currentPage, itemsPerPage])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setSelectedPodcasts(new Set())
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

  const toggleSelection = (podcastUuid: string) => {
    const newSelection = new Set(selectedPodcasts)
    if (newSelection.has(podcastUuid)) {
      newSelection.delete(podcastUuid)
    } else {
      newSelection.add(podcastUuid)
    }
    setSelectedPodcasts(newSelection)
  }

  const clearSelection = () => {
    setSelectedPodcasts(new Set())
  }

  const bulkDeletePodcasts = async () => {
    const toastId = toast.loading(`Deleting ${selectedPodcasts.size} podcasts...`)
    let successCount = 0
    let errorCount = 0

    for (const podcastUuid of selectedPodcasts) {
      try {
        await deletePodcast(podcastUuid, access_token)
        successCount++
      } catch (error) {
        errorCount++
      }
    }

    toast.dismiss(toastId)
    if (errorCount === 0) {
      toast.success(`${successCount} podcasts deleted`)
    } else {
      toast.error(`${successCount} deleted, ${errorCount} failed`)
    }

    clearSelection()
    mutatePodcasts()
  }

  return (
    <PlanRestrictedFeature
      currentPlan={currentPlan}
      requiredPlan="standard"
      icon={Headphones}
      titleKey="common.plans.feature_restricted.podcasts.title"
      descriptionKey="common.plans.feature_restricted.podcasts.description"
      fullScreen
    >
    <FeatureDisabledView featureName="podcasts" orgslug={orgslug} context="dashboard">
    <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', minHeight: '100dvh' }}>
      <h1 className="text-[28px] font-semibold text-ui-fg-base mb-6">
        {t('podcasts.podcasts')}
      </h1>

      {effectivePodcasts.length > 0 && (
        <ActionRow>
          <ActionRowSearch
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder={t('podcasts.search_placeholder')}
            summary={
              searchQuery
                ? `${filteredPodcasts.length} result${filteredPodcasts.length !== 1 ? 's' : ''} for “${searchQuery}”`
                : undefined
            }
          />

          <ActionRowSpacer />

          <AuthenticatedClientElement
            checkMethod="roles"
            action="create"
            ressourceType="podcasts"
            orgId={org_id}
          >
            <Button
              variant="primary"
              size="small"
              className="gap-x-1.5"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <ConceptIcon.add size={14} />
              {t('podcasts.new_podcast')}
            </Button>
          </AuthenticatedClientElement>

          <ActionRowActions>
            <Button
              variant="secondary"
              size="small"
              className="gap-x-1.5"
              onClick={() => { setIsSelectMode(prev => !prev); if (isSelectMode) clearSelection(); }}
            >
              <ListChecks size={14} />
              <span>{isSelectMode ? t('cancel') : t('podcasts.select_podcasts')}</span>
            </Button>

            {selectedPodcasts.size > 0 && (
              <ConfirmationModal
                confirmationButtonText="Delete"
                confirmationMessage={`Are you sure you want to delete ${selectedPodcasts.size} podcasts?`}
                dialogTitle="Delete Podcasts"
                dialogTrigger={
                  <Button variant="secondary" size="small" className="gap-x-1.5 text-red-600 border-red-200 hover:bg-red-50">
                    <ConceptIcon.delete size={14} />
                    <span>Delete {selectedPodcasts.size}</span>
                  </Button>
                }
                functionToExecute={bulkDeletePodcasts}
                status="warning"
              />
            )}
          </ActionRowActions>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                size="small"
                variant="transparent"
                className="bg-white hover:bg-gray-50 shadow-borders-base"
                aria-label={t('common.filter')}
              >
                <ConceptIcon.filter size={14} />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white min-w-0 w-40">
              <DropdownMenuItem onSelect={() => setActiveFilter('all')} className="flex items-center justify-between">
                <span>{t('podcasts.all_podcasts')}</span>
                {activeFilter === 'all' && <ConceptIcon.check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('published')} className="flex items-center justify-between">
                <span>{t('podcasts.published')}</span>
                {activeFilter === 'published' && <ConceptIcon.check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('unpublished')} className="flex items-center justify-between">
                <span>{t('podcasts.unpublished')}</span>
                {activeFilter === 'unpublished' && <ConceptIcon.check size={12} className="text-gray-500" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ActionRow>
      )}

      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {paginatedPodcasts.map((podcast) => {
            const isSelected = selectedPodcasts.has(podcast.podcast_uuid)

            return (
              <div
                key={podcast.podcast_uuid}
                className="relative group"
                onClick={() => isSelectMode && toggleSelection(podcast.podcast_uuid)}
              >
                {isSelectMode && (
                  <label className="absolute top-2 left-2 z-20 w-5 h-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(podcast.podcast_uuid)}
                      onClick={(e) => e.stopPropagation()}
                      className="sr-only peer"
                    />
                    <div className="w-full h-full rounded-md border border-gray-300 bg-white peer-checked:bg-gray-500 peer-checked:border-gray-500 flex items-center justify-center transition-all duration-200 shadow-sm peer-hover:border-gray-400 peer-checked:shadow-md">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="scale-0 peer-checked:scale-100 transition-transform duration-200">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </label>
                )}
                <PodcastCard
                  id={removePodcastPrefix(podcast.podcast_uuid)}
                  title={podcast.name}
                  description={podcast.description || ''}
                  thumbnailImage={podcast.thumbnail_image || ''}
                  episodeCount={podcast.episode_count || 0}
                  totalDurationSeconds={podcast.total_duration_seconds || 0}
                  creationDate={podcast.creation_date || ''}
                  org_uuid={org?.org_uuid}
                  href={`/orgs/${orgslug}/dash/podcasts/podcast/${removePodcastPrefix(podcast.podcast_uuid)}/general`}
                />
                <AdminEditOptions
                  podcast={podcast}
                  orgSlug={orgslug}
                  isDashboard={true}
                  deletePodcast={async () => {
                    await deletePodcast(podcast.podcast_uuid, access_token)
                    mutatePodcasts()
                  }}
                />
              </div>
            )
          })}

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

          {filteredPodcasts.length === 0 && !searchQuery && activeFilter !== 'all' && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <Headphones className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                No {filterLabel.toLowerCase()} podcasts
              </h2>
              <p className="txt-compact-small text-ui-fg-muted">
                Try a different filter
              </p>
            </div>
          )}

          {effectivePodcasts.length === 0 && !searchQuery && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <Mic2 className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-semibold text-ui-fg-base mb-2">
                {t('podcasts.no_podcasts')}
              </h1>
              <p className="txt-compact-small text-ui-fg-muted mb-6 text-center max-w-xs">
                {t('podcasts.no_podcasts_description')}
              </p>
              <AuthenticatedClientElement
                action="create"
                ressourceType="podcasts"
                checkMethod="roles"
                orgId={org_id}
              >
                <Button
                  variant="primary"
                  size="small"
                  className="gap-x-1.5"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <ConceptIcon.add size={14} />
                  {t('podcasts.new_podcast')}
                </Button>
              </AuthenticatedClientElement>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-6 pb-8">
          <Button
            variant="transparent"
            size="small"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            <span className="hidden sm:inline ms-1">{t('pagination.previous')}</span>
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
            <span className="hidden sm:inline me-1">{t('pagination.next')}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </div>
      )}

      <CreatePodcastModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        orgId={org_id}
        orgSlug={orgslug}
      />
    </div>
    </FeatureDisabledView>
    </PlanRestrictedFeature>
  )
}

export default PodcastsDashClient
