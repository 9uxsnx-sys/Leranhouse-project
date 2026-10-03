'use client'
import React, { useEffect, use } from 'react';
import { motion } from 'motion/react'
import Link from 'next/link'
import { useMediaQuery } from 'usehooks-ts'
import { getUriWithOrg } from '@services/config/config'
import { Monitor, Ticket, SquareUserRound, Users, Shield, ShieldAlert } from 'lucide-react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import OrgUsers from '@components/Dashboard/Pages/Users/OrgUsers/OrgUsers'
import OrgAccess from '@components/Dashboard/Pages/Users/OrgAccess/OrgAccess'
import OrgUserGroups from '@components/Dashboard/Pages/Users/OrgUserGroups/OrgUserGroups'
import OrgRoles from '@components/Dashboard/Pages/Users/OrgRoles/OrgRoles'
import OrgAuditLogs from '@components/Dashboard/Pages/Org/OrgAuditLogs/OrgAuditLogs'
import { useTranslation } from 'react-i18next'
import PlanBadge from '@components/Dashboard/Shared/PlanRestricted/PlanBadge'
import { PlanLevel } from '@services/plans/plans'
import { usePlan } from '@components/Hooks/usePlan'

export type SettingsParams = {
  subpage: string
  orgslug: string
}

function UsersSettingsPage(props: { params: Promise<SettingsParams> }) {
  const { t } = useTranslation()
  const params = use(props.params);
  const session = useLHSession() as any
  const org = useOrg() as any
  const currentPlan = usePlan()
  const [H1Label, setH1Label] = React.useState('')
  const isMobile = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    if (params.subpage == 'users') setH1Label(t('dashboard.users.settings.pages.users.title'))
    if (params.subpage == 'signups') setH1Label(t('dashboard.users.settings.pages.signups.title'))
    if (params.subpage == 'add') setH1Label(t('dashboard.users.settings.pages.add.title'))
    if (params.subpage == 'usergroups') setH1Label(t('dashboard.users.settings.pages.usergroups.title'))
    if (params.subpage == 'roles') setH1Label(t('dashboard.users.settings.pages.roles.title'))
    if (params.subpage == 'audit-logs') setH1Label(t('dashboard.users.settings.pages.audit_logs.title'))
  }, [session, org, params.subpage, params, t])

  if (isMobile) {
    return (
      <div className="h-screen w-full bg-[#f8f8f8] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold mb-4">{t('dashboard.users.settings.mobile.title')}</h2>
          <Monitor className='mx-auto my-5' size={60} />
          <p>{t('dashboard.users.settings.mobile.message1')}</p>
          <p>{t('dashboard.users.settings.mobile.message2')}</p>
        </div>
      </div>
    )
  }

  const tabs = [
    {
      key: 'users',
      label: t('dashboard.users.settings.tabs.users'),
      icon: Users,
      href: `/dash/users/settings/users`,
    },
    {
      key: 'usergroups',
      label: t('dashboard.users.settings.tabs.usergroups'),
      icon: SquareUserRound,
      href: `/dash/users/settings/usergroups`,
      requiresPlan: 'standard' as PlanLevel,
    },
    {
      key: 'roles',
      label: t('dashboard.users.settings.tabs.roles'),
      icon: Shield,
      href: `/dash/users/settings/roles`,
      requiresPlan: 'pro' as PlanLevel,
    },
    {
      key: 'signups',
      label: t('dashboard.users.settings.tabs.signups'),
      icon: Ticket,
      href: `/dash/users/settings/signups`,
    },
    {
      key: 'audit-logs',
      label: t('dashboard.users.settings.tabs.audit_logs'),
      icon: ShieldAlert,
      href: `/dash/users/settings/audit-logs`,
      requiresPlan: 'enterprise' as PlanLevel,
    },
  ]

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8]">
      {/* Row 1: Page title */}
      <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">
          {H1Label}
        </h1>
      </div>

      {/* Row 2: Pill-style tab bar */}
      <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-50/80 rounded-xl p-1 flex items-center w-full">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = params.subpage === tab.key

            return (
              <Link
                key={tab.key}
                prefetch={false}
                href={getUriWithOrg(params.orgslug, '') + tab.href}
                className="flex-1 relative"
              >
                <div
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isActive
                      ? 'text-ui-fg-base'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm border border-neutral-200/80"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <IconComponent size={16} />
                    <span>{tab.label}</span>
                    {(tab as any).requiresPlan && (
                      <PlanBadge currentPlan={currentPlan} requiredPlan={(tab as any).requiresPlan} size="sm" noMargin />
                    )}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Row 3: Content */}
      <div className="w-full mx-auto max-w-7xl mt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <main className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, type: 'spring', stiffness: 80 }}
            className="space-y-8 rounded-xl"
          >
            {params.subpage == 'users' ? <OrgUsers /> : ''}
            {params.subpage == 'signups' ? <OrgAccess /> : ''}
            {params.subpage == 'usergroups' ? <OrgUserGroups /> : ''}
            {params.subpage == 'roles' ? <OrgRoles /> : ''}
            {params.subpage == 'audit-logs' ? <OrgAuditLogs /> : ''}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default UsersSettingsPage
