import SignInPreview from './_components/SignInPreview'
import { getPreviewOrg } from './_components/getPreviewOrg'
import OrgNotFound from '@components/Objects/StyledElements/Error/OrgNotFound'

export const dynamic = 'force-dynamic'

export default async function AuthSignInPreviewPage() {
  const org = await getPreviewOrg()
  if (!org) {
    return <OrgNotFound />
  }
  return <SignInPreview org={org} />
}
