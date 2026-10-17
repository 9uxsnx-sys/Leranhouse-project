'use client'
import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity, useCommunityDispatch } from '@components/Contexts/CommunityContext'
import { updateCommunityThumbnail, deleteCommunityThumbnail, updateCommunityBanner, deleteCommunityBanner } from '@services/communities/communities'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const MAX_FILE_SIZE = 8_000_000
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const
type ValidImageMimeType = (typeof VALID_IMAGE_MIME_TYPES)[number]

const CommunityMediaSection: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const communityState = useCommunity()
  const community = communityState?.community
  const communityDispatch = useCommunityDispatch()
  const accessToken = session?.data?.tokens?.access_token
  const imageInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [isCoverLoading, setIsCoverLoading] = useState(false)
  const [isBannerLoading, setIsBannerLoading] = useState(false)

  if (!community) return null

  const hasThumbnail = !!community.thumbnail_image
  const hasBanner = !!community.banner_image

  const showError = (message: string) => {
    toast.error(message, { duration: 3000, position: 'top-center' })
  }

  const validateFile = (file: File): boolean => {
    if (!VALID_IMAGE_MIME_TYPES.includes(file.type as ValidImageMimeType)) {
      showError(t('dashboard.courses.communities.media.invalid_file_type'))
      return false
    }
    if (file.size > MAX_FILE_SIZE) {
      showError(t('dashboard.courses.communities.media.file_too_large'))
      return false
    }
    return true
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateFile(file)) {
      event.target.value = ''
      return
    }
    await uploadThumbnail(file)
  }

  const uploadThumbnail = async (file: File) => {
    setIsCoverLoading(true)
    try {
      const formData = new FormData()
      formData.append('thumbnail', file)
      const res = await updateCommunityThumbnail(community.community_uuid, formData, accessToken)
      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      if (org?.id) {
        mutate(`${getAPIUrl()}communities/org/${org.id}/page/1/limit/100`)
      }
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && communityDispatch) {
          communityDispatch({ type: 'setCommunity', payload: res.data })
        }
        toast.success(t('dashboard.courses.communities.media.saved'), { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[CommunityMediaSection] Upload failed:', err)
      showError(t('dashboard.courses.communities.media.cover_upload_error'))
    } finally {
      setIsCoverLoading(false)
    }
  }

  const handleDeleteThumbnail = async () => {
    setIsCoverLoading(true)
    try {
      const res = await deleteCommunityThumbnail(community.community_uuid, accessToken)
      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      if (org?.id) {
        mutate(`${getAPIUrl()}communities/org/${org.id}/page/1/limit/100`)
      }
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && communityDispatch) {
          communityDispatch({ type: 'setCommunity', payload: res.data })
        }
        toast.success(t('dashboard.courses.communities.media.removed'), { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[CommunityMediaSection] Delete failed:', err)
      showError(t('dashboard.courses.communities.media.cover_delete_error'))
    } finally {
      setIsCoverLoading(false)
    }
  }

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
      const res = await updateCommunityBanner(community.community_uuid, formData, accessToken)
      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      if (org?.id) {
        mutate(`${getAPIUrl()}communities/org/${org.id}/page/1/limit/100`)
      }
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && communityDispatch) {
          communityDispatch({ type: 'setCommunity', payload: res.data })
        }
        toast.success(t('dashboard.courses.communities.media.saved'), { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[CommunityMediaSection] Banner upload failed:', err)
      showError(t('dashboard.courses.communities.media.banner_upload_error'))
    } finally {
      setIsBannerLoading(false)
    }
  }

  const handleDeleteBanner = async () => {
    setIsBannerLoading(true)
    try {
      const res = await deleteCommunityBanner(community.community_uuid, accessToken)
      await revalidateTags(['communities'], org.slug)
      mutate(`${getAPIUrl()}communities/${community.community_uuid}`)
      if (org?.id) {
        mutate(`${getAPIUrl()}communities/org/${org.id}/page/1/limit/100`)
      }
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && communityDispatch) {
          communityDispatch({ type: 'setCommunity', payload: res.data })
        }
        toast.success(t('dashboard.courses.communities.media.removed'), { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[CommunityMediaSection] Banner delete failed:', err)
      showError(t('dashboard.courses.communities.media.banner_delete_error'))
    } finally {
      setIsBannerLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
        {t('common.sections.media')}
      </h2>

      {/* Thumbnail row */}
      <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50 mb-3">
        <div className="flex-shrink-0">
          <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">{t('dashboard.courses.communities.media.cover_image')}</p>
        </div>

        {isCoverLoading ? (
          <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : (
          <>
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            {hasThumbnail ? (
              <button
                type="button"
                onClick={handleDeleteThumbnail}
                className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                title={t('dashboard.courses.communities.media.remove_cover')}
              >
                <Trash2 size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title={t('dashboard.courses.communities.media.upload_cover')}
              >
                <UploadCloud size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Banner row */}
      <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
        <div className="flex-shrink-0">
          <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">{t('dashboard.courses.communities.media.banner_image')}</p>
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
                title={t('dashboard.courses.communities.media.remove_banner')}
              >
                <Trash2 size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title={t('dashboard.courses.communities.media.upload_banner')}
              >
                <UploadCloud size={18} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CommunityMediaSection
