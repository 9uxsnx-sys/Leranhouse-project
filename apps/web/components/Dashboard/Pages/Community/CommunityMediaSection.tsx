'use client'
import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { useCommunity, useCommunityDispatch } from '@components/Contexts/CommunityContext'
import { updateCommunityThumbnail, deleteCommunityThumbnail } from '@services/communities/communities'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import toast from 'react-hot-toast'

const MAX_FILE_SIZE = 8_000_000
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const
type ValidImageMimeType = (typeof VALID_IMAGE_MIME_TYPES)[number]

const CommunityMediaSection: React.FC = () => {
  const router = useRouter()
  const session = useLHSession() as any
  const org = useOrg() as any
  const communityState = useCommunity()
  const community = communityState?.community
  const communityDispatch = useCommunityDispatch()
  const accessToken = session?.data?.tokens?.access_token
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!community) return null

  const hasThumbnail = !!community.thumbnail_image

  const showError = (message: string) => {
    toast.error(message, { duration: 3000, position: 'top-center' })
  }

  const validateFile = (file: File): boolean => {
    if (!VALID_IMAGE_MIME_TYPES.includes(file.type as ValidImageMimeType)) {
      showError('Invalid file type. Please upload a JPG or PNG image.')
      return false
    }
    if (file.size > MAX_FILE_SIZE) {
      showError('File is too large. Maximum size is 8MB.')
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
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('thumbnail', file)
      console.log('[CommunityMediaSection] Uploading thumbnail...')
      const res = await updateCommunityThumbnail(community.community_uuid, formData, accessToken)
      console.log('[CommunityMediaSection] Upload response:', res)
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
        toast.success('Cover image updated successfully', {
          duration: 3000,
          position: 'top-center',
        })
        router.refresh()
      }
    } catch (err) {
      console.error('[CommunityMediaSection] Upload failed:', err)
      showError('Failed to update cover image')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteThumbnail = async () => {
    setIsLoading(true)
    try {
      console.log('[CommunityMediaSection] Deleting thumbnail...')
      const res = await deleteCommunityThumbnail(community.community_uuid, accessToken)
      console.log('[CommunityMediaSection] Delete response:', res)
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
        toast.success('Cover image removed', {
          duration: 3000,
          position: 'top-center',
        })
        router.refresh()
      }
    } catch (err) {
      console.error('[CommunityMediaSection] Delete failed:', err)
      showError('Failed to remove cover image')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
        Media
      </h2>

      <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
        <div className="flex-shrink-0">
          <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Community Cover Image</p>
        </div>

        {isLoading ? (
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
                title="Remove cover image"
              >
                <Trash2 size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title="Upload cover image"
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
