# Org Pages 404 — Issue Diagnosis & Next Steps

## Overview

Two separate but related issues were discovered while debugging why clicking
community cards from `/orgs/{slug}/communities` leads to a 404 page.

---

## Issue 1: All `/orgs/{slug}/*` pages return 404 from Next.js

**Severity: HIGH** — blocks ALL org routes (homepage, communities, courses, etc.)

### Symptoms

- `/orgs/default/` → 404 (Next.js serves `not-found.tsx`)
- `/orgs/default/communities` → 404
- `/orgs/default/community/community_<uuid>` → 404
- `/orgs/default/course/course_<uuid>` → 404
- Homepage `/` renders correctly with org data visible

### What works (API level)

- `GET http://localhost:1338/api/v1/orgs/slug/default` → 200
- `GET http://localhost:1338/api/v1/communities/community_<uuid>` → 200
- All backend endpoints respond correctly when called directly

### What we know

1. **Server logs show**:
   - `GET /orgs/default 404 in 4.9s (next.js: 3.2s, proxy.ts: 242ms, application-code: 1496ms)`
   - `GET /orgs/default/communities 404 in 62ms (next.js: 11ms, proxy.ts: 6ms, application-code: 45ms)`
   - The fast 45ms response suggests a cached or early-exit 404

2. **Error handling added to `communities/page.tsx`** (try/catch around
   `getOrganizationContextInfo` + `getCommunities`) — **still returns 404**.
   This proves the 404 is NOT caused by a thrown error in those service calls.

3. **The `(withmenu)/layout.tsx`** wraps pages in `<SessionGate>` which
   requires a valid session. If `SessionGate` redirects or blocks rendering
   for unauthenticated users, it could cause 404-like behavior.

4. **The root layout `[orgslug]/layout.tsx`** wraps content in `<OrgProvider>`
   which fetches org data client-side via SWR. If this fails, it renders
   `<ErrorUI>` — not a 404.

### Hypothesis (not yet verified)

- `generateMetadata` in `(withmenu)/page.tsx` (the org homepage) does NOT
  have try/catch around `getOrganizationContextInfo`. If it throws, Next.js
  may render `not-found.tsx`.
- But this doesn't explain why the `communities` page still 404s even with
  try/catch. The 404 must be happening at a **higher layout level** or in
  the Next.js route resolution itself.

### What to check next

1. Does the 404 happen BEFORE any component code runs? (Next.js routing
   layer vs page rendering layer)
2. Check if `SessionGate` in `(withmenu)/layout.tsx` is blocking the page
3. Add try/catch to `generateMetadata` in `(withmenu)/page.tsx`
4. Test with a simple page (no data fetching) at `/orgs/default/test`

---

## Issue 2: Community detail page UUID prefix handling

**Severity: MEDIUM** — affects community navigation from card clicks

### Root cause

The **course** and **community** flows handle UUID prefixes inconsistently:

#### Course flow (works correctly)

| Step | File | What happens |
|------|------|-------------|
| Card rendering | `CourseThumbnailLanding.tsx:57` | `removeCoursePrefix` strips `course_` → href = `/course/<bare-uuid>` |
| Detail page | `course/[courseuuid]/page.tsx` | Receives bare UUID, passes to `getCourseMetadata()` |
| Service layer | `courses.ts:53` | **Re-adds** `course_` → API URL = `courses/course_<uuid>/meta` ✅ |

#### Community flow (broken)

| Step | File | What happens |
|------|------|-------------|
| Card rendering | `CommunityCard.tsx:37` | `removeCommunityPrefix` strips `community_` → href = `/community/<bare-uuid>` |
| Detail page | `community/[communityuuid]/page.tsx` (original) | Receives bare UUID, passes to `getCommunity()` |
| Service layer | `communities.ts:95` | **Does NOT re-add** `community_` → API URL = `communities/<bare-uuid>` ❌ |

### Fix approach (not yet applied)

**Option A — Service-layer fix (recommended, matches course pattern)**

Modify `getCommunity` in `apps/web/services/communities/communities.ts` to
auto-re-add the `community_` prefix, exactly like `getCourseMetadata` does
for `course_`:

```typescript
// Before (broken):
`${getAPIUrl()}communities/${community_uuid}`

// After (fixed):
`${getAPIUrl()}communities/community_${community_uuid}`
```

Then revert the conditional `startsWith('community_')` logic on the detail
page (it won't be needed anymore — the service handles it).

**Option B — Page-level fix (already attempted, incomplete)**

The current code on the detail page has a conditional check:

```typescript
const communityUuid = communityuuid.startsWith('community_')
  ? communityuuid
  : `community_${communityuuid}`
```

This handles both URL formats but doesn't fix the **all org pages 404**
issue (Issue 1). This approach is a workaround, not the root fix.

---

## What was changed so far

### Files modified

1. **`apps/web/app/orgs/[orgslug]/(withmenu)/community/[communityuuid]/page.tsx`**
   - Added conditional `startsWith('community_')` check in both
     `generateMetadata` and `CommunityPage` to handle bare UUIDs

2. **`apps/web/app/orgs/[orgslug]/(withmenu)/communities/page.tsx`**
   - Added try/catch around `getOrganizationContextInfo` in both
     `generateMetadata` and `CommunitiesPage` (diagnostic — didn't fix the
     underlying 404)

### Files examined but not changed

- `apps/web/app/orgs/[orgslug]/layout.tsx` — Root org layout, has try/catch
  in `generateMetadata`, `RootLayout` just passes orgslug to `OrgProvider`
- `apps/web/app/orgs/[orgslug]/(withmenu)/layout.tsx` — Client layout with
  `<SessionGate>`, `<OrgProvider>` for org data
- `apps/web/services/communities/communities.ts` — `getCommunity` does NOT
  re-add `community_` prefix (the root fix location)
- `apps/web/services/courses/courses.ts` — `getCourseMetadata` DOES re-add
  `course_` prefix (the pattern to follow)
- `apps/web/components/Objects/Communities/CommunityCard.tsx` — Strips
  `community_` prefix from href (line 30-31, 37, 43)
- `apps/web/app/orgs/[orgslug]/(withmenu)/communities/communities.tsx` —
  Uses `@components/Objects/Thumbnails/CommunityCard` with full UUID in href
- `apps/web/app/orgs/[orgslug]/(withmenu)/course/[courseuuid]/page.tsx` —
  Course detail page (works, reference for correct pattern)

---

## Next steps to continue from here

### Priority 1: Fix ALL org pages 404

1. Add try/catch to `generateMetadata` in
   `apps/web/app/orgs/[orgslug]/(withmenu)/page.tsx`
2. Check if `SessionGate` in `(withmenu)/layout.tsx` is blocking
   unauthenticated users
3. Create a minimal test page at `/orgs/default/test` to isolate the
   routing issue
4. Check Next.js Turbopack dev server logs for compilation errors on org
   route group

### Priority 2: Fix community UUID prefix (service layer)

1. Edit `getCommunity` in `apps/web/services/communities/communities.ts` to
   add `community_` prefix to the API URL
2. Revert the conditional `startsWith()` logic from the detail page (it
   becomes unnecessary)
3. Check `getDiscussions` service — does it also need the prefix?

### Priority 3: Verify both fixes

1. Navigate to `/orgs/default/` — should render org homepage
2. Click a community card → should navigate to community detail page (no
   404)
3. Check with Playwright that all routes return 200
