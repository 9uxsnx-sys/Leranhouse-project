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
import { Switch } from '@components/ui/switch'
import { useTranslation } from 'react-i18next'
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'
import { getAPIUrl } from '@services/config/config'
import { getContrastRatio, normalizeBrandColor, resolveBrandFg, resolveBrandHover, deriveDarkBrand } from '@services/utils/ts/colorUtils'
import AuthBrandingTab from './AuthBrandingTab'

const SUPPORTED_FILES = constructAcceptValue(['png', 'jpg', 'svg'])

type ThemeCardValues = {
  color: string
  fg: string
  hover: string
  sidebar: boolean
}

/**
 * One theme card — the same four controls for light and dark. The card owns
 * its previews so the resolved (or derived) colours are shown while editing,
 * and reports every change upward so the Branding action row can save both.
 */
function ThemeCard({
  title,
  values,
  fallbackBrand,
  onChange,
}: {
  title: string
  values: ThemeCardValues
  /** Colour the card resolves to when no primary is set (the mode default). */
  fallbackBrand: string
  onChange: (patch: Partial<ThemeCardValues>) => void
}) {
  const { t } = useTranslation()

  // Preview of the actual button colours: the resolved foreground sitting on
  // the resolved brand background. An empty primary resolves to the mode
  // default (ink in light, white in dark, or the lifted light brand).
  const resolvedBrand = values.color ? normalizeBrandColor(values.color) : fallbackBrand
  const resolvedFg = resolveBrandFg(resolvedBrand, values.fg)
  const contrast = getContrastRatio(resolvedFg, resolvedBrand)
  const isContrastLow = contrast < 4.5

  // Hover fill: explicit when set, otherwise the automatic step. The foreground
  // is already resolved, so the read-out shows what the label will look like.
  const resolvedHover = resolveBrandHover(resolvedBrand, resolvedFg, values.hover)
  const hoverContrast = getContrastRatio(resolvedFg, resolvedHover.hover)
  const isHoverContrastLow = hoverContrast < 4.5

  return (
    <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-5">
        {title}
      </h3>
      <div className="space-y-3">
        {/* Color Picker Container — matches upload row pattern */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
          <div className="flex-shrink-0">
            <div
              className="w-10 h-10 rounded-lg border border-gray-100 dark:border-dk-line shadow-sm"
              style={{ backgroundColor: values.color || '#ffffff' }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">{t('dashboard.organization.theme.primary_color')}</p>
          </div>
          <Input
            type="text"
            value={values.color}
            onChange={(e) => onChange({ color: e.target.value })}
            placeholder={t('dashboard.organization.branding.theme.no_color')}
            className="w-24 h-10 rounded-lg border border-gray-100 dark:border-dk-line !shadow-sm font-mono text-sm uppercase bg-white dark:bg-dk-card focus-visible:!shadow-sm focus-visible:border-gray-100 focus:outline-none"
            maxLength={7}
          />
          {values.color && (
            <button
              type="button"
              onClick={() => onChange({ color: '' })}
              className="flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title={t('dashboard.organization.theme.clear_color')}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-400">{t('dashboard.organization.theme.primary_color_desc')}</p>

        {/* Hover fill — the colour brand buttons switch to on hover / press */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
          <div className="flex-shrink-0">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-100 dark:border-dk-line shadow-sm text-sm font-semibold"
              style={{ backgroundColor: resolvedHover.hover, color: resolvedFg }}
            >
              Aa
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">{t('dashboard.organization.theme.brand_hover')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-400">
              {values.hover ? resolvedHover.hover.toUpperCase() : `${t('dashboard.organization.theme.brand_hover_auto')} · ${resolvedHover.hover.toUpperCase()}`}
              {' · '}
              {t('dashboard.organization.theme.contrast')} {hoverContrast}:1
              {isHoverContrastLow && (
                <span className="text-amber-600"> · {t('dashboard.organization.theme.contrast_low')}</span>
              )}
            </p>
          </div>
          <Input
            type="text"
            value={values.hover}
            onChange={(e) => onChange({ hover: e.target.value })}
            placeholder={t('dashboard.organization.theme.brand_hover_auto')}
            className="w-24 h-10 rounded-lg border border-gray-100 dark:border-dk-line !shadow-sm font-mono text-sm uppercase bg-white dark:bg-dk-card focus-visible:!shadow-sm focus-visible:border-gray-100 focus:outline-none"
            maxLength={7}
          />
          {values.hover && (
            <button
              type="button"
              onClick={() => onChange({ hover: '' })}
              className="flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title={t('dashboard.organization.theme.clear_color')}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-400">{t('dashboard.organization.theme.brand_hover_desc')}</p>

        {/* Brand foreground — text and icons sitting on brand surfaces */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
          <div className="flex-shrink-0">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-100 dark:border-dk-line shadow-sm text-sm font-semibold"
              style={{ backgroundColor: resolvedBrand, color: resolvedFg }}
            >
              Aa
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">{t('dashboard.organization.theme.brand_fg')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-400">
              {values.fg ? '' : `${t('dashboard.organization.theme.brand_fg_auto')} · `}
              {t('dashboard.organization.theme.contrast')} {contrast}:1
              {isContrastLow && (
                <span className="text-amber-600"> · {t('dashboard.organization.theme.contrast_low')}</span>
              )}
            </p>
          </div>
          <Input
            type="text"
            value={values.fg}
            onChange={(e) => onChange({ fg: e.target.value })}
            placeholder={t('dashboard.organization.theme.brand_fg_auto')}
            className="w-24 h-10 rounded-lg border border-gray-100 dark:border-dk-line !shadow-sm font-mono text-sm uppercase bg-white dark:bg-dk-card focus-visible:!shadow-sm focus-visible:border-gray-100 focus:outline-none"
            maxLength={7}
          />
          {values.fg && (
            <button
              type="button"
              onClick={() => onChange({ fg: '' })}
              className="flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title={t('dashboard.organization.theme.clear_color')}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-400">{t('dashboard.organization.theme.brand_fg_desc')}</p>

        {/* Sidebar active tab — opt in to a brand fill on the floating pill */}
        <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">{t('dashboard.organization.theme.brand_sidebar')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-400">{t('dashboard.organization.theme.brand_sidebar_desc')}</p>
          </div>
          <Switch
            checked={values.sidebar}
            onCheckedChange={(checked) => onChange({ sidebar: checked })}
            className="data-[state=checked]:bg-brand"
          />
        </div>
      </div>
    </div>
  )
}

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

  // Theme state — one set per mode. Both cards are saved together by the
  // Branding action row.
  const generalConfig =
    org?.config?.config?.customization?.general || org?.config?.config?.general || {}
  const [primaryColor, setPrimaryColor] = useState<string>(generalConfig.color || '')
  const [brandFg, setBrandFg] = useState<string>(generalConfig.brand_fg || '')
  const [brandHover, setBrandHover] = useState<string>(generalConfig.brand_hover || '')
  const [brandSidebar, setBrandSidebar] = useState<boolean>(!!generalConfig.brand_sidebar)
  const [darkPrimaryColor, setDarkPrimaryColor] = useState<string>(generalConfig.dark_color || '')
  const [darkBrandFg, setDarkBrandFg] = useState<string>(generalConfig.dark_brand_fg || '')
  const [darkBrandHover, setDarkBrandHover] = useState<string>(generalConfig.dark_brand_hover || '')
  const [darkBrandSidebar, setDarkBrandSidebar] = useState<boolean>(
    generalConfig.dark_brand_sidebar === undefined
      ? !!generalConfig.brand_sidebar
      : !!generalConfig.dark_brand_sidebar
  )
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
      const loadingToast = toast.loading(t('dashboard.organization.branding.images.uploading_logomark'))
      try {
        await uploadOrganizationLogoIcon(org.id, file, access_token)
        await new Promise((r) => setTimeout(r, 1500))
        toast.success(t('dashboard.organization.branding.images.toasts.logomark_success'), { id: loadingToast })
        await revalidateTags(['organizations'], org.slug)
        mutate(`${getAPIUrl()}orgs/slug/${org.slug}`)
        router.refresh()
      } catch (err) {
        toast.error(t('dashboard.organization.branding.images.toasts.logomark_error'), { id: loadingToast })
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
      await updateOrgColorConfig(
        org.id,
        primaryColor,
        access_token,
        brandFg,
        brandSidebar,
        brandHover,
        darkPrimaryColor,
        darkBrandFg,
        darkBrandHover,
        darkBrandSidebar
      )
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

  const updateLightTheme = (patch: Partial<ThemeCardValues>) => {
    if (patch.color !== undefined) setPrimaryColor(patch.color)
    if (patch.fg !== undefined) setBrandFg(patch.fg)
    if (patch.hover !== undefined) setBrandHover(patch.hover)
    if (patch.sidebar !== undefined) setBrandSidebar(patch.sidebar)
    setIsSaved(false)
  }

  const updateDarkTheme = (patch: Partial<ThemeCardValues>) => {
    if (patch.color !== undefined) setDarkPrimaryColor(patch.color)
    if (patch.fg !== undefined) setDarkBrandFg(patch.fg)
    if (patch.hover !== undefined) setDarkBrandHover(patch.hover)
    if (patch.sidebar !== undefined) setDarkBrandSidebar(patch.sidebar)
    setIsSaved(false)
  }

  // With no dark colour the dark card previews the lifted light brand; with no
  // light colour either, it previews the white dark-mode default.
  const darkFallbackBrand = deriveDarkBrand(normalizeBrandColor(primaryColor))

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
                ? 'bg-brand text-brand-fg border-brand opacity-50 cursor-not-allowed'
                : isSaved
                  ? 'bg-white dark:bg-dk-card text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-dk-line-strong cursor-default'
                  : 'bg-brand text-brand-fg border-brand hover:bg-brand-hover cursor-pointer'
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
                ? t('common.saving')
                : isSaved
                  ? t('dashboard.organization.branding.saved')
                  : t('common.save')}
            </span>
          </button>
        </div>
      </div>

      {/* Logo & Favicon Card */}
      <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-5">
          {t('dashboard.organization.branding.images.header')}
        </h3>
        <div className="space-y-3">
          {/* Logo Upload */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
            <div className="flex-shrink-0">
              <ImageIcon size={24} className="text-gray-400 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">{t('dashboard.organization.images.tabs.logo')}</p>
            </div>
            {isLogoUploading ? (
              <div className="w-[18px] h-[18px] border-2 border-gray-300 dark:border-dk-line-strong border-t-gray-600 rounded-full animate-spin" />
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
                    title={t('dashboard.organization.branding.images.remove_logo')}
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title={t('dashboard.organization.branding.images.upload_logo')}
                  >
                    <UploadCloud size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Favicon Upload */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
            <div className="flex-shrink-0">
              <ImageIcon size={24} className="text-gray-400 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">{t('dashboard.organization.branding.images.favicon')}</p>
            </div>
            {isFaviconUploading ? (
              <div className="w-[18px] h-[18px] border-2 border-gray-300 dark:border-dk-line-strong border-t-gray-600 rounded-full animate-spin" />
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
                    title={t('dashboard.organization.branding.images.remove_favicon')}
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title={t('dashboard.organization.branding.images.upload_favicon')}
                  >
                    <UploadCloud size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Logomark Upload */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
            <div className="flex-shrink-0">
              <ImageIcon size={24} className="text-gray-400 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">{t('dashboard.organization.branding.images.logomark')}</p>
            </div>
            {isLogoIconUploading ? (
              <div className="w-[18px] h-[18px] border-2 border-gray-300 dark:border-dk-line-strong border-t-gray-600 rounded-full animate-spin" />
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
                    title={t('dashboard.organization.branding.images.remove_logomark')}
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoIconInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title={t('dashboard.organization.branding.images.upload_logomark')}
                  >
                    <UploadCloud size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dk-line-strong rounded-xl bg-gray-50/50 dark:bg-dk-inset/40">
            <div className="flex-shrink-0">
              <ImageIcon size={24} className="text-gray-400 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">{t('dashboard.organization.images.tabs.thumbnail')}</p>
            </div>
            {isThumbnailUploading ? (
              <div className="w-[18px] h-[18px] border-2 border-gray-300 dark:border-dk-line-strong border-t-gray-600 rounded-full animate-spin" />
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
                    title={t('dashboard.organization.branding.images.remove_thumbnail')}
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex items-center justify-center text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title={t('dashboard.organization.branding.images.upload_thumbnail')}
                  >
                    <UploadCloud size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Theme Cards — light and dark, saved together by the action row */}
      <ThemeCard
        title={t('dashboard.organization.theme.light_theme')}
        values={{ color: primaryColor, fg: brandFg, hover: brandHover, sidebar: brandSidebar }}
        fallbackBrand={normalizeBrandColor('')}
        onChange={updateLightTheme}
      />

      <ThemeCard
        title={t('dashboard.organization.theme.dark_theme')}
        values={{
          color: darkPrimaryColor,
          fg: darkBrandFg,
          hover: darkBrandHover,
          sidebar: darkBrandSidebar,
        }}
        fallbackBrand={darkFallbackBrand}
        onChange={updateDarkTheme}
      />

      {/* Auth Page Branding Card */}
      <div className="bg-white dark:bg-dk-card rounded-xl border border-gray-100 dark:border-dk-line shadow-sm p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 dark:text-dk-fg-1 mb-5">
          {t('dashboard.organization.branding.tabs.auth')}
        </h3>
        <AuthBrandingTab />
      </div>
    </div>
  )
}
