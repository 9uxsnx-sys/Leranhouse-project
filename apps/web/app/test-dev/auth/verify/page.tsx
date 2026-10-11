import VerifyPreview from '../_components/VerifyPreview'
import { getPreviewOrg } from '../_components/getPreviewOrg'
import OrgNotFound from '@components/Objects/StyledElements/Error/OrgNotFound'

export const dynamic = 'force-dynamic'

export default async function AuthVerifyPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>
}) {
  const org = await getPreviewOrg()
  if (!org) {
    return <OrgNotFound />
  }
  const { state } = await searchParams
  return <VerifyPreview org={org} initialState={state} />
}
