'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Loader2, Trash2, CheckSquare, Square } from 'lucide-react'
import { DiscussionCard } from './DiscussionCard'
import { DiscussionReplyModal } from './DiscussionReplyModal'
import {
  deleteDiscussion,
  getCommentCount,
  DiscussionSortBy,
  DiscussionWithAuthor,
} from '@services/communities/discussions'
import toast from 'react-hot-toast'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useCommunityRights } from '@components/Hooks/useCommunityRights'
import { useDiscussions, mutateDiscussions } from '@components/Hooks/useDiscussions'
import ConfirmationModal from '@components/Objects/StyledElements/ConfirmationModal/ConfirmationModal'
import { searchMatchesAny } from '@/lib/search/normalize'

interface DiscussionListProps {
  communityUuid: string
  orgslug: string
  onCreateClick?: () => void
  initialDiscussions?: DiscussionWithAuthor[]
  // Shared filter state from parent
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: DiscussionSortBy
  onSortChange: (sort: DiscussionSortBy) => void
  selectedLabel: string | null
  onLabelChange: (label: string | null) => void
  // Select mode (controlled from parent)
  isSelectMode: boolean
  onSelectModeToggle: () => void
  // Filtered count (reported to parent)
  onFilteredCountChange?: (count: number) => void
}

