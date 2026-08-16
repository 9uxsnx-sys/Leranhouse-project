'use client'

import React, { ComponentType } from 'react'
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
  Book,
  FolderOpen,
  PlaySolid,
  Users,
  CubeSolid,
  ShoppingCart,
  Directions,
  GridList,
  GridLayout,
  EllipsisHorizontal,
} from '@components/Objects/Icons/MedusaIcons'
import { Text } from '@components/ui/text'

/**
 * LearnHouse port of the Medusa v2.18.0 main sidebar (main-layout.tsx + nav-item.tsx).
 * - Grey `#fafafa` canvas, white active nav chip with the elevation-card ring.
 * - Header (org) -> nav -> user block pinned at the bottom, hairline dividers.
 */

// nav-item.tsx: BASE_NAV_LINK_CLASSES + ACTIVE_NAV_LINK_CLASSES
const NAV_BASE =
  'text-gray-500 transition-colors hover:bg-gray-100 flex items-center gap-x-2 rounded-md py-0.5 pl-0.5 pr-2 outline-none'
const NAV_ACTIVE = 'bg-white card-shadow-rest text-gray-900 hover:bg-white'

interface NavEntry {
  to: string
  labelKey?: string
  label?: string
  icon: ComponentType<{ className?: string }>
  feature?: string | null
}

const NAV_ITEMS: NavEntry[] = [
  { to: '/', labelKey: 'common.home', icon: House, feature: null },
  { to: '/courses', labelKey: 'courses.courses', icon: Book, feature: 'courses' },
  { to: '/collections', labelKey: 'collections.collections', icon: FolderOpen, feature: 'collections' },
  { to: '/podcasts', labelKey: 'podcasts.podcasts', icon: PlaySolid, feature: 'podcasts' },
  { to: '/communities', labelKey: 'communities.title', icon: Users, feature: 'communities' },
  { to: '/playgrounds', label: 'Playgrounds', icon: CubeSolid, feature: 'playgrounds' },
  { to: '/store', label: 'Store', icon: ShoppingCart, feature: 'payments' },
  { to: '/trail', labelKey: 'courses.progress', icon: Directions, feature: null },
  { to: '/boards', label: 'Boards', icon: GridList, feature: 'boards' },
]

const Divider = () => (
  <div className="px-3">
    <div className="border-t border-dashed border-border" />
  </div>
)

function OrgHeader({ org, orgslug }: { org: any; orgslug: string }) {
  const name = org?.name || 'LearnHouse'
  const fallback = (name || 'L').slice(0, 1).toUpperCase()
  const logoUrl = org?.logo_image
    ? getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)
    : undefined

  return (
    <div className="p-3">
      <Link
        href={getUriWithOrg(orgslug, '/')}
        className="grid w-full grid-cols-[24px_1fr_15px] items-center gap-x-3 rounded-md p-0.5 pe-2 outline-none transition-colors hover:bg-gray-100"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-6 w-6 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200 text-xs font-medium text-gray-600">
            {fallback}
          </div>
        )}
        <div className="block overflow-hidden text-start">
          <Text size="small" weight="plus" leading="compact" className="truncate text-gray-900">
            {name}
          </Text>
        </div>
        <EllipsisHorizontal className="h-4 w-4 text-gray-400" />
      </Link>
    </div>
  )
}

function NavLinkItem({
  item,
  orgslug,
  active,
}: {
  item: NavEntry
  orgslug: string
  active: boolean
}) {
  const { t } = useTranslation()
  const href = getUriWithOrg(orgslug, item.to)
  const label = item.labelKey ? t(item.labelKey) : item.label
  const Icon = item.icon

  return (
    <Link href={href} className={`${NAV_BASE} ${active ? NAV_ACTIVE : ''}`}>
      <div className="flex size-6 items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <Text size="small" weight="plus" leading="compact">
        {label}
      </Text>
    </Link>
  )
}

export function MedusaSidebarContent({ orgslug }: { orgslug: string }) {
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

  return (
    <aside className="flex h-full flex-1 flex-col justify-between overflow-y-auto">
      <div className="flex flex-1 flex-col">
        {/* Header: org selector (Medusa Header) */}
        <div className="sticky top-0">
          <OrgHeader org={org} orgslug={orgslug} />
          <Divider />
        </div>

        {/* Nav (Medusa SidebarRoutes) */}
        <nav className="py-3">
          <div className="flex flex-col gap-y-1 px-3">
            {visible.map((item) => (
              <NavLinkItem
                key={item.to}
                item={item}
                orgslug={orgslug}
                active={isActive(item.to)}
              />
            ))}
          </div>
        </nav>
      </div>

      {/* Bottom: dashboard shortcut + user (Medusa UtilitySection + UserSection) */}
      <div className="sticky bottom-0">
        {rights?.dashboard?.action_access && (
          <div className="flex flex-col gap-y-0.5 px-3 pb-3">
            <NavLinkItem
              item={{
                to: '/dash',
                labelKey: 'common.dashboard',
                icon: GridLayout,
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
