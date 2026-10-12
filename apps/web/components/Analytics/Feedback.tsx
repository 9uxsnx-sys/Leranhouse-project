'use client'
import React from 'react'
import { Inbox, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10', className)}>
      <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon size={20} className="text-gray-400" />
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 text-xs text-gray-500 max-w-[240px]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-gray-100', className)} />
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {[60, 40, 75, 55, 90, 65, 80, 50, 70, 85, 45, 95].map((h, i) => (
        <div key={i} className="flex-1 rounded-md bg-gray-100 animate-pulse" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}
