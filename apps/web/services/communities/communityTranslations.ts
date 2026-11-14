import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  errorHandling,
} from '@services/utils/ts/requests'

export type CommunityTranslation = {
  id: number
  community_id: number
  locale: string
  name: string
  description: string | null
  state: string
  source_updated_at: string | null
  translated_by: number | null
  creation_date: string
  update_date: string
}

export type CommunityTranslationPayload = {
  name: string
  description?: string | null
  state?: string
}

export async function getCommunityTranslations(
  community_uuid: string,
  access_token: string
): Promise<CommunityTranslation[]> {
  const result: any = await fetch(
    `${getAPIUrl()}communities/${community_uuid}/translations`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}

export async function upsertCommunityTranslation(
  community_uuid: string,
  locale: string,
  data: CommunityTranslationPayload,
  access_token: string
): Promise<CommunityTranslation> {
  const result: any = await fetch(
    `${getAPIUrl()}communities/${community_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  return await errorHandling(result)
}

export async function deleteCommunityTranslation(
  community_uuid: string,
  locale: string,
  access_token: string
): Promise<{ detail: string }> {
  const result: any = await fetch(
    `${getAPIUrl()}communities/${community_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await errorHandling(result)
}
