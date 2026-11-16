'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Settings, Shield, Lock } from 'lucide-react'
import { getUriWithOrg } from '@services/config/config'
import { cn } from '@/lib/utils'

interface AccountSidebarProps {
  orgslug: string
  currentSubpage: string
}

const NAV_ITEMS = [
  { id: 'general', icon: Settings, labelKey: 'account.general' },
  { id: 'security', icon: Shield, labelKey: 'account.security' },
  { id: 'privacy', icon: Lock, labelKey: 'account.privacy' },
]

export function AccountSidebar({ orgslug, currentSubpage }: AccountSidebarProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorTop, setIndicatorTop] = useState(-9999)
  const [indicatorOpacity, setIndicatorOpacity] = useState(0)

  const measureIndicator = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const activeLink = container.querySelector('[aria-current="page"]')
    if (activeLink) {
      const navItem = (activeLink as HTMLElement).closest('[data-nav-item]')
      if (navItem) {
        const containerRect = container.getBoundingClientRect()
        const itemRect = navItem.getBoundingClientRect()
        setIndicatorTop(itemRect.top - containerRect.top)
        setIndicatorOpacity(1)
      }
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    measureIndicator()

    const ro = new ResizeObserver(() => {
      measureIndicator()
    })
    ro.observe(container)

    return () => ro.disconnect()
  }, [currentSubpage, measureIndicator])

  return (
    <div className="relative" ref={containerRef}>
      {/* Floating active indicator */}
      <div
        className="absolute left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-sm transition-all duration-200 ease-out pointer-events-none"
        style={{ top: indicatorTop, height: 40, opacity: indicatorOpacity }}
      />
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentSubpage === item.id
          return (
            <div key={item.id} data-nav-item>
              <Link
                href={getUriWithOrg(orgslug, `/account/${item.id}`)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "relative flex items-center gap-x-2.5 h-10 px-4 rounded-xl transition-all",
                  isActive
                    ? "text-ui-fg-base"
                    : "text-ui-fg-subtle hover:bg-ui-bg-subtle-hover hover:text-ui-fg-base"
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
              </Link>
            </div>
          )
        })}
      </nav>
    </div>
  )
}

export default AccountSidebar
