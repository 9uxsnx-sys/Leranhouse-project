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
import { useTheme } from '@components/Contexts/ThemeContext'
import React, { useEffect } from 'react'
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
    const { resolvedTheme } = useTheme()
    const orgConfig = org?.config?.config
    const brandColor = orgConfig?.customization?.general?.color || orgConfig?.general?.color || ''
    const brandFg = orgConfig?.customization?.general?.brand_fg || orgConfig?.general?.brand_fg || ''
    const brandSidebar = !!(
        orgConfig?.customization?.general?.brand_sidebar || orgConfig?.general?.brand_sidebar
    )
    const brandHover = orgConfig?.customization?.general?.brand_hover || orgConfig?.general?.brand_hover || ''

    // Dialogs and popovers portal to <body>, outside the wrapper below, so the
    // brand variables are also published on the root element. Without this the
    // primary action inside a modal would silently fall back to ink.
    useEffect(() => {
        const vars = getBrandStyle(brandColor, brandFg, brandSidebar, brandHover, resolvedTheme)
        const root = document.documentElement
        Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value))
        return () => {
            Object.keys(vars).forEach((key) => root.style.removeProperty(key))
        }
    }, [brandColor, brandFg, brandSidebar, brandHover, resolvedTheme])

    return (
        <SessionGate>
            <AdminAuthorization authorizationMode="page">
                <CommandPaletteProvider>
                  <DashboardBreadcrumbProvider>
                    <div
                        className="flex flex-col md:flex-row"
                        style={getBrandStyle(brandColor, brandFg, brandSidebar, brandHover, resolvedTheme) as React.CSSProperties}
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
