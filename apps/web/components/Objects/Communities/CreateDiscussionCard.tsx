'use client'
import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { createDiscussion, DISCUSSION_LABELS } from '@services/communities/discussions'
import { mutateDiscussions } from '@components/Hooks/useDiscussions'
import { OctagonAlert, ArrowLeft, Loader2 } from 'lucide-react'

interface CreateDiscussionCardProps {
  communityUuid: string
  orgSlug: string
  onClose: () => void
}

export function CreateDiscussionCard({
  communityUuid,
  orgSlug,
  onClose,
}: CreateDiscussionCardProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string>('general')
  const toastRef = useRef<string | null>(null)

  const fieldClassName =
    'w-full bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none'

  const accessToken = session?.data?.tokens?.access_token

  const validateTitle = (value: string) => {
    if (!value.trim()) {
      return t('communities.create_discussion.title_required')
    }
    if (value.trim().length < 5) {
      return t('communities.create_discussion.title_min_length')
    }
    if (value.length > 200) {
      return t('communities.create_discussion.title_max_length')
    }
    return null
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTitle(value)
    setTitleError(validateTitle(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateTitle(title)
    if (validationError) {
      if (toastRef.current) toast.remove(toastRef.current)
      const id = toast.custom((toastId) => (
        <div className="toast-blur-in flex gap-3 p-4 rounded-xl border shadow-xl" style={{ background: '#fff', borderColor: '#e5e7eb', minWidth: '360px', maxWidth: '400px' }}>
          <div className="flex items-start flex-shrink-0">
            <OctagonAlert size={18} className="text-red-500" style={{ marginTop: '1px' }} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold" style={{ color: '#111827' }}>Fill info</span>
            <span className="text-xs" style={{ color: '#6b7280', lineHeight: '1.4' }}>
              Fill in the required fields so you can post your tweet
            </span>
          </div>
        </div>
      ), { duration: 4000 })
      toastRef.current = id
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createDiscussion(
        communityUuid,
        {
          title: title.trim(),
          content: content || null,
          label: selectedLabel,
        },
        accessToken
      )

      if (result) {
        mutateDiscussions(communityUuid)
        setTitle('')
        setContent('')
        setSelectedLabel('general')
        onClose()
      }
    } catch (err: any) {
      const message =
        (err?.detail && typeof err.detail === 'object' && err.detail.message) ||
        (typeof err?.detail === 'string' && err.detail) ||
        err?.message ||
        t('communities.create_discussion.failed_to_create')
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        .toast-blur-in {
          animation: toastSlideIn 0.25s ease-out;
        }
        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500">
            {t('communities.create_discussion.title')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category / Label */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t('communities.create_discussion.category_label')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DISCUSSION_LABELS.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => setSelectedLabel(label.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
                    selectedLabel === label.id
                      ? 'bg-gray-100 text-gray-900 ring-1 ring-inset ring-gray-300'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 ring-1 ring-inset ring-gray-200'
                  }`}
                >
                  {t(`communities.labels.${label.id}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder={t('communities.create_discussion.title_placeholder')}
              className={fieldClassName}
            />
            {titleError && (
              <p className="text-xs text-red-500 mt-1">{titleError}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Details
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('communities.create_discussion.details_placeholder')}
              className={`${fieldClassName} min-h-[200px]`}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t('communities.create_discussion.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-sm text-white font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Post
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default CreateDiscussionCard
