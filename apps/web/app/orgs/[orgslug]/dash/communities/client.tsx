'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, MessagesSquare, Trash2, X, ChevronLeft, ChevronRight, CheckSquare, ListChecks } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { Community, deleteCommunity } from '@services/communities/communities'
import { CreateCommunityModal } from '@components/Objects/Modals/Communities/CreateCommunityModal'
import { EditCommunityModal } from '@components/Objects/Modals/Communities/EditCommunityModal'
import { CommunityCard } from '@components/Objects/Thumbnails/CommunityCard'
import AuthenticatedClientElement from '@components/Security/AuthenticatedClientElement'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import FeatureDisabledView from '@components/Dashboard/Shared/FeatureDisabled/FeatureDisabledView'
import { usePlan } from '@components/Hooks/usePlan'
import { searchMatchesAny } from '@/lib/search/normalize'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import toast from 'react-hot-toast'

import { IconButton } from '@/components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface CommunitiesDashClientProps {
  org_id: number
  orgslug: string
  communities: Community[]
}

type FilterMode = 'all' | 'newest' | 'course' | 'general'

const removeCommunityPrefix = (uuid: string) => uuid.replace('community_', '')

const CommunitiesDashClient = ({
  org_id,
  orgslug,
  communities,
}: CommunitiesDashClientProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const org = useOrg() as any
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const currentPlan = usePlan()
  const org_uuid = org?.org_uuid

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all')
  const [selectedCommunities, setSelectedCommunities] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  const filterLabel = useMemo(() => {
    switch (activeFilter) {
      case 'all': return 'All'
      case 'newest': return 'Newest'
      case 'course': return 'Course'
      case 'general': return 'General'
    }
  }, [activeFilter])

  const filteredCommunities = useMemo(() => {
    let items = communities

    switch (activeFilter) {
      case 'course':
        items = items.filter((c) => c.course_id != null)
        break
      case 'general':
        items = items.filter((c) => c.course_id == null)
        break
      case 'newest':
        items = [...items].sort((a, b) =>
          new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime()
        )
        break
    }

    if (searchQuery.trim()) {
      items = items.filter((c) =>
        searchMatchesAny([c.name, c.description], searchQuery)
      )
    }

    return items
  }, [communities, searchQuery, activeFilter])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilter])

  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage)
  const paginatedCommunities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCommunities.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCommunities, currentPage, itemsPerPage])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setSelectedCommunities(new Set())
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

  const toggleSelection = (communityUuid: string) => {
    const newSelection = new Set(selectedCommunities)
    if (newSelection.has(communityUuid)) {
      newSelection.delete(communityUuid)
    } else {
      newSelection.add(communityUuid)
    }
    setSelectedCommunities(newSelection)
  }

  const selectAll = () => {
    const allUuids = paginatedCommunities.map((c) => c.community_uuid)
    setSelectedCommunities(new Set(allUuids))
  }

  const clearSelection = () => {
    setSelectedCommunities(new Set())
  }

  const bulkDeleteCommunities = async () => {
    const toastId = toast.loading(`Deleting ${selectedCommunities.size} communities...`)
    let successCount = 0
    let errorCount = 0

    for (const communityUuid of selectedCommunities) {
      try {
        await deleteCommunity(communityUuid, access_token)
        successCount++
      } catch (error) {
        errorCount++
      }
    }

    toast.dismiss(toastId)
    if (errorCount === 0) {
      toast.success(`${successCount} communities deleted`)
    } else {
      toast.error(`${successCount} deleted, ${errorCount} failed`)
    }

    clearSelection()
  }

  return (
    <PlanRestrictedFeature
      currentPlan={currentPlan}
      requiredPlan="standard"
      icon={MessagesSquare}
      titleKey="common.plans.feature_restricted.communities.title"
      descriptionKey="common.plans.feature_restricted.communities.description"
      fullScreen
    >
    <FeatureDisabledView featureName="communities" orgslug={orgslug} context="dashboard">
    <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', minHeight: '100dvh' }}>
      <h1 className="text-[28px] font-semibold text-ui-fg-base mb-6">
        {t('dashboard.courses.communities.title')}
      </h1>

      {communities.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search communities..."
                className="w-full h-7 pl-8 pr-2 text-sm bg-white shadow-borders-base rounded-md placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            {searchQuery && (
              <span className="txt-compact-xsmall text-ui-fg-muted whitespace-nowrap">
                {filteredCommunities.length} result{filteredCommunities.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>

          <div className="flex-1" />

          <AuthenticatedClientElement
            checkMethod="roles"
            action="create"
            ressourceType="communities"
            orgId={org_id}
          >
            <Button
              variant="primary"
              size="small"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +&nbsp;New
            </Button>
          </AuthenticatedClientElement>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              className="gap-x-1.5"
              onClick={() => { setIsSelectMode(prev => !prev); if (isSelectMode) clearSelection(); }}
            >
              <ListChecks size={14} />
              <span>{isSelectMode ? 'Cancel' : 'Select'}</span>
            </Button>

            {selectedCommunities.size > 0 && (
              <ConfirmationModal
                confirmationButtonText="Delete"
                confirmationMessage={`Are you sure you want to delete ${selectedCommunities.size} communities?`}
                dialogTitle="Delete Communities"
                dialogTrigger={
                  <Button variant="secondary" size="small" className="gap-x-1.5 text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 size={14} />
                    <span>Delete {selectedCommunities.size}</span>
                  </Button>
                }
                functionToExecute={bulkDeleteCommunities}
                status="warning"
              />
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="small" className="gap-x-1.5">
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5h10M4.5 7.5h6M6.5 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{filterLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white min-w-0 w-40">
              <DropdownMenuItem onSelect={() => setActiveFilter('all')} className="flex items-center justify-between">
                <span>All Communities</span>
                {activeFilter === 'all' && <CheckSquare size={12} className="text-gray-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('newest')} className="flex items-center justify-between">
                <span>Newest</span>
                {activeFilter === 'newest' && <CheckSquare size={12} className="text-gray-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('course')} className="flex items-center justify-between">
                <span>Course Communities</span>
                {activeFilter === 'course' && <CheckSquare size={12} className="text-gray-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('general')} className="flex items-center justify-between">
                <span>General</span>
                {activeFilter === 'general' && <CheckSquare size={12} className="text-gray-500" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedCommunities.map((community) => {
            const communityId = removeCommunityPrefix(community.community_uuid)
            const isSelected = selectedCommunities.has(community.community_uuid)

            return (
              <div
                key={community.community_uuid}
                className="relative"
                onClick={() => isSelectMode && toggleSelection(community.community_uuid)}
              >
                {isSelectMode && (
                  <label className="absolute top-2 left-2 z-10 w-5 h-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(community.community_uuid)}
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
                <CommunityCard
                  id={communityId}
                  title={community.name}
                  description={community.description || ''}
                  org_uuid={org_uuid}
                  community_uuid={community.community_uuid}
                  course_id={community.course_id}
                  public={community.public || false}
                  creation_date={community.creation_date || ''}
                  thumbnail_image={community.thumbnail_image}
                  href={`/orgs/${orgslug}/dash/communities/${community.community_uuid}/general`}
                />
              </div>
            )
          })}

          {filteredCommunities.length === 0 && searchQuery && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <MessagesSquare className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                No communities found
              </h2>
              <p className="txt-compact-small text-ui-fg-muted">
                Try a different search term
              </p>
            </div>
          )}

          {filteredCommunities.length === 0 && !searchQuery && activeFilter !== 'all' && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <MessagesSquare className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
                No {filterLabel.toLowerCase()} communities
              </h2>
              <p className="txt-compact-small text-ui-fg-muted">
                Try a different filter
              </p>
            </div>
          )}

          {communities.length === 0 && !searchQuery && (
            <div className="col-span-full flex flex-col justify-center items-center py-16 px-4">
              <div className="p-4 bg-ui-bg-base rounded-full shadow-borders-base mb-4">
                <Users className="w-8 h-8 text-ui-fg-muted" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-semibold text-ui-fg-base mb-2">
                No communities yet
              </h1>
              <p className="txt-compact-small text-ui-fg-muted mb-6 text-center max-w-xs">
                Communities will appear here once they are created
              </p>
              <AuthenticatedClientElement
                action="create"
                ressourceType="communities"
                checkMethod="roles"
                orgId={org_id}
              >
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  +&nbsp;New
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
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
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
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        orgId={org_id}
        orgSlug={orgslug}
      />

      {editingCommunity && (
        <EditCommunityModal
          isOpen={!!editingCommunity}
          onClose={() => setEditingCommunity(null)}
          community={editingCommunity}
          orgSlug={orgslug}
        />
      )}
    </div>
    </FeatureDisabledView>
    </PlanRestrictedFeature>
  )
}

export default CommunitiesDashClient
