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
 * WCAG 2.1 contrast ratio between two colours, rounded to one decimal.
 * Returned by the branding screen as a read-out, never as a gate.
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(normalizeBrandColor(foreground))
  const bg = hexToRgb(normalizeBrandColor(background))
  if (!fg || !bg) return 1
  const one = relativeLuminance(fg.r, fg.g, fg.b)
  const two = relativeLuminance(bg.r, bg.g, bg.b)
  const lighter = Math.max(one, two)
  const darker = Math.min(one, two)
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 10) / 10
}

/** Ink foreground for light brand fills. */
const INK_FG = '#18181b'
/** White foreground for dark brand fills. */
const LIGHT_FG = '#ffffff'

/**
 * Foreground used for text and icons sitting on the brand colour.
 *
 * The organization may pin an explicit value; otherwise the two candidates are
 * compared and the higher-contrast one wins. Comparing beats a brightness
 * threshold: a mid-tone brand such as clay resolves to white under a threshold
 * (3.12:1) while ink on the same fill is 5.68:1.
 *
 * Empty or malformed input falls back to the automatic choice, so a half-typed
 * hex in the branding form can never break the shell.
 */
export function resolveBrandFg(brand: string, explicit?: string | null): string {
  const raw = (explicit || '').trim()
  if (/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return normalizeBrandColor(raw)
  return getContrastRatio(INK_FG, brand) >= getContrastRatio(LIGHT_FG, brand) ? INK_FG : LIGHT_FG
}

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

function rgbToHex(r: number, g: number, b: number): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

/** Darkens a hex by `amount` percent — the automatic hover/pressed step. */
function mixTowardBlack(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const keep = 1 - amount / 100
  return rgbToHex(rgb.r * keep, rgb.g * keep, rgb.b * keep)
}

/** Lightens a hex by `amount` percent. */
function mixTowardWhite(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const keep = 1 - amount / 100
  return rgbToHex(
    rgb.r * keep + 255 * (amount / 100),
    rgb.g * keep + 255 * (amount / 100),
    rgb.b * keep + 255 * (amount / 100)
  )
}

/**
 * Hover and pressed fills for the brand colour.
 *
 * With no explicit hover the steps are mixed toward black, gentler when the
 * foreground is dark because dimming lowers contrast under dark text.
 *
 * An explicit hover is used verbatim and pressed is one further 12% step from
 * that hover in the same direction — lighter hover → lighter pressed. Measuring
 * from the hover instead of extrapolating the brand→hover vector keeps a pale
 * hover from saturating to pure white. Both values are real hex, not
 * `color-mix()` expressions, so the branding screen can print their contrast
 * ratio.
 */
export function resolveBrandHover(
  brand: string,
  fg: string,
  explicit?: string | null
): { hover: string; pressed: string } {
  const raw = (explicit || '').trim()
  const isHex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)

  if (!isHex) {
    const step = isLightColor(fg) ? { hover: 14, pressed: 26 } : { hover: 6, pressed: 12 }
    return {
      hover: mixTowardBlack(brand, step.hover),
      pressed: mixTowardBlack(brand, step.pressed),
    }
  }

  const hover = normalizeBrandColor(raw)
  const base = hexToRgb(brand)
  const target = hexToRgb(hover)
  if (!base || !target) return { hover, pressed: hover }

  const lighter =
    relativeLuminance(target.r, target.g, target.b) >
    relativeLuminance(base.r, base.g, base.b)

  return {
    hover,
    pressed: lighter ? mixTowardWhite(hover, 12) : mixTowardBlack(hover, 12),
  }
}

/**
 * The CSS custom properties every brand surface reads.
 *
 * Derived from one hex so an organization never has to pick six colours:
 * the foreground is chosen by contrast, and hover/pressed are computed from
 * the brand (or from the explicit hover the organization pinned) while
 * soft/ring are mixed from the brand.
 *
 * When no hover is pinned, the dimming depends on the foreground. Dimming a
 * fill raises contrast under white text but lowers it under dark text, so a
 * dark foreground uses a gentler step — 14%/26% black would take a clay brand
 * from 5.68:1 to 4.32:1 / 3.36:1, while 6%/12% keeps it at 5.07:1 / 4.51:1.
 *
 * With no colour set the whole set resolves to ink — the interface looks
 * exactly as it did before the brand feature existed.
 */
export function getBrandStyle(
  color?: string | null,
  brandFg?: string | null,
  sidebarBrand = false,
  brandHover?: string | null
): Record<string, string> {
  const brand = normalizeBrandColor(color)
  const fg = resolveBrandFg(brand, brandFg)
  const hover = resolveBrandHover(brand, fg, brandHover)
  return {
    '--brand': brand,
    '--brand-fg': fg,
    '--brand-hover': hover.hover,
    '--brand-pressed': hover.pressed,
    '--brand-soft': `color-mix(in oklab, ${brand} 10%, transparent)`,
    '--brand-ring': `color-mix(in oklab, ${brand} 35%, transparent)`,
    // The floating pill behind the active sidebar item. Off keeps the original
    // white surface; on makes it a brand fill, so the label follows the
    // foreground rather than ink.
    '--sidebar-active-bg': sidebarBrand ? brand : '#ffffff',
    '--sidebar-active-border': sidebarBrand ? brand : '#f3f4f6',
    '--sidebar-active-fg': sidebarBrand ? fg : '#18181b',
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
