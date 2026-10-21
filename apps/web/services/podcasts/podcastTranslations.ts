import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  errorHandling,
} from '@services/utils/ts/requests'

export type PodcastTranslation = {
  id: number
  podcast_id: number
  locale: string
  name: string
  description: string | null
  about: string | null
  tags: string | null
  seo: Record<string, any> | null
  state: string
  source_updated_at: string | null
  translated_by: number | null
  creation_date: string
  update_date: string
}

export type PodcastTranslationPayload = {
  name: string
  description?: string | null
  about?: string | null
  tags?: string | null
  seo?: Record<string, any> | null
  state?: string
}

export type PodcastEpisodeTranslation = {
  id: number
  episode_id: number
  locale: string
  title: string
  description: string | null
  state: string
  source_updated_at: string | null
  translated_by: number | null
  creation_date: string
  update_date: string
}

export type PodcastEpisodeTranslationPayload = {
  title: string
  description?: string | null
  state?: string
}

export async function getPodcastTranslations(
  podcast_uuid: string,
  access_token: string
): Promise<PodcastTranslation[]> {
  const result: any = await fetch(
    `${getAPIUrl()}podcasts/${podcast_uuid}/translations`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}

export async function upsertPodcastTranslation(
  podcast_uuid: string,
  locale: string,
  data: PodcastTranslationPayload,
  access_token: string
): Promise<PodcastTranslation> {
  const result: any = await fetch(
    `${getAPIUrl()}podcasts/${podcast_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  return await errorHandling(result)
}

export async function deletePodcastTranslation(
  podcast_uuid: string,
  locale: string,
  access_token: string
): Promise<{ detail: string }> {
  const result: any = await fetch(
    `${getAPIUrl()}podcasts/${podcast_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await errorHandling(result)
}

export async function getEpisodeTranslations(
  episode_uuid: string,
  access_token: string
): Promise<PodcastEpisodeTranslation[]> {
  const result: any = await fetch(
    `${getAPIUrl()}podcasts/episodes/${episode_uuid}/translations`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}

export async function upsertEpisodeTranslation(
  episode_uuid: string,
  locale: string,
  data: PodcastEpisodeTranslationPayload,
  access_token: string
): Promise<PodcastEpisodeTranslation> {
  const result: any = await fetch(
    `${getAPIUrl()}podcasts/episodes/${episode_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  return await errorHandling(result)
}

export async function deleteEpisodeTranslation(
  episode_uuid: string,
  locale: string,
  access_token: string
): Promise<{ detail: string }> {
  const result: any = await fetch(
    `${getAPIUrl()}podcasts/episodes/${episode_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await errorHandling(result)
}
