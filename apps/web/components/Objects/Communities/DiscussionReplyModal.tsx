'use client'
import React from 'react'
import { X } from 'lucide-react'
import { DiscussionWithAuthor } from '@services/communities/discussions'
import { CommentSection } from './CommentSection'

interface DiscussionReplyModalProps {
  discussion: DiscussionWithAuthor
  communityUuid: string
  onClose: () => void
}

export function DiscussionReplyModal({ discussion, communityUuid, onClose }: DiscussionReplyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-gray-100 shadow-sm max-h-[90vh] flex flex-col z-10 overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500">
            Replies
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 flex flex-col px-6 pb-5">
          <CommentSection
            discussionUuid={discussion.discussion_uuid}
            communityUuid={communityUuid}
            isLocked={discussion.is_locked}
          />
        </div>
      </div>
    </div>
  )
}

export default DiscussionReplyModal
