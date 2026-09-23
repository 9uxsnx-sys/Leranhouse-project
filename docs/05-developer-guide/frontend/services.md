# API Service Layer

> Koodook services are async TypeScript functions that wrap fetch calls to the backend API, providing a typed interface for all data operations with consistent auth header handling and error management.

---

## Service Organization

All service modules live under `apps/web/services/`, organized by domain:

```
services/
├── courses/
│   ├── courses.ts         # Course CRUD
│   ├── chapters.ts        # Chapter/module CRUD
│   ├── activities.ts      # Activity CRUD
│   ├── activity.ts        # Single activity operations
│   ├── assignments.ts     # Assignment management
│   ├── certifications.ts  # Certificate operations
│   ├── collections.ts     # Collection operations
│   ├── migration.ts       # Course migration
│   ├── transfer.ts        # Course transfer
│   └── updates.ts         # Course updates/changelog
├── auth/
│   ├── auth.ts            # Authentication
│   ├── cookies.ts         # Cookie management
│   └── sso.ts             # SSO operations
├── organizations/
│   ├── orgs.ts            # Organization CRUD
│   └── invites.ts         # Org invites
├── communities/
│   ├── communities.ts     # Community CRUD
│   └── discussions.ts     # Discussion operations
├── users/
│   └── users.ts           # User management
├── payments/
│   ├── payments.ts        # Payment operations
│   ├── offers.ts          # Offer management
│   ├── groups.ts          # Payment groups
│   └── providers/stripe.ts # Stripe integration
├── media/
│   └── media.ts           # Media file URLs
├── analytics/
│   └── analytics.ts       # Analytics data
├── boards/
│   ├── boards.ts          # Board CRUD
│   └── playground.ts      # Playground operations
├── config/
│   └── config.ts          # Runtime configuration
├── settings/
│   ├── org.ts             # Org settings
│   ├── profile.ts         # User profile
│   └── password.ts        # Password management
├── utils/
│   └── ts/
│       └── requests.ts    # Fetch helpers, auth headers, error handling
├── roles/
│   ├── roles.ts           # Role management
├── usergroups/
│   └── usergroups.ts      # User group management
├── plans/
│   └── plans.ts           # Plan/feature checks
├── search/
│   └── search.ts          # Search operations
├── podcasts/
│   ├── podcasts.ts        # Podcast CRUD
│   └── episodes.ts        # Episode CRUD
└── ee/
    ├── audit_logs.ts      # Enterprise audit logs
    └── superadmin.ts      # Superadmin operations
```

---

## How Services Call the API

All services use a shared set of helpers from `@services/utils/ts/requests`:

### Base URL

The API base URL is obtained via `getAPIUrl()` from `@services/config/config`:

```ts
import { getAPIUrl } from '@services/config/config'

// Returns something like "http://localhost/api/v1/"
// On custom domains, returns a relative path "/api/v1/" for same-origin requests
```

### Fetch Wrappers

Three request builders handle different content types:

**`RequestBodyWithAuthHeader(method, data, next, token)`** — JSON requests with optional Bearer token auth:

```ts
const options = RequestBodyWithAuthHeader('POST', { name: 'New Course' }, null, access_token)
// Result:
// {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
//   credentials: 'include',
//   cache: 'no-store',
//   body: '{"name":"New Course"}'
// }
```

Key behaviors:
- Always sets `cache: 'no-store'` to prevent Next.js from caching API responses
- Always includes `credentials: 'include'` for cookie-based auth
- Only adds `Authorization` header when a token is provided
- Only includes `body` for POST/PUT/DELETE methods

**`RequestBodyFormWithAuthHeader(method, data, next, access_token)`** — FormData requests (file uploads):

```ts
const formData = new FormData()
formData.append('name', 'Course Name')
formData.append('thumbnail', file)
const options = RequestBodyFormWithAuthHeader('POST', formData, null, access_token)
// Content-Type is not set (browser sets it with boundary for FormData)
```

