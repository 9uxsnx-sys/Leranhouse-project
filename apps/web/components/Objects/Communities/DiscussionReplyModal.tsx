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
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-black/10 max-h-[90vh] flex flex-col z-10 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X size={18} className="text-gray-500" />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 flex flex-col pt-12 px-5">
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
