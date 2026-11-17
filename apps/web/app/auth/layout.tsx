import type { CSSProperties } from 'react'
import { cookies } from 'next/headers'
import { OrgProvider } from '@components/Contexts/OrgContext'
import OrgLanguageSync from '@components/Contexts/OrgLanguageSync'
import { getOrgSlug } from '@services/org/orgResolution'
import { getOrganizationContextInfoWithoutCredentials } from '@services/organizations/orgs'
import { getBrandStyle } from '@services/utils/ts/colorUtils'

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const orgslug = await getOrgSlug()

    // If no org slug found, let the page components handle it
    // (they show OrgNotFound appropriately)
    if (!orgslug) {
        return <>{children}</>
    }

    // Same colour source as the org shells so auth pages match the tenant
    const org = await getOrganizationContextInfoWithoutCredentials(orgslug).catch(() => null)
    const brandColor =
        org?.config?.config?.customization?.general?.color ||
        org?.config?.config?.general?.color ||
        ''
    const brandFg =
        org?.config?.config?.customization?.general?.brand_fg ||
        org?.config?.config?.general?.brand_fg ||
        ''
    const brandHover =
        org?.config?.config?.customization?.general?.brand_hover ||
        org?.config?.config?.general?.brand_hover ||
        ''

    // Auth has no theme switch, so the cookie is enough. `system` resolves
    // server-side to light; the root layout still paints `dark` when the OS
    // asks for it, and only the brand fill lags behind in that rare case.
    const themeMode: 'light' | 'dark' =
        (await cookies()).get('lh_theme')?.value === 'dark' ? 'dark' : 'light'

    return (
        <OrgProvider orgslug={orgslug}>
            <OrgLanguageSync />
            <div style={getBrandStyle(brandColor, brandFg, false, brandHover, themeMode) as CSSProperties}>
                {children}
            </div>
        </OrgProvider>
    )
}
