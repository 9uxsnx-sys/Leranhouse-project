'use client'
import React from 'react'
import { cn } from '@/lib/utils'

/**
 * The white section card used across the analytics tabs.
 * Section heading style matches the rest of the platform.
 */
export function SectionCard({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-6', className)}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-5">
          {title ? (
            <h3 className="text-[13px] font-semibold tracking-wide uppercase text-gray-500">{title}</h3>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}

/**
 * A section card whose body is a single chart of a fixed height.
 */
export function ChartCard({
  title,
  actions,
  height = 260,
  children,
  className,
}: {
  title: string
  actions?: React.ReactNode
  height?: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-6', className)}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-semibold tracking-wide uppercase text-gray-500">{title}</h3>
        {actions}
      </div>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  )
}
