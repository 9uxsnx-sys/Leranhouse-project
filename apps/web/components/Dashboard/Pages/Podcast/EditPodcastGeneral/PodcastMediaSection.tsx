'use client'
import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { usePodcast } from '@components/Contexts/PodcastContext'
import {
  updatePodcastThumbnail,
  deletePodcastThumbnail,
  updatePodcastBanner,
  deletePodcastBanner,
} from '@services/podcasts/podcasts'
import { revalidateTags } from '@services/utils/ts/requests'
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

const PodcastMediaSection: React.FC = () => {
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const { podcast, refreshPodcast, setPodcast } = usePodcast()
  const accessToken = session?.data?.tokens?.access_token
  const coverInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [isCoverLoading, setIsCoverLoading] = useState(false)
  const [isBannerLoading, setIsBannerLoading] = useState(false)

  if (!podcast) return null

  const hasCover = !!podcast.thumbnail_image
  const hasBanner = !!podcast.banner_image

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
      const res = await updatePodcastThumbnail(podcast.podcast_uuid, formData, accessToken)
      await revalidateTags(['podcasts'], org.slug)
      await refreshPodcast()
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && setPodcast) {
          setPodcast({ ...podcast, thumbnail_image: res.data.thumbnail_image })
        }
        toast.success('Cover image updated successfully', { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[PodcastMediaSection] Cover upload failed:', err)
      showError('Failed to update cover image')
    } finally {
      setIsCoverLoading(false)
    }
  }

  const handleDeleteCover = async () => {
    setIsCoverLoading(true)
    try {
      const res = await deletePodcastThumbnail(podcast.podcast_uuid, accessToken)
      await revalidateTags(['podcasts'], org.slug)
      await refreshPodcast()
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && setPodcast) {
          setPodcast({ ...podcast, thumbnail_image: '' })
        }
        toast.success('Cover image removed', { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[PodcastMediaSection] Cover delete failed:', err)
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
      const res = await updatePodcastBanner(podcast.podcast_uuid, formData, accessToken)
      await revalidateTags(['podcasts'], org.slug)
      await refreshPodcast()
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && setPodcast) {
          setPodcast({ ...podcast, banner_image: res.data.banner_image })
        }
        toast.success('Banner image updated successfully', { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[PodcastMediaSection] Banner upload failed:', err)
      showError('Failed to update banner image')
    } finally {
      setIsBannerLoading(false)
    }
  }

  const handleDeleteBanner = async () => {
    setIsBannerLoading(true)
    try {
      const res = await deletePodcastBanner(podcast.podcast_uuid, accessToken)
      await revalidateTags(['podcasts'], org.slug)
      await refreshPodcast()
      await new Promise((r) => setTimeout(r, 1000))
      if (res.success === false) {
        showError(res.HTTPmessage)
      } else {
        if (res.data && setPodcast) {
          setPodcast({ ...podcast, banner_image: '' })
        }
        toast.success('Banner image removed', { duration: 3000, position: 'top-center' })
        router.refresh()
      }
    } catch (err) {
      console.error('[PodcastMediaSection] Banner delete failed:', err)
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
        {/* ════════ Podcast Card Cover ════════ */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex-shrink-0">
            <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Podcast Card Cover</p>
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

        {/* ════════ Podcast Banner Image ════════ */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div className="flex-shrink-0">
            <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Podcast Banner Image</p>
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

export default PodcastMediaSection
