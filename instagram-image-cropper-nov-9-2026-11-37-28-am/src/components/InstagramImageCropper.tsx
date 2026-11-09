/**
 * InstagramImageCropper Component
 *
 * A clean, minimalist React component for uploading, dragging/panning,
 * mouse-wheel zooming, and cropping images with an exact Instagram-style frame.
 *
 * HOW TO COPY & USE IN ANOTHER WHITE CARD / MODAL:
 * ------------------------------------------------
 * 1. Copy `src/components/InstagramImageCropper.tsx`, `src/types/cropper.ts`,
 *    and `src/utils/cropMath.ts` to your project.
 * 2. Import and use it inside any container or card:
 *
 *    ```tsx
 *    import InstagramImageCropper from './components/InstagramImageCropper';
 *
 *    function MyModal() {
 *      return (
 *        <div className="bg-white rounded-2xl p-3 shadow-lg border border-neutral-200">
 *          <InstagramImageCropper
 *            aspectRatio="4:5" // Configurable: '1:1' | '4:5' | '16:9' | '9:16' | 'original' | custom number (e.g. 1.33)
 *            onSave={(result) => {
 *              console.log(result.dataUrl); // high-res base64 string
 *              console.log(result.blob);    // raw Blob for FormData upload
 *            }}
 *            onCancel={() => {
 *              console.log('User cancelled');
 *            }}
 *          />
 *        </div>
 *      );
 *    }
 *    ```
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Check,
  Download,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import {
  clamp,
  calculateCropBoxDimensions,
  calculatePanBounds,
  constrainPan,
  formatBytes,
  getNumericAspectRatio,
} from '../utils/cropMath.ts';
import { CroppedImageResult, InstagramCropperProps } from '../types/cropper.ts';
import { SAMPLE_IMAGES, createDefaultFallbackImage } from '../utils/sampleImages.ts';

export const InstagramImageCropper: React.FC<InstagramCropperProps> = ({
  initialImage = null,
  aspectRatio = '1:1',
  onSave,
  onCancel,
  className = '',
}) => {
  // Image source and metadata
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage);
  const [fileName, setFileName] = useState<string>('instagram-photo.jpg');
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Cropper transform state (pan & mouse-wheel zoom)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Result state
  const [savedResult, setSavedResult] = useState<CroppedImageResult | null>(null);

  // Dragging / Pan references
  const isDraggingRef = useRef<boolean>(false);
  const startPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [containerSize, setContainerSize] = useState<number>(420);

  // Measure actual container size dynamically for responsive precision
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setContainerSize(w);
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageSrc]);

  // Keep imageSrc in sync if initialImage changes externally
  useEffect(() => {
    if (initialImage !== undefined) {
      setImageSrc(initialImage);
      if (!initialImage) {
        setSavedResult(null);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    }
  }, [initialImage]);

  // Calculate numeric aspect ratio (configured via prop / backend, defaults to 1:1)
  const currentRatio = getNumericAspectRatio(
    aspectRatio,
    naturalDimensions.width,
    naturalDimensions.height
  );

  // Crop box dimensions fitted into viewport
  const cropBox = calculateCropBoxDimensions(containerSize, containerSize, currentRatio, 0);

  // Clamp pan whenever cropBox, zoom, or naturalDimensions change
  useEffect(() => {
    if (!naturalDimensions.width || !naturalDimensions.height) return;

    // How image is scaled to cover crop box at 1x zoom
    const scaleFactor = Math.max(
      cropBox.width / naturalDimensions.width,
      cropBox.height / naturalDimensions.height
    );
    const displayedW = naturalDimensions.width * scaleFactor;
    const displayedH = naturalDimensions.height * scaleFactor;

    const bounds = calculatePanBounds(displayedW, displayedH, cropBox.width, cropBox.height, zoom);
    setPan((prev) => constrainPan(prev, bounds));
  }, [cropBox.width, cropBox.height, zoom, naturalDimensions]);

  // Load natural dimensions whenever imageSrc changes
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 800,
    });
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSavedResult(null);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageSrc(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Drag and drop file handling
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setImageSrc(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Select sample photo
  const handleSelectSample = (sample: (typeof SAMPLE_IMAGES)[0]) => {
    setFileName(`${sample.name.toLowerCase().replace(/\s+/g, '-')}.jpg`);
    setImageSrc(sample.url);
  };

  const handleUseFallbackImage = () => {
    const fallback = createDefaultFallbackImage('Instagram Aesthetic');
    setFileName('instagram-aesthetic.jpg');
    setImageSrc(fallback);
  };

  // Pointer interaction: Hold and move (Pan up, down, left, right)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setIsInteracting(true);
    startPointerPos.current = { x: e.clientX, y: e.clientY };
    startPanPos.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - startPointerPos.current.x;
    const dy = e.clientY - startPointerPos.current.y;

    if (!naturalDimensions.width || !naturalDimensions.height) return;

    const scaleFactor = Math.max(
      cropBox.width / naturalDimensions.width,
      cropBox.height / naturalDimensions.height
    );
    const displayedW = naturalDimensions.width * scaleFactor;
    const displayedH = naturalDimensions.height * scaleFactor;

    const bounds = calculatePanBounds(displayedW, displayedH, cropBox.width, cropBox.height, zoom);

    const newPan = {
      x: startPanPos.current.x + dx,
      y: startPanPos.current.y + dy,
    };

    setPan(constrainPan(newPan, bounds));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsInteracting(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Mouse wheel zoom in and zoom out
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsInteracting(true);
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => clamp(Number((prev + delta).toFixed(2)), 1, 3));
    setTimeout(() => {
      if (!isDraggingRef.current) {
        setIsInteracting(false);
      }
    }, 400);
  };

  // Reset or cancel
  const handleCancelClick = () => {
    if (savedResult) {
      setSavedResult(null);
      return;
    }
    // Reset cropper parameters
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageSrc(null);

    if (onCancel) {
      onCancel();
    }
  };

  // Save / Crop Image Export
  const handleSaveCrop = useCallback(async () => {
    if (!imageElementRef.current || !naturalDimensions.width || !naturalDimensions.height) {
      return;
    }

    setIsProcessing(true);

    try {
      const img = imageElementRef.current;
      const canvas = document.createElement('canvas');

      // Base target output dimension (high-fidelity standard export, e.g. 1080px base)
      const exportWidth = 1080;
      const exportHeight = Math.round(exportWidth / currentRatio);

      canvas.width = exportWidth;
      canvas.height = exportHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Scaling factor of image to cover the cropBox
      const scaleFactor = Math.max(
        cropBox.width / naturalDimensions.width,
        cropBox.height / naturalDimensions.height
      );
      const displayedW = naturalDimensions.width * scaleFactor;
      const displayedH = naturalDimensions.height * scaleFactor;

      // Effective scale from displayed pixels to original natural image pixels
      const origScale = naturalDimensions.width / displayedW;

      const sourceCenterX = naturalDimensions.width / 2 - (pan.x * origScale) / zoom;
      const sourceCenterY = naturalDimensions.height / 2 - (pan.y * origScale) / zoom;

      const sourceWidth = (cropBox.width * origScale) / zoom;
      const sourceHeight = (cropBox.height * origScale) / zoom;

      const sx = sourceCenterX - sourceWidth / 2;
      const sy = sourceCenterY - sourceHeight / 2;

      ctx.drawImage(img, sx, sy, sourceWidth, sourceHeight, 0, 0, exportWidth, exportHeight);

      // Export as Blob & DataURL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => {
            resolve(b || new Blob());
          },
          'image/jpeg',
          0.95
        );
      });

      const result: CroppedImageResult = {
        dataUrl,
        blob,
        width: exportWidth,
        height: exportHeight,
        aspectRatio: typeof aspectRatio === 'number' ? `${exportWidth}:${exportHeight}` : aspectRatio,
        fileName: fileName.replace(/\.[^/.]+$/, '') + '-cropped.jpg',
        fileSize: blob.size,
      };

      setSavedResult(result);
      if (onSave) {
        onSave(result);
      }
    } catch (err) {
      console.error('Failed to crop image', err);
    } finally {
      setIsProcessing(false);
    }
  }, [cropBox.width, cropBox.height, currentRatio, naturalDimensions, pan, zoom, aspectRatio, fileName, onSave]);

  // Download cropped photo
  const handleDownload = () => {
    if (!savedResult) return;
    const a = document.createElement('a');
    a.href = savedResult.dataUrl;
    a.download = savedResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {/* White Card with uniform small padding on all 4 sides */}
      <div
        className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl border border-neutral-200/90 p-3 sm:p-3.5 transition-all"
        style={{ boxSizing: 'border-box' }}
      >
        {/* State 1: Upload State (No image selected yet) */}
        {!imageSrc && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border-2 border-dashed border-neutral-200 hover:border-neutral-300 transition-colors bg-neutral-50/50"
          >
            {/* Clean Upload Icon */}
            <div className="w-20 h-20 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center mb-4 text-neutral-800">
              <ImageIcon className="w-10 h-10 text-neutral-700 stroke-[1.5]" />
            </div>

            <h3 className="text-lg font-medium text-neutral-900 mb-1">
              Drag photos and videos here
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Supports JPG, PNG, WEBP, and GIF
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0095F6] hover:bg-[#1877F2] active:scale-[0.98] rounded-lg shadow-sm transition"
            >
              Select from computer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload photo to crop"
            />

            {/* Quick Sample Photos for instant testing */}
            <div className="mt-8 pt-5 border-t border-neutral-200/80 w-full">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider block mb-2.5">
                Or try a sample photo
              </span>
              <div className="flex items-center justify-center gap-2">
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="group relative rounded-lg overflow-hidden border border-neutral-200 hover:border-[#0095F6] transition shadow-xs"
                    title={`Use ${sample.name}`}
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-14 h-14 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleUseFallbackImage}
                  className="w-14 h-14 rounded-lg border border-neutral-200 hover:border-[#0095F6] flex flex-col items-center justify-center bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white text-[10px] font-bold shadow-xs hover:scale-105 transition-transform"
                  title="Use Instagram gradient preset"
                >
                  <Sparkles className="w-4 h-4 mb-0.5" />
                  <span>Preset</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Active Cropping Viewport (Ultra-clean, zero overlay buttons) */}
        {imageSrc && !savedResult && (
          <div className="flex flex-col select-none">
            {/* Cropping Viewport Container: Mouse wheel zooms, Hold & drag pans */}
            <div
              ref={containerRef}
              className="relative w-full aspect-square bg-[#121212] rounded-xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              style={{ touchAction: 'none' }}
              role="region"
              aria-label="Instagram Image Cropper Viewport"
            >
              {/* Crop Box Frame with authentic outer matte masking */}
              <div
                className="relative overflow-hidden flex items-center justify-center pointer-events-none"
                style={{
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
                }}
              >
                {/* The actual image being panned and zoomed */}
                <img
                  ref={imageElementRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                  draggable={false}
                  className="absolute pointer-events-none transition-transform duration-75 ease-out max-w-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    // Size image to cover crop box at 1x
                    width:
                      naturalDimensions.width && naturalDimensions.height
                        ? `${
                            naturalDimensions.width *
                            Math.max(
                              cropBox.width / naturalDimensions.width,
                              cropBox.height / naturalDimensions.height
                            )
                          }px`
                        : '100%',
                    height:
                      naturalDimensions.width && naturalDimensions.height
                        ? `${
                            naturalDimensions.height *
                            Math.max(
                              cropBox.width / naturalDimensions.width,
                              cropBox.height / naturalDimensions.height
                            )
                          }px`
                        : '100%',
                  }}
                />

                {/* 3x3 Rule-of-Thirds Grid (Appears cleanly while dragging or zooming with mouse wheel) */}
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

                {/* Crisp subtle inner crop border */}
                <div className="absolute inset-0 border border-white/40 pointer-events-none rounded-[1px]" />
              </div>
            </div>

            {/* Underneath the cropping tool: Cancel and Save buttons (nothing more, nothing less) */}
            <div className="flex items-center justify-between pt-3 mt-1">
              <button
                type="button"
                onClick={handleCancelClick}
                className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition active:scale-[0.98]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={isProcessing}
                className="px-6 py-2 text-sm font-semibold text-white bg-[#0095F6] hover:bg-[#1877F2] active:scale-[0.98] rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-60"
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
        )}

        {/* State 3: Saved Cropped Photo result */}
        {savedResult && (
          <div className="flex flex-col animate-in fade-in duration-200">
            {/* Cropped Image Display */}
            <div className="relative w-full rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center shadow-inner">
              <img
                src={savedResult.dataUrl}
                alt="Cropped output"
                className="w-full object-contain max-h-[420px] rounded-lg"
              />
              <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                <span>Cropped</span>
              </div>
            </div>

            {/* File info metadata */}
            <div className="flex items-center justify-between text-xs text-neutral-500 mt-3 px-1">
              <span className="font-medium text-neutral-700 truncate max-w-[200px]">
                {savedResult.fileName}
              </span>
              <span>
                {savedResult.width} × {savedResult.height} px · {formatBytes(savedResult.fileSize)}
              </span>
            </div>

            {/* Under the result: Edit Crop and Download / New actions */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setSavedResult(null)}
                className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
              >
                Edit Crop
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSavedResult(null);
                    setImageSrc(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
                >
                  New Photo
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#0095F6] hover:bg-[#1877F2] active:scale-[0.98] rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 stroke-[2.2]" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramImageCropper;
