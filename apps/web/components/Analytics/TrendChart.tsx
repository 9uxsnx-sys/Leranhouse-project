'use client'
import React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartTheme, formatNumber } from './chartTheme'

/**
 * Recharts tooltip restyled to the platform's section-card aesthetic
 * (neutral chrome, tabular figures). Reused by every analytics chart.
 */
export function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md">
      {label != null && <p className="text-[11px] font-medium text-gray-400 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-gray-500">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-gray-900 tabular-nums">
            {formatter ? formatter(p.value) : formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export interface SeriesDef {
  key: string
  name: string
  color?: string
}

export interface TrendChartProps {
  data: any[]
  xKey: string
  series: SeriesDef[]
  height?: number
  formatter?: (v: number) => string
}

/**
 * Trend chart — the platform's standard time-series design.
 * Soft gradient area, 2px monotone line, horizontal-only grid, hidden `0` tick.
 * Single accent color (the org primary), inherits branding automatically.
 */
export function TrendChart({ data, xKey, series, height = 260, formatter }: TrendChartProps) {
  const t = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color || (i === 0 ? t.primary : t.categorical[i % t.categorical.length])
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            )
          })}
        </defs>
        <CartesianGrid vertical={false} stroke={t.grid} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: t.axis }} dy={4} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: t.axis }}
          width={44}
          tickFormatter={(v) => (v === 0 ? '' : formatNumber(v))}
        />
        <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ stroke: t.grid }} />
        {series.map((s, i) => {
          const color = s.color || (i === 0 ? t.primary : t.categorical[i % t.categorical.length])
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          )
        })}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default TrendChart
