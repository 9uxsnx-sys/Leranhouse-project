'use client'
import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { createDiscussion, DISCUSSION_LABELS } from '@services/communities/discussions'
import { mutateDiscussions } from '@components/Hooks/useDiscussions'
import Modal from '@components/Objects/StyledElements/Modal/Modal'
import { MessageSquare, HelpCircle, Lightbulb, Megaphone, Star, Check, OctagonAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface CreateDiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  communityUuid: string
  orgSlug: string
}

// Get the icon component for a label
function getLabelIcon(iconName: string, size: number = 16) {
  switch (iconName) {
    case 'HelpCircle':
      return <HelpCircle size={size} />
    case 'Lightbulb':
      return <Lightbulb size={size} />
    case 'Megaphone':
      return <Megaphone size={size} />
    case 'Star':
      return <Star size={size} />
    default:
      return <MessageSquare size={size} />
  }
}

export function CreateDiscussionModal({
  isOpen,
  onClose,
  communityUuid,
  orgSlug,
}: CreateDiscussionModalProps) {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string>('general')
  const toastRef = useRef<string | null>(null)

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
      <Modal
      isDialogOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setTitle('')
          setContent('')
          setError(null)
          setTitleError(null)
          setSelectedLabel('general')
          onClose()
        }
      }}
      minWidth="sm"
      dialogTitle={t('communities.create_discussion.title')}
      dialogDescription={t('communities.create_discussion.description')}
      dialogContent={
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Category */}
          <div className="border-ui-border-base flex flex-col gap-y-3 border-b px-4 py-4">
            <Label size="small" weight="plus">
              {t('communities.create_discussion.category_label')}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {DISCUSSION_LABELS.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => setSelectedLabel(label.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-sm ${
                    selectedLabel === label.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <span style={{ color: label.color }}>
                    {getLabelIcon(label.icon, 14)}
                  </span>
                  <span>{t(`communities.labels.${label.id}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Post Details */}
          <div className="border-ui-border-base flex flex-col gap-y-3 border-b px-4 py-4">
            <Label size="small" weight="plus">
              {t('communities.create_discussion.details_label')}
            </Label>

            {/* Title */}
            <div>
              <Input
                type="text"
                name="title"
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder={t('communities.create_discussion.title_placeholder')}
                size="base"
              />
            </div>

            {/* Content Textarea */}
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus" htmlFor="content">
                {t('communities.create_discussion.details_label')}
              </Label>
              <Textarea
                name="content"
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('communities.create_discussion.details_placeholder')}
                className="min-h-[180px]"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 p-3 bg-ui-bg-subtle border border-ui-border-base rounded-lg text-ui-fg-error text-sm">
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-4 py-3">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={onClose}
              className="h-7"
            >
              {t('communities.create_discussion.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isSubmitting}
              className="h-7"
            >
              Post
            </Button>
          </div>
        </form>
      }
    />
    </>
  )
}

export default CreateDiscussionModal
