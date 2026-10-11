import { getOrgSlug } from '@services/org/orgResolution'
import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { cookies } from 'next/headers'

/**
 * Resolves the org for the /test-dev/auth preview routes.
 *
 * `LH_org` is set per-request by the proxy; falls back to the instance
 * default org so the preview still renders on a cold load.
 */
export async function getPreviewOrg() {
  const orgslug =
    (await getOrgSlug()) ||
    (await cookies()).get('LH_default_org')?.value ||
    'default'

  try {
    return await getOrganizationContextInfo(orgslug, {
      revalidate: 0,
      tags: ['organizations'],
    })
  } catch {
    return null
  }
}
