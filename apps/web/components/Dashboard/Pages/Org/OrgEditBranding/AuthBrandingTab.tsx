'use client'
import React, { useRef, useState } from 'react'
import { Image as ImageIcon, UploadCloud, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getOrgAuthBackgroundMediaDirectory } from '@services/media/media'
import { toast } from 'react-hot-toast'
import { constructAcceptValue } from '@/lib/constants'
import { uploadOrgAuthBackground } from '@services/settings/org'
import { useTranslation } from 'react-i18next'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'

const SUPPORTED_FILES = constructAcceptValue(['png', 'jpg', 'webp'])
const MAX_FILE_SIZE = 8_000_000
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * Auth page background — one upload row, same interaction as the logo and
 * favicon rows above it: pick a file and it persists immediately, no Save.
 *
 * The auth shell reads `background_type` + `background_image` from the org
 * config, so a successful upload replaces the default black gradient.
 */
export default function AuthBrandingTab() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any
  const inputRef = useRef<HTMLInputElement>(null)

  const authBranding =
    org?.config?.config?.customization?.auth_branding ||
    org?.config?.config?.general?.auth_branding || {}

  const backgroundType: string = authBranding.background_type || 'gradient'
  const backgroundImage: string = authBranding.background_image || ''

  // Uploads store a file name; legacy Unsplash selections store an absolute URL.
  const storedPreview =
    backgroundType === 'custom' && backgroundImage
      ? getOrgAuthBackgroundMediaDirectory(org?.org_uuid, backgroundImage)
      : backgroundType === 'unsplash' && backgroundImage
        ? backgroundImage
        : ''

  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const preview = localPreview || storedPreview
  const hasImage = !!preview

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('dashboard.organization.auth_branding.file_too_large'), {
        duration: 3000,
        position: 'top-center',
      })
      event.target.value = ''
      return
    }
    if (!VALID_IMAGE_MIME_TYPES.includes(file.type)) {
      toast.error(t('dashboard.organization.auth_branding.invalid_file_type'), {
        duration: 3000,
        position: 'top-center',
      })
      event.target.value = ''
      return
    }

    setLocalPreview(URL.createObjectURL(file))
    setIsUploading(true)
    const loadingToast = toast.loading(t('dashboard.organization.auth_branding.uploading'))
    try {
      await uploadOrgAuthBackground(org.id, file, access_token)
      await revalidateTags(['organizations'], org.slug)
      mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
      toast.success(t('dashboard.organization.auth_branding.upload_success'), { id: loadingToast })
      router.refresh()
    } catch (err) {
      console.error('[AuthBrandingTab] Auth background upload failed:', err)
      toast.error(t('dashboard.organization.auth_branding.upload_error'), { id: loadingToast })
      setLocalPreview(null)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
        <div className="flex-shrink-0">
          {hasImage ? (
            <div className="w-10 h-10 rounded-lg border border-gray-100 dark:border-dk-line shadow-sm overflow-hidden bg-white dark:bg-dk-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <ImageIcon size={24} className="text-gray-400 dark:text-zinc-400" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">
            {t('dashboard.organization.auth_branding.background_image')}
          </p>
        </div>
        {isUploading ? (
          <div className="w-[18px] h-[18px] border-2 border-gray-300 dark:border-dk-line-strong border-t-gray-600 rounded-full animate-spin" />
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={SUPPORTED_FILES}
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={
                hasImage
                  ? 'flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer'
                  : 'flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer'
              }
              title={
                hasImage
                  ? t('dashboard.organization.auth_branding.replace_image')
                  : t('dashboard.organization.auth_branding.background_image')
              }
            >
              {hasImage ? <Trash2 size={18} /> : <UploadCloud size={18} />}
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-gray-400 dark:text-zinc-400">
        {t('dashboard.organization.auth_branding.background_image_desc')}
      </p>
    </div>
  )
}
