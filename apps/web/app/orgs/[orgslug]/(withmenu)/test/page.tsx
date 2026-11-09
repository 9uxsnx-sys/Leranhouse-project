'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Image as ImageIcon, UploadCloud, Trash2, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
} from '@components/ui/dialog'

// ── cropper.ts types (exact copy from InstagramImageCropper project) ──────

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
}: {
  imageSrc: string
  onSaveResult: (dataUrl: string) => void
  onCancel: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState(420)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const isDraggingRef = useRef(false)
  const startPointerPos = useRef({ x: 0, y: 0 })
  const startPanPos = useRef({ x: 0, y: 0 })

  // Measure container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateSize = () => {
      const w = el.clientWidth
      if (w > 0) setContainerSize(w)
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const currentRatio = 1 // locked 1:1 for PFP
  const cropBox = calculateCropBoxDimensions(containerSize, containerSize, currentRatio, 0)

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
      const exportSize = 1080
      canvas.width = exportSize
      canvas.height = exportSize
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

      ctx.drawImage(img, sx, sy, sourceWidth, sourceHeight, 0, 0, exportSize, exportSize)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      onSaveResult(dataUrl)
    } catch {
      toast.error('Failed to crop image', { duration: 3000 })
    } finally {
      setIsProcessing(false)
    }
  }, [naturalDimensions, displayedW, displayedH, pan, zoom, cropBox.width, cropBox.height, onSaveResult])

  return (
    <div className="flex flex-col select-none">
      {/* Cropping viewport */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-[#121212] rounded-2xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
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

// ── Test Page ──────────────────────────────────────────────────────────────

export default function TestPage() {
  // Simulated PFP state
  const [simAvatarUrl, setSimAvatarUrl] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  // File selected → open crop dialog
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 8_000_000
    if (file.size > MAX_SIZE) {
      toast.error('File size must be less than 8MB', { duration: 3000 })
      event.target.value = ''
      return
    }
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed', { duration: 3000 })
      event.target.value = ''
      return
    }

    setCropImageSrc(URL.createObjectURL(file))
    setCropDialogOpen(true)
  }

  const handleSaveCropped = async (dataUrl: string) => {
    await new Promise((r) => setTimeout(r, 600))
    setSimAvatarUrl(dataUrl)
    closeDialog()
    toast.success('Avatar updated (simulated)', { duration: 2000 })
  }

  const closeDialog = () => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc)
    setCropImageSrc(null)
    setCropDialogOpen(false)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleDeleteAvatar = async () => {
    const loadingToast = toast.loading('Removing avatar...')
    await new Promise((r) => setTimeout(r, 500))
    if (simAvatarUrl) URL.revokeObjectURL(simAvatarUrl)
    setSimAvatarUrl(null)
    toast.success('Avatar removed (simulated)', { id: loadingToast })
  }

  const hasSimAvatar = !!simAvatarUrl

  return (
    <>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Image Cropper Test</h1>
          <p className="text-gray-500 mt-1">
            Instagram-style pan/zoom cropping — upload, crop in dialog, see preview
          </p>
        </div>

        {/* PFP Upload Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            PFP Upload
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-ui-bg-field">
              <div className="flex-shrink-0">
                <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Profile Picture</p>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
              {hasSimAvatar ? (
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
                  title="Change avatar"
                >
                  <UploadCloud size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PFP Preview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            PFP Preview
          </h3>
          <div className="flex flex-col items-center justify-center py-8">
            <div
              className="rounded-full overflow-hidden border-4 border-gray-100 shadow-lg"
              style={{ width: 128, height: 128 }}
            >
              {hasSimAvatar ? (
                <img
                  src={simAvatarUrl!}
                  alt="Simulated avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon size={40} className="text-gray-300" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {hasSimAvatar
                ? 'Cropped avatar displayed locally (simulated)'
                : 'Upload a photo above to start cropping'}
            </p>
          </div>
        </div>
      </div>

      {/* Crop Dialog — notification window style */}
      <Dialog open={cropDialogOpen} onOpenChange={(next) => { if (!next) closeDialog() }}>
        <DialogContent
          hideCloseButton
          aria-describedby={undefined}
          className="flex flex-col w-[520px] max-w-[calc(100vw-2rem)] border-0 p-0 rounded-2xl overflow-hidden"
        >
          {cropImageSrc && (
            <div className="p-4">
              <CropDialogContent
                imageSrc={cropImageSrc}
                onSaveResult={handleSaveCropped}
                onCancel={closeDialog}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
