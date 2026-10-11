import ResetPreview from '../_components/ResetPreview'
import { getPreviewOrg } from '../_components/getPreviewOrg'
import OrgNotFound from '@components/Objects/StyledElements/Error/OrgNotFound'

export const dynamic = 'force-dynamic'

export default async function AuthResetPreviewPage() {
  const org = await getPreviewOrg()
  if (!org) {
    return <OrgNotFound />
  }
  return <ResetPreview org={org} />
}