export function DiscussionList({
  communityUuid,
  orgslug,
  onCreateClick,
  initialDiscussions = [],
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedLabel,
  onLabelChange,
  isSelectMode,
  onSelectModeToggle,
  onFilteredCountChange,
}: DiscussionListProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const { canCreateDiscussion: hasCreatePermission, canManageCommunity } = useCommunityRights(communityUuid)
  const canCreateDiscussion = hasCreatePermission
  const accessToken = session?.data?.tokens?.access_token

  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [replyDiscussion, setReplyDiscussion] = useState<DiscussionWithAuthor | null>(null)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset selection when select mode is turned off
  useEffect(() => {
    if (!isSelectMode) {
      setSelectedIds(new Set())
    }
  }, [isSelectMode])

  // Use SWR for fetching discussions
  const { discussions: swrDiscussions, isLoading, mutate } = useDiscussions({
    communityUuid,
    sortBy,
    page: 1,
    limit: 50, // Fetch more initially since we're not paginating for now
    label: selectedLabel,
  })

  // Use SWR data, fall back to initial data if SWR hasn't loaded yet
  const discussions = swrDiscussions.length > 0 ? swrDiscussions : initialDiscussions

  const fetchCommentCounts = async (discussionList: DiscussionWithAuthor[]) => {
    if (!discussionList.length) return
    try {
      const counts = await Promise.all(
        discussionList.map(async (d) => {
          try {
            const count = await getCommentCount(d.discussion_uuid, null, accessToken)
            return { uuid: d.discussion_uuid, count }
          } catch {
            return { uuid: d.discussion_uuid, count: 0 }
          }
        })
      )
      setCommentCounts(prev => {
        const newCounts = { ...prev }
        counts.forEach(({ uuid, count }) => {
          newCounts[uuid] = count
        })
        return newCounts
      })
    } catch (_error) {
      // silent — counts fall back to 0
    }
  }

  // Fetch comment counts when discussions change
  useEffect(() => {
    if (discussions.length > 0) {
      // Only fetch counts for discussions we don't have counts for
      const newDiscussions = discussions.filter(d => !(d.discussion_uuid in commentCounts))
      if (newDiscussions.length > 0) {
        fetchCommentCounts(newDiscussions)
      }
    }
  }, [discussions])

  // Filter discussions based on search query
  const filteredDiscussions = useMemo(() => {
    if (!searchQuery.trim()) return discussions
    return discussions.filter(d =>
      searchMatchesAny(
        [d.title, d.author?.username, d.author?.first_name, d.author?.last_name],
        searchQuery,
      )
    )
  }, [discussions, searchQuery])

  // Report filtered count to parent
  useEffect(() => {
    onFilteredCountChange?.(filteredDiscussions.length)
  }, [filteredDiscussions.length, onFilteredCountChange])

  // Selection handlers
  const toggleSelection = (discussionUuid: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(discussionUuid)) {
      newSelected.delete(discussionUuid)
    } else {
      newSelected.add(discussionUuid)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredDiscussions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredDiscussions.map(d => d.discussion_uuid)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !accessToken) return

    setIsDeleting(true)
    try {
      // Delete discussions one by one
      const deletePromises = Array.from(selectedIds).map(uuid =>
        deleteDiscussion(uuid, accessToken)
      )
      await Promise.all(deletePromises)

      // Revalidate SWR cache
      mutateDiscussions(communityUuid)
      setSelectedIds(new Set())
      setIsDeleting(false)
    } catch (err: any) {
      const message =
        (err?.detail && typeof err.detail === 'object' && err.detail.message) ||
        (typeof err?.detail === 'string' && err.detail) ||
        err?.message ||
        t('communities.discussion_list.delete_failed')
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDiscussionUpdate = (updated: DiscussionWithAuthor) => {
    // Optimistically update the local cache
    mutate(
      (current) => current?.map(d =>
        d.discussion_uuid === updated.discussion_uuid ? updated : d
      ),
      false
    )
  }

  const handleDiscussionDelete = (discussionUuid: string) => {
    // Optimistically update the local cache
    mutate(
      (current) => current?.filter(d => d.discussion_uuid !== discussionUuid),
      false
    )
  }

  const allSelected = filteredDiscussions.length > 0 && selectedIds.size === filteredDiscussions.length

  return (
    <div>
      {/* Selection Action Bar */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800"
            >
              {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              {allSelected ? t('communities.discussion_list.deselect_all') : t('communities.discussion_list.select_all')}
            </button>
            <span className="text-xs text-indigo-600 font-medium">
              {selectedIds.size} {t('communities.discussion_list.selected')}
            </span>
          </div>

          <ConfirmationModal
            confirmationMessage={t('communities.discussion_list.delete_discussions_confirm', { count: selectedIds.size, type: selectedIds.size === 1 ? t('communities.discussion') : t('communities.discussions') })}
            confirmationButtonText={t('communities.discussion_list.delete')}
            dialogTitle={selectedIds.size === 1 ? t('communities.discussion_list.delete_discussions_title', { count: selectedIds.size }) : t('communities.discussion_list.delete_discussions_title_plural', { count: selectedIds.size })}
            dialogTrigger={
              <button
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {t('communities.discussion_list.delete')}
              </button>
            }
            functionToExecute={handleBulkDelete}
            status="warning"
          />
        </div>
      )}

      {/* Discussion List */}
      <div>
        {filteredDiscussions.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <MessageCircle size={28} className="text-gray-300" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-base font-semibold text-gray-600 mb-1">{t('communities.discussion_list.no_results')}</h3>
                <p className="text-sm text-gray-400 text-center max-w-xs mb-4">
                  {t('communities.discussion_list.no_results_description')}
                </p>
                <button
                  onClick={() => onSearchChange('')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {t('communities.discussion_list.clear_search')}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-gray-600 mb-1">{t('communities.discussion_list.no_discussions')}</h3>
                <p className="text-sm text-gray-400 text-center max-w-xs mb-4">
                  {t('communities.discussion_list.no_discussions_description')}
                </p>
                {canCreateDiscussion && onCreateClick && (
                  <button
                    onClick={onCreateClick}
                    className="rounded-lg bg-primary transition-all duration-100 ease-linear antialiased p-2 px-5 my-auto font text-xs font-bold text-primary-foreground nice-shadow flex space-x-2 items-center hover:bg-primary/90 hover:scale-105"
                  >
                    <div>{t('communities.discussion_list.start_discussion')} </div>
                    <div className="text-md bg-white/20 px-1 rounded-full">+</div>
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {isLoading && discussions.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : (
              filteredDiscussions.map((discussion) => (
                <DiscussionCard
                  key={discussion.discussion_uuid}
                  discussion={discussion}
                  orgslug={orgslug}
                  communityUuid={communityUuid}
                  commentCount={commentCounts[discussion.discussion_uuid] || 0}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.has(discussion.discussion_uuid)}
                  onToggleSelect={() => toggleSelection(discussion.discussion_uuid)}
                  canManage={canManageCommunity}
                  onDiscussionUpdate={handleDiscussionUpdate}
                  onDiscussionDelete={handleDiscussionDelete}
                  onReplyClick={setReplyDiscussion}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyDiscussion && (
        <DiscussionReplyModal
          discussion={replyDiscussion}
          communityUuid={communityUuid}
          onClose={() => setReplyDiscussion(null)}
        />
      )}
    </div>
  )
}

export default DiscussionList
