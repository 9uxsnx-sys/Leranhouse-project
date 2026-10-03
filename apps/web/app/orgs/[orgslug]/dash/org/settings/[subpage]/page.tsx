'use client'
import React, { useEffect, use } from 'react';
import { motion } from 'motion/react'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import { TextIcon, LucideIcon, KeyIcon, Palette, Shield, Globe, Search, Zap } from 'lucide-react'
import OrgEditGeneral from '@components/Dashboard/Pages/Org/OrgEditGeneral/OrgEditGeneral'
import OrgEditBranding from '@components/Dashboard/Pages/Org/OrgEditBranding/OrgEditBranding'
import OrgEditAPIAccess from '@components/Dashboard/Pages/Org/OrgEditAPIAccess/OrgEditAPIAccess'
import OrgEditSSO from '@components/Dashboard/Pages/Org/OrgEditSSO/OrgEditSSO'
import OrgEditDomains from '@components/Dashboard/Pages/Org/OrgEditDomains/OrgEditDomains'
import OrgEditSEO from '@components/Dashboard/Pages/Org/OrgEditSEO/OrgEditSEO'
import OrgEditAutomations from '@components/Dashboard/Pages/Org/OrgEditAutomations/OrgEditAutomations'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import PlanBadge from '@components/Dashboard/Shared/PlanRestricted/PlanBadge'
import { PlanLevel } from '@services/plans/plans'
import { usePlan } from '@components/Hooks/usePlan'

export type OrgParams = {
  subpage: string
  orgslug: string
}

interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
  customIcon?: string
  requiredPlan?: PlanLevel
}

const getSettingTabs = (t: any): TabItem[] => [
  { id: 'general', label: t('dashboard.organization.settings.tabs.general'), icon: TextIcon },
  { id: 'branding', label: t('dashboard.organization.settings.tabs.branding'), icon: Palette },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'domains', label: t('dashboard.organization.settings.tabs.domains') || 'Domains', icon: Globe, requiredPlan: 'standard' },
  { id: 'automations', label: 'Automations', icon: Zap, requiredPlan: 'pro' },
  { id: 'api', label: t('dashboard.organization.settings.tabs.api') || 'API Access', icon: KeyIcon, requiredPlan: 'pro' },
  { id: 'sso', label: t('dashboard.organization.settings.tabs.sso') || 'SSO', icon: Shield, requiredPlan: 'enterprise' },
]

function OrgPage(props: { params: Promise<OrgParams> }) {
  const { t } = useTranslation()
  const params = use(props.params);
  const org = useOrg() as any
  const currentPlan = usePlan()
  const [H1Label, setH1Label] = React.useState('')
  const SETTING_TABS = getSettingTabs(t)

  useEffect(() => {
    if (params.subpage == 'general') setH1Label(t('dashboard.organization.settings.pages.general.title'))
    else if (params.subpage == 'branding') setH1Label(t('dashboard.organization.settings.pages.branding.title'))
    else if (params.subpage == 'seo') setH1Label('SEO')
    else if (params.subpage == 'domains') setH1Label(t('dashboard.organization.settings.pages.domains.title') || 'Custom Domains')
    else if (params.subpage == 'automations') setH1Label('Automations')
    else if (params.subpage == 'api') setH1Label(t('dashboard.organization.settings.pages.api.title') || 'API Access')
    else if (params.subpage == 'sso') setH1Label(t('dashboard.organization.settings.pages.sso.title') || 'Single Sign-On')
  }, [params.subpage, params, t])

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
          {SETTING_TABS.map((tab) => {
            const isActive = params.subpage === tab.id

            return (
              <Link
                key={tab.id}
                prefetch={false}
                href={getUriWithOrg(params.orgslug, '') + `/dash/org/settings/${tab.id}`}
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
                    {tab.customIcon ? (
                      <Image src={tab.customIcon} alt={tab.label} width={16} height={16} />
                    ) : tab.icon ? (
                      <tab.icon size={16} />
                    ) : null}
                    <span>{tab.label}</span>
                    {tab.requiredPlan && (
                      <PlanBadge currentPlan={currentPlan} requiredPlan={tab.requiredPlan} size="sm" noMargin />
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
            {params.subpage == 'general' ? <OrgEditGeneral /> : ''}
            {params.subpage == 'branding' ? <OrgEditBranding /> : ''}
            {params.subpage == 'seo' ? <OrgEditSEO /> : ''}
            {params.subpage == 'domains' ? <OrgEditDomains /> : ''}
            {params.subpage == 'automations' ? <OrgEditAutomations /> : ''}
            {params.subpage == 'api' ? <OrgEditAPIAccess /> : ''}
            {params.subpage == 'sso' ? <OrgEditSSO /> : ''}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default OrgPage
