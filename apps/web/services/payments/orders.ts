'use server'

import { getAPIUrl } from '@services/config/config'
import { RequestBodyWithAuthHeader, errorHandling, secureFetch } from '@services/utils/ts/requests'

export async function getOrgOrders(
  orgId: number,
  params: { search?: string; status?: string; page?: number; limit?: number },
  access_token: string
) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  query.set('page', String(params.page ?? 1))
  query.set('limit', String(params.limit ?? 20))

  const result = await secureFetch(
    `${getAPIUrl()}payments/${encodeURIComponent(String(orgId))}/orders?${query.toString()}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}
