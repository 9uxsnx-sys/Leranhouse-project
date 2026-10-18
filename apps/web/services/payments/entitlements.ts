import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  getResponseMetadata,
} from '@services/utils/ts/requests'

export async function grantResourceEntitlements(
  org_id: number,
  resource_uuid: string,
  user_ids: number[],
  access_token: string
) {
  const result: any = await fetch(
    `${getAPIUrl()}payments/${org_id}/entitlements?resource_uuid=${encodeURIComponent(
      resource_uuid
    )}&user_ids=${user_ids.join(',')}`,
    RequestBodyWithAuthHeader('POST', null, null, access_token)
  )
  return await getResponseMetadata(result)
}

export async function revokeResourceEntitlements(
  org_id: number,
  resource_uuid: string,
  user_ids: number[],
  access_token: string
) {
  const result: any = await fetch(
    `${getAPIUrl()}payments/${org_id}/entitlements?resource_uuid=${encodeURIComponent(
      resource_uuid
    )}&user_ids=${user_ids.join(',')}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await getResponseMetadata(result)
}
