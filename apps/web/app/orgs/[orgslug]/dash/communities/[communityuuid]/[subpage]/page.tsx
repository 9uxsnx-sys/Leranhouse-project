'use client'
import { getUriWithOrg } from '@services/config/config'
import { TextIcon, LucideIcon, Link2, Shield, Users } from 'lucide-react'
import React, { use } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { PageTabs } from '@components/ui/page-tabs'
import { useOrg } from '@components/Contexts/OrgContext'
import { CommunityProvider, useCommunity } from '@components/Contexts/CommunityContext'
import CommunityEditGeneral from '@components/Dashboard/Pages/Community/CommunityEditGeneral'
import CommunityEditCourse from '@components/Dashboard/Pages/Community/CommunityEditCourse'
import CommunityEditModeration from '@components/Dashboard/Pages/Community/CommunityEditModeration'
import CommunityEditAccess from '@components/Dashboard/Pages/Community/CommunityEditAccess'

export type CommunityParams = {
  subpage: string
  orgslug: string
  communityuuid: string
}

interface TabItem {
  id: string
  labelKey: string
  icon: LucideIcon
}

const SETTING_TABS: TabItem[] = [
  { id: 'general', labelKey: 'dashboard.courses.communities.settings.tabs.general', icon: TextIcon },
  { id: 'access', labelKey: 'dashboard.courses.communities.settings.tabs.access', icon: Users },
  { id: 'course', labelKey: 'dashboard.courses.communities.settings.tabs.course', icon: Link2 },
  { id: 'moderation', labelKey: 'dashboard.courses.communities.settings.tabs.moderation', icon: Shield },
]

function CommunityPageTitle() {
  const communityState = useCommunity()
  const community = communityState?.community
  return (
    <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">
      {community?.name || '...'}
    </h1>
  )
}

function CommunitySettingsContent({ params }: { params: CommunityParams }) {
  const { t } = useTranslation()
  const org = useOrg() as any

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8]">
      {/* Row 1: Page title */}
      <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8">
        <CommunityPageTitle />
      </div>

      {/* Row 2: Pill-style tab bar */}
      <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
        <PageTabs
          variant="pill"
          indicatorId="community-settings-tabs"
          active={params.subpage}
          tabs={SETTING_TABS.map((tab) => ({
            id: tab.id,
            label: t(tab.labelKey),
            icon: tab.icon,
            href: getUriWithOrg(params.orgslug, '') + `/dash/communities/${params.communityuuid}/${tab.id}`,
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
            {params.subpage === 'general' && <CommunityEditGeneral />}
            {params.subpage === 'access' && <CommunityEditAccess />}
            {params.subpage === 'course' && <CommunityEditCourse />}
            {params.subpage === 'moderation' && <CommunityEditModeration />}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function CommunitySettingsPage(props: { params: Promise<CommunityParams> }) {
  const params = use(props.params)

  return (
    <CommunityProvider communityuuid={params.communityuuid}>
      <CommunitySettingsContent params={params} />
    </CommunityProvider>
  )
}

export default CommunitySettingsPage
