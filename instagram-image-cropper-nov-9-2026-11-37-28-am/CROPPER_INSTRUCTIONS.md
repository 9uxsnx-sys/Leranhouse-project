# Instagram Image Cropper — Implementation & Integration Guide

A clean, minimalist React component for uploading, dragging/panning, mouse-wheel zooming, and high-fidelity cropping. Styled as a crisp white card with uniform padding, Instagram matte viewport masking, 3×3 rule-of-thirds grid, and simple **Cancel** and **Save** actions underneath.

---

## 1. Files to Copy

To use this logic in any project, copy these 3 files:

```
src/
├── components/
│   └── InstagramImageCropper.tsx   # The main React UI component
├── types/
│   └── cropper.ts                  # TypeScript types & props
└── utils/
    ├── cropMath.ts                 # Pure math (bounds clamping, aspect ratio, canvas coordinates)
    └── sampleImages.ts             # (Optional) Sample photos & fallback canvas generator
```

### Dependencies
Ensure these standard packages are in your `package.json`:
- `react` (v18 or v19)
- `lucide-react` (for clean SVG icons)
- `tailwindcss` (for styles)

---

## 2. Quick Start: Place in Another White Card

Here is how you import and render it inside any white card or page in clean mode with zero issues:

```tsx
import React, { useState } from 'react';
import InstagramImageCropper from './components/InstagramImageCropper';
import { CroppedImageResult } from './types/cropper';

export function ProfilePhotoUploader() {
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);

  const handleSave = async (result: CroppedImageResult) => {
    console.log('Cropped Data URL:', result.dataUrl); // Base64 string for immediate <img> display
    console.log('Cropped Blob:', result.blob);        // Binary Blob ready for API upload
    console.log('Dimensions:', `${result.width}x${result.height}`);
    console.log('File Size:', result.fileSize);

    setCroppedPhoto(result.dataUrl);

    // Optional: Upload to your backend API
    // const formData = new FormData();
    // formData.append('file', result.blob, result.fileName);
    // await fetch('/api/upload', { method: 'POST', body: formData });
  };

  const handleCancel = () => {
    console.log('Crop cancelled or reset');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-100 p-4">
      {/* The component already renders as a self-contained white card with padding */}
      <InstagramImageCropper
        aspectRatio="1:1" // Decided from code/backend!
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
```

---

## 3. Configuring the Aspect Ratio from Code / Backend

The aspect ratio is **not locked in or hardcoded** and **cannot be altered by the user in the UI**. You configure it directly via the `aspectRatio` prop:

| `aspectRatio` Prop Value | Description | Output Dimensions (Base) |
| :--- | :--- | :--- |
| `'1:1'` *(default)* | Instagram Square Feed Post | `1080 × 1080 px` |
| `'4:5'` | Instagram Portrait Post | `1080 × 1350 px` |
| `'16:9'` | Landscape / Banner | `1080 × 608 px` |
| `'9:16'` | Story / Reels / Mobile Vertical | `1080 × 1920 px` |
| `'original'` | Matches original photo ratio | Proportional to source |
| `number` (e.g. `1.33` or `4/3`) | Custom numeric ratio (width / height) | Calculated from number |

### Examples:

```tsx
// 1. Portrait 4:5 post (Instagram feed standard)
<InstagramImageCropper aspectRatio="4:5" onSave={handleSave} />

// 2. Banner 16:9
<InstagramImageCropper aspectRatio="16:9" onSave={handleSave} />

// 3. Custom 4:3 ratio
<InstagramImageCropper aspectRatio={4 / 3} onSave={handleSave} />
```

---

## 4. How the Interactions Work

- **Mouse Scroll Wheel Zoom**:
  Scroll up to zoom in (up to 3×), scroll down to zoom out (down to 1×).
- **Hold and Move (Pan)**:
  Click and hold with left mouse button (or touch on mobile), then drag in any direction (up, down, left, right).
  Movement is automatically clamped so the image always fills the crop window without empty voids.
- **3×3 Rule-of-Thirds Grid**:
  The grid automatically appears while the user is actively dragging or scrolling, and fades smoothly when released.
- **Under the Card**:
  Only the **Cancel** button (resets to upload screen) and the **Save** button (exports the high-resolution canvas) are rendered.

---

## 5. Embed Inside a Modal Dialog

If you want to render the cropper inside a modal dialog:

```tsx
import React, { useState } from 'react';
import InstagramImageCropper from './components/InstagramImageCropper';
import { CroppedImageResult } from './types/cropper';

export function CropModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Clean White Card */}
      <div className="relative w-full max-w-[480px]">
        <InstagramImageCropper
          aspectRatio="1:1"
          onSave={(result: CroppedImageResult) => {
            console.log('Saved image:', result);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
```
