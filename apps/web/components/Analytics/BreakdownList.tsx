'use client'
import React from 'react'
import { useChartTheme } from './chartTheme'

export interface BreakdownListProps {
  data: any[]
  nameKey: string
  valueKey: string
  formatter?: (v: number) => string
}

/**
 * Breakdown list — one row per segment: label · proportional bar · value.
 * The platform's distribution pattern (devices, traffic sources, plan mix).
 * Chosen over pie/donut because it stays compact vertically and reads left-to-right.
 */
export function BreakdownList({ data, nameKey, valueKey, formatter }: BreakdownListProps) {
  const t = useChartTheme()
  const total = data.reduce((a, d) => a + (d[valueKey] || 0), 0) || 1
  return (
    <div className="space-y-3.5 pt-1">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-20 truncate text-[13px] text-gray-600">{d[nameKey]}</span>
          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${((d[valueKey] || 0) / total) * 100}%`, background: t.categorical[i % t.categorical.length] }}
            />
          </div>
          <span className="w-20 shrink-0 border-l border-gray-100 pl-3 text-right text-[13px] font-semibold text-gray-900 tabular-nums">
            {formatter ? formatter(d[valueKey]) : `${Math.round(((d[valueKey] || 0) / total) * 100)}%`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default BreakdownList
