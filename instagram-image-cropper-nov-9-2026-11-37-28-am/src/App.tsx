/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import InstagramImageCropper from './components/InstagramImageCropper.tsx';
import { CroppedImageResult } from './types/cropper.ts';
import { SAMPLE_IMAGES, createDefaultFallbackImage } from './utils/sampleImages.ts';

export default function App() {
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [savedOutput, setSavedOutput] = useState<CroppedImageResult | null>(null);

  // Check URL query parameters for ?autostart=1 or ?sample=1 to populate image immediately
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' || params.get('sample') === '1') {
      // Use the fallback gradient image for guaranteed offline / test consistency
      setInitialImage(createDefaultFallbackImage('Demo Preview'));
    }
  }, []);

  const handleSave = (result: CroppedImageResult) => {
    setSavedOutput(result);
  };

  const handleCancel = () => {
    setInitialImage(null);
    setSavedOutput(null);
  };

  // Aspect ratio decided from code / backend (defaults to '1:1', can easily be '4:5', '16:9', '9:16', 'original', or custom number)
  const [defaultRatio, setDefaultRatio] = useState<'1:1' | '4:5' | '16:9' | '9:16' | 'original' | number>('1:1');

  // Allow URL query parameter e.g. ?ratio=4:5 or ?ratio=16:9 for testing developer-configured aspect ratios
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('ratio');
    if (r === '4:5' || r === '16:9' || r === '9:16' || r === 'original' || r === '1:1') {
      setDefaultRatio(r);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased selection:bg-[#0095F6]/20 selection:text-[#0095F6]">
      {/* Subtle clean header */}
      <header className="mb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center justify-center gap-2">
          <span>Crop Photo</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Scroll to zoom in/out · Hold and drag to reposition image
        </p>
      </header>

      {/* Main Cropper Card Container */}
      <main className="w-full flex justify-center">
        <InstagramImageCropper
          initialImage={initialImage}
          aspectRatio={defaultRatio}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </main>

      {/* Output preview toast or footer notification when saved */}
      {savedOutput && (
        <div
          data-testid="crop-saved-notification"
          className="mt-4 px-4 py-2 bg-white rounded-full border border-emerald-200 shadow-sm flex items-center gap-2 text-xs font-medium text-emerald-800 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Cropped {savedOutput.aspectRatio} image ready ({savedOutput.width}×{savedOutput.height}px)
          </span>
        </div>
      )}
    </div>
  );
}
