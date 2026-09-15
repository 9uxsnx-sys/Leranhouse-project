'use client'
import React, { use, useEffect } from 'react';
import { CourseProvider, useCourse } from '../../../../../../../../components/Contexts/CourseContext'
import Link from 'next/link'
import { motion } from 'motion/react'
import { BookOpen, Globe, Settings, Users, Award, Lock, Search, BarChart3 } from 'lucide-react'
import EditCourseStructure from '@components/Dashboard/Pages/Course/EditCourseStructure/EditCourseStructure'
import EditCourseGeneral from '@components/Dashboard/Pages/Course/EditCourseGeneral/EditCourseGeneral'
import EditCourseAccess from '@components/Dashboard/Pages/Course/EditCourseAccess/EditCourseAccess'
import EditCourseContributors from '@components/Dashboard/Pages/Course/EditCourseContributors/EditCourseContributors'
import EditCourseCertification from '@components/Dashboard/Pages/Course/EditCourseCertification/EditCourseCertification'
import EditCourseSEO from '@components/Dashboard/Pages/Course/EditCourseSEO/EditCourseSEO'
import { useCourseRights } from '@hooks/useCourseRights'
import { useRouter } from 'next/navigation'
import ToolTip from '@components/Objects/StyledElements/Tooltip/Tooltip'
import { getUriWithOrg } from '@services/config/config';
import { useTranslation } from 'react-i18next';
import { useOrg } from '@components/Contexts/OrgContext';
import { PlanLevel, isFeatureAvailable } from '@services/plans/plans';
import PlanBadge from '@components/Dashboard/Shared/PlanRestricted/PlanBadge';
import PlanRestrictedFeature from '@components/Dashboard/Shared/PlanRestricted/PlanRestrictedFeature';
import CourseAnalyticsTab from '@components/Dashboard/Analytics/Course/CourseAnalyticsTab';
import { usePlan } from '@components/Hooks/usePlan'
import { CourseEditSidebar } from '@components/Dashboard/Misc/CourseEditSidebar'

export type CourseOverviewParams = {
  orgslug: string
  courseuuid: string
  subpage: string
}

/** Inner component that reads the course name from context for the page title */
function CoursePageTitle() {
  const course = useCourse() as any
  const courseStructure = course?.courseStructure
  return (
    <h1 className="text-3xl md:text-4xl font-semibold text-ui-fg-base leading-tight">
      {courseStructure?.name || '...'}
    </h1>
  )
}

