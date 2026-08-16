'use client'
import { useOrg } from '@components/Contexts/OrgContext'
import { signOut } from '@components/Contexts/AuthContext'
import { Backpack, BookOpen, Buildings, ChatsCircle, CurrencyCircleDollar, Gear, Headphones, House, SignOut, Users } from '@phosphor-icons/react'
import Link from 'next/link'
import React from 'react'
import { useTranslation } from 'react-i18next'
import AdminAuthorization from '@components/Security/AdminAuthorization'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import ToolTip from '@components/Objects/StyledElements/Tooltip/Tooltip'

function DashMobileMenu() {
  const { t } = useTranslation()
  const org = useOrg() as any
  const session = useLHSession() as any

  // Feature visibility from API resolved_features
  const rf = org?.config?.config?.resolved_features
  const isEnabled = (feature: string) => rf?.[feature]?.enabled === true
  const showCommunities = isEnabled('communities')
  const showPodcasts = isEnabled('podcasts')
  const showPayments = isEnabled('payments')

  return (
    <nav aria-label="Dashboard mobile actions" className="fixed bottom-4 left-4 right-4 bg-black/90 backdrop-blur-lg text-white border border-white/10 rounded-2xl">
      <div className="flex justify-around items-center h-16 px-2">
        <AdminAuthorization authorizationMode="component">
          <ToolTip content={t('common.home')} slateBlack sideOffset={8} side="top">
            <Link href={`/`} className="flex flex-col items-center p-2" aria-label="Go to dashboard home">
              <House size={20} weight="bold" />
              <span className="text-xs mt-1">{t('common.home')}</span>
            </Link>
          </ToolTip>
          <ToolTip content={t('courses.courses')} slateBlack sideOffset={8} side="top">
            <Link href={`/dash/courses`} className="flex flex-col items-center p-2" aria-label="Manage courses">
              <BookOpen size={20} weight="bold" />
              <span className="text-xs mt-1">{t('courses.courses')}</span>
            </Link>
          </ToolTip>
          <ToolTip content={t('common.assignments')} slateBlack sideOffset={8} side="top">
            <Link href={`/dash/assignments`} className="flex flex-col items-center p-2" aria-label="Manage assignments">
              <Backpack size={20} />
              <span className="text-xs mt-1">{t('common.assignments')}</span>
            </Link>
          </ToolTip>
          {showCommunities && (
            <ToolTip content={t('communities.title')} slateBlack sideOffset={8} side="top">
              <Link href={`/dash/communities`} className="flex flex-col items-center p-2" aria-label="Manage communities">
                <ChatsCircle size={20} weight="bold" />
                <span className="text-xs mt-1">{t('communities.title')}</span>
              </Link>
            </ToolTip>
          )}
          {showPodcasts && (
            <ToolTip content={t('podcasts.podcasts')} slateBlack sideOffset={8} side="top">
              <Link href={`/dash/podcasts`} className="flex flex-col items-center p-2" aria-label="Manage podcasts">
                <Headphones size={20} weight="bold" />
                <span className="text-xs mt-1">{t('podcasts.podcasts')}</span>
              </Link>
            </ToolTip>
          )}
          {showPayments && (
            <ToolTip content={t('common.payments')} slateBlack sideOffset={8} side="top">
              <Link href={`/dash/payments/overview`} className="flex flex-col items-center p-2" aria-label="Manage payments and billing">
                <CurrencyCircleDollar size={20} weight="bold" />
                <span className="text-xs mt-1">{t('common.payments')}</span>
              </Link>
            </ToolTip>
          )}
          <ToolTip content={t('common.users')} slateBlack sideOffset={8} side="top">
            <Link href={`/dash/users/settings/users`} className="flex flex-col items-center p-2" aria-label="Manage users">
              <Users size={20} weight="bold" />
              <span className="text-xs mt-1">{t('common.users')}</span>
            </Link>
          </ToolTip>
          <ToolTip content={t('common.organization')} slateBlack sideOffset={8} side="top">
            <Link href={`/dash/org/settings/general`} className="flex flex-col items-center p-2" aria-label="Organization settings">
              <Buildings size={20} weight="bold" />
              <span className="text-xs mt-1">{t('common.organization')}</span>
            </Link>
          </ToolTip>
        </AdminAuthorization>
        <ToolTip content={t('common.settings')} slateBlack sideOffset={8} side="top">
          <Link href={'/account/general'} className="flex flex-col items-center p-2" aria-label="User account settings">
            <Gear size={20} weight="bold" />
            <span className="text-xs mt-1">{t('common.settings')}</span>
          </Link>
        </ToolTip>
        <ToolTip content={t('user.sign_out')} slateBlack sideOffset={8} side="top">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex flex-col items-center p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Sign out"
          >
            <SignOut size={20} weight="bold" />
            <span className="text-xs mt-1">{t('user.sign_out')}</span>
          </button>
        </ToolTip>
      </div>
    </nav>
  )
}

export default DashMobileMenu
