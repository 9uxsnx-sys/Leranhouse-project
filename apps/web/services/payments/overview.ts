'use server'

import { getAPIUrl } from '@services/config/config'
import { RequestBodyWithAuthHeader, errorHandling, secureFetch } from '@services/utils/ts/requests'

export async function getPaymentsOverview(
  orgId: number,
  range: string,
  access_token: string
) {
  const query = new URLSearchParams({ range })
  const result = await secureFetch(
    `${getAPIUrl()}payments/${encodeURIComponent(String(orgId))}/overview?${query.toString()}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}
