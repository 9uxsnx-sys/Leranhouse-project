import { getAPIUrl } from '@services/config/config'
import { errorHandling } from '@services/utils/ts/requests'

export async function getUserTrail(orgId: number, access_token?: string) {
  const url = `${getAPIUrl()}trail/org/${orgId}/trail`
  const result = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  return errorHandling(result)
}
