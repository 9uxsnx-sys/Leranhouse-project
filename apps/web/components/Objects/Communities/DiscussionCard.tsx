'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
import { MessageSquare, Pin, Lock } from 'lucide-react'
import { DiscussionWithAuthor, getLabelInfo } from '@services/communities/discussions'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import { UpvoteButton } from './UpvoteButton'
import UserAvatar from '@components/Objects/UserAvatar'

function getAvatarUrl(author: any): string | null {
  if (!author?.avatar_image) return null
  if (author.avatar_image.startsWith('http://') || author.avatar_image.startsWith('https://')) {
    return author.avatar_image
  }
  return getUserAvatarMediaDirectory(author.user_uuid, author.avatar_image)
}

interface DiscussionCardProps {
  discussion: DiscussionWithAuthor
  orgslug: string
  communityUuid: string
  onClick?: () => void
  commentCount?: number
  isSelectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
  canManage?: boolean
  onDiscussionUpdate?: (updated: DiscussionWithAuthor) => void
  onDiscussionDelete?: (discussionUuid: string) => void
  onReplyClick?: (discussion: DiscussionWithAuthor) => void
}

/** Extract plain text from TipTap JSON content (string or object) */
function extractPlainText(content: any): string {
  if (!content) return ''
  
  // If it's a JSON string, parse it
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      return extractPlainText(parsed)
    } catch {
      // Not JSON, return as-is
      return content
    }
  }
  
  if (typeof content !== 'object') return ''
  
  if (content.text) return content.text
  
  if (content.content && Array.isArray(content.content)) {
    return content.content.map((node: any) => extractPlainText(node)).join(' ').trim()
  }
  
  return ''
}

export function DiscussionCard({
  discussion,
  orgslug,
  communityUuid,
  onClick,
  commentCount = 0,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  canManage = false,
  onDiscussionUpdate,
  onDiscussionDelete,
  onReplyClick,
}: DiscussionCardProps) {
  const { t } = useTranslation()

  const timeAgo = dayjs(discussion.creation_date).fromNow()

  const authorName = discussion.author
    ? `${discussion.author.first_name} ${discussion.author.last_name}`.trim() || discussion.author.username
    : t('common.unknown')

  const labelInfo = getLabelInfo(discussion.label || 'general')

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectMode && onToggleSelect) {
      e.preventDefault()
      onToggleSelect()
    }
  }

  return (
    <div
      onClick={isSelectMode ? handleClick : undefined}
      className={`relative flex h-fit w-full flex-col gap-4 overflow-hidden rounded-xl border px-5 pt-5 pb-3 bg-white transition-colors ${
        isSelectMode ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-indigo-300 bg-indigo-50/50'
          : discussion.is_pinned
          ? 'border-amber-200 bg-amber-50/30'
          : 'border-black/10'
      }`}
    >
      {/* Header row: Avatar + Name + Username on left, Label on right */}
      <div className="flex flex-row items-start justify-between tracking-normal">
        <div className="flex items-center space-x-3">
          {/* Select mode checkbox */}
          {isSelectMode && (
            <div className="flex-shrink-0">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Avatar */}
          {!isSelectMode && (
            <div className="shrink-0">
              <UserAvatar
                width={48}
                rounded="rounded-full"
                avatar_url={getAvatarUrl(discussion.author) || undefined}
                predefined_avatar={discussion.author?.avatar_image ? undefined : 'empty'}
                showProfilePopup={true}
                userId={discussion.author?.id?.toString()}
                shadow="shadow-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center font-medium whitespace-nowrap">
              <span className="text-sm font-semibold text-gray-900 truncate">{authorName}</span>
              {/* Pinned/Locked indicators inline */}
              {discussion.is_pinned && <Pin size={14} className="ml-1 text-amber-500 flex-shrink-0" />}
              {discussion.is_locked && <Lock size={14} className="ml-1 text-gray-400 flex-shrink-0" />}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">@{discussion.author?.username || authorName}</span>
            </div>
          </div>
        </div>

        {/* Label badge - Medusa UI style */}
        <span
          className={`inline-flex items-center gap-x-0.5 border box-border rounded-md h-5 px-1 text-[11px] font-medium flex-shrink-0 ml-2 ${
            labelInfo.id === 'general' ? 'bg-gray-100 text-gray-700 border-gray-200' :
            labelInfo.id === 'question' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            labelInfo.id === 'idea' ? 'bg-purple-50 text-purple-700 border-purple-200' :
            labelInfo.id === 'announcement' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            labelInfo.id === 'showcase' ? 'bg-green-50 text-green-700 border-green-200' :
            'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {t(`communities.labels.${discussion.label || 'general'}`)}
        </span>
      </div>

      {/* Body: Content */}
      <div className="text-[15px] leading-relaxed tracking-normal">
        <p className="text-gray-900 whitespace-pre-wrap">{extractPlainText(discussion.content) || discussion.title}</p>
      </div>

      {/* Bottom row: Upvote · Comment · Time */}
      {!isSelectMode && (
        <div className="flex items-center gap-4">
          <UpvoteButton
            discussionUuid={discussion.discussion_uuid}
            initialVoteCount={discussion.upvote_count}
            initialHasVoted={discussion.has_voted}
            compact
          />
          <button
            onClick={() => onReplyClick?.(discussion)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <MessageSquare size={15} />
            <span className="text-xs">{commentCount}</span>
          </button>
          <div className="flex-1" />
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
      )}

      {/* Select mode: show upvote count */}
      {isSelectMode && (
        <div className="flex items-center gap-1 text-gray-400">
          <span className="text-xs">{discussion.upvote_count} {t('communities.discussion_card.votes')}</span>
        </div>
      )}
    </div>
  )
}

export default DiscussionCard
