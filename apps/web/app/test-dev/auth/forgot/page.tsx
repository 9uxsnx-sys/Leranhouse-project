import ForgotPreview from '../_components/ForgotPreview'
import { getPreviewOrg } from '../_components/getPreviewOrg'
import OrgNotFound from '@components/Objects/StyledElements/Error/OrgNotFound'

export const dynamic = 'force-dynamic'

export default async function AuthForgotPreviewPage() {
  const org = await getPreviewOrg()
  if (!org) {
    return <OrgNotFound />
  }
  return <ForgotPreview org={org} />
}
