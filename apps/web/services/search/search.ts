import { RequestBodyWithAuthHeader } from "@services/utils/ts/requests"
import { getAPIUrl } from "@services/config/config"
import { getResponseMetadata } from "@services/utils/ts/requests"

export async function searchOrgContent(
  org_slug: string,
  query: string,
  page: number = 1,
  limit: number = 10,
  next: any,
  access_token?: any,
  locale?: string,
) {
  const params = new URLSearchParams({
    query,
    page: String(page),
    limit: String(limit),
  })
  if (locale) params.set('locale', locale)
  const url = `${getAPIUrl()}search/org_slug/${org_slug}?${params.toString()}`
  const result: any = await fetch(
    url,
    RequestBodyWithAuthHeader('GET', null, next, access_token),
  )
  return getResponseMetadata(result)
}