**`swrFetcher(url, token)`** — SWR-specific fetcher that handles errors:

```ts
const { data, error } = useSWR(url, (url) => swrFetcher(url, access_token))
```

### Error Handling

The `errorHandling()` function parses API errors consistently:

```ts
const result = await fetch(url, options)
const res = await errorHandling(result)
// If response is not ok, throws an Error with:
//   error.status — HTTP status code
//   error.detail — Parsed error body
// If response is ok, returns parsed JSON
```

The `getResponseMetadata()` function returns a structured response for mutation operations:

```ts
const res = await getResponseMetadata(result)
// { success: boolean, data: any, status: number, HTTPmessage: string }
```

---

## Key Services

### Courses (`@services/courses/courses`)

```ts
// GET — called via SWR in components
getCourseMetadata(course_uuid, next, access_token, options?)    // Course metadata
getOrgCourses(org_slug, next, access_token, include_unpublished?)
searchOrgCourses(org_slug, query, page, limit, next, access_token?)
getCourse(course_uuid, next, access_token)
getCourseById(course_id, next, access_token)
getCourseRights(course_uuid, access_token)
getCourseContributors(course_uuid, access_token)

// POST/PUT/DELETE
updateCourse(course_uuid, data, access_token)
createNewCourse(org_id, course_body, thumbnail, access_token)
deleteCourseFromBackend(course_uuid, access_token)
cloneCourse(course_uuid, access_token)
updateCourseThumbnail(course_uuid, formData, access_token)
editContributor(course_uuid, contributor_id, authorship, authorship_status, access_token)
applyForContributor(course_uuid, data, access_token)
```

### Chapters (`@services/courses/chapters`)

```ts
getCourseChaptersMetadata(course_uuid, next, access_token)
updateChaptersMetadata(course_uuid, data, access_token)
updateChapter(coursechapter_id, data, access_token)
updateCourseOrderStructure(course_uuid, data: OrderPayload, access_token)
createChapter(data, access_token)
deleteChapter(coursechapter_id, access_token)
getChapterUserGroups(chapter_uuid, access_token)
addUserGroupToChapter(chapter_uuid, usergroup_uuid, access_token)
removeUserGroupFromChapter(chapter_uuid, usergroup_uuid, access_token)
```

### Activities (`@services/courses/activities`)

```ts
createActivity(data, chapter_id, org_id, access_token)
createFileActivity(file, type, data, chapter_id, access_token)
createExternalVideoActivity(data, activity, chapter_id, access_token)
getActivity(activity_uuid, next, access_token)
getActivityByID(activity_id, next, access_token)
getActivityWithAuthHeader(activity_uuid, next, access_token)
updateActivity(data, activity_uuid, access_token)
deleteActivity(activity_uuid, access_token)
getActivityVersions(activity_uuid, access_token, limit?, offset?)
getActivityVersion(activity_uuid, version_number, access_token)
restoreActivityVersion(activity_uuid, version_number, access_token)
getActivityUserGroups(activity_uuid, access_token)
addUserGroupToActivity(activity_uuid, usergroup_uuid, access_token)
removeUserGroupFromActivity(activity_uuid, usergroup_uuid, access_token)
```

### Communities (`@services/communities/communities`)

```ts
getCommunities(org_id, page, limit, next, access_token?)
getCommunity(community_uuid, next, access_token?)
getCommunityByCourse(course_uuid, next, access_token?)
createCommunity(org_id, data: CommunityCreate, access_token)
updateCommunity(community_uuid, data: CommunityUpdate, access_token)
deleteCommunity(community_uuid, access_token)
getCommunityRights(community_uuid, access_token?)
linkCommunityToCourse(community_uuid, course_uuid, access_token)
unlinkCommunityFromCourse(community_uuid, access_token)
updateCommunityThumbnail(community_uuid, formData, access_token)
```

---

## Service Function Patterns

Every service function follows the same pattern:

### 1. Async function with typed parameters

