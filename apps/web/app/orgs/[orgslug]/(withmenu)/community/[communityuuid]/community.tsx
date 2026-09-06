'use client'

import React, { useState } from 'react'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import { CommunitySidebar } from '@components/Objects/Communities/CommunitySidebar'
import { CommunityActionsMobile } from '@components/Objects/Communities/CommunityActionsMobile'
import { DiscussionList } from '@components/Objects/Communities/DiscussionList'
import { CreateDiscussionModal } from '@components/Objects/Modals/Communities/CreateDiscussionModal'
import { Community } from '@services/communities/communities'
import { DiscussionWithAuthor, DiscussionSortBy, DISCUSSION_LABELS } from '@services/communities/discussions'
import { useMediaQuery } from 'usehooks-ts'
import { Search, Clock, Flame, TrendingUp, HelpCircle, Lightbulb, Megaphone, Star, MessageSquare, CheckSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { useCommunityRights } from '@components/Hooks/useCommunityRights'
import { useOrgMembership } from '@components/Contexts/OrgContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface CommunityClientProps {
  community: Community
  initialDiscussions: DiscussionWithAuthor[]
  orgslug: string
  org_id: number
}

const CommunityClient = ({
  community,
  initialDiscussions,
  orgslug,
  org_id,
}: CommunityClientProps) => {
  const { t } = useTranslation()
  const [isCreateDiscussionModalOpen, setIsCreateDiscussionModalOpen] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<DiscussionSortBy>('recent')
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [discussionCount, setDiscussionCount] = useState(0)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { canManageCommunity, canCreateDiscussion: hasCreatePermission } = useCommunityRights(community.community_uuid)
  const { isUserPartOfTheOrg } = useOrgMembership()
  const canCreateDiscussion = hasCreatePermission && isUserPartOfTheOrg

  return (
    <>
      <GeneralWrapperStyled>
        {/* Forum Layout - Content Left, Sidebar Right */}
        <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
          <div className="flex flex-col lg:flex-row gap-10 justify-between">
          {/* Main Content - Discussions Feed */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-8">
            {/* Mobile only shows community name */}
            <div className="md:hidden mb-4">
              <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
              {community.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {community.description}
                </p>
              )}
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3 mb-4">
              {/* Search Bar */}
              <div className="relative w-80">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('communities.discussion_list.search_placeholder')}
                  className="w-full h-7 pl-8 pr-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
                />
              </div>

              {/* Results count */}
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {discussionCount} {discussionCount === 1 ? t('communities.discussion') : t('communities.discussions')}
              </span>

              {/* Spacer pushes actions to the right */}
              <div className="flex-1" />

              {/* New Discussion Button */}
              {canCreateDiscussion && !isSelectMode && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setIsCreateDiscussionModalOpen(true)}
                  className="gap-x-1.5"
                >
                  +&nbsp;&nbsp;New
                </Button>
              )}

              {/* Select Mode Button */}
              {canManageCommunity && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setIsSelectMode(!isSelectMode)}
                  className="gap-1.5"
                >
                  <CheckSquare size={14} strokeWidth={2.5} />
                  <span className="font-semibold">{isSelectMode ? t('communities.discussion_list.cancel') : t('communities.discussion_list.select')}</span>
                </Button>
              )}

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base relative" aria-label="Filter discussions">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5h10M4.5 7.5h6M6.5 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {(sortBy !== 'recent' || selectedLabel !== null) && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
                    )}
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white min-w-0 w-44 p-2">
                  <DropdownMenuItem onClick={() => setSortBy('recent')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                    <span className="text-gray-500"><Clock size={14} /></span>
                    <span className="text-gray-700">Latest</span>
                    {sortBy === 'recent' && <CheckSquare size={12} className="ml-auto text-gray-500 shrink-0" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('upvotes')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                    <span className="text-gray-500"><TrendingUp size={14} /></span>
                    <span className="text-gray-700">Top</span>
                    {sortBy === 'upvotes' && <CheckSquare size={12} className="ml-auto text-gray-500 shrink-0" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('hot')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                    <span className="text-gray-500"><Flame size={14} /></span>
                    <span className="text-gray-700">Hot</span>
                    {sortBy === 'hot' && <CheckSquare size={12} className="ml-auto text-gray-500 shrink-0" />}
                  </DropdownMenuItem>

                  <div className="border-t border-gray-200 my-1" />

                  <DropdownMenuItem onClick={() => setSelectedLabel(null)} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                    <span className="text-gray-500"><MessageSquare size={14} /></span>
                    <span className="text-gray-700">All</span>
                    {selectedLabel === null && <CheckSquare size={12} className="ml-auto text-gray-500 shrink-0" />}
                  </DropdownMenuItem>
                  {DISCUSSION_LABELS.map((label) => (
                    <DropdownMenuItem key={label.id} onClick={() => setSelectedLabel(label.id)} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                      <span className="text-gray-500">
                        {label.icon === 'HelpCircle' ? <HelpCircle size={14} /> :
                         label.icon === 'Lightbulb' ? <Lightbulb size={14} /> :
                         label.icon === 'Megaphone' ? <Megaphone size={14} /> :
                         label.icon === 'Star' ? <Star size={14} /> :
                         <MessageSquare size={14} />}
                      </span>
                      <span className="text-gray-700">{t(`communities.labels.${label.id}`)}</span>
                      {selectedLabel === label.id && <CheckSquare size={12} className="ml-auto text-gray-500 shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Discussions List */}
            <DiscussionList
                communityUuid={community.community_uuid}
                orgslug={orgslug}
                onCreateClick={() => setIsCreateDiscussionModalOpen(true)}
                initialDiscussions={initialDiscussions}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                selectedLabel={selectedLabel}
                onLabelChange={setSelectedLabel}
                isSelectMode={isSelectMode}
                onSelectModeToggle={() => setIsSelectMode(!isSelectMode)}
                onFilteredCountChange={setDiscussionCount}
              />
          </div>

          {/* Right Sidebar - Community Info (Desktop only) */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              <CommunitySidebar
                community={community}
                discussionCount={initialDiscussions.length}
                orgslug={orgslug}
              />
            </div>
          </div>
          </div>
        </div>

        {/* Bottom padding for mobile action bar */}
        {isMobile && <div className="h-24" />}
      </GeneralWrapperStyled>

      {/* Mobile Actions Bar */}
      {isMobile && (
        <CommunityActionsMobile
          community={community}
          orgslug={orgslug}
          onCreateDiscussion={() => setIsCreateDiscussionModalOpen(true)}
        />
      )}

      {/* Modals */}
      <CreateDiscussionModal
        isOpen={isCreateDiscussionModalOpen}
        onClose={() => setIsCreateDiscussionModalOpen(false)}
        communityUuid={community.community_uuid}
        orgSlug={orgslug}
      />
    </>
  )
}

export default CommunityClient
