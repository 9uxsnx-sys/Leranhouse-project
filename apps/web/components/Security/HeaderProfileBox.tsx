'use client'
import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

import Link from 'next/link'
import {
  ArrowRightOnRectangle,
  Check,
  CreditCard,
  EllipsisHorizontal,
  GridLayout,
  IdBadge,
  Language,
} from '@components/Objects/Icons/MedusaIcons'
import { Avatar } from '@components/ui/avatar'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getUriWithOrg } from '@services/config/config'
import { getUserAvatarMediaDirectory } from '@services/media/media'
import Tooltip from '@components/Objects/StyledElements/Tooltip/Tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@components/ui/dropdown-menu"
import { signOut } from '@components/Contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { changeLanguage } from '@/lib/i18n'
import { AVAILABLE_LANGUAGES } from '@/lib/languages'

interface RoleInfo {
  name: string;
  bgColor: string;
  textColor: string;
  description: string;
}

interface CustomRoleInfo {
  name: string;
  description?: string;
}

export const HeaderProfileBox = ({ primaryColor = '' }: { primaryColor?: string }) => {
  const session = useLHSession() as any
  const { isAdmin, loading, userRoles, rights } = useAdminStatus()
  const org = useOrg() as any
  const { t, i18n } = useTranslation()
  const router = useRouter()


  useEffect(() => {
    // Not signed in — the org shell is authenticated only, send to login
    if (session?.status === 'unauthenticated' && org?.slug) {
      router.push(getUriWithOrg(org.slug, '/login'))
    }
  }, [session?.status, org?.slug, router])

  const userRoleInfo = useMemo((): RoleInfo | null => {
    if (!userRoles || userRoles.length === 0) return null;

    // Find the highest priority role for the current organization
    const orgRoles = userRoles.filter((role: any) => role.org.id === org?.id);
    
    if (orgRoles.length === 0) return null;

    // Sort by role priority (admin > maintainer > instructor > user)
    const sortedRoles = orgRoles.sort((a: any, b: any) => {
      const getRolePriority = (role: any) => {
        if (role.role.role_uuid === 'role_global_admin' || role.role.id === 1) return 4;
        if (role.role.role_uuid === 'role_global_maintainer' || role.role.id === 2) return 3;
        if (role.role.role_uuid === 'role_global_instructor' || role.role.id === 3) return 2;
        return 1;
      };
      return getRolePriority(b) - getRolePriority(a);
    });

    const highestRole = sortedRoles[0];

    // Define role configurations based on actual database roles
    const roleConfigs: { [key: string]: RoleInfo } = {
      'role_global_admin': {
        name: t('roles.role_admin'),
        bgColor: 'bg-purple-600',
        textColor: 'text-white',
        description: t('roles.role_admin_desc')
      },
      'role_global_maintainer': {
        name: t('roles.role_maintainer'),
        bgColor: 'bg-blue-600',
        textColor: 'text-white',
        description: t('roles.role_maintainer_desc')
      },
      'role_global_instructor': {
        name: t('roles.role_instructor'),
        bgColor: 'bg-green-600',
        textColor: 'text-white',
        description: t('roles.role_instructor_desc')
      },
      'role_global_user': {
        name: t('roles.role_user'),
        bgColor: 'bg-gray-500',
        textColor: 'text-white',
        description: t('roles.role_user_desc')
      }
    };

    // Determine role based on role_uuid or id
    let roleKey = 'role_global_user'; // default
    if (highestRole.role.role_uuid) {
      roleKey = highestRole.role.role_uuid;
    } else if (highestRole.role.id === 1) {
      roleKey = 'role_global_admin';
    } else if (highestRole.role.id === 2) {
      roleKey = 'role_global_maintainer';
    } else if (highestRole.role.id === 3) {
      roleKey = 'role_global_instructor';
    }

    return roleConfigs[roleKey] || roleConfigs['role_global_user'];
  }, [userRoles, org?.id]);

  const customRoles = useMemo((): CustomRoleInfo[] => {
    if (!userRoles || userRoles.length === 0) return [];

    // Find roles for the current organization
    const orgRoles = userRoles.filter((role: any) => role.org.id === org?.id);
    
    if (orgRoles.length === 0) return [];

    // Filter for custom roles (not system roles)
    const customRoles = orgRoles.filter((role: any) => {
      // Check if it's a system role
      const isSystemRole = 
        role.role.role_uuid?.startsWith('role_global_') ||
        [1, 2, 3, 4].includes(role.role.id) ||
        ['Admin', 'Maintainer', 'Instructor', 'User'].includes(role.role.name);
      
      return !isSystemRole;
    });

    return customRoles.map((role: any) => ({
      name: role.role.name || t('roles.custom_role'),
      description: role.role.description
    }));
  }, [userRoles, org?.id]);

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
          <DropdownMenuContent>
            <DropdownMenuLabel>
              <div className="flex items-center gap-x-3 overflow-hidden px-2 py-1">
                <Avatar src={avatarSrc} fallback={avatarFallback} variant="rounded" size="small" />
                <div className="block min-w-0 max-w-[187px] overflow-hidden whitespace-nowrap">
                  <p className="txt-compact-medium-plus truncate capitalize">
                    {session.data.user.username}
                  </p>
                  <p className="txt-compact-small text-ui-fg-subtle truncate">{session.data.user.email}</p>
                  {customRoles.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {customRoles.map((customRole, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700"
                        >
                          {customRole.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {userRoleInfo && (
                  <Tooltip content={userRoleInfo.description} sideOffset={10} side="bottom">
                    <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                      {userRoleInfo.name}
                    </span>
                  </Tooltip>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {rights?.dashboard?.action_access && (
              <DropdownMenuItem asChild>
                <Link href="/dash" className="flex items-center gap-2">
                  <GridLayout className="h-4 w-4" />
                  <span>{t('common.dashboard')}</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/account/general" className="flex items-center gap-2">
                <IdBadge className="h-4 w-4" />
                <span>{t('user.user_settings')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={getUriWithOrg(org?.slug, '/account/purchases')} className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>{t('account.purchases')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                <Language className="h-4 w-4" />
                <span>{t('common.language')}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {AVAILABLE_LANGUAGES.map((language) => (
                    <DropdownMenuItem
                      key={language.code}
                      onClick={() => changeLanguage(language.code)}
                      className="flex items-center justify-between"
                    >
                      <span>{t(language.translationKey)} ({language.nativeName})</span>
                      {i18n.language.split('-')[0] === language.code && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 text-red-600 data-[highlighted]:text-red-600 data-[highlighted]:bg-red-50"
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