```ts
export async function createActivity(
  data: any,
  chapter_id: any,
  org_id: any,
  access_token: string
) {
  // ...
}
```

### 2. Build URL using `getAPIUrl()`

```ts
const result = await fetch(
  `${getAPIUrl()}activities/?coursechapter_id=${chapter_id}&org_id=${org_id}`,
  RequestBodyWithAuthHeader('POST', data, null, access_token)
)
```

### 3. Parse and return response

```ts
const res = await result.json()
return res
```

Or with error handling:

```ts
const res = await errorHandling(result)
return res
```

Or with response metadata:

```ts
const res = await getResponseMetadata(result)
return res  // { success, data, status, HTTPmessage }
```

---

## Error Handling in Services

There are two error handling patterns:

### For Data Fetching (used with SWR)

Use `errorHandling()` which throws on non-OK responses:

```ts
import { errorHandling } from '@services/utils/ts/requests'

export async function getCourseMetadata(course_uuid: string, next: any, access_token: string) {
  const result = await fetch(
    `${getAPIUrl()}courses/course_${course_uuid}/meta`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  const res = await errorHandling(result)
  return res
}
```

The thrown error has `status` and `detail` properties, which SWR captures in its `error` object.

### For Mutations (create, update, delete)

Use `getResponseMetadata()` which always returns a structured object:

```ts
import { getResponseMetadata } from '@services/utils/ts/requests'

export async function updateActivity(data: any, activity_uuid: string, access_token: string) {
  const result = await fetch(
    `${getAPIUrl()}activities/${activity_uuid}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res  // { success: boolean, data: any, status: number, HTTPmessage: string }
}
```

Callers then check `res.success` to determine if the operation succeeded.

---

## Revalidation After Mutations

After successful mutations, services or calling code revalidate SWR caches and Next.js data cache tags:

```ts
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'

// Revalidate Next.js data cache tags
await revalidateTags(['courses'], props.orgslug)

// Revalidate SWR cache
await mutate(getCourseMetaCacheKey(course_uuid, withUnpublishedActivities), undefined, { revalidate: true })
```

The `revalidateTags` function makes two programmatic fetches per tag to the revalidation endpoint (to ensure it hits multiple pods behind a load balancer):

```ts
export const revalidateTags = async (tags: string[], orgslug: string) => {
  const url = getUriWithOrg(orgslug, '')
  const calls = tags.flatMap((tag) => [
    fetch(`${url}/api/revalidate?tag=${tag}`, { cache: 'no-store' }),
    fetch(`${url}/api/revalidate?tag=${tag}`, { cache: 'no-store' }),
  ])
  await Promise.allSettled(calls)
}
```

---

## Example: `createActivity()` and `updateActivity()`

### `createActivity()`

```ts
export async function createActivity(data: any, chapter_id: any, org_id: any, access_token: string) {
  data.content = data.content || {}
  delete data.chapterId  // Remove redundant field

  const result = await fetch(
    `${getAPIUrl()}activities/?coursechapter_id=${chapter_id}&org_id=${org_id}`,
    RequestBodyWithAuthHeader('POST', data, null, access_token)
  )
  const res = await result.json()
  return res
}
```

### `updateActivity()`

```ts
export async function updateActivity(data: any, activity_uuid: string, access_token: string) {
  const result = await fetch(
    `${getAPIUrl()}activities/${activity_uuid}`,
    RequestBodyWithAuthHeader('PUT', data, null, access_token)
  )
  const res = await getResponseMetadata(result)
  return res
}
```

Typical usage in a component:

```tsx
import { createActivity } from '@services/courses/activities'
import { useLHSession } from '@components/Contexts/LHSessionContext'

function NewActivityForm({ chapterId, orgId }: Props) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const handleCreate = async () => {
    const activity = await createActivity(
      { name: 'New Lesson', content: {} },
      chapterId,
      orgId,
      access_token
    )
    // Revalidate cache
    await mutate(cacheKey)
  }
}
```
