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
  // Size the label column to the data: short labels (Google, Direct…) get a tight
  // column, long course names get a wider one — so there is never dead space on the left.
  const longest = data.reduce((m, d) => Math.max(m, String(d[categoryKey] ?? '').length), 0)
  const axisWidth = Math.min(160, Math.max(44, Math.round(longest * 6.2) + 8))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={t.grid} />
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
