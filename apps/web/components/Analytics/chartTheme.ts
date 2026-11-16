/**
 * Analytics chart theme.
 *
 * Every series colour is derived from the organization's single brand hex — the
 * same value every other brand surface reads. That makes all chart types
 * (area/line, bar, ranked bar, funnel, scatter) white-label without a second
 * colour source.
 *
 * Recharts renders SVG presentation attributes, where CSS `var()` does not
 * resolve, so the hex is resolved in JS and handed over as a real colour string.
 *
 * The brand is read from the org context rather than from `--brand` on
 * `document.documentElement`: child effects run before the shell's, so reading
 * the custom property here would capture the ink fallback on first paint and
 * never update.
 */
import { useEffect, useMemo, useState } from 'react'
import { useOrg } from '@components/Contexts/OrgContext'
import { isLightColor, normalizeBrandColor } from '@services/utils/ts/colorUtils'

export interface ChartTheme {
  primary: string
  primarySoft: string
  grid: string
  axis: string
  positive: string
  negative: string
  categorical: string[]
}

const GRID = '#e4e4e7'
const AXIS = '#71717a'
const POSITIVE = '#10b981'
const NEGATIVE = '#f43f5e'

type Rgb = { r: number; g: number; b: number }
const WHITE: Rgb = { r: 255, g: 255, b: 255 }
const BLACK: Rgb = { r: 0, g: 0, b: 0 }

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: Rgb): string {
  const part = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

/** Blends `hex` toward `target`. 0 keeps the hex, 1 returns the target. */
function blend(hex: string, target: Rgb, amount: number): string {
  const c = hexToRgb(hex)
  return rgbToHex({
    r: c.r + (target.r - c.r) * amount,
    g: c.g + (target.g - c.g) * amount,
    b: c.b + (target.b - c.b) * amount,
  })
}

function withAlpha(hex: string, alpha: number): string {
  const c = hexToRgb(hex)
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`
}

/**
 * Luminance above which a brand is too pale to read as a chart fill on white.
 * Deliberately far above the 0.4 text threshold: a saturated mango orange is
 * light enough to need dark text but must still be drawn at full strength —
 * darkening it is what turns orange into brown.
 */
const NEAR_WHITE = 0.82

/** The first series colour. The brand is used exactly, except for near-white. */
export function chartPrimary(brand: string): string {
  return isLightColor(brand, NEAR_WHITE) ? blend(brand, BLACK, 0.45) : brand
}

/**
 * Categorical ramp: one hue, five steps, all derived by mixing toward white so
 * every step stays in the brand's own family. Lightening only — mixing toward
 * black would take a saturated hue through brown.
 */
export function buildBrandRamp(brand: string): string[] {
  const base = chartPrimary(brand)
  return [0, 0.18, 0.34, 0.5, 0.64].map((amount) =>
    amount === 0 ? base : blend(base, WHITE, amount)
  )
}

export function useChartTheme(): ChartTheme {
  const org = useOrg() as any
  const orgConfig = org?.config?.config
  const brand = normalizeBrandColor(
    orgConfig?.customization?.general?.color || orgConfig?.general?.color || ''
  )

  const [neutrals, setNeutrals] = useState({ grid: GRID, axis: AXIS })

  // Grid and axis stay neutral tokens; they are not part of the brand signal.
  useEffect(() => {
    try {
      const s = getComputedStyle(document.documentElement)
      const hsl = (name: string, fallback: string) => {
        const raw = s.getPropertyValue(name).trim()
        return raw ? `hsl(${raw})` : fallback
      }
      setNeutrals({ grid: hsl('--border', GRID), axis: hsl('--muted-foreground', AXIS) })
    } catch {
      /* SSR / no document — keep fallbacks */
    }
  }, [])

  return useMemo(() => {
    const primary = chartPrimary(brand)
    return {
      primary,
      primarySoft: withAlpha(primary, 0.12),
      grid: neutrals.grid,
      axis: neutrals.axis,
      positive: POSITIVE,
      negative: NEGATIVE,
      categorical: buildBrandRamp(brand),
    }
  }, [brand, neutrals.grid, neutrals.axis])
}

export function formatNumber(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export function formatCurrency(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} DZD`
}
