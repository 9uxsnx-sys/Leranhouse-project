import type { CSSProperties } from 'react'
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

    return (
        <OrgProvider orgslug={orgslug}>
            <OrgLanguageSync />
            <div style={getBrandStyle(brandColor) as CSSProperties}>
                {children}
            </div>
        </OrgProvider>
    )
}
