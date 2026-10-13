'use client'
import React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartTheme } from './chartTheme'
import { ChartTooltip } from './TrendChart'

export interface RankedBarsProps {
  data: any[]
  categoryKey: string
  valueKey: string
  height?: number
  formatter?: (v: number) => string
}

/**
 * Rankings — horizontal bars for ordered top-N lists (top courses, traffic sources…).
 * Category labels sit flush against the card's left edge (tight label column, no
 * left margin) and the value axis is hidden so the bars carry the whole row.
 */
export function RankedBars({ data, categoryKey, valueKey, height = 260, formatter }: RankedBarsProps) {
  const t = useChartTheme()
  // A category axis with zero rows collapses recharts to an empty SVG, so an
  // empty card looked broken instead of empty. Lay out blank rows in that case
  // to keep the frame (grid + label column) — same way the vertical BarsChart
  // degrades when it has no data.
  const rows = data.length
    ? data
    : Array.from({ length: 5 }, () => ({ [categoryKey]: '', [valueKey]: 0 }))
  // Size the label column to the data: short labels (Google, Direct…) get a tight
  // column, long course names get a wider one — so there is never dead space on the left.
  const longest = rows.reduce((m, d) => Math.max(m, String(d[categoryKey] ?? '').length), 0)
  const axisWidth = Math.min(150, Math.max(40, Math.round(longest * 5.6) + 4))
  // Evenly spaced background lines (8 → 7 equal gaps) across the value range.
  const dataMax = rows.reduce((m, d) => Math.max(m, Number(d[valueKey]) || 0), 0) || 1
  const gridValues = Array.from({ length: 8 }, (_, i) => (dataMax / 7) * i)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={t.grid} verticalValues={gridValues} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey={categoryKey}
          tickLine={false}
          axisLine={false}
          width={axisWidth}
          tick={{ fontSize: 11, fill: t.axis }}
        />
        <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey={valueKey} fill={t.primary} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default RankedBars
