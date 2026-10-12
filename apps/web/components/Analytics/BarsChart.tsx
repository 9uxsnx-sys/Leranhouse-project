'use client'
import React from 'react'
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartTheme, formatNumber } from './chartTheme'
import { ChartTooltip, SeriesDef } from './TrendChart'

export interface BarsChartProps {
  data: any[]
  xKey: string
  series: SeriesDef[]
  height?: number
  formatter?: (v: number) => string
  /** Shorten long category labels on the axis (the tooltip still shows the full value). */
  xTickFormatter?: (v: any) => string
}

/**
 * Bar chart — the platform's standard categorical/comparison chart.
 * Rounded top corners, 34px max bar width, horizontal-only grid, hidden `0` tick.
 * Supports a single series or grouped series.
 */
export function BarsChart({ data, xKey, series, height = 260, formatter, xTickFormatter }: BarsChartProps) {
  const t = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke={t.grid} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: t.axis }}
          dy={4}
          tickFormatter={xTickFormatter}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: t.axis }}
          width={44}
          tickFormatter={(v) => (v === 0 ? '' : formatNumber(v))}
        />
        <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color || (i === 0 ? t.primary : t.categorical[i % t.categorical.length])}
            radius={[4, 4, 0, 0]}
            maxBarSize={34}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export default BarsChart
