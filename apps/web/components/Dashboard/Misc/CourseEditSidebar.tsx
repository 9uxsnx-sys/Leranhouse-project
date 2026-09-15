'use client'
import { useCourse, useCourseDispatch, getCourseMetaCacheKey } from '@components/Contexts/CourseContext'
import SaveState from './SaveState'
import { CourseOverviewParams } from 'app/orgs/[orgslug]/dash/courses/course/[courseuuid]/[subpage]/page'
import { getUriWithOrg } from '@services/config/config'
import { useOrg } from '@components/Contexts/OrgContext'
import Link from 'next/link'
import { BrainCircuit, Eye, Globe, GlobeLock, Loader2, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/ui/tooltip'
import { useTranslation } from 'react-i18next'
import { updateCourse } from '@services/courses/courses'
import { getAPIUrl } from '@services/config/config'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import toast from 'react-hot-toast'
import { useState, useCallback } from 'react'

export function CourseEditSidebar({
  params,
}: {
  params: CourseOverviewParams
}) {
  const { t } = useTranslation()
  const course = useCourse() as any
  const dispatchCourse = useCourseDispatch() as any
  const org = useOrg() as any
  const session = useLHSession() as any
  const [isPublishing, setIsPublishing] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [isIndexed, setIsIndexed] = useState(false)

  const courseStructure = course?.courseStructure
  const isPublished = courseStructure?.published
  const withUnpublishedActivities = course?.withUnpublishedActivities ?? false

  const cacheKey = courseStructure?.course_uuid
    ? getCourseMetaCacheKey(courseStructure.course_uuid, withUnpublishedActivities)
    : null

  const isAIEnabled = org?.config?.config?.resolved_features?.ai?.enabled ?? org?.config?.config?.features?.ai?.enabled !== false

  const chaptersCount = courseStructure?.chapters?.length ?? 0
  const activitiesCount = courseStructure?.chapters?.reduce(
    (acc: number, ch: any) => acc + (ch.activities?.length ?? 0), 0
  ) ?? 0

  const indexCourseForAI = useCallback(async () => {
    if (isIndexing || !courseStructure?.course_uuid) return
    setIsIndexing(true)
    setIsIndexed(false)

    const toastId = toast.loading('Indexing course for AI...')

    try {
      const response = await fetch(`${getAPIUrl()}ai/rag/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data?.tokens?.access_token}`,
        },
        body: JSON.stringify({ course_uuid: courseStructure.course_uuid }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(error.detail || `HTTP ${response.status}`)
      }

      const data = await response.json()
      toast.dismiss(toastId)
      toast.success(`Indexed ${data.chunks_indexed} chunks for AI`)
      setIsIndexed(true)
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error(error.message || 'Failed to index course')
    } finally {
      setIsIndexing(false)
    }
  }, [isIndexing, courseStructure, session.data?.tokens?.access_token])

  const togglePublishStatus = useCallback(async () => {
    if (isPublishing || !courseStructure?.course_uuid) return
    setIsPublishing(true)

    const newPublishedStatus = !isPublished
    const toastMessage = newPublishedStatus
      ? t('dashboard.courses.publishing')
      : t('dashboard.courses.unpublishing')
    const toastId = toast.loading(toastMessage)

    const previousState = { ...courseStructure }
    dispatchCourse({
      type: 'mergePendingChanges',
      payload: { published: newPublishedStatus }
    })

    try {
      await updateCourse(
        courseStructure.course_uuid,
        { published: newPublishedStatus },
        session.data?.tokens?.access_token
      )

      if (cacheKey) {
        await mutate(cacheKey, { ...courseStructure, published: newPublishedStatus }, { revalidate: false })
      }

      await revalidateTags(['courses'], params.orgslug)

      toast.dismiss(toastId)
      toast.success(
        newPublishedStatus
          ? t('dashboard.courses.published_success')
          : t('dashboard.courses.unpublished_success')
      )
    } catch (error) {
      dispatchCourse({
        type: 'mergePendingChanges',
        payload: { published: previousState.published }
      })
      toast.dismiss(toastId)
      toast.error(t('dashboard.courses.publish_error'))
    } finally {
      setIsPublishing(false)
    }
  }, [
    isPublishing, isPublished, courseStructure, cacheKey,
    session.data?.tokens?.access_token, dispatchCourse, params.orgslug, t
  ])

  if (!courseStructure) {
    return null
  }

  return (
    <aside className="w-64 shrink-0 space-y-6">
      {/* Save state */}
      <div className="w-full">
        <SaveState orgslug={params.orgslug} />
      </div>

      {/* Publish status */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('dashboard.courses.sidebar.status')}
        </p>
        <button
          onClick={togglePublishStatus}
          disabled={isPublishing}
          className={`w-full px-4 py-2.5 text-sm font-semibold flex items-center justify-between rounded-lg border transition-colors ${
            isPublished
              ? 'bg-green-50/70 text-green-700 border-green-200 hover:bg-green-100/70'
              : 'bg-yellow-50/70 text-yellow-700 border-yellow-200 hover:bg-yellow-100/70'
          } ${isPublishing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2">
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPublished ? (
              <Globe className="w-4 h-4" />
            ) : (
              <GlobeLock className="w-4 h-4" />
            )}
            <span>
              {isPublishing
                ? t('dashboard.courses.processing')
                : isPublished
                  ? t('dashboard.courses.published')
                  : t('dashboard.courses.unpublished')
              }
            </span>
          </div>
          <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${
            isPublished
              ? 'bg-green-200/80 text-green-800'
              : 'bg-yellow-200/80 text-yellow-800'
          }`}>
            {isPublished ? t('dashboard.courses.click_to_unpublish') : t('dashboard.courses.click_to_publish')}
          </span>
        </button>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('dashboard.courses.sidebar.quick_actions')}
        </p>
        <div className="space-y-1.5">
          {/* Preview */}
          <Link
            href={getUriWithOrg(org?.slug, '') + `/course/${params.courseuuid}`}
            target="_blank"
            className="w-full px-4 py-2.5 text-sm font-semibold text-neutral-600 bg-neutral-50/70 border border-neutral-200 hover:bg-neutral-100/70 rounded-lg transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>{t('dashboard.courses.preview')}</span>
          </Link>

          {/* Index for AI */}
          {isAIEnabled && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={indexCourseForAI}
                    disabled={isIndexing}
                    className={`w-full px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors flex items-center gap-2 ${
                      isIndexed
                        ? 'bg-blue-50/70 text-blue-700 border-blue-200'
                        : 'bg-purple-50/70 text-purple-700 border-purple-200 hover:bg-purple-100/70'
                    } ${isIndexing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isIndexing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isIndexed ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <BrainCircuit className="w-4 h-4" />
                    )}
                    <span>
                      {isIndexing ? 'Indexing...' : isIndexed ? 'Indexed' : 'Index for AI'}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  <p>Indexes this course's content so the AI Copilot can search and reference it when answering questions. Content is automatically re-indexed when activities are updated.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Course info */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('dashboard.courses.sidebar.course_info')}
        </p>
        <div className="bg-neutral-50/50 border border-neutral-200 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('dashboard.courses.sidebar.chapters')}</span>
            <span className="font-semibold text-gray-700">{chaptersCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('dashboard.courses.sidebar.activities')}</span>
            <span className="font-semibold text-gray-700">{activitiesCount}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
