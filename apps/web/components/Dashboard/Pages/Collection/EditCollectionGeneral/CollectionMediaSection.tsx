'use client'
import React, { useRef, useState } from 'react'
import { Image as ImageIcon, Trash2, UploadCloud } from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  deleteCollectionBanner,
  deleteCollectionThumbnail,
  updateCollectionBanner,
  updateCollectionThumbnail,
} from '@services/courses/collections'
import { revalidateTags } from '@services/utils/ts/requests'
import { getAPIUrl } from '@services/config/config'
import { mutate } from 'swr'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const MAX_FILE_SIZE = 8_000_000
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const
type ValidImageMimeType = (typeof VALID_IMAGE_MIME_TYPES)[number]

const validateFile = (file: File, t: any): boolean => {
  if (file.size > MAX_FILE_SIZE) {
    toast.error(t('dashboard.courses.general.media.file_too_large'), {
      duration: 3000,
      position: 'top-center',
    })
    return false
  }
  if (!VALID_IMAGE_MIME_TYPES.includes(file.type as ValidImageMimeType)) {
    toast.error(t('dashboard.courses.general.media.invalid_file_type'), {
      duration: 3000,
      position: 'top-center',
    })
    return false
  }
  return true
}

type CollectionMediaSectionProps = {
  collection: any
  onUpdated?: (fields: Record<string, any>) => void
}

const CollectionMediaSection: React.FC<CollectionMediaSectionProps> = ({
  collection,
  onUpdated,
}) => {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const accessToken = session?.data?.tokens?.access_token
  const coverInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [isCoverLoading, setIsCoverLoading] = useState(false)
  const [isBannerLoading, setIsBannerLoading] = useState(false)

  if (!collection) return null

  const hasCover = !!collection.thumbnail_image
  const hasBanner = !!collection.banner_image

  const showError = (message: string) => {
    toast.error(message, { duration: 3000, position: 'top-center' })
  }

  const refreshLists = async () => {
    await revalidateTags(['collections'], org.slug)
    if (org?.id) {
      mutate(`${getAPIUrl()}collections/org/${org.id}/page/1/limit/100`)
    }
  }

  // ── Card Cover handlers ────────────────────────────────────────────────────

  const handleCoverFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateFile(file, t)) {
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
      formData.append('thumbnail_type', 'image')
      const res = await updateCollectionThumbnail(
        collection.collection_uuid,
        formData,
        accessToken
      )
      await refreshLists()
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        onUpdated?.({
          thumbnail_image: res.data?.thumbnail_image,
          thumbnail_type: res.data?.thumbnail_type,
        })
        toast.success(t('dashboard.courses.save.saved'), {
          duration: 3000,
          position: 'top-center',
        })
      }
    } catch (err) {
      console.error('[CollectionMediaSection] Cover upload failed:', err)
      showError(t('dashboard.courses.general.media.cover_update_failed'))
    } finally {
      setIsCoverLoading(false)
    }
  }

  const handleDeleteCover = async () => {
    setIsCoverLoading(true)
    try {
      const res = await deleteCollectionThumbnail(
        collection.collection_uuid,
        accessToken
      )
      await refreshLists()
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        onUpdated?.({ thumbnail_image: '', thumbnail_type: 'image' })
        toast.success(t('dashboard.courses.general.media.removed'), {
          duration: 3000,
          position: 'top-center',
        })
      }
    } catch (err) {
      console.error('[CollectionMediaSection] Cover delete failed:', err)
      showError(t('dashboard.courses.general.media.cover_remove_failed'))
    } finally {
      setIsCoverLoading(false)
    }
  }

  // ── Banner handlers ────────────────────────────────────────────────────────

  const handleBannerFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateFile(file, t)) {
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
      const res = await updateCollectionBanner(
        collection.collection_uuid,
        formData,
        accessToken
      )
      await refreshLists()
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        onUpdated?.({ banner_image: res.data?.banner_image })
        toast.success(t('dashboard.courses.save.saved'), {
          duration: 3000,
          position: 'top-center',
        })
      }
    } catch (err) {
      console.error('[CollectionMediaSection] Banner upload failed:', err)
      showError(t('dashboard.courses.general.media.banner_update_failed'))
    } finally {
      setIsBannerLoading(false)
    }
  }

  const handleDeleteBanner = async () => {
    setIsBannerLoading(true)
    try {
      const res = await deleteCollectionBanner(
        collection.collection_uuid,
        accessToken
      )
      await refreshLists()
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        onUpdated?.({ banner_image: '' })
        toast.success(t('dashboard.courses.general.media.removed'), {
          duration: 3000,
          position: 'top-center',
        })
      }
    } catch (err) {
      console.error('[CollectionMediaSection] Banner delete failed:', err)
      showError(t('dashboard.courses.general.media.banner_remove_failed'))
    } finally {
      setIsBannerLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
        {t('common.sections.media')}
      </h2>

      <div className="space-y-3">
        {/* ════════ Card Cover Image ════════ */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex-shrink-0">
            <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">
              {t('dashboard.courses.general.media.cover_title')}
            </p>
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
                  title={t('dashboard.courses.general.media.remove_cover')}
                >
                  <Trash2 size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title={t('dashboard.courses.general.media.upload_cover')}
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
            <p className="text-sm font-medium text-gray-700">
              {t('dashboard.courses.general.media.banner_title')}
            </p>
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
                  title={t('dashboard.courses.general.media.remove_banner')}
                >
                  <Trash2 size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title={t('dashboard.courses.general.media.upload_banner')}
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

export default CollectionMediaSection
