'use client';
import { use, useEffect } from "react";
import '@styles/globals.css'
import { SessionGate } from '@components/Contexts/LHSessionContext'
import { OrgMenu } from '@components/Objects/Menus/OrgMenu'
import { useOrg } from '@components/Contexts/OrgContext'
import { OrgJoinBanner, OrgJoinBannerProvider } from '@components/Objects/Banners/OrgJoinBanner'
import { PodcastPlayerProvider } from '@components/Contexts/PodcastPlayerContext'
import { UserBreadcrumbProvider } from '@components/Objects/Breadcrumbs/UserBreadcrumbContext'

import { PageViewTracker } from '@components/Analytics/PageViewTracker'
import { getGoogleFontUrl, DEFAULT_FONT } from '@/lib/fonts'
import { getBrandStyle } from '@services/utils/ts/colorUtils'
import { useTheme } from '@components/Contexts/ThemeContext'

function LayoutContent({ children, orgslug }: { children: React.ReactNode; orgslug: string }) {
  const org = useOrg() as any
  const { resolvedTheme } = useTheme()
  const customFont = org?.config?.config?.customization?.general?.font || org?.config?.config?.general?.font || ''
  const brandColor = org?.config?.config?.customization?.general?.color || org?.config?.config?.general?.color || ''
  const brandFg = org?.config?.config?.customization?.general?.brand_fg || org?.config?.config?.general?.brand_fg || ''
  const brandSidebar = !!(
    org?.config?.config?.customization?.general?.brand_sidebar ||
    org?.config?.config?.general?.brand_sidebar
  )
  const brandHover =
    org?.config?.config?.customization?.general?.brand_hover ||
    org?.config?.config?.general?.brand_hover ||
    ''

  // Portalled dialogs/popovers live outside the shell wrapper, so the brand
  // variables are mirrored on the root element as well.
  useEffect(() => {
    const vars = getBrandStyle(brandColor, brandFg, brandSidebar, brandHover, resolvedTheme)
    const root = document.documentElement
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value))
    return () => {
      Object.keys(vars).forEach((key) => root.style.removeProperty(key))
    }
  }, [brandColor, brandFg, brandSidebar, brandHover, resolvedTheme])

  // Inject Google Font stylesheet into document head
  useEffect(() => {
    if (!customFont || customFont === DEFAULT_FONT) return

    const fontId = `gfont-${customFont.replace(/\s/g, '-')}`
    if (document.getElementById(fontId)) return

    // Add preconnect hints
    const preconnect1 = document.createElement('link')
    preconnect1.rel = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    document.head.appendChild(preconnect1)

    const preconnect2 = document.createElement('link')
    preconnect2.rel = 'preconnect'
    preconnect2.href = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect2)

    // Add font stylesheet
    const link = document.createElement('link')
    link.id = fontId
    link.rel = 'stylesheet'
    link.href = getGoogleFontUrl(customFont)
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(preconnect1)
      document.head.removeChild(preconnect2)
      const existing = document.getElementById(fontId)
      if (existing) document.head.removeChild(existing)
    }
  }, [customFont])

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: 'var(--color-canvas)',
        ...(customFont ? { fontFamily: `'${customFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` } : {}),
      }}
    >
      <PageViewTracker />
      <OrgJoinBanner />
      <OrgMenu orgslug={orgslug}>
        <div className="flex-1 relative w-full">
          {children}
        </div>
      </OrgMenu>
    </div>
  )
}

export default function RootLayout(
  props: {
    children: React.ReactNode
    params: Promise<any>
  }
) {
  const params = use(props.params);

  const {
    children
  } = props;

  return (
    <>
      <SessionGate>
      <OrgJoinBannerProvider>
        <PodcastPlayerProvider>
          <UserBreadcrumbProvider>
            <LayoutContent orgslug={params?.orgslug}>
              {children}
            </LayoutContent>
          </UserBreadcrumbProvider>
        </PodcastPlayerProvider>
      </OrgJoinBannerProvider>
      </SessionGate>
    </>
  )
}
