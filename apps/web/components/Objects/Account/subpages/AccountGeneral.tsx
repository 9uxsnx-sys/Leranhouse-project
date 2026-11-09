'use client';
import { updateProfile } from '@services/settings/profile'
import { getUser } from '@services/users/users'
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { Formik, Form } from 'formik'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Check,
  SaveAllIcon
} from 'lucide-react'
import { updateUserAvatar, deleteUserAvatar, updateUserBanner, deleteUserBanner, checkUsernameAvailability } from '@services/users/users'
import { constructAcceptValue } from '@/lib/constants'
import * as Yup from 'yup'
import { Input } from "@components/ui/input"
import { Textarea } from "@components/ui/textarea"
import { Label } from "@components/ui/label"
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
} from '@components/ui/dialog'

const SUPPORTED_FILES = constructAcceptValue(['jpg', 'png', 'webp', 'gif'])

interface FormValues {
  username: string;
  first_name: string;
  bio: string;
}

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none";

// ── cropper types (exact copy from InstagramImageCropper project) ──────────

type AspectRatioPreset = '1:1' | '4:5' | '16:9' | '9:16' | 'original'
type AspectRatioType = AspectRatioPreset | number

interface CroppedImageResult {
  dataUrl: string
  blob: Blob
  width: number
  height: number
  aspectRatio: string | number
  fileName: string
  fileSize: number
}

// ── cropMath.ts (exact copy from InstagramImageCropper project) ───────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getNumericAspectRatio(
  aspect: AspectRatioType,
  origWidth: number,
  origHeight: number,
): number {
  if (typeof aspect === 'number') return aspect
  const presetMap: Record<string, number> = {
    '1:1': 1,
    '4:5': 0.8,
    '16:9': 16 / 9,
    '9:16': 9 / 16,
    original: origWidth > 0 && origHeight > 0 ? origWidth / origHeight : 1,
  }
  return presetMap[aspect] ?? 1
}

function calculateCropBoxDimensions(
  viewportWidth: number,
  viewportHeight: number,
  aspectRatio: number,
  padding: number = 0,
): { width: number; height: number } {
  const availableWidth = Math.max(50, viewportWidth - padding * 2)
  const availableHeight = Math.max(50, viewportHeight - padding * 2)
  let width = availableWidth
  let height = width / aspectRatio
  if (height > availableHeight) {
    height = availableHeight
    width = height * aspectRatio
  }
  return { width: Math.round(width), height: Math.round(height) }
}

function calculatePanBounds(
  displayedImgWidth: number,
  displayedImgHeight: number,
  cropBoxWidth: number,
  cropBoxHeight: number,
  zoom: number,
): { maxPanX: number; maxPanY: number } {
  const scaledWidth = displayedImgWidth * zoom
  const scaledHeight = displayedImgHeight * zoom
  return {
    maxPanX: Math.max(0, (scaledWidth - cropBoxWidth) / 2),
    maxPanY: Math.max(0, (scaledHeight - cropBoxHeight) / 2),
  }
}

function constrainPan(
  pan: { x: number; y: number },
  bounds: { maxPanX: number; maxPanY: number },
): { x: number; y: number } {
  return {
    x: clamp(pan.x, -bounds.maxPanX, bounds.maxPanX),
    y: clamp(pan.y, -bounds.maxPanY, bounds.maxPanY),
  }
}

// ── Crop Dialog Content (Instagram-style cropping viewport only) ─────────

