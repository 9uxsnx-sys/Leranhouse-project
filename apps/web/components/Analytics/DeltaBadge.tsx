'use client'
import React from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Inline +/- delta — same style as the StatCard trend caption:
 * an arrow + the colored value, no pill background.
 */
export function DeltaBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0
  return (
    <span className="inline-flex items-center gap-1 text-[13px]">
      {up ? (
        <TrendingUp size={15} className="text-emerald-600" />
      ) : (
        <TrendingDown size={15} className="text-rose-600" />
      )}
      <span className={cn('font-medium tabular-nums', up ? 'text-emerald-600' : 'text-rose-600')}>
        {up ? '+' : ''}
        {value}
        {suffix}
      </span>
    </span>
  )
}

export default DeltaBadge
