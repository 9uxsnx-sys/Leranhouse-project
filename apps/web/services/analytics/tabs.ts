'use client'
import useSWR from 'swr'
import { getAPIUrl } from '@services/config/config'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'

export type CardKind = 'trend' | 'bars' | 'ranked' | 'table'
export type CardFormat = 'number' | 'percent' | 'minutes'

export interface CardSeries {
  key: string
  name: string
  color?: string
}

export interface CardColumn {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  width?: string
  sortable?: boolean
  /**
   * Optional cell rendering hint — the frontend maps it to a `render`.
   * `mono` path, `delta` signed %, `percent` plain %, `person` avatar + name,
   * `username` @handle, `status` verified dot, `date` localized date.
   */
  variant?: 'mono' | 'delta' | 'percent' | 'person' | 'username' | 'status' | 'date'
}

/**
 * One card as returned by `GET /analytics/tabs/{tab}`.
 * Self-describing: `kind` picks the component and the remaining fields *are*
 * that component's props — see docs/08-features/analytics/implementation-plan.md §2.
 */
export interface AnalyticsCard {
  title: string
  kind: CardKind
  format?: CardFormat
  /** Optional value for the card's header slot. */
  heading?: string
  data?: Record<string, any>[]
  xKey?: string
  series?: CardSeries[]
  categoryKey?: string
  valueKey?: string
  columns?: CardColumn[]
  rows?: Record<string, any>[]
  /** Pagination — currently only the Learners table sends these. */
  page?: number
  pageSize?: number
  total?: number
}

export interface AnalyticsTabPayload {
  tab: string
  meta: {
    org_id: number
    range: string
    entity: string
    generated_at: string
    cached: boolean
  }
  cards: Record<string, AnalyticsCard>
}

function fetcher(url: string, token: string) {
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
    if (!r.ok) throw new Error(`${r.status}`)
    return r.json()
  })
}

/**
 * Fetches one Analytics tab — every card, in a single request.
 * `range` and `entity` are real query params (the API bucketises accordingly);
 * `extra` carries tab-specific params (`q`, `page` for Learners).
 */
export function useAnalyticsTab(
  tab: string,
  range = '30d',
  entity = 'all',
  extra: Record<string, string | number> = {}
) {
  const org = useOrg() as any
  const session = useLHSession() as any
  const token = session?.data?.tokens?.access_token
  const orgId = org?.id

  const params = new URLSearchParams({ org_id: String(orgId ?? ''), range, entity })
  for (const [key, value] of Object.entries(extra)) {
    if (value !== '' && value !== undefined && value !== null) params.set(key, String(value))
  }
  const url = orgId && token ? `${getAPIUrl()}analytics/tabs/${tab}?${params}` : null

  return useSWR<AnalyticsTabPayload>(url, (u) => fetcher(u, token), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
}

/** One learner's profile + per-course progress — backs the details dialog. */
export interface LearnerDetail {
  user: {
    id: number
    name: string
    username: string
    email: string
    role: string
    verified: boolean
    joined: string
    last_active: string | null
  }
  courses: { name: string; progress: number }[]
}

export function useLearnerDetail(userId: number | null) {
  const org = useOrg() as any
  const session = useLHSession() as any
  const token = session?.data?.tokens?.access_token
  const orgId = org?.id

  const url =
    orgId && token && userId
      ? `${getAPIUrl()}analytics/learners/${userId}?org_id=${orgId}`
      : null

  return useSWR<LearnerDetail>(url, (u) => fetcher(u, token), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
}

export interface FilterOption {
  value: string
  label: string
}

/**
 * The org's `courses` / `podcasts` as action-row filter options (`All …` plus
 * one per item, keyed by uuid so the value can be passed straight through as
 * `entity`).
 */
function useOrgEntityOptions(kind: 'courses' | 'podcasts', allLabel: string): FilterOption[] {
  const org = useOrg() as any
  const session = useLHSession() as any
  const token = session?.data?.tokens?.access_token
  const slug = org?.slug
  const uuidKey = kind === 'courses' ? 'course_uuid' : 'podcast_uuid'

  const url =
    slug && token
      ? `${getAPIUrl()}${kind}/org_slug/${slug}/page/1/limit/100?include_unpublished=true`
      : null

  const { data } = useSWR<any>(url, (u) => fetcher(u, token), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const items: any[] = Array.isArray(data) ? data : []
  return [
    { value: 'all', label: allLabel },
    ...items.map((item) => ({ value: item[uuidKey], label: item.name })),
  ]
}

export function useOrgCourses(): FilterOption[] {
  return useOrgEntityOptions('courses', 'All courses')
}

export function useOrgPodcasts(): FilterOption[] {
  return useOrgEntityOptions('podcasts', 'All podcasts')
}

export function useOrgCommunities(): FilterOption[] {
  const org = useOrg() as any
  const session = useLHSession() as any
  const token = session?.data?.tokens?.access_token
  const orgId = org?.id

  const url = orgId && token ? `${getAPIUrl()}communities/org/${orgId}/page/1/limit/100` : null

  const { data } = useSWR<any>(url, (u) => fetcher(u, token), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const items: any[] = Array.isArray(data) ? data : []
  return [
    { value: 'all', label: 'All communities' },
    ...items.map((community) => ({ value: community.community_uuid, label: community.name })),
  ]
}
