/**
 * Analytics chart theme.
 *
 * Chart libraries (recharts) render SVG attributes — CSS `var()` does NOT resolve
 * in presentation attributes, so we read the live CSS custom properties from
 * :root on the client and hand recharts real `hsl(...)` strings. This is what
 * makes every chart inherit the organization's primary color automatically.
 */
import { useEffect, useState } from 'react'

export interface ChartTheme {
  primary: string
  primarySoft: string
  grid: string
  axis: string
  positive: string
  negative: string
  categorical: string[]
}

/**
 * The platform's chart palette (see Dashboard/Analytics/CoreWidgetsRow + FunnelChart).
 * Categorical series all come from this one indigo→violet ramp — never an ad-hoc rainbow.
 */
export const CHART_PALETTE = ['#6b8de3', '#818cf8', '#a78bfa', '#c4b5fd']

const FALLBACK: ChartTheme = {
  primary: '#6366f1',
  primarySoft: 'rgba(99, 102, 241, 0.12)',
  grid: '#e4e4e7',
  axis: '#71717a',
  positive: '#10b981',
  negative: '#f43f5e',
  categorical: CHART_PALETTE,
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK)

  useEffect(() => {
    try {
      const s = getComputedStyle(document.documentElement)
      const hsl = (name: string, fb: string) => {
        const raw = s.getPropertyValue(name).trim()
        return raw ? `hsl(${raw})` : fb
      }
      const primary = hsl('--primary', FALLBACK.primary)
      setTheme({
        primary,
        primarySoft: primary.replace('hsl(', 'hsla(').replace(')', ' / 0.12)'),
        grid: hsl('--border', FALLBACK.grid),
        axis: hsl('--muted-foreground', FALLBACK.axis),
        positive: FALLBACK.positive,
        negative: FALLBACK.negative,
        categorical: CHART_PALETTE,
      })
    } catch {
      /* SSR / no document — keep fallbacks */
    }
  }, [])

  return theme
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
