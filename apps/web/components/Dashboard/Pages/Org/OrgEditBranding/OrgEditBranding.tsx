'use client'
import React, { useState } from 'react'
import { UploadCloud, Info, X, StarIcon, ImageIcon, Palette, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOrg } from '@components/Contexts/OrgContext'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getOrgLogoMediaDirectory, getOrgThumbnailMediaDirectory, getOrgFaviconMediaDirectory, getOrgLogoIconMediaDirectory } from '@services/media/media'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs"
import { toast } from 'react-hot-toast'
import { constructAcceptValue } from '@/lib/constants'
import { uploadOrganizationLogo, uploadOrganizationThumbnail, updateOrgColorConfig, updateOrgFontConfig, uploadOrganizationFavicon, uploadOrganizationLogoIcon } from '@services/settings/org'
import FontSelector from './FontSelector'
import { cn } from '@/lib/utils'
import { Input } from "@components/ui/input"
import { Button } from "@components/ui/button"
import { Label } from "@components/ui/label"
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

  // Theme state
  const [primaryColor, setPrimaryColor] = useState<string>(org?.config?.config?.customization?.general?.color || org?.config?.config?.general?.color || '')
  const [selectedFont, setSelectedFont] = useState<string>(org?.config?.config?.customization?.general?.font || org?.config?.config?.general?.font || '')
  const [isThemeSaving, setIsThemeSaving] = useState(false)

  // Image handlers
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleImageButtonClick = (inputId: string) => (event: React.MouseEvent) => {
    event.preventDefault()
    document.getElementById(inputId)?.click()
  }

  // Theme handlers
  const handleThemeSave = async () => {
    setIsThemeSaving(true)
    const loadingToast = toast.loading(t('dashboard.organization.settings.updating'))
    try {
      await Promise.all([
        updateOrgColorConfig(org.id, primaryColor, access_token),
        updateOrgFontConfig(org.id, selectedFont, access_token),
      ])
      await revalidateTags(['organizations'], org.slug)
      mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
      toast.success(t('dashboard.organization.settings.update_success'), { id: loadingToast })
      router.refresh()
    } catch (err) {
      toast.error(t('dashboard.organization.settings.update_error'), { id: loadingToast })
    } finally {
      setIsThemeSaving(false)
    }
  }

  const handleClearColor = () => {
    setPrimaryColor('')
  }

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex || hex.length < 7) return 'transparent'
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <div className="sm:mx-10 mx-0 bg-white rounded-xl nice-shadow px-3 py-3 sm:mb-0 mb-16">
      <div className="flex flex-col bg-gray-50 -space-y-1 px-5 py-3 mb-2 rounded-md">
        <h1 className="font-bold text-xl text-gray-800">
          {t('dashboard.organization.branding.title')}
        </h1>
        <h2 className="text-gray-500 text-md">
          {t('dashboard.organization.branding.subtitle')}
        </h2>
      </div>

      <Tabs defaultValue="logo" className="w-full">
        <TabsList className="flex w-full p-1 bg-gray-100 rounded-lg gap-1 overflow-x-auto">
          <TabsTrigger
            value="logo"
            className="flex-1 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-xs transition-all flex items-center justify-center space-x-2 px-3"
          >
            <StarIcon size={14} />
            <span className="hidden sm:inline">{t('dashboard.organization.images.tabs.logo')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="theme"
            className="flex-1 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-xs transition-all flex items-center justify-center space-x-2 px-3"
          >
            <Palette size={14} />
            <span className="hidden sm:inline">{t('dashboard.organization.branding.tabs.theme')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="flex-1 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-xs transition-all flex items-center justify-center space-x-2 px-3"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">{t('dashboard.organization.branding.tabs.auth')}</span>
          </TabsTrigger>
          <TabsTrigger
            value="thumbnail"
            className="flex-1 min-w-fit data-[state=active]:bg-white data-[state=active]:shadow-xs transition-all flex items-center justify-center space-x-2 px-3"
          >
            <ImageIcon size={14} />
            <span className="hidden sm:inline">{t('dashboard.organization.images.tabs.thumbnail')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Logo Tab */}
        <TabsContent value="logo" className="mt-4">
              <div className="flex flex-col space-y-5 w-full">
                <div className="w-full bg-linear-to-b from-gray-50 to-white rounded-xl transition-all duration-300 py-8">
                  <div className="flex flex-col justify-center items-center space-y-8">
                    <div className="relative group">
                      <div
                        className={cn(
                          "w-[200px] sm:w-[250px] h-[100px] sm:h-[125px] bg-contain bg-no-repeat bg-center rounded-lg shadow-md bg-white",
                          "border-2 border-gray-100 hover:border-blue-200 transition-all duration-300",
                          isLogoUploading && "opacity-50"
                        )}
                        style={{ backgroundImage: `url(${localLogo || getOrgLogoMediaDirectory(org?.org_uuid, org?.logo_image)})` }}
                      />
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <input
                        type="file"
                        id="fileInput"
                        accept={SUPPORTED_FILES}
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        disabled={isLogoUploading}
                        className={cn(
                          "font-medium text-sm px-6 py-2.5 rounded-full",
                          "bg-linear-to-r from-blue-500 to-blue-600 text-white",
                          "hover:from-blue-600 hover:to-blue-700",
                          "shadow-xs hover:shadow-sm transition-all duration-300",
                          "flex items-center space-x-2",
                          isLogoUploading && "opacity-75 cursor-not-allowed"
                        )}
                        onClick={handleImageButtonClick('fileInput')}
                      >
                        <UploadCloud size={18} className={cn("", isLogoUploading && "animate-bounce")} />
                        <span>{isLogoUploading ? t('dashboard.organization.images.uploading') : t('dashboard.organization.images.upload_logo')}</span>
                      </button>

                      <div className="flex flex-col text-xs space-y-2 items-center text-gray-500">
                        <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                          <Info size={14} />
                          <p className="font-medium">{t('dashboard.organization.images.accepted_files')}</p>
                        </div>
                        <p className="text-gray-400">{t('dashboard.organization.images.recommended_size')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="w-full border-t border-gray-100 pt-6">
                  <div className="flex flex-col justify-center items-center space-y-6">
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={cn(
                          "w-8 h-8 bg-contain bg-no-repeat bg-center rounded bg-white",
                          "border-2 border-gray-100 hover:border-blue-200 transition-all duration-300",
                          isFaviconUploading && "opacity-50"
                        )}
                        style={{ backgroundImage: `url(${localFavicon || ((org?.config?.config?.customization?.general?.favicon_image || org?.config?.config?.general?.favicon_image) ? getOrgFaviconMediaDirectory(org?.org_uuid, org?.config?.config?.customization?.general?.favicon_image || org?.config?.config?.general?.favicon_image) : '')})` }}
                      />
                      <p className="text-xs text-gray-400">Favicon preview (32×32)</p>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <input
                        type="file"
                        id="faviconInput"
                        accept={SUPPORTED_FILES}
                        className="hidden"
                        onChange={handleFaviconChange}
                      />
                      <button
                        type="button"
                        disabled={isFaviconUploading}
                        className={cn(
                          "font-medium text-sm px-6 py-2.5 rounded-full",
                          "bg-linear-to-r from-gray-600 to-gray-700 text-white",
                          "hover:from-gray-700 hover:to-gray-800",
                          "shadow-xs hover:shadow-sm transition-all duration-300",
                          "flex items-center space-x-2",
                          isFaviconUploading && "opacity-75 cursor-not-allowed"
                        )}
                        onClick={handleImageButtonClick('faviconInput')}
                      >
                        <UploadCloud size={18} className={cn("", isFaviconUploading && "animate-bounce")} />
                        <span>{isFaviconUploading ? t('dashboard.organization.images.uploading') : 'Upload Favicon'}</span>
                      </button>

                      <div className="flex flex-col text-xs space-y-2 items-center text-gray-500">
                        <div className="flex items-center space-x-2 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full">
                          <Info size={14} />
                          <p className="font-medium">{t('dashboard.organization.images.accepted_files')}</p>
                        </div>
                        <p className="text-gray-400">Recommended: 32×32px or 64×64px PNG</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logomark Upload */}
                <div className="w-full border-t border-gray-100 pt-6">
                  <div className="flex flex-col justify-center items-center space-y-6">
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={cn(
                          "w-[48px] h-[48px] bg-contain bg-no-repeat bg-center rounded-lg bg-white",
                          "border-2 border-gray-100 hover:border-blue-200 transition-all duration-300",
                          isLogoIconUploading && "opacity-50"
                        )}
                        style={{ backgroundImage: `url(${localLogoIcon || (org?.logo_icon ? getOrgLogoIconMediaDirectory(org?.org_uuid, org?.logo_icon) : '')})` }}
                      />
                      <p className="text-xs text-gray-400">Logomark preview (square icon)</p>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <input
                        type="file"
                        id="logoIconInput"
                        accept={SUPPORTED_FILES}
                        className="hidden"
                        onChange={handleLogoIconChange}
                      />
                      <button
                        type="button"
                        disabled={isLogoIconUploading}
                        className={cn(
                          "font-medium text-sm px-6 py-2.5 rounded-full",
                          "bg-linear-to-r from-emerald-500 to-emerald-600 text-white",
                          "hover:from-emerald-600 hover:to-emerald-700",
                          "shadow-xs hover:shadow-sm transition-all duration-300",
                          "flex items-center space-x-2",
                          isLogoIconUploading && "opacity-75 cursor-not-allowed"
                        )}
                        onClick={handleImageButtonClick('logoIconInput')}
                      >
                        <UploadCloud size={18} className={cn("", isLogoIconUploading && "animate-bounce")} />
                        <span>{isLogoIconUploading ? 'Uploading...' : 'Upload Logomark'}</span>
                      </button>

                      <div className="flex flex-col text-xs space-y-2 items-center text-gray-500">
                        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                          <Info size={14} />
                          <p className="font-medium">PNG, JPG</p>
                        </div>
                        <p className="text-gray-400">Recommended: 512×512px square</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        </TabsContent>

        {/* Thumbnail Tab */}
        <TabsContent value="thumbnail" className="mt-4">
              <div className="flex flex-col space-y-5 w-full">
                <div className="w-full bg-linear-to-b from-gray-50 to-white rounded-xl transition-all duration-300 py-8">
                  <div className="flex flex-col justify-center items-center space-y-8">
                    <div className="relative group">
                      <div
                        className={cn(
                          "w-[200px] sm:w-[250px] h-[100px] sm:h-[125px] bg-contain bg-no-repeat bg-center rounded-lg shadow-md bg-white",
                          "border-2 border-gray-100 hover:border-purple-200 transition-all duration-300",
                          isThumbnailUploading && "opacity-50"
                        )}
                        style={{ backgroundImage: `url(${localThumbnail || getOrgThumbnailMediaDirectory(org?.org_uuid, org?.thumbnail_image)})` }}
                      />
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <input
                        type="file"
                        id="thumbnailInput"
                        accept={SUPPORTED_FILES}
                        className="hidden"
                        onChange={handleThumbnailChange}
                      />
                      <button
                        type="button"
                        disabled={isThumbnailUploading}
                        className={cn(
                          "font-medium text-sm px-6 py-2.5 rounded-full",
                          "bg-linear-to-r from-purple-500 to-purple-600 text-white",
                          "hover:from-purple-600 hover:to-purple-700",
                          "shadow-xs hover:shadow-sm transition-all duration-300",
                          "flex items-center space-x-2",
                          isThumbnailUploading && "opacity-75 cursor-not-allowed"
                        )}
                        onClick={handleImageButtonClick('thumbnailInput')}
                      >
                        <UploadCloud size={18} className={cn("", isThumbnailUploading && "animate-bounce")} />
                        <span>{isThumbnailUploading ? t('dashboard.organization.images.uploading') : t('dashboard.organization.images.upload_thumbnail')}</span>
                      </button>

                      <div className="flex flex-col text-xs space-y-2 items-center text-gray-500">
                        <div className="flex items-center space-x-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
                          <Info size={14} />
                          <p className="font-medium">{t('dashboard.organization.images.accepted_files')}</p>
                        </div>
                        <p className="text-gray-400">{t('dashboard.organization.images.recommended_size')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="mt-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Color Picker */}
            <div className="flex-1 bg-gray-50/50 rounded-xl p-5">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">{t('dashboard.organization.theme.primary_color')}</Label>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={primaryColor || '#ffffff'}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors"
                    style={{ padding: 0 }}
                  />
                </div>
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="No color"
                  className="w-28 h-10 font-mono text-sm uppercase bg-white"
                  maxLength={7}
                />
                {primaryColor && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearColor}
                    disabled={isThemeSaving}
                    className="text-gray-400 hover:text-gray-600 h-10 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">{t('dashboard.organization.theme.primary_color_desc')}</p>
            </div>

            {/* Font Selector */}
            <div className="flex-1 bg-gray-50/50 rounded-xl p-5">
              <FontSelector value={selectedFont} onChange={setSelectedFont} />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mt-6">
            {/* Preview */}
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">{t('dashboard.organization.theme.preview')}</Label>

              <div
                className="rounded-xl overflow-hidden border border-gray-200"
                style={{ backgroundColor: primaryColor ? hexToRgba(primaryColor, 0.05) : '#f9fafb' }}
              >
                {/* Header Preview */}
                <div
                  className="h-10 px-3 flex items-center justify-between"
                  style={{ backgroundColor: primaryColor || 'rgba(255, 255, 255, 0.9)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded"
                      style={{ backgroundColor: primaryColor ? 'rgba(255, 255, 255, 0.25)' : '#e5e7eb' }}
                    />
                    <div
                      className="h-2 w-12 rounded-full"
                      style={{ backgroundColor: primaryColor ? 'rgba(255, 255, 255, 0.5)' : '#d1d5db' }}
                    />
                  </div>
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: primaryColor ? 'rgba(255, 255, 255, 0.25)' : '#e5e7eb' }}
                  />
                </div>
                {/* Content Preview */}
                <div className="p-3 flex gap-2">
                  <div className="w-16 h-10 rounded bg-white shadow-sm" />
                  <div className="w-16 h-10 rounded bg-white shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-5">
            <Button
              onClick={handleThemeSave}
              disabled={isThemeSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isThemeSaving ? t('dashboard.organization.settings.saving') : t('dashboard.organization.settings.save_changes')}
            </Button>
          </div>
        </TabsContent>

        {/* Auth Branding Tab */}
        <TabsContent value="auth" className="mt-4">
          <AuthBrandingTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
