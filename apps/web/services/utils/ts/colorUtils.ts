/**
 * Color contrast utilities for accessible text on dynamic backgrounds.
 * Uses WCAG 2.1 relative luminance to decide light vs dark foreground.
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

/** WCAG 2.1 relative luminance */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Returns true when the background is light enough to need dark text.
 *
 * The threshold defaults to 0.4 (text contrast). Callers that only care about
 * "so light it disappears on white" can pass a higher one — a saturated mango
 * orange is a light *text* background but must never be treated as a
 * near-white fill.
 */
export function isLightColor(hex: string, threshold = 0.4): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  return relativeLuminance(rgb.r, rgb.g, rgb.b) > threshold
}

/** Ink — the signal colour used when an organization has not set one. */
export const BRAND_FALLBACK = '#27272a'

/**
 * Accepts `#rgb`, `rgb`, `#rrggbb` or `rrggbb` and normalises to `#rrggbb`.
 * Anything else falls back to ink, so a bad value can never break the shell.
 */
export function normalizeBrandColor(value?: string | null): string {
  const raw = (value || '').trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split('').map((c) => c + c).join('')}`
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`
  return BRAND_FALLBACK
}

/**
 * The CSS custom properties every brand surface reads.
 *
 * Derived from one hex so an organization never has to pick six colours:
 * the foreground is chosen by WCAG luminance, and hover/pressed/soft/ring are
 * mixed in CSS with `color-mix`, so they follow whatever hex is configured.
 *
 * With no colour set the whole set resolves to ink — the interface looks
 * exactly as it did before the brand feature existed.
 */
export function getBrandStyle(color?: string | null): Record<string, string> {
  const brand = normalizeBrandColor(color)
  return {
    '--brand': brand,
    '--brand-fg': isLightColor(brand) ? '#18181b' : '#ffffff',
    '--brand-hover': `color-mix(in oklab, ${brand} 86%, black)`,
    '--brand-pressed': `color-mix(in oklab, ${brand} 74%, black)`,
    '--brand-soft': `color-mix(in oklab, ${brand} 10%, transparent)`,
    '--brand-ring': `color-mix(in oklab, ${brand} 35%, transparent)`,
  }
}

/**
 * Tailwind class sets for menu elements on a dynamic primary-color background.
 *
 * - No primaryColor → default gray theme
 * - Dark primaryColor → white foreground
 * - Light primaryColor → dark foreground with subtle overlays
 */
export function getMenuColorClasses(primaryColor: string) {
  if (!primaryColor) {
    return {
      text: 'text-gray-700',
      textMuted: 'text-gray-500',
      hoverBg: 'hover:bg-gray-100',
      iconBtn: 'hover:bg-gray-100 text-gray-600',
      searchBg:
        'bg-white text-black placeholder:text-black/40 focus:ring-black/5 focus:border-black/20 nice-shadow',
      searchIcon:
        'text-black/40 group-focus-within:text-black/60',
      signUpBtn: 'bg-primary text-primary-foreground hover:bg-primary/90',
      profileHover: 'hover:bg-gray-50',
      profileName: 'text-gray-900',
      profileMuted: 'text-gray-500',
      logoFilter: 'none',
    }
  }

  const light = isLightColor(primaryColor)

  if (light) {
    return {
      text: 'text-gray-900',
      textMuted: 'text-gray-700',
      hoverBg: 'hover:bg-black/10',
      iconBtn: 'hover:bg-black/10 text-gray-800',
      searchBg:
        'bg-black/10 text-gray-900 placeholder:text-gray-600 focus:ring-black/10 focus:border-black/20',
      searchIcon:
        'text-gray-600 group-focus-within:text-gray-800',
      signUpBtn: 'bg-zinc-800 text-white hover:bg-zinc-700',
      profileHover: 'hover:bg-black/10',
      profileName: 'text-gray-900',
      profileMuted: 'text-gray-700',
      logoFilter: 'none',
    }
  }

  return {
    text: 'text-white',
    textMuted: 'text-white/70',
    hoverBg: 'hover:bg-white/10',
    iconBtn: 'hover:bg-white/10 text-white',
    searchBg:
      'bg-white/20 text-white placeholder:text-white/60 focus:ring-white/20 focus:border-white/30',
    searchIcon:
      'text-white/60 group-focus-within:text-white/80',
    signUpBtn: 'bg-white text-gray-900 hover:bg-gray-100',
    profileHover: 'hover:bg-white/10',
    profileName: 'text-white',
    profileMuted: 'text-white/70',
    logoFilter: 'brightness(0) invert(1)',
  }
}
