export type AspectRatioPreset = '1:1' | '4:5' | '16:9' | '9:16' | 'original';
export type AspectRatioType = AspectRatioPreset | number;

export interface CroppedImageResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  aspectRatio: string | number;
  fileName: string;
  fileSize: number;
}

export interface InstagramCropperProps {
  /**
   * Preloaded image URL, data URL, or object URL.
   */
  initialImage?: string | null;

  /**
   * Configurable aspect ratio determined by code/backend.
   * Accepts presets ('1:1', '4:5', '16:9', '9:16', 'original') or any custom number (e.g. 1.33 for 4:3).
   * Defaults to '1:1'.
   */
  aspectRatio?: AspectRatioType;

  /**
   * Callback fired when the user hits Save.
   * Receives high-resolution cropped dataUrl, blob, dimensions, and fileSize.
   */
  onSave?: (result: CroppedImageResult) => void;

  /**
   * Callback fired when the user hits Cancel.
   */
  onCancel?: () => void;

  /**
   * Optional custom wrapper styling.
   */
  className?: string;
}
