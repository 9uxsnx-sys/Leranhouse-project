import { RequestBodyWithAuthHeader, errorHandling } from '@services/utils/ts/requests'
import { getAPIUrl } from '@services/config/config'

/*
 This file includes only POST, PUT, DELETE requests
 GET requests are called from the frontend using SWR (https://swr.vercel.app/)
*/

export async function startTrail(org_id: number, user_id: number, access_token: any) {
  const result: any = await fetch(
    `${getAPIUrl()}trail/start`,
    RequestBodyWithAuthHeader('POST', { org_id, user_id }, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function startCourse(course_uuid: string, org_slug: string,access_token:any) {
  const result: any = await fetch(
    `${getAPIUrl()}trail/add_course/${course_uuid}`,
    RequestBodyWithAuthHeader('POST', null, null,access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function removeCourse(course_uuid: string, org_slug: string,access_token:any) {
  const result: any = await fetch(
    `${getAPIUrl()}trail/remove_course/${course_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null,access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function markActivityAsComplete(
  org_slug: string,
  course_uuid: string,
  activity_uuid: string,
  access_token: any
) {
  const url = `${getAPIUrl()}trail/add_activity/${activity_uuid}`
  console.log('[markActivityAsComplete] URL:', url)
  console.log('[markActivityAsComplete] token present:', !!access_token)
  try {
    const result: any = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
    console.log('[markActivityAsComplete] response status:', result.status)
    const res = await errorHandling(result)
    return res
  } catch (e) {
    console.error('[markActivityAsComplete] fetch error:', e)
    console.error('[markActivityAsComplete] error name:', (e as any)?.name)
    console.error('[markActivityAsComplete] error message:', (e as any)?.message)
    console.error('[markActivityAsComplete] error cause:', (e as any)?.cause)
    throw e
  }
}

export async function unmarkActivityAsComplete(
  org_slug: string,
  course_uuid: string,
  activity_uuid: string,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}trail/remove_activity/${activity_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function updateActivityContent(
  activity_uuid: string,
  content: any,
  access_token: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const result = await fetch(
      `${getAPIUrl()}activities/${activity_uuid}`,
      RequestBodyWithAuthHeader('PUT', { content }, null, access_token)
    )

    if (!result.ok) {
      const errorData = await result.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.detail || `HTTP error ${result.status}`,
      }
    }

    const data = await result.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
