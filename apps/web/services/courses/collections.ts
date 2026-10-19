import { getAPIUrl } from '../config/config'
import {
  RequestBodyWithAuthHeader,
  RequestBodyFormWithAuthHeader,
  errorHandling,
  getResponseMetadata,
} from '@services/utils/ts/requests'

/*
 This file includes only POST, PUT, DELETE requests
 GET requests are called from the frontend using SWR (https://swr.vercel.app/)
*/

export async function deleteCollection(
  collection_uuid: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

// Create a new collection
export async function createCollection(
  org_id: number | string,
  collection: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/?org_id=${org_id}`,
    RequestBodyWithAuthHeader('POST', collection, null, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function getCollectionById(
  collection_uuid: any,
  access_token: string,
  next: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/collection_${collection_uuid}`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function getOrgCollections(
  org_id: string,
  access_token?: string,
  next?: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/org/${org_id}/page/1/limit/100`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  const res = await errorHandling(result)
  return res
}

export async function updateCollectionThumbnail(
  collection_uuid: string,
  formData: FormData,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/thumbnail`,
    RequestBodyFormWithAuthHeader('PUT', formData, null, access_token)
  )
  return await getResponseMetadata(result)
}

export async function deleteCollectionThumbnail(
  collection_uuid: string,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/thumbnail`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await getResponseMetadata(result)
}

export async function updateCollectionBanner(
  collection_uuid: string,
  formData: FormData,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/banner`,
    RequestBodyFormWithAuthHeader('PUT', formData, null, access_token)
  )
  return await getResponseMetadata(result)
}

export async function deleteCollectionBanner(
  collection_uuid: string,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/banner`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await getResponseMetadata(result)
}

export async function updateCollection(
  collection_uuid: string,
  collection: any,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}`,
    RequestBodyWithAuthHeader('PUT', collection, null, access_token)
  )
  return await getResponseMetadata(result)
}

export async function getCollectionCourses(
  collection_uuid: string,
  access_token: string,
  search = '',
  page = 1,
  limit = 20
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/courses?search=${encodeURIComponent(
      search
    )}&page=${page}&limit=${limit}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return await errorHandling(result)
}

export async function addCourseToCollection(
  collection_uuid: string,
  course_uuid: string,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/courses?course_uuid=${course_uuid}`,
    RequestBodyWithAuthHeader('POST', null, null, access_token)
  )
  return await getResponseMetadata(result)
}

export async function removeCourseFromCollection(
  collection_uuid: string,
  course_uuid: string,
  access_token: any
) {
  const result: any = await fetch(
    `${getAPIUrl()}collections/${collection_uuid}/courses?course_uuid=${course_uuid}`,
    RequestBodyWithAuthHeader('DELETE', null, null, access_token)
  )
  return await getResponseMetadata(result)
}
