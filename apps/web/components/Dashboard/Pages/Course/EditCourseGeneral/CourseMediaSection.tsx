'use client'
import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCourse, useCourseDispatch } from '@components/Contexts/CourseContext'
import {
  updateCourseThumbnail,
  deleteCourseThumbnail,
  updateCourseBanner,
  deleteCourseBanner,
} from '@services/courses/courses'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import toast from 'react-hot-toast'

const MAX_FILE_SIZE = 8_000_000
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const
type ValidImageMimeType = (typeof VALID_IMAGE_MIME_TYPES)[number]

const validateFile = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE) {
    toast.error('File size must be less than 8MB', { duration: 3000, position: 'top-center' })
    return false
  }
  if (!VALID_IMAGE_MIME_TYPES.includes(file.type as ValidImageMimeType)) {
    toast.error('File must be a JPEG or PNG image', { duration: 3000, position: 'top-center' })
    return false
  }
  return true
}

const CourseMediaSection: React.FC = () => {
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const courseState = useCourse()
  const course = courseState?.courseStructure
  const courseDispatch = useCourseDispatch()
  const accessToken = session?.data?.tokens?.access_token
  const coverInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [isCoverLoading, setIsCoverLoading] = useState(false)
  const [isBannerLoading, setIsBannerLoading] = useState(false)

  if (!course) return null

  const hasCover = !!course.thumbnail_image
  const hasBanner = !!course.banner_image

  const showError = (message: string) => {
    toast.error(message, { duration: 3000, position: 'top-center' })
  }

  // ── Card Cover handlers ────────────────────────────────────────────────────

  const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateFile(file)) {
      event.target.value = ''
      return
    }
    await uploadCover(file)
  }

  const uploadCover = async (file: File) => {
    setIsCoverLoading(true)
    try {
      const formData = new FormData()
      formData.append('thumbnail', file)
      const res = await updateCourseThumbnail(course.course_uuid, formData, accessToken)
      await revalidateTags(['courses'], org.slug)
      mutate(`${getAPIUrl()}courses/${course.course_uuid}/meta?with_unpublished_activities=false&slim=true`)
      if (org?.id) {
        mutate(`${getAPIUrl()}courses/org/${org.id}/page/1/limit/100`)
      }
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && courseDispatch) {
          courseDispatch({ type: 'updateField', payload: { field: 'thumbnail_image', value: res.data.thumbnail_image } })
        }
        toast.success('Cover image updated successfully', { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[CourseMediaSection] Cover upload failed:', err)
      showError('Failed to update cover image')
    } finally {
      setIsCoverLoading(false)
    }
  }

  const handleDeleteCover = async () => {
    setIsCoverLoading(true)
    try {
      const res = await deleteCourseThumbnail(course.course_uuid, accessToken)
      await revalidateTags(['courses'], org.slug)
      mutate(`${getAPIUrl()}courses/${course.course_uuid}/meta?with_unpublished_activities=false&slim=true`)
      if (org?.id) {
        mutate(`${getAPIUrl()}courses/org/${org.id}/page/1/limit/100`)
      }
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && courseDispatch) {
          courseDispatch({ type: 'updateField', payload: { field: 'thumbnail_image', value: '' } })
        }
        toast.success('Cover image removed', { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[CourseMediaSection] Cover delete failed:', err)
      showError('Failed to remove cover image')
    } finally {
      setIsCoverLoading(false)
    }
  }

  // ── Banner handlers ────────────────────────────────────────────────────────

  const handleBannerFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateFile(file)) {
      event.target.value = ''
      return
    }
    await uploadBanner(file)
  }

  const uploadBanner = async (file: File) => {
    setIsBannerLoading(true)
    try {
      const formData = new FormData()
      formData.append('banner', file)
      const res = await updateCourseBanner(course.course_uuid, formData, accessToken)
      await revalidateTags(['courses'], org.slug)
      mutate(`${getAPIUrl()}courses/${course.course_uuid}/meta?with_unpublished_activities=false&slim=true`)
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && courseDispatch) {
          courseDispatch({ type: 'updateField', payload: { field: 'banner_image', value: res.data.banner_image } })
        }
        toast.success('Banner image updated successfully', { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[CourseMediaSection] Banner upload failed:', err)
      showError('Failed to update banner image')
    } finally {
      setIsBannerLoading(false)
    }
  }

  const handleDeleteBanner = async () => {
    setIsBannerLoading(true)
    try {
      const res = await deleteCourseBanner(course.course_uuid, accessToken)
      await revalidateTags(['courses'], org.slug)
      mutate(`${getAPIUrl()}courses/${course.course_uuid}/meta?with_unpublished_activities=false&slim=true`)
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && courseDispatch) {
          courseDispatch({ type: 'updateField', payload: { field: 'banner_image', value: '' } })
        }
        toast.success('Banner image removed', { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[CourseMediaSection] Banner delete failed:', err)
      showError('Failed to remove banner image')
    } finally {
      setIsBannerLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
        Media
      </h2>

      <div className="space-y-3">
        {/* ════════ Card Cover Image ════════ */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex-shrink-0">
            <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Course Card Cover</p>
          </div>

          {isCoverLoading ? (
            <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <>
              <input
                ref={coverInputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png"
                onChange={handleCoverFileChange}
              />
              {hasCover ? (
                <button
                  type="button"
                  onClick={handleDeleteCover}
                  className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove cover image"
                >
                  <Trash2 size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Upload cover image"
                >
                  <UploadCloud size={18} />
                </button>
              )}
            </>
          )}
        </div>

        {/* ════════ Banner Image ════════ */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex-shrink-0">
            <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Course Banner Image</p>
          </div>

          {isBannerLoading ? (
            <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png"
                onChange={handleBannerFileChange}
              />
              {hasBanner ? (
                <button
                  type="button"
                  onClick={handleDeleteBanner}
                  className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove banner image"
                >
                  <Trash2 size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="Upload banner image"
                >
                  <UploadCloud size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseMediaSection
