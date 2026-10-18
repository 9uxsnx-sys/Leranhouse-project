import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  getResponseMetadata,
} from '@services/utils/ts/requests'

export async function linkUsersToCourse(
  course_uuid: string,
  user_ids: number[],
  access_token: string
) {
  const result: any = await fetch(
    `${getAPIUrl()}courses/${course_uuid}/access/users?user_ids=${user_ids.join(',')}`,
    RequestBodyWithAuthHeader('POST', null, null, access_token)
  )
  return await getResponseMetadata(result)
}

export async function unlinkUsersFromCourse(
  course_uuid: string,
  user_ids: number[],
  access_token: string
) {
  const result: any = await fetch(
    `${getAPIUrl()}courses/${course_uuid}/access/users?user_ids=${user_ids.join(',')}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await getResponseMetadata(result)
}
