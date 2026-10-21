import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  errorHandling,
} from '@services/utils/ts/requests'

export type CourseTranslation = {
  id: number
  course_id: number
  locale: string
  name: string
  description: string | null
  about: string | null
  learnings: string | null
  tags: string | null
  seo: Record<string, any> | null
  extra_metadata: Record<string, any> | null
  state: string
  source_updated_at: string | null
  translated_by: number | null
  creation_date: string
  update_date: string
}

export type CourseTranslationPayload = {
  name: string
  description?: string | null
  about?: string | null
  learnings?: string | null
  tags?: string | null
  seo?: Record<string, any> | null
  extra_metadata?: Record<string, any> | null
  state?: string
}

export async function getCourseTranslations(
  course_uuid: string,
  access_token: string
): Promise<CourseTranslation[]> {
  const result: any = await fetch(
    `${getAPIUrl()}courses/${course_uuid}/translations`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}

export async function upsertCourseTranslation(
  course_uuid: string,
  locale: string,
  data: CourseTranslationPayload,
  access_token: string
): Promise<CourseTranslation> {
  const result: any = await fetch(
    `${getAPIUrl()}courses/${course_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  return await errorHandling(result)
}

export async function deleteCourseTranslation(
  course_uuid: string,
  locale: string,
  access_token: string
) {
  const result: any = await fetch(
    `${getAPIUrl()}courses/${course_uuid}/translations/${locale}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await errorHandling(result)
}
