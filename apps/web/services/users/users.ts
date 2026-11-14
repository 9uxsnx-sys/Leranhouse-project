import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyFormWithAuthHeader,
  RequestBodyWithAuthHeader,
  errorHandling,
  getResponseMetadata,
} from '@services/utils/ts/requests'

/**
 * Get user by ID.
 *
 * SECURITY: Requires authentication to prevent user enumeration attacks.
 * The access_token parameter is required.
 */
export async function getUser(user_id: string, access_token: string) {
  const result = await fetch(
    `${getAPIUrl()}users/id/${user_id}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

/**
 * Get user by username.
 *
 * SECURITY: Requires authentication to prevent user enumeration attacks.
 * The access_token parameter is required.
 */
export async function getUserByUsername(username: string, access_token: string) {
  const result = await fetch(
    `${getAPIUrl()}users/username/${username}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

/**
 * Get courses created/contributed by a user.
 *
 * SECURITY: Requires authentication.
 * The access_token parameter is required.
 */
export async function getCoursesByUser(user_id: string, access_token: string, locale?: string) {
  const localeParam = locale ? `&locale=${locale}` : ''
  const result = await fetch(
    `${getAPIUrl()}users/${user_id}/courses?limit=50${localeParam}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}
/**
 * Get podcasts created/contributed by a user.
 *
 * SECURITY: Requires authentication.
 * The access_token parameter is required.
 */
export async function getPodcastsByUser(user_id: string, access_token: string) {
  const result = await fetch(
    `${getAPIUrl()}users/${user_id}/podcasts?limit=50`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

/**
 * Get communities accessible by a user.
 *
 * SECURITY: Requires authentication.
 * The access_token parameter is required.
 */
export async function getCommunitiesByUser(
  user_id: string,
  access_token: string,
  locale?: string
) {
  const query = locale ? `&locale=${encodeURIComponent(locale)}` : ''
  const result = await fetch(
    `${getAPIUrl()}users/${user_id}/communities?limit=50${query}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

export async function updateUserAvatar(
  user_uuid: any,
  avatar_file: any,
  access_token: any
) {
  const formData = new FormData()
  formData.append('avatar_file', avatar_file)
  const result: any = await fetch(
    `${getAPIUrl()}users/update_avatar/${user_uuid}`,
    RequestBodyFormWithAuthHeader('PUT', formData, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

export async function deleteUserAvatar(user_uuid: any, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}users/delete_avatar/${user_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

export async function updateUserBanner(
  user_uuid: any,
  banner_file: any,
  access_token: any
) {
  const formData = new FormData()
  formData.append('banner_file', banner_file)
  const result: any = await fetch(
    `${getAPIUrl()}users/update_banner/${user_uuid}`,
    RequestBodyFormWithAuthHeader('PUT', formData, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

export async function deleteUserBanner(user_uuid: any, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}users/delete_banner/${user_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}

export async function checkUsernameAvailability(username: string, access_token: string) {
  const result = await fetch(
    `${getAPIUrl()}users/check-username/${username}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function deleteUser(user_id: number, access_token: string) {
  const result: any = await fetch(
    `${getAPIUrl()}users/user_id/${user_id}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}
