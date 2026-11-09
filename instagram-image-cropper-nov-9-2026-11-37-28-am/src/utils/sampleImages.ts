/**
 * Sample image presets for testing and quick start without manual file picking.
 */

export interface SampleImage {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-1',
    name: 'Urban Architecture',
    category: 'Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sample-2',
    name: 'Sunset Coastline',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'sample-3',
    name: 'Minimal Coffee',
    category: 'Lifestyle',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
  },
];

/**
 * Creates a deterministic, offline-safe gradient canvas image data URL as instant fallback.
 */
export function createDefaultFallbackImage(label = 'Sample Photo'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Rich Instagram gradient background
  const grad = ctx.createLinearGradient(0, 0, 1200, 900);
  grad.addColorStop(0, '#833ab4');
  grad.addColorStop(0.5, '#fd1d1d');
  grad.addColorStop(1, '#fcb045');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 900);

  // Decorative aesthetic circles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(350, 450, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(850, 400, 200, 0, Math.PI * 2);
  ctx.fill();

  // Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 600, 450);

  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('1200 × 900 · Ready for Instagram Cropping', 600, 510);

  return canvas.toDataURL('image/jpeg', 0.95);
}
