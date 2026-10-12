'use client'
import React from 'react'
import { useChartTheme, formatNumber } from './chartTheme'

export interface FunnelStepsProps {
  steps: { label: string; value: number }[]
}

/**
 * Funnel — descending steps (enrollment, checkout…) with step-to-step conversion.
 * Bars fade progressively and inherit the organization's primary color.
 */
export function FunnelSteps({ steps }: FunnelStepsProps) {
  const t = useChartTheme()
  const max = steps[0]?.value || 1
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100
        const prev = i > 0 ? steps[i - 1].value : null
        const conv = prev ? Math.round((s.value / prev) * 100) : 100
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-gray-700">{s.label}</span>
              <span className="text-gray-500 tabular-nums">
                {formatNumber(s.value)}
                {i > 0 && <span className="text-gray-300"> · {conv}%</span>}
              </span>
            </div>
            <div className="h-8 rounded-lg bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-lg transition-all"
                style={{ width: `${pct}%`, background: t.primary, opacity: 1 - i * 0.14 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default FunnelSteps
