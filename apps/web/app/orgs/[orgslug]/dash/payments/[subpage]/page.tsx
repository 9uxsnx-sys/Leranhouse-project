'use client'
import React, { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react'
import { isOSSMode } from '@services/config/config'
import { getUriWithOrg } from '@services/config/config'
import { BadgeDollarSign, Gem, LineChart, ScrollText, Settings, Users } from 'lucide-react'
import PaymentsConfigurationPage from '@components/Dashboard/Pages/Payments/PaymentsConfigurationPage'
import PaymentsOffersPage from '@components/Dashboard/Pages/Payments/PaymentsOffersPage'
import PaymentsOverviewPage from '@components/Dashboard/Pages/Payments/PaymentsOverviewPage'
import PaymentsPayoutsPage from '@components/Dashboard/Pages/Payments/PaymentsPayoutsPage'
import PaymentsTransactionsPage from '@components/Dashboard/Pages/Payments/PaymentsTransactionsPage'
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature'
import FeatureDisabledView from '@components/Dashboard/Shared/FeatureDisabled/FeatureDisabledView'
import { usePlan } from '@components/Hooks/usePlan'
import { PageTabs } from '@components/ui/page-tabs'
import { useTranslation } from 'react-i18next'

export type PaymentsParams = {
  subpage: string
  orgslug: string
}

/**
 * Payments is EE-only. OSS deployments see the enterprise restriction instead
 * of the dashboard; cloud orgs need the `standard` plan (Gate 2 below).
 */
const OSS_GATE = true

function PaymentsPage(props: { params: Promise<PaymentsParams> }) {
  const { t } = useTranslation()
  const params = use(props.params);
  const router = useRouter()
  const subpage = params.subpage || 'overview'
  const currentPlan = usePlan()

  const tabs = [
    { id: 'overview', label: t('dashboard.payments.tabs.overview'), icon: LineChart },
    { id: 'transactions', label: t('dashboard.payments.tabs.transactions'), icon: ScrollText },
    { id: 'offers', label: t('dashboard.payments.tabs.offers'), icon: Gem },
    { id: 'payouts', label: t('dashboard.payments.tabs.payouts'), icon: Users },
    { id: 'configuration', label: t('dashboard.payments.tabs.configuration'), icon: Settings },
  ]

  // Retired tabs (Payment Groups) and unknown paths land on the overview.
  useEffect(() => {
    if (!tabs.some((tab) => tab.id === subpage)) {
      router.replace(getUriWithOrg(params.orgslug, '/dash/payments/overview'))
    }
  }, [subpage, params.orgslug, router])

  // Gate 1: OSS deployment → payments is EE-only, blocked entirely
  if (OSS_GATE && isOSSMode()) {
    return (
      <PlanRestrictedFeature
        currentPlan={currentPlan}
        requiredPlan="enterprise"
        icon={BadgeDollarSign}
        titleKey="common.plans.feature_restricted.payments.title"
        descriptionKey="common.plans.feature_restricted.payments.description"
        fullScreen
      >
        <></>
      </PlanRestrictedFeature>
    )
  }

  const content = (
    <div className="min-h-screen w-full bg-[#f8f8f8]">
      {/* Row 1: Page title */}
      <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">
          {t(`dashboard.payments.pages.${subpage}.title`, { defaultValue: t('dashboard.payments.title') })}
        </h1>
      </div>

      {/* Row 2: Pill-style tab bar */}
      <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
        <PageTabs
          variant="pill"
          indicatorId="payments-tabs"
          active={subpage}
          tabs={tabs.map((tab) => ({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            href: getUriWithOrg(params.orgslug, '') + `/dash/payments/${tab.id}`,
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
            {subpage === 'overview' && <PaymentsOverviewPage />}
            {subpage === 'transactions' && <PaymentsTransactionsPage />}
            {subpage === 'offers' && <PaymentsOffersPage />}
            {subpage === 'payouts' && <PaymentsPayoutsPage />}
            {subpage === 'configuration' && <PaymentsConfigurationPage />}
          </motion.div>
        </main>
      </div>
    </div>
  )

  // Gate 2: plan-based restriction for cloud users (standard required)
  return (
    <PlanRestrictedFeature
      currentPlan={currentPlan}
      requiredPlan="standard"
      icon={BadgeDollarSign}
      titleKey="common.plans.feature_restricted.payments.title"
      descriptionKey="common.plans.feature_restricted.payments.description"
      fullScreen
    >
      {OSS_GATE ? (
        <FeatureDisabledView featureName="payments" orgslug={params.orgslug} context="dashboard">
          {content}
        </FeatureDisabledView>
      ) : (
        content
      )}
    </PlanRestrictedFeature>
  )
}

export default PaymentsPage
