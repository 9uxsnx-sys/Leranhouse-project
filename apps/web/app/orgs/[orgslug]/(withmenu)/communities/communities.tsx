'use client'
import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ChevronLeft, ChevronRight, MessagesSquare, Users, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { CommunityCard } from '@components/Objects/Thumbnails/CommunityCard'
import { searchMatchesAny } from '@/lib/search/normalize'
import { Community, deleteCommunity } from '@services/communities/communities'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import AuthenticatedClientElement from '@components/Security/AuthenticatedClientElement'
import FeatureDisabledView from '@components/Dashboard/Shared/FeatureDisabled/FeatureDisabledView'
import { CreateCommunityModal } from '@components/Objects/Modals/Communities/CreateCommunityModal'
import { EditCommunityModal } from '@components/Objects/Modals/Communities/EditCommunityModal'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import { revalidateTags } from '@services/utils/ts/requests'

// Medusa components
import { IconButton } from '@/components/ui/icon-button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface CommunitiesClientProps {
  communities: Community[]
  orgslug: string
  org_id: number
}

type FilterMode = 'all' | 'newest' | 'course' | 'general'

const removeCommunityPrefix = (uuid: string) => uuid.replace('community_', '')

function CommunitiesClient(props: CommunitiesClientProps) {
  const { t } = useTranslation()
  const orgslug = props.orgslug
  const allCommunities = props.communities
  const org = useOrg() as any
  const org_uuid = org?.org_uuid
  const session = useLHSession() as any

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null)

  const handleDeleteCommunity = async (community_uuid: string) => {
    const access_token = session?.data?.tokens?.access_token
    if (!access_token) return
    await deleteCommunity(community_uuid, access_token)
    await revalidateTags(['communities'], orgslug)
    window.location.reload()
  }

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all')

  // Filter label for display
  const filterLabel = useMemo(() => {
    switch (activeFilter) {
      case 'all': return 'All Communities'
      case 'newest': return 'Newest'
      case 'course': return 'Course Communities'
      case 'general': return 'General'
    }
  }, [activeFilter])

  // Filter + search communities
  const filteredCommunities = useMemo(() => {
    let communities = allCommunities

    // Apply filter
    switch (activeFilter) {
      case 'course':
        communities = communities.filter((c: any) => c.course_id != null)
        break
      case 'general':
        communities = communities.filter((c: any) => c.course_id == null)
        break
      case 'newest':
        communities = [...communities].sort((a: any, b: any) =>
          new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime()
        )
        break
      case 'all':
      default:
        break
    }

    // Apply search
    if (searchQuery.trim()) {
      communities = communities.filter((c: any) =>
        searchMatchesAny([c.name, c.description], searchQuery)
      )
    }

    return communities
  }, [allCommunities, searchQuery, activeFilter])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Reset to page 1 when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilter])

  // Calculate pagination
  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage)
  const paginatedCommunities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCommunities.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCommunities, currentPage, itemsPerPage])

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
    <>
    <FeatureDisabledView featureName="communities" orgslug={orgslug} context="public">
    <div className="pt-8 px-6 pb-0" style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', minHeight: '100dvh' }}>
      {/* Page title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-semibold text-ui-fg-base">
          {t('communities.title') || 'Communities'}
        </h1>
        <AuthenticatedClientElement action="create" ressourceType="communities" orgId={props.org_id} checkMethod="roles">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + {t('communities.new_community') || 'New Community'}
          </button>
        </AuthenticatedClientElement>
      </div>

      {/* Search + Filter toolbar (only if communities exist) */}
      {allCommunities.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          {/* Search + results count group (left side) */}
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('communities.search_communities') || 'Search communities...'}
                className="w-full h-7 pl-8 pr-2 text-sm bg-white shadow-borders-base rounded-md placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            {searchQuery && (
              <span className="txt-compact-xsmall text-ui-fg-muted whitespace-nowrap">
                {filteredCommunities.length} result{filteredCommunities.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>

          {/* Spacer pushes filter to the right */}
          <div className="flex-1" />

          {/* Filter — Medusa IconButton + DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base" aria-label="Filter communities">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5h10M4.5 7.5h6M6.5 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white min-w-0 w-44">
              <DropdownMenuItem onSelect={() => setActiveFilter('all')}>
                {activeFilter === 'all' && <span className="absolute left-2">✓</span>}
                <span className={activeFilter === 'all' ? 'ml-5' : 'ml-5'}>All Communities</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('newest')}>
                {activeFilter === 'newest' && <span className="absolute left-2">✓</span>}
                <span className={activeFilter === 'newest' ? 'ml-5' : 'ml-5'}>Newest</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('course')}>
                {activeFilter === 'course' && <span className="absolute left-2">✓</span>}
                <span className={activeFilter === 'course' ? 'ml-5' : 'ml-5'}>Course Communities</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('general')}>
                {activeFilter === 'general' && <span className="absolute left-2">✓</span>}
                <span className={activeFilter === 'general' ? 'ml-5' : 'ml-5'}>General</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Grid area */}
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedCommunities.map((community: any) => (
            <div key={community.community_uuid} className="relative group">
              <CommunityCard
                id={removeCommunityPrefix(community.community_uuid)}
                title={community.name}
                description={community.description || ''}
                org_uuid={org_uuid}
                community_uuid={community.community_uuid}
                course_id={community.course_id}
                public={community.public || false}
                creation_date={community.creation_date || ''}
                thumbnail_image={community.thumbnail_image}
                href={`/orgs/${orgslug}/community/${removeCommunityPrefix(community.community_uuid)}`}
              />
              <AuthenticatedClientElement action="update" ressourceType="communities" orgId={props.org_id} checkMethod="roles">
                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button aria-label="Community actions" className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md">
                        <MoreVertical size={18} className="text-gray-700" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white">
                      <DropdownMenuItem asChild>
                        <button
                          onClick={() => setEditingCommunity(community)}
                          className="w-full text-left flex items-center px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <Edit className="mr-2 h-4 w-4" /> {t('communities.edit') || 'Edit'}
                        </button>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <ConfirmationModal
                          confirmationMessage={t('communities.delete_confirmation') || 'Are you sure you want to delete this community?'}
                          confirmationButtonText={t('communities.delete') || 'Delete'}
                          dialogTitle={t('communities.delete_title') || 'Delete Community'}
                          dialogTrigger={
                            <button className="w-full text-left flex items-center px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                              <Trash2 className="mr-2 h-4 w-4" /> {t('communities.delete') || 'Delete'}
                            </button>
                          }
                          functionToExecute={() => handleDeleteCommunity(community.community_uuid)}
                          status="warning"
                        />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </AuthenticatedClientElement>
            </div>
          ))}

          {/* Empty state — search with no results */}
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

          {/* Empty state — filter with no results */}
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

          {/* Empty state — no communities at all */}
          {allCommunities.length === 0 && !searchQuery && (
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
    </div>
    </FeatureDisabledView>

    {/* Create Community Modal */}
    <CreateCommunityModal
      isOpen={createModalOpen}
      onClose={() => setCreateModalOpen(false)}
      orgId={props.org_id}
      orgSlug={orgslug}
    />

    {/* Edit Community Modal */}
    {editingCommunity && (
      <EditCommunityModal
        isOpen={!!editingCommunity}
        onClose={() => setEditingCommunity(null)}
        community={editingCommunity}
        orgSlug={orgslug}
      />
    )}
    </>
  )
}

export default CommunitiesClient
