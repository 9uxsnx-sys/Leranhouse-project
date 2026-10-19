'use server'

import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  errorHandling,
  secureFetch,
} from '@services/utils/ts/requests'

export async function getPayoutReport(
  orgId: number,
  month: string,
  access_token: string
) {
  const query = new URLSearchParams({ month })
  const result = await secureFetch(
    `${getAPIUrl()}payments/${encodeURIComponent(String(orgId))}/payouts?${query.toString()}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}

export async function updatePayoutCosts(
  orgId: number,
  payload: {
    month: string
    hosting: number
    marketing: number
    other: number
  },
  access_token: string
) {
  const result = await secureFetch(
    `${getAPIUrl()}payments/${encodeURIComponent(String(orgId))}/payouts/costs`,
    RequestBodyWithAuthHeader('PUT', payload, null, access_token)
  )
  return await errorHandling(result)
}
