/**
 * Pure mathematical functions for image crop calculations, boundary clamping,
 * aspect ratio adjustments, and canvas slice coordinates.
 */

export type AspectRatio = '1:1' | '4:5' | '16:9' | '9:16' | 'original' | number;

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface CropState {
  zoom: number; // 1 to 3
  pan: Position; // pixel offset from center
  aspectRatio: AspectRatio;
  rotation: number; // 0, 90, 180, 270
}

export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns numeric aspect ratio (width / height) given the aspect key/number and original dimensions.
 */
export function getNumericAspectRatio(
  aspect: AspectRatio,
  origWidth: number,
  origHeight: number
): number {
  if (typeof aspect === 'number' && aspect > 0) {
    return aspect;
  }
  if (origWidth <= 0 || origHeight <= 0) return 1;
  switch (aspect) {
    case '1:1':
      return 1;
    case '4:5':
      return 4 / 5; // 0.8 portrait
    case '16:9':
      return 16 / 9; // ~1.777 landscape
    case '9:16':
      return 9 / 16; // 0.5625 story / reels
    case 'original':
      return origWidth / origHeight;
    default:
      return 1;
  }
}

/**
 * Calculates max allowable pan offset so image completely covers the crop box.
 * Returns { maxPanX, maxPanY }.
 */
export function calculatePanBounds(
  displayedImgWidth: number,
  displayedImgHeight: number,
  cropBoxWidth: number,
  cropBoxHeight: number,
  zoom: number
): { maxPanX: number; maxPanY: number } {
  const scaledWidth = displayedImgWidth * zoom;
  const scaledHeight = displayedImgHeight * zoom;

  const maxPanX = Math.max(0, (scaledWidth - cropBoxWidth) / 2);
  const maxPanY = Math.max(0, (scaledHeight - cropBoxHeight) / 2);

  return { maxPanX, maxPanY };
}

/**
 * Constrains pan position within allowable bounds.
 */
export function constrainPan(
  pan: Position,
  bounds: { maxPanX: number; maxPanY: number }
): Position {
  return {
    x: clamp(pan.x, -bounds.maxPanX, bounds.maxPanX),
    y: clamp(pan.y, -bounds.maxPanY, bounds.maxPanY),
  };
}

/**
 * Fits crop box within viewport given target aspect ratio.
 */
export function calculateCropBoxDimensions(
  viewportWidth: number,
  viewportHeight: number,
  aspectRatio: number,
  padding: number = 0
): Dimensions {
  const availableWidth = Math.max(50, viewportWidth - padding * 2);
  const availableHeight = Math.max(50, viewportHeight - padding * 2);

  let width = availableWidth;
  let height = width / aspectRatio;

  if (height > availableHeight) {
    height = availableHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Computes the source slice coordinates (sx, sy, sw, sh) on the original unscaled image.
 */
export function calculateSourceCropCoords(
  origWidth: number,
  origHeight: number,
  displayedWidth: number,
  displayedHeight: number,
  cropBoxWidth: number,
  cropBoxHeight: number,
  pan: Position,
  zoom: number
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = (origWidth / displayedWidth) / zoom;

  // Center of the crop box mapped to original image coordinates
  const centerX = (displayedWidth / 2) - (pan.x / zoom);
  const centerY = (displayedHeight / 2) - (pan.y / zoom);

  const sw = cropBoxWidth * scale;
  const sh = cropBoxHeight * scale;

  const sx = (centerX * (origWidth / displayedWidth)) - (sw / 2);
  const sy = (centerY * (origHeight / displayedHeight)) - (sh / 2);

  return {
    sx: clamp(Math.round(sx), 0, origWidth),
    sy: clamp(Math.round(sy), 0, origHeight),
    sw: Math.min(Math.round(sw), origWidth),
    sh: Math.min(Math.round(sh), origHeight),
  };
}

/**
 * Formats byte size into human readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
