'use client'
import React, { useState, useRef } from 'react'
import { UploadCloud, X, ImageIcon, Trash2, Check, SaveAllIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getOrgLogoMediaDirectory, getOrgFaviconMediaDirectory, getOrgLogoIconMediaDirectory } from '@services/media/media'
import { toast } from 'react-hot-toast'
import { constructAcceptValue } from '@/lib/constants'
import { uploadOrganizationLogo, uploadOrganizationThumbnail, updateOrgColorConfig, uploadOrganizationFavicon, uploadOrganizationLogoIcon } from '@services/settings/org'
import { Input } from "@components/ui/input"
import { useTranslation } from 'react-i18next'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import AuthBrandingTab from './AuthBrandingTab'

const SUPPORTED_FILES = constructAcceptValue(['png', 'jpg', 'svg'])

export default function OrgEditBranding() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const org = useOrg() as any

  const [localLogo, setLocalLogo] = useState<string | null>(null)
  const [localThumbnail, setLocalThumbnail] = useState<string | null>(null)
  const [localFavicon, setLocalFavicon] = useState<string | null>(null)
  const [localLogoIcon, setLocalLogoIcon] = useState<string | null>(null)
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false)
  const [isFaviconUploading, setIsFaviconUploading] = useState(false)
  const [isLogoIconUploading, setIsLogoIconUploading] = useState(false)

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const logoIconInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Theme state
  const [primaryColor, setPrimaryColor] = useState<string>(org?.config?.config?.customization?.general?.color || org?.config?.config?.general?.color || '')
  const [isSaved, setIsSaved] = useState(true)
  const [isManualSaving, setIsManualSaving] = useState(false)
  const isActiveSaving = isManualSaving

  // Image state checks
  const hasLogo = !!org?.logo_image
  const hasFavicon = !!(org?.config?.config?.customization?.general?.favicon_image || org?.config?.config?.general?.favicon_image)
  const hasLogoIcon = !!org?.logo_icon
  const hasThumbnail = !!org?.thumbnail_image

  // Logo handler
  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      setLocalLogo(URL.createObjectURL(file))
      setIsLogoUploading(true)
      const loadingToast = toast.loading(t('dashboard.organization.images.uploading_logo'))
      try {
        await uploadOrganizationLogo(org.id, file, access_token)
        await new Promise((r) => setTimeout(r, 1500))
        toast.success(t('dashboard.organization.images.toasts.logo_success'), { id: loadingToast })
        await revalidateTags(['organizations'], org.slug)
        mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
        router.refresh()
      } catch (err) {
        toast.error(t('dashboard.organization.images.toasts.logo_error'), { id: loadingToast })
      } finally {
        setIsLogoUploading(false)
      }
    }
  }

  // Thumbnail handler
  const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      setLocalThumbnail(URL.createObjectURL(file))
      setIsThumbnailUploading(true)
      const loadingToast = toast.loading(t('dashboard.organization.images.uploading_thumbnail'))
      try {
        await uploadOrganizationThumbnail(org.id, file, access_token)
        await new Promise((r) => setTimeout(r, 1500))
        toast.success(t('dashboard.organization.images.toasts.thumbnail_success'), { id: loadingToast })
        router.refresh()
      } catch (err) {
        toast.error(t('dashboard.organization.images.toasts.thumbnail_error'), { id: loadingToast })
      } finally {
        setIsThumbnailUploading(false)
      }
    }
  }

  // Favicon handler
  const handleFaviconChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      setLocalFavicon(URL.createObjectURL(file))
      setIsFaviconUploading(true)
      const loadingToast = toast.loading(t('dashboard.organization.images.uploading'))
      try {
        await uploadOrganizationFavicon(org.id, file, access_token)
        await new Promise((r) => setTimeout(r, 1500))
        toast.success(t('dashboard.organization.images.toasts.logo_success'), { id: loadingToast })
        await revalidateTags(['organizations'], org.slug)
        mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
        router.refresh()
      } catch (err) {
        toast.error(t('dashboard.organization.images.toasts.logo_error'), { id: loadingToast })
      } finally {
        setIsFaviconUploading(false)
      }
    }
  }

  // Logomark handler
  const handleLogoIconChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      setLocalLogoIcon(URL.createObjectURL(file))
      setIsLogoIconUploading(true)
      const loadingToast = toast.loading('Uploading logomark...')
      try {
        await uploadOrganizationLogoIcon(org.id, file, access_token)
        await new Promise((r) => setTimeout(r, 1500))
        toast.success('Logomark updated', { id: loadingToast })
        await revalidateTags(['organizations'], org.slug)
        mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
        router.refresh()
      } catch (err) {
        toast.error('Failed to upload logomark', { id: loadingToast })
      } finally {
        setIsLogoIconUploading(false)
      }
    }
  }

  // Theme handlers
  const handleThemeSave = async () => {
    if (isActiveSaving) return
    setIsManualSaving(true)
    const loadingToast = toast.loading(t('dashboard.organization.settings.updating'))
    try {
      await updateOrgColorConfig(org.id, primaryColor, access_token)
      await revalidateTags(['organizations'], org.slug)
      mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
      setIsSaved(true)
      toast.success(t('dashboard.organization.settings.update_success'), { id: loadingToast })
    } catch (err) {
      toast.error(t('dashboard.organization.settings.update_error'), { id: loadingToast })
    } finally {
      setIsManualSaving(false)
    }
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(e.target.value)
    setIsSaved(false)
  }

  const handleClearColor = () => {
    setPrimaryColor('')
    setIsSaved(false)
  }

  return (
    <div className="space-y-3">
      {/* ===== Action Row ===== */}
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isSaved ? undefined : handleThemeSave}
            disabled={isActiveSaving}
            className={`inline-flex items-center gap-2 px-2 py-1 text-sm font-semibold rounded-lg border transition-colors ${
              isActiveSaving
                ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                : isSaved
                  ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                  : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
            }`}
          >
            {isActiveSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isSaved ? (
              <Check size={14} />
            ) : (
              <SaveAllIcon size={14} />
            )}
            <span>
              {isActiveSaving
                ? 'Saving...'
                : isSaved
                  ? 'Saved'
                  : 'Save'}
            </span>
          </button>
        </div>
      </div>

      {/* Logo & Favicon Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('dashboard.organization.images.tabs.logo')} &amp; Favicon
        </h3>
        <div className="space-y-3">
          {/* Logo Upload */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
            <div className="flex-shrink-0">
              <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Logo</p>
            </div>
            {isLogoUploading ? (
              <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <>
                <input
                  ref={logoInputRef}
                  type="file"
                  className="hidden"
                  accept={SUPPORTED_FILES}
                  onChange={handleLogoChange}
                />
                {hasLogo ? (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    title="Upload logo"
                  >
                    <UploadCloud size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Favicon Upload */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
            <div className="flex-shrink-0">
              <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Favicon</p>
            </div>
            {isFaviconUploading ? (
              <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <>
                <input
                  ref={faviconInputRef}
                  type="file"
                  className="hidden"
                  accept={SUPPORTED_FILES}
                  onChange={handleFaviconChange}
                />
                {hasFavicon ? (
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove favicon"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    title="Upload favicon"
                  >
                    <UploadCloud size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Logomark Upload */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
            <div className="flex-shrink-0">
              <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Logomark</p>
            </div>
            {isLogoIconUploading ? (
              <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <>
                <input
                  ref={logoIconInputRef}
                  type="file"
                  className="hidden"
                  accept={SUPPORTED_FILES}
                  onChange={handleLogoIconChange}
                />
                {hasLogoIcon ? (
                  <button
                    type="button"
                    onClick={() => logoIconInputRef.current?.click()}
                    className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove logomark"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoIconInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    title="Upload logomark"
                  >
                    <UploadCloud size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
            <div className="flex-shrink-0">
              <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{t('dashboard.organization.images.tabs.thumbnail')}</p>
            </div>
            {isThumbnailUploading ? (
              <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  className="hidden"
                  accept={SUPPORTED_FILES}
                  onChange={handleThumbnailChange}
                />
                {hasThumbnail ? (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove thumbnail"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    title="Upload thumbnail"
                  >
                    <UploadCloud size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Theme Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('dashboard.organization.branding.tabs.theme')}
        </h3>
        <div className="space-y-3">
          {/* Color Picker Container — matches upload row pattern */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
            {/* Color preview square */}
            <div className="flex-shrink-0">
              <div
                className="w-10 h-10 rounded-lg border border-gray-100 shadow-sm"
                style={{ backgroundColor: primaryColor || '#ffffff' }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{t('dashboard.organization.theme.primary_color')}</p>
            </div>
            {/* Hex input — card styling, no blue focus */}
            <Input
              type="text"
              value={primaryColor}
              onChange={handleHexInputChange}
              placeholder="No color"
              className="w-24 h-10 rounded-lg border border-gray-100 !shadow-sm font-mono text-sm uppercase bg-white focus-visible:!shadow-sm focus-visible:border-gray-100 focus:outline-none"
              maxLength={7}
            />
            {primaryColor && (
              <button
                type="button"
                onClick={handleClearColor}
                className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title="Clear color"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">{t('dashboard.organization.theme.primary_color_desc')}</p>
        </div>
      </div>

      {/* Auth Page Branding Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
          {t('dashboard.organization.branding.tabs.auth')}
        </h3>
        <AuthBrandingTab />
      </div>
    </div>
  )
}
