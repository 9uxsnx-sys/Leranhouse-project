'use client'
import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

import Link from 'next/link'
import {
  ArrowRightOnRectangle,
  CreditCard,
  EllipsisHorizontal,
  IdBadge,
} from '@components/Objects/Icons/MedusaIcons'
import { Avatar } from '@components/ui/avatar'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getUriWithOrg } from '@services/config/config'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import {
  HoverMenu,
  HoverMenuContent,
  HoverMenuItem,
} from "@components/ui/hover-menu"
import { signOut } from '@components/Contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export const HeaderProfileBox = ({ primaryColor = '', collapsed = false }: { primaryColor?: string; collapsed?: boolean }) => {
  const session = useLHSession() as any
  const org = useOrg() as any
  const { t } = useTranslation()
  const router = useRouter()


  useEffect(() => {
    // Not signed in — the org shell is authenticated only, send to login
    if (session?.status === 'unauthenticated' && org?.slug) {
      router.push(getUriWithOrg(org.slug, '/login'))
    }
  }, [session?.status, org?.slug, router])

  // Medusa Avatar source (mirrors UserAvatar resolution for the current session user)
  const avatarSrc = useMemo((): string | undefined => {
    const avatarImage = session?.data?.user?.avatar_image
    if (!avatarImage) return undefined
    if (avatarImage.startsWith('http://') || avatarImage.startsWith('https://')) return avatarImage
    return getUserAvatarMediaDirectory(session.data.user.user_uuid, avatarImage)
  }, [session])

  const avatarFallback = (session?.data?.user?.username || '?').slice(0, 2).toUpperCase()

  const menuContent = (
    <HoverMenuContent className="min-w-[220px]">
      {/* User info header */}
      <div className="flex items-center gap-x-3 px-3 py-2 mb-1 border-b border-gray-100">
        <Avatar src={avatarSrc} fallback={avatarFallback} variant="rounded" size="small" />
        <div className="block min-w-0 max-w-[187px] overflow-hidden whitespace-nowrap">
          <p className="text-sm font-medium truncate capitalize">
            {session.data.user.username}
          </p>
          <p className="text-xs text-ui-fg-subtle truncate">{session.data.user.email}</p>
        </div>
      </div>

      <HoverMenuItem asChild>
        <Link href={getUriWithOrg(org?.slug, '/account/general')} className="flex items-center gap-2">
          <IdBadge className="h-4 w-4" />
          <span>{t('user.user_settings')}</span>
        </Link>
      </HoverMenuItem>
      <HoverMenuItem asChild>
        <Link href={getUriWithOrg(org?.slug, '/account/purchases')} className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span>{t('account.purchases')}</span>
        </Link>
      </HoverMenuItem>

      <div className="border-t border-gray-100 my-1 mx-2" />

      <HoverMenuItem
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-red-600 hover:text-red-600 hover:bg-red-50"
      >
        <ArrowRightOnRectangle className="h-4 w-4" />
        <span>Sign Out</span>
      </HoverMenuItem>
    </HoverMenuContent>
  )

  return (
    <div className="flex items-stretch items-center">
      {session.status == 'unauthenticated' && null}
      {session.status == 'authenticated' && (
        <HoverMenu
          align="end"
          content={menuContent}
        >
          {collapsed ? (
            <button className="flex items-center justify-center w-full h-10 rounded-lg text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all">
              <Avatar src={avatarSrc} fallback={avatarFallback} variant="rounded" size="xsmall" />
            </button>
          ) : (
            <button className={cn(
              "flex items-center w-full h-10 rounded-xl text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all",
              "px-4 gap-x-2.5"
            )}>
              <div className="flex size-6 items-center justify-center">
                <Avatar src={avatarSrc} fallback={avatarFallback} variant="rounded" size="xsmall" />
              </div>
              <div className="flex items-center overflow-hidden flex-1">
                <span className="text-sm font-medium truncate capitalize">
                  {session.data.user.username}
                </span>
              </div>
              <EllipsisHorizontal className="text-ui-fg-muted w-[18px] h-[18px] ml-auto shrink-0" />
            </button>
          )}
        </HoverMenu>
      )}
    </div>
  )
}