function CourseOverviewPage(props: { params: Promise<CourseOverviewParams> }) {
  const { t } = useTranslation()
  const params = use(props.params);
  const router = useRouter();
  const org = useOrg() as any;
  const currentPlan = usePlan();
  const hasCertificationsAccess = isFeatureAvailable('certifications', currentPlan);
  const hasSEOAccess = isFeatureAvailable('seo', currentPlan);

  function getEntireCourseUUID(courseuuid: string) {
    // add course_ to uuid
    return `course_${courseuuid}`
  }

  const courseuuid = getEntireCourseUUID(params.courseuuid)
  const { hasPermission, isLoading: rightsLoading } = useCourseRights(courseuuid)

  // Define tab configurations with their required permissions
  const tabs = [
    {
      key: 'general',
      label: t('dashboard.courses.settings.tabs.general'),
      icon: Settings,
      href: `/dash/courses/course/${params.courseuuid}/general`,
      requiredPermission: 'update' as const
    },
    {
      key: 'content',
      label: t('dashboard.courses.settings.tabs.content'),
      icon: BookOpen,
      href: `/dash/courses/course/${params.courseuuid}/content`,
      requiredPermission: 'update_content' as const
    },
    {
      key: 'access',
      label: t('dashboard.courses.settings.tabs.access'),
      icon: Globe,
      href: `/dash/courses/course/${params.courseuuid}/access`,
      requiredPermission: 'manage_access' as const
    },
    {
      key: 'contributors',
      label: t('dashboard.courses.settings.tabs.contributors'),
      icon: Users,
      href: `/dash/courses/course/${params.courseuuid}/contributors`,
      requiredPermission: 'manage_contributors' as const
    },
    {
      key: 'seo',
      label: t('dashboard.courses.settings.tabs.seo'),
      icon: Search,
      href: `/dash/courses/course/${params.courseuuid}/seo`,
      requiredPermission: 'update' as const,
      requiresPlan: 'standard' as PlanLevel
    },
    {
      key: 'certification',
      label: t('dashboard.courses.settings.tabs.certification'),
      icon: Award,
      href: `/dash/courses/course/${params.courseuuid}/certification`,
      requiredPermission: 'create_certifications' as const,
      requiresPlan: 'pro' as PlanLevel
    },
    {
      key: 'analytics',
      label: t('dashboard.courses.settings.tabs.analytics'),
      icon: BarChart3,
      href: `/dash/courses/course/${params.courseuuid}/analytics`,
      requiredPermission: 'update' as const,
      requiresPlan: 'pro' as PlanLevel
    }
  ]

  // Filter tabs based on permissions
  const visibleTabs = tabs.filter(tab => hasPermission(tab.requiredPermission))

  // Check if current subpage is accessible
  const currentTab = tabs.find(tab => tab.key === params.subpage)
  const hasAccessToCurrentPage = currentTab ? hasPermission(currentTab.requiredPermission) : false

  // Determine if sidebar should be shown
  const showSidebar = params.subpage !== 'content' && params.subpage !== 'analytics'

  // Redirect to first available tab if current page is not accessible
  useEffect(() => {
    if (!rightsLoading && !hasAccessToCurrentPage && visibleTabs.length > 0) {
      const firstAvailableTab = visibleTabs[0]
      router.replace(getUriWithOrg(params.orgslug, '') + firstAvailableTab.href)
    }
  }, [rightsLoading, hasAccessToCurrentPage, visibleTabs, router, params.orgslug])

  // Show loading state while rights are being fetched
  if (rightsLoading) {
    return (
      <div className="h-screen w-full bg-[#f8f8f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Show access denied if no tabs are available
  if (!rightsLoading && visibleTabs.length === 0) {
    return (
      <div className="h-screen w-full bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.courses.settings.access_denied.title')}</h3>
          <p className="text-gray-500">{t('dashboard.courses.settings.access_denied.message')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#f8f8f8] grid grid-rows-[auto_auto_1fr]">
      <CourseProvider courseuuid={courseuuid} withUnpublishedActivities={true}>
        {/* Row 1: Page title — matching lesson-preview page style */}
        <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8">
          <CoursePageTitle />
        </div>

        {/* Row 2: Pill-style tab bar */}
        <div className="max-w-7xl mx-auto w-full py-4 px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50/80 rounded-xl p-1 flex items-center w-full">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = params.subpage.toString() === tab.key
              const hasAccess = hasPermission(tab.requiredPermission)

              if (!hasAccess) {
                return (
                  <ToolTip
                    key={tab.key}
                    content={
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{t('dashboard.courses.settings.access_restricted.title')}</div>
                        <div className="text-sm text-gray-600">
                          {t('dashboard.courses.settings.access_restricted.message', { tab: tab.label })}
                        </div>
                      </div>
                    }
                  >
                    <div className="flex-1 relative px-4 py-2 text-sm font-medium rounded-lg opacity-30 cursor-not-allowed flex items-center justify-center gap-2 select-none">
                      <IconComponent size={16} />
                      <span>{tab.label}</span>
                    </div>
                  </ToolTip>
                )
              }

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

        {/* Row 3: Content + Sidebar — exact lesson-preview layout */}
        <div className="w-full mx-auto max-w-7xl mt-8 pb-10 overflow-hidden px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col lg:flex-row ${showSidebar ? 'gap-10 justify-between' : ''}`}>
            {/* Main content column */}
            <main className={`flex-1 min-w-0 ${showSidebar ? 'max-w-3xl' : 'w-full'}`}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, type: 'spring', stiffness: 80 }}
                className="space-y-8 rounded-xl"
              >
                {params.subpage == 'content' && hasPermission('update_content') ? (
                  <EditCourseStructure orgslug={params.orgslug} />
                ) : null}
                {params.subpage == 'general' && hasPermission('update') ? (
                  <EditCourseGeneral orgslug={params.orgslug} />
                ) : null}
                {params.subpage == 'access' && hasPermission('manage_access') ? (
                  <EditCourseAccess orgslug={params.orgslug} />
                ) : null}
                {params.subpage == 'contributors' && hasPermission('manage_contributors') ? (
                  <EditCourseContributors orgslug={params.orgslug} />
                ) : null}
                {params.subpage == 'seo' && hasPermission('update') ? (
                  <PlanRestrictedFeature
                    currentPlan={currentPlan}
                    requiredPlan="standard"
                    icon={Search}
                    titleKey="common.plans.feature_restricted.seo.title"
                    descriptionKey="common.plans.feature_restricted.seo.description"
                  >
                    <EditCourseSEO orgslug={params.orgslug} />
                  </PlanRestrictedFeature>
                ) : null}
                {params.subpage == 'certification' && hasPermission('create_certifications') ? (
                  <PlanRestrictedFeature
                    currentPlan={currentPlan}
                    requiredPlan="pro"
                    icon={Award}
                    titleKey="common.plans.feature_restricted.certifications.title"
                    descriptionKey="common.plans.feature_restricted.certifications.description"
                  >
                    <EditCourseCertification orgslug={params.orgslug} />
                  </PlanRestrictedFeature>
                ) : null}
                {params.subpage == 'analytics' && hasPermission('update') ? (
                  <PlanRestrictedFeature
                    currentPlan={currentPlan}
                    requiredPlan="pro"
                    icon={BarChart3}
                    titleKey="common.plans.feature_restricted.course_analytics.title"
                    descriptionKey="common.plans.feature_restricted.course_analytics.description"
                  >
                    <CourseAnalyticsTab courseUUID={courseuuid} />
                  </PlanRestrictedFeature>
                ) : null}
              </motion.div>
            </main>

            {/* Sidebar — hidden for content and analytics tabs */}
            {showSidebar && (
              <div className="w-full lg:w-72 xl:w-80 shrink-0">
                <CourseEditSidebar params={params} />
              </div>
            )}
          </div>
        </div>
      </CourseProvider>
    </div>
  )
}

export default CourseOverviewPage