function CropDialogContent({
  imageSrc,
  onSaveResult,
  onCancel,
  aspectRatio = 1,
}: {
  imageSrc: string
  onSaveResult: (dataUrl: string) => void
  onCancel: () => void
  aspectRatio?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 })
  const [containerDimensions, setContainerDimensions] = useState({ width: 420, height: 420 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const isDraggingRef = useRef(false)
  const startPointerPos = useRef({ x: 0, y: 0 })
  const startPanPos = useRef({ x: 0, y: 0 })

  // Measure container (both width and height)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateSize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0 && h > 0) setContainerDimensions({ width: w, height: h })
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const currentRatio = aspectRatio
  const cropBox = calculateCropBoxDimensions(containerDimensions.width, containerDimensions.height, currentRatio, 0)

  const scaleFactor =
    naturalDimensions.width && naturalDimensions.height
      ? Math.max(
          cropBox.width / naturalDimensions.width,
          cropBox.height / naturalDimensions.height,
        ) * 1.01
      : 1
  const displayedW = naturalDimensions.width * scaleFactor
  const displayedH = naturalDimensions.height * scaleFactor

  useEffect(() => {
    if (!naturalDimensions.width || !naturalDimensions.height) return
    const bounds = calculatePanBounds(displayedW, displayedH, cropBox.width, cropBox.height, zoom)
    setPan((prev) => constrainPan(prev, bounds))
  }, [cropBox.width, cropBox.height, zoom, naturalDimensions])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalDimensions({ width: img.naturalWidth || 800, height: img.naturalHeight || 800 })
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    isDraggingRef.current = true
    setIsInteracting(true)
    startPointerPos.current = { x: e.clientX, y: e.clientY }
    startPanPos.current = { ...pan }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - startPointerPos.current.x
    const dy = e.clientY - startPointerPos.current.y
    const bounds = calculatePanBounds(displayedW, displayedH, cropBox.width, cropBox.height, zoom)
    setPan(constrainPan({ x: startPanPos.current.x + dx, y: startPanPos.current.y + dy }, bounds))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setIsInteracting(false)
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setIsInteracting(true)
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setZoom((prev) => clamp(Number((prev + delta).toFixed(2)), 1, 3))
    setTimeout(() => { if (!isDraggingRef.current) setIsInteracting(false) }, 400)
  }

  const handleSave = useCallback(async () => {
    if (!imageRef.current || !naturalDimensions.width || !naturalDimensions.height) return
    setIsProcessing(true)
    try {
      const img = imageRef.current
      const canvas = document.createElement('canvas')
      const exportLongSide = aspectRatio === 1 ? 1080 : 1920
      canvas.width = exportLongSide
      canvas.height = Math.round(exportLongSide / aspectRatio)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No canvas context')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const origScale = naturalDimensions.width / displayedW
      const sourceCenterX = naturalDimensions.width / 2 - (pan.x * origScale) / zoom
      const sourceCenterY = naturalDimensions.height / 2 - (pan.y * origScale) / zoom
      const sourceWidth = (cropBox.width * origScale) / zoom
      const sourceHeight = (cropBox.height * origScale) / zoom
      const sx = sourceCenterX - sourceWidth / 2
      const sy = sourceCenterY - sourceHeight / 2

      ctx.drawImage(img, sx, sy, sourceWidth, sourceHeight, 0, 0, exportLongSide, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      onSaveResult(dataUrl)
    } catch {
      toast.error('Failed to crop image', { duration: 3000 })
    } finally {
      setIsProcessing(false)
    }
  }, [naturalDimensions, displayedW, displayedH, pan, zoom, cropBox.width, cropBox.height, onSaveResult, aspectRatio])

  return (
    <div className="flex flex-col select-none">
      {/* Cropping viewport */}
      <div
        ref={containerRef}
        className="relative w-full bg-[#121212] rounded-2xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{ aspectRatio: `${aspectRatio} / 1`, touchAction: 'none' }}
        role="region"
        aria-label="Crop preview"
      >
        {/* Crop box with dark matte overlay */}
        <div
          className="relative overflow-hidden flex items-center justify-center pointer-events-none"
          style={{
            width: `${cropBox.width}px`,
            height: `${cropBox.height}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
          }}
        >
          {/* The pannable / zoomable image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
            draggable={false}
            className="absolute pointer-events-none transition-transform duration-75 ease-out max-w-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: naturalDimensions.width && naturalDimensions.height
                ? `${displayedW}px` : '100%',
              height: naturalDimensions.width && naturalDimensions.height
                ? `${displayedH}px` : '100%',
            }}
          />

          {/* 3x3 grid */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-200 grid grid-cols-3 grid-rows-3 ${
              isInteracting ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="border-r border-b border-white/60 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
            <div className="border-r border-b border-white/60 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
            <div className="border-b border-white/60 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
            <div className="border-r border-b border-white/60 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
            <div className="border-r border-b border-white/60 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
            <div className="border-b border-white/60 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
            <div className="border-r border-white/60 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
            <div className="border-r border-white/60 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
            <div />
          </div>

          {/* Inner crop border */}
          <div className="absolute inset-0 border border-white/40 pointer-events-none rounded-[1px]" />
        </div>
      </div>

      {/* Cancel + Save buttons */}
      <div className="flex items-center justify-between pt-3 mt-1 px-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="px-4 py-1.5 text-sm font-semibold text-white bg-[#0095F6] hover:bg-[#1877F2] active:scale-[0.98] rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-60"
        >
          {isProcessing ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Form component to handle the details section
const UserEditForm = ({
  values,
  setFieldValue,
  handleChange,
  errors,
  touched,
  isSubmitting,
  profilePicture,
  banner,
  hasAvatar,
  hasBanner,
  handleDeleteAvatar,
  handleDeleteBanner,
  dirty,
  isSaved
}: {
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  handleChange: (e: React.ChangeEvent<any>) => void;
  errors: any;
  touched: any;
  isSubmitting: boolean;
  profilePicture: {
    isLoading: boolean;
    localAvatar: File | null;
    handleFileChange: (event: any) => Promise<void>;
  };
  banner: {
    localBanner: File | null;
    isUploading: boolean;
    handleFileChange: (event: any) => Promise<void>;
  };
  hasAvatar: boolean;
  hasBanner: boolean;
  handleDeleteAvatar: () => void;
  handleDeleteBanner: () => void;
  dirty: boolean;
  isSaved: boolean;
}) => {
  const { t } = useTranslation();
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  return (
    <Form>
      <div className="space-y-6">
        {/* Card 1: Profile Information */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('user.settings.general.profile_information')}
          </h3>
          <div className="space-y-5">
            <div>
              <Label htmlFor="username" className="font-medium leading-[35px] text-black text-sm">{t('user.settings.general.username')}</Label>
              <Input
                id="username"
                name="username"
                value={values.username}
                onChange={handleChange}
                placeholder={t('user.settings.general.username_placeholder')}
                className={fieldClassName}
              />
              {touched.username && errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <Label htmlFor="first_name" className="font-medium leading-[35px] text-black text-sm">{t('user.settings.general.first_name')}</Label>
              <Input
                id="first_name"
                name="first_name"
                value={values.first_name}
                onChange={handleChange}
                placeholder={t('user.settings.general.first_name_placeholder')}
                className={fieldClassName}
              />
              {touched.first_name && errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bio" className="font-medium leading-[35px] text-black text-sm">
                {t('user.settings.general.bio')}
                <span className="text-gray-500 text-sm ms-2">
                  ({t('user.settings.general.characters_left', { count: 400 - (values.bio?.length || 0) })})
                </span>
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={values.bio}
                onChange={handleChange}
                placeholder={t('user.settings.general.bio_placeholder')}
                className={`${fieldClassName} min-h-[80px]`}
                maxLength={400}
              />
              {touched.bio && errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Profile Picture & Banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('user.settings.general.profile_picture')}
          </h3>
          <div className="space-y-3">
            {/* Avatar Row */}
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-ui-bg-field">
              <div className="flex-shrink-0">
                <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{t('user.settings.general.profile_picture')}</p>
              </div>
              {profilePicture.isLoading ? (
                <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    className="hidden"
                    accept={SUPPORTED_FILES}
                    onChange={profilePicture.handleFileChange}
                  />
                  {hasAvatar ? (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove avatar"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title={t('user.settings.general.change_avatar')}
                    >
                      <UploadCloud size={18} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Banner Row */}
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-ui-bg-field">
              <div className="flex-shrink-0">
                <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{t('user.settings.appearance.profile_banner')}</p>
              </div>
              {banner.isUploading ? (
                <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    className="hidden"
                    accept={SUPPORTED_FILES}
                    onChange={banner.handleFileChange}
                  />
                  {hasBanner ? (
                    <button
                      type="button"
                      onClick={handleDeleteBanner}
                      className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove banner"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Upload banner"
                    >
                      <UploadCloud size={18} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isSubmitting
                ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                : !dirty && isSaved
                  ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                  : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : !dirty && isSaved ? (
              <Check size={14} />
            ) : (
              <SaveAllIcon size={14} />
            )}
            <span>
              {isSubmitting ? t('user.settings.general.saving') : !dirty && isSaved ? t('user.settings.general.saved') : t('user.settings.general.save_changes')}
            </span>
          </button>
        </div>
      </div>
    </Form>
  );
};

function AccountGeneral() {
  const session = useLHSession() as any;
  const access_token = session?.data?.tokens?.access_token;
  const [localAvatar, setLocalAvatar] = React.useState(null) as any
  const [isLoading, setIsLoading] = React.useState(false) as any
  const [localBanner, setLocalBanner] = React.useState(null) as any
  const [bannerUploading, setBannerUploading] = React.useState(false) as any
  const [userData, setUserData] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [bannerCropDialogOpen, setBannerCropDialogOpen] = useState(false)
  const [bannerCropImageSrc, setBannerCropImageSrc] = useState<string | null>(null)
  const { t } = useTranslation();
  const pendingCheckRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const validationSchema = useMemo(() => Yup.object().shape({
    username: Yup.string()
      .required('Username is required')
      .test('username-available', t('user.settings.general.username_taken'), async function(value) {
        if (!value || value === userData?.username) return true

        // Cancel previous pending check
        pendingCheckRef.current.cancelled = true
        const currentCheck = { cancelled: false }
        pendingCheckRef.current = currentCheck

        // Debounce: wait 500ms before making the API call
        await new Promise(r => setTimeout(r, 500))
        if (currentCheck.cancelled) return true

        try {
          const result = await checkUsernameAvailability(value, access_token)
          return result.available !== false
        } catch {
          return true // Allow on error to not block form submission
        }
      }),
    first_name: Yup.string().required('First name is required'),
    bio: Yup.string().max(400, 'Bio must be 400 characters or less'),
  }), [userData?.username, access_token, t]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.data?.user?.id) {
        try {
          const data = await getUser(session.data.user.id, access_token);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [session?.data?.user?.id, access_token]);

  const handleFileChange = async (event: any) => {
    const file = event.target.files[0]
    if (!file) return

    // File validation
    const MAX_FILE_SIZE = 8_000_000
    const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 8MB', { duration: 3000 })
      event.target.value = ''
      return
    }
    if (!VALID_TYPES.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed', { duration: 3000 })
      event.target.value = ''
      return
    }

    // Open crop dialog instead of uploading directly
    setCropImageSrc(URL.createObjectURL(file))
    setCropDialogOpen(true)
  }

  const handleDeleteAvatar = async () => {
    const loadingToast = toast.loading('Removing avatar...')
    try {
      const res = await deleteUserAvatar(session.data.user.id, access_token)
      if (res.success === false) {
        toast.error(res.HTTPmessage || 'Failed to remove avatar', { id: loadingToast })
      } else {
        setUserData((prev: any) => prev ? { ...prev, avatar_image: null } : prev)
        await session.update(true)
        toast.success('Avatar removed successfully', { id: loadingToast })
      }
    } catch (error: any) {
      toast.error('Failed to remove avatar', { id: loadingToast })
    }
  }

  const handleBannerFileChange = async (event: any) => {
    const file = event.target.files[0]
    if (!file) return

    // File validation
    const MAX_FILE_SIZE = 8_000_000
    const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 8MB', { duration: 3000 })
      event.target.value = ''
      return
    }
    if (!VALID_TYPES.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed', { duration: 3000 })
      event.target.value = ''
      return
    }

    setLocalBanner(file)
    // Open crop dialog instead of uploading directly
    setBannerCropImageSrc(URL.createObjectURL(file))
    setBannerCropDialogOpen(true)
  }

  const handleDeleteBanner = async () => {
    const loadingToast = toast.loading('Removing banner...')
    try {
      const res = await deleteUserBanner(session.data.user.id, access_token)
      if (res.success === false) {
        toast.error(res.HTTPmessage || 'Failed to remove banner', { id: loadingToast })
      } else {
        setUserData((prev: any) => prev ? { ...prev, banner_image: null } : prev)
        await session.update(true)
        toast.success('Banner removed successfully', { id: loadingToast })
      }
    } catch (error: any) {
      toast.error('Failed to remove banner', { id: loadingToast })
    }
  }

  const closeCropDialog = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc)
    setCropDialogOpen(false)
    setCropImageSrc(null)
  }, [cropImageSrc])

  const handleSaveCropped = useCallback(async (dataUrl: string) => {
    // Convert dataUrl to Blob/File
    const blob = await (await fetch(dataUrl)).blob()
    const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })

    setIsLoading(true)
    const res = await updateUserAvatar(session.data.user.id, croppedFile, access_token)
    if (res.success === false) {
      toast.error(res.HTTPmessage || 'Failed to upload avatar', { duration: 3000 })
      setIsLoading(false)
    } else {
      const newAvatar = res.data?.avatar_image
      if (newAvatar) {
        setUserData((prev: any) => prev ? { ...prev, avatar_image: newAvatar } : prev)
      }
      await session.update(true)
      setIsLoading(false)
      closeCropDialog()
      toast.success(t('user.settings.general.avatar_updated'), { duration: 3000 })
    }
  }, [session, access_token, closeCropDialog, t])

  const closeBannerCropDialog = useCallback(() => {
    if (bannerCropImageSrc) URL.revokeObjectURL(bannerCropImageSrc)
    setBannerCropDialogOpen(false)
    setBannerCropImageSrc(null)
  }, [bannerCropImageSrc])

  const handleSaveBannerCropped = useCallback(async (dataUrl: string) => {
    // Convert dataUrl to Blob/File
    const blob = await (await fetch(dataUrl)).blob()
    const croppedFile = new File([blob], 'banner.jpg', { type: 'image/jpeg' })

    setBannerUploading(true)
    const res = await updateUserBanner(session.data.user.id, croppedFile, access_token)
    if (res.success === false) {
      toast.error(res.HTTPmessage || 'Failed to upload banner', { duration: 3000 })
      setBannerUploading(false)
    } else {
      const newBanner = res.data?.banner_image
      if (newBanner) {
        setUserData((prev: any) => prev ? { ...prev, banner_image: newBanner } : prev)
      }
      await session.update(true)
      setBannerUploading(false)
      closeBannerCropDialog()
      toast.success('Banner uploaded successfully', { duration: 3000 })
    }
  }, [session, access_token, closeBannerCropDialog])


  if (!userData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <Formik<FormValues>
        enableReinitialize
        initialValues={{
          username: userData.username,
          first_name: userData.first_name,
          bio: userData.bio || '',

        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          const loadingToast = toast.loading(t('user.settings.general.saving'))

          setTimeout(() => {
            updateProfile(values, userData.id, access_token)
              .then(() => {
                toast.dismiss(loadingToast)
                setIsSaved(true)
                toast.success(t('user.settings.general.profile_updated'))
                getUser(userData.id, access_token).then(setUserData);
              })
              .catch((error: any) => {
                const message = error?.message || error?.detail || 'Failed to update profile'
                toast.error(message, { id: loadingToast })
              })
              .finally(() => {
                setSubmitting(false)
              })
          }, 400)
        }}
      >
        {(formikProps) => (
          <UserEditForm
            {...formikProps}
            profilePicture={{
              isLoading,
              localAvatar,
              handleFileChange
            }}
            banner={{
              localBanner,
              isUploading: bannerUploading,
              handleFileChange: handleBannerFileChange
            }}
            hasAvatar={!!userData?.avatar_image}
            hasBanner={!!userData?.banner_image}
            handleDeleteAvatar={handleDeleteAvatar}
            handleDeleteBanner={handleDeleteBanner}
            dirty={formikProps.dirty}
            isSaved={isSaved}
          />
        )}
      </Formik>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(next) => { if (!next) closeCropDialog() }}>
        <DialogContent hideCloseButton aria-describedby={undefined}
          className="flex flex-col w-[520px] max-w-[calc(100vw-2rem)] border-0 p-0 rounded-2xl overflow-hidden"
        >
          {cropImageSrc && (
            <div className="p-4">
              <CropDialogContent imageSrc={cropImageSrc} onSaveResult={handleSaveCropped} onCancel={closeCropDialog} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Banner Crop Dialog */}
      <Dialog open={bannerCropDialogOpen} onOpenChange={(next) => { if (!next) closeBannerCropDialog() }}>
        <DialogContent hideCloseButton aria-describedby={undefined}
          className="flex flex-col w-[640px] max-w-[calc(100vw-2rem)] border-0 p-0 rounded-2xl overflow-hidden"
        >
          {bannerCropImageSrc && (
            <div className="p-4">
              <CropDialogContent imageSrc={bannerCropImageSrc} onSaveResult={handleSaveBannerCropped} onCancel={closeBannerCropDialog} aspectRatio={4} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccountGeneral
