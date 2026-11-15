# API Service Layer

> Status: as-built · Last verified: 2026-11-15

> Services are async TypeScript functions in `apps/web/services/` that wrap fetch calls to the backend, centralizing URL building and auth-header handling.

---

## Service Organization

All modules live under `apps/web/services/`, grouped by domain:

| Domain | Files |
|--------|-------|
| `ai/` | `ai.ts`, `courseplanning.ts`, `magicblocks.ts` |
| `analytics/` | `analytics.ts`, `tabs.ts` |
| `api_tokens/` | `api_tokens.ts` |
| `auth/` | `auth.ts`, `cookies.ts`, `sso.ts` |
| `blocks/` | `Audio/audio.ts`, `CodePlayground/sqlite.ts`, `Image/images.ts`, `Pdf/pdf.ts`, `Quiz/quiz.ts`, `Video/video.ts` |
| `boards/` | `boards.ts`, `playground.ts` |
| `communities/` | `communities.ts`, `communityTranslations.ts`, `discussions.ts` |
| `config/` | `config.ts` (runtime config, URL builders) |
| `courses/` | `access.ts`, `activities.ts`, `activity.ts`, `assignments.ts`, `certifications.ts`, `chapters.ts`, `collectionTranslations.ts`, `collections.ts`, `courses.ts`, `migration.ts`, `transfer.ts`, `translations.ts`, `updates.ts` |
| `custom_domains/` | `custom_domains.ts` |
| `ee/` | `audit_logs.ts`, `superadmin.ts` |
| `home/` | `trail.ts`, `trending.ts` |
| `media/` | `media.ts` (media URL builders) |
| `org/` | `orgResolution.ts` |
| `organizations/` | `orgs.ts`, `invites.ts` |
| `orgs/` | `usage.ts` |
| `packs/` | `packs.ts` |
| `payments/` | `checkout.ts`, `entitlements.ts`, `offers.ts`, `orders.ts`, `overview.ts`, `payments.ts`, `payouts.ts`, `providers/stripe.ts` |
| `plans/` | `plans.ts` |
| `playgrounds/` | `playgrounds.ts`, `generator.ts` |
| `podcasts/` | `podcasts.ts`, `episodes.ts`, `podcastTranslations.ts`, `trail.ts` |
| `roles/` | `roles.ts` |
| `search/` | `search.ts` |
| `settings/` | `org.ts`, `password.ts`, `profile.ts` |
| `usergroups/` | `usergroups.ts` |
| `users/` | `users.ts` |
| `utils/` | `health.ts`, `ts/requests.ts`, `ts/hostUtils.ts`, `ts/colorUtils.ts`, `react/middlewares/views.ts` |
| `webhooks/` | `webhooks.ts` |
| root | `notifications.ts` |

---

## URL Building

`services/config/config.ts` is the single source of truth:

- `getAPIUrl()` — full backend API base (`{backend}/api/v1/`), or the relative `/api/v1/` when the browser is on a custom domain (so requests stay same-origin through the Next.js proxy).
- `getServerAPIUrl()` — always the absolute URL; use it in Server Components and route handlers.
- `getBackendUrl()` — backend origin without the `/api/v1/` suffix.
- `getUriWithOrg(orgslug, path)` — relative path on the current host, or an absolute subdomain URL when crossing subdomains in multi tenancy.
- Runtime values come from `window.__RUNTIME_CONFIG__` / `runtime-config.json`, falling back to `process.env` server-side (`getConfig`).

```ts
import { getAPIUrl } from '@services/config/config'

const res = await fetch(`${getAPIUrl()}courses/`, options)
```

---

## Request Helpers (`@services/utils/ts/requests`)

| Helper | Behavior |
|--------|----------|
| `RequestBodyWithAuthHeader(method, data, next, token?)` | JSON request. Adds `Authorization: Bearer <token>` only when a token is passed; sets `credentials: 'include'` and `redirect: 'follow'`; adds a JSON body only when `data` is not `null`/`undefined`. It does **not** set `cache`. |
| `RequestBodyFormWithAuthHeader(method, data, next, access_token)` | `FormData` request with a Bearer token and no `Content-Type` (the browser adds the multipart boundary). |
| `RequestBody(method, data, next)` | Unauthenticated JSON request. |
| `swrFetcher(url, token?)` | GET + `errorHandling()`, used as the SWR fetcher; returns `undefined` on `AbortError`. |
| `swrFetchAllPages(url, token?, pageSize = 100)` | Walks `{ items, total }` pages, because the API caps `limit` at 100. |
| `secureFetch(url, options)` | Rejects URLs that do not start with `getAPIUrl()` (SSRF guard); use it for user-influenced URLs. |
| `errorHandling(response)` | Throws an `Error` carrying `status` and `detail` on non-OK responses; otherwise returns parsed JSON. |
| `getResponseMetadata(response)` | Always returns `{ success, data, status, HTTPmessage }`; `success` is true only for HTTP 200. |
| `revalidateTags(tags, orgslug)` | Calls `/api/revalidate?tag=...` twice per tag (to reach multiple pods behind a load balancer). |

---

## Two Error Patterns

**Fetching (SWR):** use `errorHandling` / `swrFetcher` so SWR receives a thrown error.

```ts
export async function getCourseMetadata(course_uuid: string, next: any, access_token: string) {
  const result = await fetch(
    `${getAPIUrl()}courses/course_${course_uuid}/meta`,
    RequestBodyWithAuthHeader('GET', null, next, access_token)
  )
  return await errorHandling(result)
}
```

**Mutations (create/update/delete):** many modules use `getResponseMetadata` and let callers check `res.success`; others still use `errorHandling`.

```ts
export async function updateCourseThumbnail(course_uuid: any, formData: FormData, access_token: any) {
  const result = await fetch(
    `${getAPIUrl()}courses/${course_uuid}/thumbnail`,
    RequestBodyFormWithAuthHeader('PUT', formData, null, access_token)
  )
  return await getResponseMetadata(result)
}
```

Callers then revalidate caches after a successful mutation:

```ts
import { revalidateTags } from '@services/utils/ts/requests'
import { mutate } from 'swr'

await revalidateTags(['courses'], orgslug)
await mutate(cacheKey, undefined, { revalidate: true })
```

---

## Conventions

- One file per backend domain; new endpoints go in the matching folder rather than a generic `api.ts`.
- Always build URLs with `getAPIUrl()` (or `getServerAPIUrl()` on the server) — never hardcode hosts or `/api/v1`.
- Pass the access token explicitly; helpers only attach `Authorization` when a token is provided.
- Return the helper result directly (`errorHandling` or `getResponseMetadata`) instead of re-implementing status checks.
- Verified examples: `services/courses/courses.ts` exports `getOrgCourses`, `getCourseMetadata`, `updateCourse`, `createNewCourse`, `cloneCourse`, `getCourseRights`, `applyForContributor`, `updateCourseThumbnail` and `updateCourseBanner`.
