import { getAPIUrl } from '@services/config/config'
import { RequestBodyWithAuthHeader, errorHandling } from '@services/utils/ts/requests'

export async function getOrgHomeTrending(
  orgId: number,
  access_token?: string,
  limit = 8,
  locale?: string
) {
  const localeParam = locale ? `&locale=${encodeURIComponent(locale)}` : ''
  const url = `${getAPIUrl()}orgs/${orgId}/home-trending?limit=${limit}${localeParam}`
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
