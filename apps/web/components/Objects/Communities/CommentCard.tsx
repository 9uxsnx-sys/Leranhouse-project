'use client'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { MoreHorizontal, Pencil, Trash2, X, Check, Loader2, AlertCircle, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  DiscussionCommentWithAuthor,
  DiscussionAuthor,
  updateComment,
  deleteComment,
  upvoteComment,
  removeCommentUpvote,
} from '@services/communities/discussions'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import UserAvatar from '@components/Objects/UserAvatar'
import { useOrgMembership } from '@components/Contexts/OrgContext'

dayjs.extend(relativeTime)

function getAvatarUrl(author: DiscussionAuthor | null): string | null {
  if (!author?.avatar_image) return null
  if (author.avatar_image.startsWith('http://') || author.avatar_image.startsWith('https://')) {
    return author.avatar_image
  }
  return getUserAvatarMediaDirectory(author.user_uuid, author.avatar_image)
}

interface CommentCardProps {
  comment: DiscussionCommentWithAuthor
  canManage?: boolean
  onDeleted: (commentUuid: string) => void
  onUpdated: (comment: DiscussionCommentWithAuthor) => void
}

export function CommentCard({
  comment,
  canManage = false,
  onDeleted,
  onUpdated,
}: CommentCardProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token
  const currentUserId = session?.data?.user?.id
  const { isUserPartOfTheOrg } = useOrgMembership()
  const isAuthenticated = session?.status === 'authenticated'
  const canVote = isAuthenticated && isUserPartOfTheOrg

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voteCount, setVoteCount] = useState(comment.upvote_count || 0)
  const [hasVoted, setHasVoted] = useState(comment.has_voted || false)
  const [isVoting, setIsVoting] = useState(false)

  const isAuthor = currentUserId === comment.author_id
  const canDelete = isAuthor || canManage
  const showMenu = isAuthor || canManage
  const timeAgo = dayjs(comment.creation_date).fromNow()
  const authorName = comment.author
    ? `${comment.author.first_name} ${comment.author.last_name}`.trim() || comment.author.username
    : t('common.unknown')

  const handleEdit = async () => {
    if (!editContent.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const updated = await updateComment(comment.comment_uuid, { content: editContent.trim() }, accessToken)
      onUpdated(updated)
      setIsEditing(false)
    } catch (err: any) {
      const message =
        (err?.detail && typeof err.detail === 'object' && err.detail.message) ||
        (typeof err?.detail === 'string' && err.detail) ||
        err?.message ||
        t('communities.comments.failed_to_update')
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await deleteComment(comment.comment_uuid, accessToken)
      onDeleted(comment.comment_uuid)
    } catch (err: any) {
      const message =
        (err?.detail && typeof err.detail === 'object' && err.detail.message) ||
        (typeof err?.detail === 'string' && err.detail) ||
        err?.message ||
        t('communities.comments.failed_to_delete')
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelEdit = () => {
    setEditContent(comment.content)
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleEdit()
    }
    if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const handleVote = async () => {
    if (!canVote || isVoting) return
    setIsVoting(true)
    const newHasVoted = !hasVoted
    const newVoteCount = newHasVoted ? voteCount + 1 : Math.max(0, voteCount - 1)
    setHasVoted(newHasVoted)
    setVoteCount(newVoteCount)
    try {
      if (newHasVoted) {
        await upvoteComment(comment.comment_uuid, accessToken)
      } else {
        await removeCommentUpvote(comment.comment_uuid, accessToken)
      }
    } catch {
      setHasVoted(!newHasVoted)
      setVoteCount(newHasVoted ? voteCount : voteCount + 1)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div
      className="relative pl-[36px] border-b border-gray-100 last:border-b-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thread line - removed */}

      <div className="absolute left-[3px] top-[10px] z-10">
        <UserAvatar
          width={28}
          rounded="rounded-full"
          avatar_url={getAvatarUrl(comment.author) || undefined}
          predefined_avatar={comment.author?.avatar_image ? undefined : 'empty'}
          showProfilePopup={true}
          userId={comment.author?.id?.toString()}
          shadow="shadow-none"
        />
      </div>

      {/* Content */}
      <div className="pb-3 pt-3 pl-2">
        {isEditing ? (
          <div className="space-y-2">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <textarea
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={handleKeyDown}
              rows={2}
              autoFocus
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all resize-none ${
                error ? 'border-red-300' : 'border-gray-200 focus:border-gray-300'
              }`}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleEdit}
                disabled={!editContent.trim() || isSubmitting}
                className="px-3 py-1 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {isSubmitting ? t('communities.comments.saving') : t('communities.comments.save')}
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSubmitting}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('communities.comments.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Name + Time + Actions row */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{authorName}</span>
              <span className="text-xs text-gray-400">{timeAgo}</span>
              <div className="flex-1" />
              {showMenu && (
                <div className={`transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button aria-label="Comment actions" className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <MoreHorizontal size={14} className="text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      {isAuthor && (
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('communities.comments.edit')}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('communities.comments.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Content text */}
            <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{comment.content}</p>

            {/* Upvote button */}
            <div className="flex items-center gap-4 mt-1.5">
              <button
                onClick={handleVote}
                disabled={!canVote || isVoting}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  hasVoted ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                } ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ChevronUp size={14} className={isVoting ? 'animate-pulse' : ''} />
                <span className="font-medium">{voteCount}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CommentCard
