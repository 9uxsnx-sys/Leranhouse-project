'use server'

import { getAPIUrl } from '@services/config/config'
import { RequestBodyWithAuthHeader, errorHandling, secureFetch } from '@services/utils/ts/requests'

export async function createResourceCheckout(
  orgId: number,
  data: {
    resource_uuid: string
    resource_type?: 'course' | 'podcast'
    payment_method?: 'edahabia' | 'cib' | 'chargily_app'
    locale?: string
  },
  access_token: string
) {
  const result = await secureFetch(
    `${getAPIUrl()}payments/${encodeURIComponent(String(orgId))}/checkout`,
    RequestBodyWithAuthHeader('POST', data, null, access_token)
  )
  return await errorHandling(result)
}
