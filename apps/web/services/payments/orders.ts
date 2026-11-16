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

/**
 * Fetch every order by walking the pages.
 *
 * The endpoint caps `limit` at 100 and rejects anything larger with a 422, so
 * the transactions table cannot ask for "all orders" in one request.
 */
export async function getAllOrgOrders(
  orgId: number,
  params: { search?: string; status?: string },
  access_token: string
) {
  const pageSize = 100
  const items: any[] = []
  let total = 0
  let page = 1

  do {
    const res = await getOrgOrders(orgId, { ...params, page, limit: pageSize }, access_token)
    const batch = res?.items || []
    items.push(...batch)
    total = Number(res?.total ?? items.length)
    if (batch.length === 0) break
    page += 1
  } while (items.length < total)

  return { items, total }
}
