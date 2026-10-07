import { RequestBodyWithAuthHeader, errorHandling } from '@services/utils/ts/requests'
import { getAPIUrl } from '@services/config/config'

/*
 This file includes only POST, PUT, DELETE requests for podcast tracking
 GET requests are called from the frontend using SWR (https://swr.vercel.app/)
*/

export async function startPodcast(podcast_uuid: string, org_slug: string, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}trail/add_podcast/${podcast_uuid}`,
    RequestBodyWithAuthHeader('POST', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function removePodcast(podcast_uuid: string, org_slug: string, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}trail/remove_podcast/${podcast_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function markEpisodeAsComplete(episode_uuid: string, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}trail/add_episode/${episode_uuid}`,
    RequestBodyWithAuthHeader('POST', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function unmarkEpisodeAsComplete(episode_uuid: string, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}trail/remove_episode/${episode_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}
