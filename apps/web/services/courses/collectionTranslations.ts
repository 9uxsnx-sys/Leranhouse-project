import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  errorHandling,
} from '@services/utils/ts/requests'

export type CollectionTranslation = {
  id: number
  collection_id: number
  locale: string
  name: string
  description: string | null
  about: string | null
  learnings: string | null
  tags: string | null
  seo: Record<string, any> | null
  state: string
  source_updated_at: string | null
  translated_by: number | null
  creation_date: string
  update_date: string
}

export type CollectionTranslationPayload = {
  name: string
  description?: string | null
  about?: string | null
  learnings?: string | null
  tags?: string | null
  seo?: Record<string, any> | null
  state?: string
}

export async function getCollectionTranslations(
  collection_uuid: string,
  access_token: string
): Promise<CollectionTranslation[]> {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/translations`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}

export async function upsertCollectionTranslation(
  collection_uuid: string,
  locale: string,
  data: CollectionTranslationPayload,
  access_token: string
): Promise<CollectionTranslation> {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  return await errorHandling(result)
}

export async function deleteCollectionTranslation(
  collection_uuid: string,
  locale: string,
  access_token: string
): Promise<{ detail: string }> {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await errorHandling(result)
}
