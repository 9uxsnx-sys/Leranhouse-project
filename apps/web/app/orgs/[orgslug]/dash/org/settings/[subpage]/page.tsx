'use client'
import React, { useEffect, use } from 'react';
import { motion } from 'motion/react'
import { getUriWithOrg } from '@services/config/config'
import { LucideIcon } from 'lucide-react'
import OrgEditGeneral from '@components/Dashboard/Pages/Org/OrgEditGeneral/OrgEditGeneral'
import OrgEditBranding from '@components/Dashboard/Pages/Org/OrgEditBranding/OrgEditBranding'
import OrgEditAPIAccess from '@components/Dashboard/Pages/Org/OrgEditAPIAccess/OrgEditAPIAccess'

import OrgEditDomains from '@components/Dashboard/Pages/Org/OrgEditDomains/OrgEditDomains'
import OrgEditSEO from '@components/Dashboard/Pages/Org/OrgEditSEO/OrgEditSEO'
import OrgEditAutomations from '@components/Dashboard/Pages/Org/OrgEditAutomations/OrgEditAutomations'
import { useTranslation } from 'react-i18next'
import { useOrg } from '@components/Contexts/OrgContext'
import { PlanLevel } from '@services/plans/plans'
import { PageTabs } from '@components/ui/page-tabs'
import { SectionIcon } from '@components/ui/icons'

export type OrgParams = {
  subpage: string
  orgslug: string
}

interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
  requiredPlan?: PlanLevel
}

const getSettingTabs = (t: any): TabItem[] => [
  { id: 'general', label: t('dashboard.organization.settings.tabs.general'), icon: SectionIcon.general },
  { id: 'branding', label: t('dashboard.organization.settings.tabs.branding'), icon: SectionIcon.branding },
  { id: 'seo', label: 'SEO', icon: SectionIcon.seo },
  { id: 'domains', label: t('dashboard.organization.settings.tabs.domains') || 'Domains', icon: SectionIcon.domains, requiredPlan: 'standard' },
  { id: 'automations', label: t('dashboard.organization.settings.tabs.automations'), icon: SectionIcon.automations, requiredPlan: 'pro' },
  { id: 'api', label: t('dashboard.organization.settings.tabs.api') || 'API Access', icon: SectionIcon.api, requiredPlan: 'pro' },
]

function OrgPage(props: { params: Promise<OrgParams> }) {
  const { t } = useTranslation()
  const params = use(props.params);
  const org = useOrg() as any
  const [H1Label, setH1Label] = React.useState('')
  const SETTING_TABS = getSettingTabs(t)

  useEffect(() => {
    if (params.subpage == 'general') setH1Label(t('dashboard.organization.settings.pages.general.title'))
    else if (params.subpage == 'branding') setH1Label(t('dashboard.organization.settings.pages.branding.title'))
    else if (params.subpage == 'seo') setH1Label('SEO')
    else if (params.subpage == 'domains') setH1Label(t('dashboard.organization.settings.pages.domains.title') || 'Custom Domains')
    else if (params.subpage == 'automations') setH1Label('Automations')
    else if (params.subpage == 'api') setH1Label(t('dashboard.organization.settings.pages.api.title') || 'API Access')
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
        <PageTabs
          variant="pill"
          indicatorId="org-settings-tabs"
          active={params.subpage}
          tabs={SETTING_TABS.map((tab) => ({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            href: getUriWithOrg(params.orgslug, '') + `/dash/org/settings/${tab.id}`,
          }))}
        />
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
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default OrgPage
