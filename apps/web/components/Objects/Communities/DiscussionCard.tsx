'use client'
import React, { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
import { MessageCircle, Pin, Lock, ArrowUp, Loader2 } from 'lucide-react'
import { DiscussionWithAuthor, getLabelInfo, getComments, createComment, DiscussionCommentWithAuthor } from '@services/communities/discussions'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import { UpvoteButton } from './UpvoteButton'
import UserAvatar from '@components/Objects/UserAvatar'
import { useLHSession } from '@components/Contexts/LHSessionContext'

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

/** Reply item with 2-line truncation + See more */
function ReplyItem({ reply, replyName, replyTime }: {
  reply: DiscussionCommentWithAuthor
  replyName: string
  replyTime: string
}) {
  const [replyExpanded, setReplyExpanded] = useState(false)
  const replyContentRef = useRef<HTMLParagraphElement>(null)
  const [replyNeedsTruncation, setReplyNeedsTruncation] = useState(false)

  useLayoutEffect(() => {
    const el = replyContentRef.current
    if (!el) return
    // Check if content overflows 2 lines
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
    setReplyNeedsTruncation(el.scrollHeight > Math.round(lineHeight * 2))
  }, [reply.content])

  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-0.5">
        <UserAvatar
          width={32}
          rounded="rounded-full"
          avatar_url={getAvatarUrl(reply.author) || undefined}
          predefined_avatar={reply.author?.avatar_image ? undefined : 'empty'}
          showProfilePopup={true}
          userId={reply.author?.id?.toString()}
          shadow="shadow-none"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900">{replyName}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">{replyTime}</span>
        </div>
        <div className="relative">
          <p
            ref={replyContentRef}
            className={`text-sm text-gray-500 mt-0.5 whitespace-pre-wrap ${!replyExpanded && replyNeedsTruncation ? 'line-clamp-2' : ''}`}
          >
            {reply.content}
          </p>
          {replyNeedsTruncation && (
            <button
              onClick={() => setReplyExpanded(!replyExpanded)}
              className="text-sm font-semibold tracking-wide text-gray-500 hover:text-gray-700 transition-colors mt-0.5"
            >
              {replyExpanded ? 'See less' : 'See more'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
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

  const contentText = extractPlainText(discussion.content)
  const [isExpanded, setIsExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const [truncatedText, setTruncatedText] = useState<string | null>(null)

  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token

  const [isRepliesExpanded, setIsRepliesExpanded] = useState(false)
  const [replies, setReplies] = useState<DiscussionCommentWithAuthor[]>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [showAllReplies, setShowAllReplies] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  const fetchReplies = useCallback(async () => {
    setIsLoadingReplies(true)
    try {
      const result = await getComments(discussion.discussion_uuid, 1, 100, null, accessToken)
      setReplies(result || [])
    } catch {
      // silent
    } finally {
      setIsLoadingReplies(false)
    }
  }, [discussion.discussion_uuid, accessToken])

  const handleSendReply = async () => {
    if (!replyText.trim() || isSendingReply) return
    setIsSendingReply(true)
    setReplyError(null)
    try {
      const comment = await createComment(
        discussion.discussion_uuid,
        { content: replyText.trim() },
        accessToken
      )
      setReplies(prev => [...prev, comment])
      setReplyText('')
    } catch (err: any) {
      const message = err?.message || 'Failed to send reply'
      setReplyError(message)
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleReplyToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isRepliesExpanded) {
      setIsRepliesExpanded(true)
      if (replies.length === 0) {
        fetchReplies()
      }
    } else {
      setIsRepliesExpanded(false)
      setShowAllReplies(false)
    }
  }

  // Extract last word for fade effect
  const lastSpaceIdx = truncatedText ? truncatedText.lastIndexOf(' ') : -1
  const textBeforeLastWord = lastSpaceIdx >= 0 ? truncatedText!.slice(0, lastSpaceIdx + 1) : ''
  const lastWord = lastSpaceIdx >= 0 ? truncatedText!.slice(lastSpaceIdx + 1) : truncatedText || ''

  useLayoutEffect(() => {
    if (!contentText || !contentRef.current) {
      setNeedsTruncation(false)
      setTruncatedText(null)
      return
    }

    const container = contentRef.current
    const lineHeight = parseFloat(getComputedStyle(container).lineHeight)
    const twoLinesHeight = Math.round(lineHeight * 2)

    if (container.scrollHeight > twoLinesHeight) {
      setNeedsTruncation(true)

      // Binary search to find exact truncation point for 2 lines
      const measurer = document.createElement('div')
      const cs = getComputedStyle(container)
      measurer.style.cssText = `
        position: absolute; visibility: hidden; white-space: pre-wrap;
        font-size: ${cs.fontSize}; line-height: ${cs.lineHeight};
        width: ${container.clientWidth}px; font-family: ${cs.fontFamily};
        word-break: ${cs.wordBreak || 'normal'};
      `
      document.body.appendChild(measurer)

      let low = 0
      let high = contentText.length
      let best = 0

      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        measurer.textContent = contentText.slice(0, mid)
        if (measurer.scrollHeight <= twoLinesHeight) {
          best = mid
          low = mid + 1
        } else {
          high = mid - 1
        }
      }

      // Cut at word boundary
      const lastSpace = contentText.lastIndexOf(' ', best)
      let truncated = contentText.slice(0, lastSpace > 0 ? lastSpace : best).trimEnd()

      // Ensure text + '... See more' fits within 2 lines (not overflowing to line 3)
      const suffix = '... See more'
      measurer.textContent = truncated + suffix
      if (measurer.scrollHeight > twoLinesHeight) {
        const words = truncated.split(' ')
        for (let i = words.length - 1; i > 0; i--) {
          const shorter = words.slice(0, i).join(' ')
          measurer.textContent = shorter + suffix
          if (measurer.scrollHeight <= twoLinesHeight) {
            truncated = shorter
            break
          }
        }
      }

      document.body.removeChild(measurer)
      setTruncatedText(truncated)
    } else {
      setNeedsTruncation(false)
      setTruncatedText(null)
    }
  }, [contentText])

  return (
    <div
      onClick={isSelectMode ? handleClick : undefined}
      className={`relative flex h-fit w-full flex-col gap-3 overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors p-6 ${
        isSelectMode ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-indigo-300 bg-indigo-50/50'
          : discussion.is_pinned
          ? 'border-amber-200 bg-amber-50/30'
          : 'border-gray-100'
      }`}
    >
      {/* Header row: Avatar + Name + Time on left, Label on right */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
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
                width={36}
                rounded="rounded-full"
                avatar_url={getAvatarUrl(discussion.author) || undefined}
                predefined_avatar={discussion.author?.avatar_image ? undefined : 'empty'}
                showProfilePopup={true}
                userId={discussion.author?.id?.toString()}
                shadow="shadow-none"
              />
            </div>
          )}

          {/* Name + time inline */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[15px] font-semibold text-gray-900 truncate">{authorName}</span>
            <span className="text-xs text-gray-300 shrink-0">·</span>
            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{timeAgo}</span>
            {/* Pinned/Locked indicators */}
            {discussion.is_pinned && <Pin size={14} className="text-amber-500 shrink-0" />}
            {discussion.is_locked && <Lock size={14} className="text-gray-400 shrink-0" />}
          </div>
        </div>

        {/* Label badge */}
        <span
          className={`inline-flex items-center gap-x-0.5 border box-border rounded-md h-5 px-1.5 text-[11px] font-medium flex-shrink-0 ${
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

      {/* Title */}
      <div>
        <h3 className="text-[17px] font-semibold text-gray-900 leading-snug">
          {discussion.title}
        </h3>
      </div>

      {/* Content preview — inline Instagram-style expand */}
      {contentText && (
        <div className="relative text-sm text-gray-500 leading-relaxed">
          {/* Truncated preview — fades out when expanded */}
          {needsTruncation && (
            <div
              className={`transition-all duration-300 ${
                isExpanded
                  ? 'opacity-0 absolute inset-0 pointer-events-none'
                  : 'opacity-100'
              }`}
            >
              <p className="whitespace-pre-wrap">
                {textBeforeLastWord}
                <span className="bg-gradient-to-l from-transparent to-gray-500 bg-clip-text text-transparent">
                  {lastWord}...{' '}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                  className="inline text-sm font-semibold tracking-wide text-gray-500 hover:text-gray-700"
                >
                  See more
                </button>
              </p>
            </div>
          )}

          {/* Full text — slides in when expanded */}
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              isExpanded || !needsTruncation ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden min-h-0">
              <p className="whitespace-pre-wrap">
                {contentText}
                {isExpanded && needsTruncation && (
                  <>
                    {' '}
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                      className="inline ml-1.5 text-sm font-semibold tracking-wide text-gray-500 hover:text-gray-700"
                    >
                      See less
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Hidden measurement element */}
          <div
            ref={contentRef}
            className="absolute inset-0 pointer-events-none opacity-0 whitespace-pre-wrap"
            style={{ fontSize: 'inherit', lineHeight: 'inherit', fontFamily: 'inherit' }}
            aria-hidden="true"
          >
            {contentText}
          </div>
        </div>
      )}

      {/* Bottom row: Upvote · Reply + See more / Close */}
      {!isSelectMode && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <UpvoteButton
              discussionUuid={discussion.discussion_uuid}
              initialVoteCount={discussion.upvote_count}
              initialHasVoted={discussion.has_voted}
              compact
            />
            <button
              onClick={handleReplyToggle}
              className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <MessageCircle size={15} />
              <span className="text-xs">{replies.length || commentCount}</span>
            </button>
          </div>
          {isRepliesExpanded && (
            <div className="flex items-center gap-2">
              {replies.length > 3 && (
                <>
                  <button
                    onClick={() => setShowAllReplies(!showAllReplies)}
                    className="text-sm font-semibold tracking-wide text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showAllReplies ? 'Show less' : `See more (${replies.length - 3})`}
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                </>
              )}
              <button
                onClick={() => { setIsRepliesExpanded(false); setShowAllReplies(false); }}
                className="text-sm font-semibold tracking-wide text-gray-500 hover:text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Select mode: show upvote count */}
      {isSelectMode && (
        <div className="flex items-center gap-1 text-gray-400">
          <span className="text-xs">{discussion.upvote_count} {t('communities.discussion_card.votes')}</span>
        </div>
      )}

      {/* Expanded replies section — animated */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isRepliesExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="pt-4 mt-2 space-y-5">
            {/* Replies list */}
            {isLoadingReplies ? (
              <div className="flex items-center justify-center py-4 transition-opacity duration-200">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            ) : replies.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">{t('communities.comments.no_replies')}</p>
            ) : (
              <>
                {/* First 3 replies always visible */}
                {replies.slice(0, 3).map((reply) => {
                  const replyName = reply.author
                    ? `${reply.author.first_name} ${reply.author.last_name}`.trim() || reply.author.username
                    : t('common.unknown')
                  const replyTime = dayjs(reply.creation_date).fromNow()
                  return (
                    <ReplyItem
                      key={reply.comment_uuid}
                      reply={reply}
                      replyName={replyName}
                      replyTime={replyTime}
                    />
                  )
                })}

                {/* Extra replies (4+) — animated */}
                {replies.length > 3 && (
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      showAllReplies ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden min-h-0">
                      <div className="space-y-5">
                        {replies.slice(3).map((reply) => {
                          const replyName = reply.author
                            ? `${reply.author.first_name} ${reply.author.last_name}`.trim() || reply.author.username
                            : t('common.unknown')
                          const replyTime = dayjs(reply.creation_date).fromNow()
                          return (
                            <ReplyItem
                              key={reply.comment_uuid}
                              reply={reply}
                              replyName={replyName}
                              replyTime={replyTime}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Reply input */}
            {!discussion.is_locked && (
              <div className="flex items-center gap-2 pt-3">
                <div className="shrink-0">
                  <UserAvatar
                    width={32}
                    rounded="rounded-full"
                    avatar_url={undefined}
                    predefined_avatar="empty"
                    showProfilePopup={false}
                    shadow="shadow-none"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  {replyError && (
                    <span className="text-xs text-red-500">{replyError}</span>
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => {
                      const val = e.target.value
                      // Count lines to enforce max 4
                      const lines = val.split('\n')
                      if (lines.length > 4) return
                      // Also prevent typing when 4 lines are filled
                      const textarea = e.target
                      textarea.style.height = 'auto'
                      textarea.style.height = textarea.scrollHeight + 'px'
                      if (textarea.scrollHeight > Math.round(parseFloat(getComputedStyle(textarea).lineHeight) * 4 + 14)) {
                        return
                      }
                      setReplyText(val)
                      if (replyError) setReplyError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply()
                      }
                    }}
                    rows={1}
                    placeholder={t('communities.comments.write_reply')}
                    className="flex-1 text-sm bg-gray-50/80 border-0 ring-1 ring-inset ring-gray-200 rounded-lg px-3 py-[7px] outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-gray-300 transition-all resize-none overflow-hidden"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSendingReply}
                    className="p-[9px] rounded-lg bg-gray-50/80 border-0 ring-1 ring-inset ring-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-all"
                  >
                    {isSendingReply ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowUp size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiscussionCard
