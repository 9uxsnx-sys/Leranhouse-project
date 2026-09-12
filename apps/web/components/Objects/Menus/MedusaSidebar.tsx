'use client'

import React, { ComponentType, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import { getUriWithOrg } from '@services/config/config'
import { getOrgLogoMediaDirectory } from '@services/media/media'
import { HeaderProfileBox } from '@components/Security/HeaderProfileBox'
import {
  House,
  BookOpen,
  Users,
  ShoppingCart,
  Route,
  LayoutDashboard,
  MoreHorizontal,
  Search,
  Mic,
} from 'lucide-react'
import { Text } from '@components/ui/text'

/**
 * LearnHouse port of the Medusa v2.18.0 main sidebar (main-layout.tsx + nav-item.tsx).
 * - Transparent canvas (#fafafa), white active nav chip with the elevation-card ring.
 * - Header (org) -> nav -> user block pinned at the bottom, hairline dashed dividers.
 */

// nav-item.tsx: BASE_NAV_LINK_CLASSES + ACTIVE_NAV_LINK_CLASSES (exact)
const NAV_BASE =
  'text-ui-fg-subtle transition-fg hover:bg-ui-bg-subtle-hover flex items-center gap-x-2.5 h-10 px-4 rounded-xl outline-none [&>svg]:text-ui-fg-subtle focus-visible:shadow-borders-focus'
const NAV_ACTIVE = 'text-ui-fg-base'

interface NavEntry {
  to: string
  labelKey?: string
  label?: string
  icon: ComponentType<{ className?: string }>
  feature?: string | null
}

const NAV_ITEMS: NavEntry[] = [
  { to: '/search', labelKey: 'common.search', icon: Search, feature: null },
  { to: '/', labelKey: 'common.home', icon: House, feature: null },
  { to: '/courses', labelKey: 'courses.courses', icon: BookOpen, feature: 'courses' },
  { to: '/podcasts', labelKey: 'podcasts.podcasts', icon: Mic, feature: 'podcasts' },
  { to: '/communities', labelKey: 'communities.title', icon: Users, feature: 'communities' },
  { to: '/store', label: 'Store', icon: ShoppingCart, feature: 'payments' },
  { to: '/trail', labelKey: 'courses.progress', icon: Route, feature: null },
]

// divider.tsx — exact dashed recipe
const Divider = () => (
  <div className="px-3">
    <div className="h-px w-full bg-[linear-gradient(90deg,var(--color-ui-border-strong)_1px,transparent_1px)] bg-[length:4px_1px]" />
  </div>
)

// main-layout.tsx Header — org selector trigger (exact classes)
function OrgHeader({ org, orgslug }: { org: any; orgslug: string }) {
  const name = org?.name || 'LearnHouse'
  const fallback = (name || 'L').slice(0, 1).toUpperCase()
  const logoUrl = org?.logo_image
    ? getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)
    : undefined

  return (
    <div className="w-full p-3">
      <Link
        href={getUriWithOrg(orgslug, '/')}
        className="bg-ui-bg-subtle transition-fg grid w-full grid-cols-[24px_1fr_15px] items-center gap-x-3 rounded-md p-0.5 pe-2 outline-none hover:bg-ui-bg-subtle-hover focus-visible:shadow-borders-focus"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-6 w-6 rounded-md object-cover"
          />
        ) : (
          <div className="shadow-borders-base flex h-6 w-6 items-center justify-center rounded-md bg-ui-bg-base text-xs font-medium text-ui-fg-muted">
            {fallback}
          </div>
        )}
        <div className="block overflow-hidden text-start">
          <Text size="small" weight="plus" leading="compact" className="truncate text-ui-fg-base">
            {name}
          </Text>
        </div>
        <MoreHorizontal className="text-ui-fg-muted" />
      </Link>
    </div>
  )
}

function NavLinkItem({
  item,
  orgslug,
  active,
  onSearchClick,
}: {
  item: NavEntry
  orgslug: string
  active: boolean
  onSearchClick?: () => void
}) {
  const { t } = useTranslation()
  const href = getUriWithOrg(orgslug, item.to)
  const label = item.labelKey ? t(item.labelKey) : item.label
  const Icon = item.icon

  if (item.to === '/search') {
    return (
      <button
        onClick={onSearchClick}
        className={`${NAV_BASE} w-full text-left`}
      >
        <Icon className="w-5 h-5" />
        <Text size="small" weight="plus" leading="compact" className="text-sm">
          {label}
        </Text>
      </button>
    )
  }

  return (
    <Link href={href} className={`${NAV_BASE} ${active ? NAV_ACTIVE : ''}`}>
      <Icon className="w-5 h-5" />
      <Text size="small" weight="plus" leading="compact" className="text-sm">
        {label}
      </Text>
    </Link>
  )
}

export function MedusaSidebarContent({ orgslug, onSearchClick }: { orgslug: string; onSearchClick?: () => void }) {
  const org = useOrg() as any
  const pathname = usePathname()
  const { rights } = useAdminStatus()

  // Feature visibility: resolved_features from API is the source of truth
  const rf = org?.config?.config?.resolved_features

  const visible = NAV_ITEMS.filter((item) => {
    if (!item.feature) return true
    if (rf?.[item.feature]) return rf[item.feature].enabled
    return true
  })

  const isActive = (to: string) => {
    const href = getUriWithOrg(orgslug, to)
    if (to === '/') return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  // Animated floating indicator: compute active item index
  const activeIndex = useMemo(
    () => visible.findIndex((item) => isActive(item.to)),
    [visible, pathname, orgslug]
  )
  const indicatorTop = activeIndex >= 0 ? activeIndex * 40 : -9999 // 40px (h-10) no gap

  return (
    <aside className="flex flex-1 flex-col justify-between overflow-x-hidden overflow-y-auto">
      <div className="flex flex-1 flex-col">
        {/* Header: org selector (main-layout.tsx Header) */}
        <div className="bg-ui-bg-subtle sticky top-0">
          <OrgHeader org={org} orgslug={orgslug} />
          <Divider />
        </div>

        {/* Nav (main-layout.tsx SidebarRoutes) */}
        <nav className="pt-4 pb-3">
          <div className="px-3">
            <div className="relative">
              {/* Floating active indicator */}
              <div
                className="absolute left-0 right-0 bg-ui-bg-base shadow-elevation-card-rest rounded-xl transition-all duration-200 ease-out pointer-events-none"
                style={{ top: indicatorTop, height: 40, opacity: activeIndex >= 0 ? 1 : 0 }}
              />
              <div className="relative flex flex-col">
                {visible.map((item) => (
                  <NavLinkItem
                    key={item.to}
                    item={item}
                    orgslug={orgslug}
                    active={isActive(item.to)}
                    onSearchClick={onSearchClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom: dashboard shortcut + user (main-layout.tsx UtilitySection + UserSection) */}
      <div className="bg-ui-bg-subtle sticky bottom-0">
        {rights?.dashboard?.action_access && (
          <div className="flex flex-col gap-y-0.5 px-3 py-3">
            <NavLinkItem
              item={{
                to: '/dash',
                labelKey: 'common.dashboard',
                icon: LayoutDashboard,
                feature: null,
              }}
              orgslug={orgslug}
              active={isActive('/dash')}
            />
          </div>
        )}
        <Divider />
        <div className="p-3">
          <HeaderProfileBox />
        </div>
      </div>
    </aside>
  )
}
