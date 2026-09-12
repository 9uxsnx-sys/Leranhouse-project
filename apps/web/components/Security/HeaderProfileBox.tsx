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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { signOut } from '@components/Contexts/AuthContext'
import { useTranslation } from 'react-i18next'

export const HeaderProfileBox = ({ primaryColor = '' }: { primaryColor?: string }) => {
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

  return (
    <div className="flex items-stretch items-center">
      {session.status == 'unauthenticated' && null}
      {session.status == 'authenticated' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-ui-bg-subtle grid w-full cursor-pointer grid-cols-[24px_1fr_15px] items-center gap-2 rounded-md py-1 pe-2 ps-0.5 text-ui-fg-base outline-none transition-fg hover:bg-ui-bg-subtle-hover data-[state=open]:bg-ui-bg-subtle-hover focus-visible:shadow-borders-focus">
              <div className="flex size-6 items-center justify-center">
                <Avatar src={avatarSrc} fallback={avatarFallback} variant="rounded" size="xsmall" />
              </div>
              <div className="flex items-center overflow-hidden">
                <span className="txt-compact-small-plus truncate capitalize">
                  {session.data.user.username}
                </span>
              </div>
              <EllipsisHorizontal className="text-ui-fg-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={4}
            className="bg-ui-bg-base shadow-elevation-card-rest min-w-[180px] w-full"
          >
            <DropdownMenuLabel>
              <div className="flex items-center gap-x-3 overflow-hidden px-2 py-1">
                <Avatar src={avatarSrc} fallback={avatarFallback} variant="rounded" size="small" />
                <div className="block min-w-0 max-w-[187px] overflow-hidden whitespace-nowrap">
                  <p className="txt-compact-medium-plus truncate capitalize">
                    {session.data.user.username}
                  </p>
                  <p className="txt-compact-small text-ui-fg-subtle truncate">{session.data.user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="bg-ui-bg-base">
              <Link href="/account/general" className="flex items-center gap-2">
                <IdBadge className="h-4 w-4" />
                <span>{t('user.user_settings')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="bg-ui-bg-base">
              <Link href={getUriWithOrg(org?.slug, '/account/purchases')} className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>{t('account.purchases')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 text-red-600 data-[highlighted]:text-red-600 data-[highlighted]:bg-red-50 bg-ui-bg-base"
            >
              <ArrowRightOnRectangle className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
