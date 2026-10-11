import SignUpPreview from '../_components/SignUpPreview'
import { getPreviewOrg } from '../_components/getPreviewOrg'
import OrgNotFound from '@components/Objects/StyledElements/Error/OrgNotFound'

export const dynamic = 'force-dynamic'

export default async function AuthSignUpPreviewPage() {
  const org = await getPreviewOrg()
  if (!org) {
    return <OrgNotFound />
  }
  return <SignUpPreview org={org} />
}
