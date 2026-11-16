'use client';
import DashLeftMenu from '@components/Dashboard/Menus/DashLeftMenu';
import DashMobileMenu from '@components/Dashboard/Menus/DashMobileMenu';
import { AdminTopBar } from '@components/Dashboard/Menus/AdminTopBar';
import OnboardingBar from '@components/Dashboard/Onboarding/OnboardingBar';
import WelcomeModal from '@components/Dashboard/Onboarding/WelcomeModal';
import AdminAuthorization from '@components/Security/AdminAuthorization'
import { SessionGate } from '@components/Contexts/LHSessionContext'
import { CommandPaletteProvider } from '@components/Dashboard/CommandPalette/CommandPaletteContext'
import { DashboardBreadcrumbProvider } from '@components/Objects/Breadcrumbs/DashboardBreadcrumbContext'
import CommandPalette from '@components/Dashboard/CommandPalette/CommandPalette'
import { useOrg } from '@components/Contexts/OrgContext'
import { getBrandStyle } from '@services/utils/ts/colorUtils'
import React from 'react'
import { useMediaQuery } from 'usehooks-ts';

function ClientAdminLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: any
}) {
    const isMobile = useMediaQuery('(max-width: 768px)')

    // Same source as the learner shell: customization.general.color, v1 fallback general.color
    const org = useOrg() as any
    const orgConfig = org?.config?.config
    const brandColor = orgConfig?.customization?.general?.color || orgConfig?.general?.color || ''

    return (
        <SessionGate>
            <AdminAuthorization authorizationMode="page">
                <CommandPaletteProvider>
                  <DashboardBreadcrumbProvider>
                    <div
                        className="flex flex-col md:flex-row"
                        style={getBrandStyle(brandColor) as React.CSSProperties}
                    >
                        {isMobile ? (
                            <DashMobileMenu />
                        ) : (
                            <DashLeftMenu />
                        )}
                        <div className="flex flex-col w-full min-h-dvh relative isolate">
                            <AdminTopBar />
                            {children}
                            <OnboardingBar />
                        </div>
                        <WelcomeModal />
                        <CommandPalette />
                    </div>
                  </DashboardBreadcrumbProvider>
                </CommandPaletteProvider>
            </AdminAuthorization>
        </SessionGate>
    )
}

export default ClientAdminLayout
