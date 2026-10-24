import { getAPIUrl } from '@services/config/config'
import {
  RequestBodyWithAuthHeader,
  errorHandling,
} from '@services/utils/ts/requests'

/*
 This file includes the notification API service.
 GET requests are typically called from the frontend using SWR (https://swr.vercel.app/)
 Mutation functions (mark read, mark all read) are exported for direct use.
*/

export type NotificationItem = {
  /** NotificationRecipient id — used by the read APIs. */
  id: number
  notification_id: number
  event_type: string
  category: string
  title: string | null
  body: string | null
  source?: string | null
  params: Record<string, any>
  link_url: string | null
  created_at: string
  read_at: string | null
}

export type NotificationFeedResponse = {
  notifications: NotificationItem[]
  total: number
  page: number
  pages: number
}

export type UnreadCountResponse = {
  count: number
}

export type MarkReadResponse = {
  success: boolean
}

export type MarkAllReadResponse = {
  success: boolean
  updated_count: number
}

/**
 * Build the SWR key for the notification feed.
 * Returns null when there's no access_token or org_id, so SWR won't fetch.
 */
export function getNotificationFeedKey(
  access_token: string | undefined,
  org_id: number | string | undefined,
  page: number = 1,
  limit: number = 20
): string | null {
  if (!access_token || !org_id) return null
  return `${getAPIUrl()}notifications?org_id=${org_id}&page=${page}&limit=${limit}`
}

/**
 * Build the SWR key for the unread count.
 * Returns null when there's no access_token or org_id, so SWR won't fetch.
 */
export function getUnreadCountKey(
  access_token: string | undefined,
  org_id: number | string | undefined
): string | null {
  if (!access_token || !org_id) return null
  return `${getAPIUrl()}notifications/unread-count?org_id=${org_id}`
}

/**
 * Mark a single notification recipient as read.
 */
export async function markNotificationAsRead(
  recipient_id: number,
  access_token: string
): Promise<MarkReadResponse> {
  const result = await fetch(
    `${getAPIUrl()}notifications/${recipient_id}/read`,
    RequestBodyWithAuthHeader('PATCH', null, null, access_token)
  )
  return errorHandling(result)
}

/**
 * Mark all notifications as read for a given user + org.
 */
export async function markAllNotificationsAsRead(
  org_id: number | string,
  access_token: string
): Promise<MarkAllReadResponse> {
  const result = await fetch(
    `${getAPIUrl()}notifications/read-all?org_id=${org_id}`,
    RequestBodyWithAuthHeader('POST', null, null, access_token)
  )
  return errorHandling(result)
}

// ─── Management types ────────────────────────────────────────────────────────

export type EventCatalogItem = {
  event_type: string
  category: string
  description: string
  data_schema: Record<string, any>
  title_template: string | null
  body_template: string | null
  link_url: string | null
  is_enabled: boolean
  is_customized: boolean
  has_audience: boolean
  audience_description: string
}

export type TemplateOverrideBody = {
  title_template: string | null
  body_template: string | null
  link_url: string | null
}

export type TemplateToggleBody = {
  is_enabled: boolean
}

export type AnnouncementBody = {
  title: string
  body: string
  link_url?: string | null
  category?: string
  recipient_user_ids: number[]
}

export type AnnouncementItem = {
  id: number
  title: string | null
  body: string | null
  link_url: string | null
  category: string
  created_at: string | null
}

export type AnnouncementListResponse = {
  announcements: AnnouncementItem[]
  total: number
  page: number
  pages: number
}

/**
 * Get the event catalog with notification template status for an org.
 */
export async function getEventCatalog(
  org_id: number | string,
  access_token: string
): Promise<EventCatalogItem[]> {
  const res = await fetch(
    `${getAPIUrl()}notifications/events?org_id=${org_id}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return errorHandling(res)
}

/**
 * Save a template override for a specific event type.
 */
export async function saveTemplateOverride(
  org_id: number | string,
  event_type: string,
  body: TemplateOverrideBody,
  access_token: string
): Promise<{ success: boolean }> {
  const res = await fetch(
    `${getAPIUrl()}notifications/events/${event_type}/template?org_id=${org_id}`,
    RequestBodyWithAuthHeader('PUT', body, null, access_token)
  )
  return errorHandling(res)
}

/**
 * Enable or disable a notification event type.
 */
export async function toggleEvent(
  org_id: number | string,
  event_type: string,
  is_enabled: boolean,
  access_token: string
): Promise<{ success: boolean; is_enabled: boolean }> {
  const res = await fetch(
    `${getAPIUrl()}notifications/events/${event_type}/toggle?org_id=${org_id}`,
    RequestBodyWithAuthHeader('PUT', { is_enabled } as any, null, access_token)
  )
  return errorHandling(res)
}

/**
 * Send an announcement notification.
 */
export async function createAnnouncement(
  org_id: number | string,
  body: AnnouncementBody,
  access_token: string
): Promise<{ success: boolean; notification_id: number; recipient_count: number }> {
  const res = await fetch(
    `${getAPIUrl()}notifications/announcements?org_id=${org_id}`,
    RequestBodyWithAuthHeader('POST', body, null, access_token)
  )
  return errorHandling(res)
}

/**
 * List sent announcements for an org.
 */
export async function listAnnouncements(
  org_id: number | string,
  access_token: string,
  page: number = 1,
  limit: number = 20
): Promise<AnnouncementListResponse> {
  const res = await fetch(
    `${getAPIUrl()}notifications/announcements?org_id=${org_id}&page=${page}&limit=${limit}`,
    RequestBodyWithAuthHeader('GET', null, null, access_token)
  )
  return errorHandling(res)
}
