'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface SubNavItem {
  label: string
  href: string
}

interface SubNavProps {
  items: SubNavItem[]
  currentPath: string
  className?: string
}

export function SubNav({ items, currentPath, className }: SubNavProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorTop, setIndicatorTop] = useState(0)
  const [indicatorHeight, setIndicatorHeight] = useState(20)

  const isActive = (href: string) => currentPath === href

  const INDICATOR_HEIGHT = 18 // matches text leading-snug line-height

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updatePosition = () => {
      const activeEl = container.querySelector('[data-active="true"]')
      const railEl = container.querySelector('[data-rail]')
      if (activeEl && railEl) {
        const railRect = railEl.getBoundingClientRect()
        const itemRect = activeEl.getBoundingClientRect()
        // Center the indicator vertically on the item
        setIndicatorTop(itemRect.top - railRect.top + (itemRect.height - INDICATOR_HEIGHT) / 2)
        setIndicatorHeight(INDICATOR_HEIGHT)
      } else {
        const firstItem = container.querySelector('[data-nav-sub-item]')
        const railEl = container.querySelector('[data-rail]')
        if (firstItem && railEl) {
          const railRect = railEl.getBoundingClientRect()
          const itemRect = firstItem.getBoundingClientRect()
          setIndicatorTop(itemRect.top - railRect.top + (itemRect.height - INDICATOR_HEIGHT) / 2)
          setIndicatorHeight(INDICATOR_HEIGHT)
        }
      }
    }

    updatePosition()

    // Recalculate on resize
    const ro = new ResizeObserver(updatePosition)
    ro.observe(container)
    return () => ro.disconnect()
  }, [currentPath])

  return (
    <div
      ref={containerRef}
      className={cn("grid grid-cols-[2px_1fr] gap-y-3 gap-x-4 ml-4 py-2", className)}
    >
      {/* Vertical rail — spans exactly the number of items */}
      <div
        data-rail
        className="relative w-0.5 rounded-[1px] bg-neutral-400/12"
        style={{ gridRow: `1 / span ${items.length}`, gridColumn: 1 }}
      >
        <div
          className="absolute left-0 w-full rounded-[100vw] bg-neutral-500 transition-all duration-200 ease-out pointer-events-none"
          style={{ top: indicatorTop, height: indicatorHeight }}
        />
      </div>
      {/* Sub-tab items */}
      {items.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active ? 'true' : undefined}
            data-nav-sub-item="true"
            className={cn(
              "col-[2] text-[15px] leading-snug transition-colors",
              active
                ? "text-ui-fg-base font-medium"
                : "text-ui-fg-muted hover:text-ui-fg-base"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
