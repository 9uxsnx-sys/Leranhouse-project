'use client'

import React, { useState } from 'react'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import { CommunitySidebar } from '@components/Objects/Communities/CommunitySidebar'
import { CommunityActionsMobile } from '@components/Objects/Communities/CommunityActionsMobile'
import { DiscussionList } from '@components/Objects/Communities/DiscussionList'
import { CreateDiscussionCard } from '@components/Objects/Communities/CreateDiscussionCard'
import { Community } from '@services/communities/communities'
import { DiscussionWithAuthor, DiscussionSortBy, DISCUSSION_LABELS } from '@services/communities/discussions'
import { useMediaQuery } from 'usehooks-ts'
import { Search, Clock, Flame, TrendingUp, HelpCircle, Lightbulb, Megaphone, Star, MessageSquare, CheckSquare, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCommunityRights } from '@components/Hooks/useCommunityRights'
import { useContentLocale } from '@components/Hooks/useCourseTranslation'
import { useOrgMembership } from '@components/Contexts/OrgContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getCommunityBannerMediaDirectory } from '@services/media/media'
import { getAPIUrl } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'
import useSWR from 'swr'
import { useRegisterBreadcrumb } from '@components/Objects/Breadcrumbs/UserBreadcrumbContext'
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
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token
  const contentLocale = useContentLocale()

  // Title, description and the stats row live in community_translation rows,
  // so a client-side language switch has to re-fetch instead of reusing props.
  const { data: swrCommunity, mutate: mutateCommunity } = useSWR(
    () =>
      contentLocale
        ? `${getAPIUrl()}communities/${community.community_uuid}?locale=${contentLocale}`
        : null,
    (url: string) => swrFetcher(url, accessToken),
    { fallbackData: community, revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  React.useEffect(() => {
    if (contentLocale) mutateCommunity()
  }, [contentLocale, mutateCommunity])

  const activeCommunity = (swrCommunity || community) as Community

  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<DiscussionSortBy>('recent')
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [discussionCount, setDiscussionCount] = useState(0)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { canManageCommunity, canCreateDiscussion: hasCreatePermission } = useCommunityRights(activeCommunity.community_uuid)
  const { isUserPartOfTheOrg } = useOrgMembership()
  const canCreateDiscussion = hasCreatePermission && isUserPartOfTheOrg
  const org = useOrg() as any

  // The feed is inline (cards expand in place), so the trail stops at the community.
  useRegisterBreadcrumb([
    { label: t('communities.title'), href: '/communities' },
    { label: activeCommunity.name },
  ])

  return (
    <>
      <GeneralWrapperStyled>
        {/* ── HERO BANNER IMAGE (centered, constrained) ── */}
        <div className="relative w-full mx-auto max-w-7xl aspect-[3/1] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-gray-100 ring-1 ring-inset ring-black/5">
          {activeCommunity.banner_image ? (
            <img
              src={getCommunityBannerMediaDirectory(org?.org_uuid, activeCommunity?.community_uuid, activeCommunity?.banner_image)}
              alt={activeCommunity.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/5 via-white to-indigo-500/10">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center mx-auto">
                  <MessageCircle className="w-10 h-10 text-indigo-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── COMMUNITY TITLE + DESCRIPTION ── */}
        <div className="w-full mx-auto max-w-7xl mt-8 space-y-2">
          <h1 dir="auto" className="text-2xl md:text-3xl font-semibold text-ui-fg-base leading-tight">{activeCommunity.name}</h1>
          {activeCommunity.description && (
            <p dir="auto" className="text-base text-ui-fg-subtle leading-relaxed">
              {activeCommunity.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge variant="grey" className="flex items-center gap-1">
              <MessageSquare size={12} />
              {initialDiscussions.length}{' '}
              {initialDiscussions.length === 1
                ? t('communities.discussion')
                : t('communities.discussions')}
            </Badge>
            {activeCommunity.public ? (
              <Badge variant="grey" className="flex items-center gap-1">
                <MessageCircle size={12} />
                {t('communities.public')}
              </Badge>
            ) : (
              <Badge variant="grey" className="flex items-center gap-1">
                <MessageCircle size={12} />
                {t('communities.private')}
              </Badge>
            )}
          </div>
        </div>

        {/* Forum Layout - Content Left, Sidebar Right */}
        <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
          <div className="flex flex-col lg:flex-row gap-10 justify-between">
          {/* Main Content - Discussions Feed */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-8">
            {/* Mobile only shows community name */}
            <div className="md:hidden mb-4">
              <h1 dir="auto" className="text-xl font-bold text-gray-900">{activeCommunity.name}</h1>
              {activeCommunity.description && (
                <p dir="auto" className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {activeCommunity.description}
                </p>
              )}
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3 mb-4">
              {/* Search Bar */}
              <div className="relative w-80">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('communities.discussion_list.search_placeholder')}
                  className="w-full h-7 ps-8 pe-2 text-sm text-gray-700 bg-white shadow-borders-base rounded-md placeholder:text-gray-500 focus:outline-none"
                />
              </div>

              {/* Results count */}
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {discussionCount} {discussionCount === 1 ? t('communities.discussion') : t('communities.discussions')}
              </span>

              {/* Spacer pushes actions to the right */}
              <div className="flex-1" />

              {/* New Discussion Button */}
              {canCreateDiscussion && !isSelectMode && !isCreatingDiscussion && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setIsCreatingDiscussion(true)}
                  className="gap-x-1.5"
                >
                  +&nbsp;&nbsp;{t('communities.new')}
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
                  <IconButton size="small" variant="transparent" className="bg-white hover:bg-gray-50 shadow-borders-base relative" aria-label={t('communities.discussion_list.filter_discussions')}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5h10M4.5 7.5h6M6.5 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {(sortBy !== 'recent' || selectedLabel !== null) && (
                      <span className="absolute -top-0.5 -end-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
                    )}
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white min-w-0 w-44 p-2">
                  <DropdownMenuItem onClick={() => setSortBy('recent')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                    <span className="text-gray-500"><Clock size={14} /></span>
                    <span className="text-gray-700">{t('communities.discussion_list.latest')}</span>
                    {sortBy === 'recent' && <CheckSquare size={12} className="ms-auto text-gray-500 shrink-0" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('upvotes')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                    <span className="text-gray-500"><TrendingUp size={14} /></span>
                    <span className="text-gray-700">{t('communities.discussion_list.top')}</span>
                    {sortBy === 'upvotes' && <CheckSquare size={12} className="ms-auto text-gray-500 shrink-0" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('hot')} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                    <span className="text-gray-500"><Flame size={14} /></span>
                    <span className="text-gray-700">{t('communities.discussion_list.hot')}</span>
                    {sortBy === 'hot' && <CheckSquare size={12} className="ms-auto text-gray-500 shrink-0" />}
                  </DropdownMenuItem>

                  <div className="border-t border-gray-200 my-1" />

                  <DropdownMenuItem onClick={() => setSelectedLabel(null)} className="flex items-center gap-2 text-sm cursor-pointer bg-white rounded-md">
                    <span className="text-gray-500"><MessageSquare size={14} /></span>
                    <span className="text-gray-700">{t('communities.discussion_list.all')}</span>
                    {selectedLabel === null && <CheckSquare size={12} className="ms-auto text-gray-500 shrink-0" />}
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
                      {selectedLabel === label.id && <CheckSquare size={12} className="ms-auto text-gray-500 shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Create Discussion Card (replaces list) */}
            {isCreatingDiscussion ? (
              <CreateDiscussionCard
                communityUuid={activeCommunity.community_uuid}
                orgSlug={orgslug}
                onClose={() => setIsCreatingDiscussion(false)}
              />
            ) : (
              <DiscussionList
                communityUuid={activeCommunity.community_uuid}
                orgslug={orgslug}
                onCreateClick={() => setIsCreatingDiscussion(true)}
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
            )}
          </div>

          {/* Right Sidebar - Community Info (Desktop only) */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4">
              <CommunitySidebar
                community={activeCommunity}
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
          community={activeCommunity}
          orgslug={orgslug}
          onCreateDiscussion={() => setIsCreatingDiscussion(true)}
        />
      )}


    </>
  )
}

export default CommunityClient
