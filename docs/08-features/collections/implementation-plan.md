# Collections — Implementation Plan

> Turn the existing (but dormant) **Collections** resource into a first-class, course-grade product: full media, three access modes, a dashboard editor, and a purchase flow that mirrors buying each course individually.

**Status:** complete — Phase 0 ✅ (paid lock verified), Phase 1 ✅ (schema, migration, RBAC), Phase 2 ✅ (CRUD, membership, validation), Phase 3 ✅ (media), Phase 4 ✅ (checkout, snapshot, fan-out), Phase 5 ✅ (dashboard listing + editor), Phase 6 ✅ (learner listing, detail, success branch, nav; buy → all courses in Progress), Phase 7 ✅ (SEO tab, Offers row type, podcast members, Payment Groups removal).
**Last updated:** 2026-10-19
**Scope:** desktop/web only. No mobile action bar. No refunds.

---

## 1. What a collection is

A collection is a named bundle of courses that learners can browse like a course. It has the same presentation surface as a course — cover, banner, description, learning outcomes, access mode, price — but its body lists **courses** instead of chapters and activities.

When a learner buys a **paid** collection, the platform grants exactly the same access as buying every member course individually:

- one `resourceentitlement` per member course,
- one `TrailRun` per member course,
- so `/trail` shows all of them with no learner-facing changes.

Collections cannot contain private (`users_only`) courses. This is a hard rule, validated on add and on publish.

---

## 2. What already exists

| Piece | Location | State |
|---|---|---|
| `collection` table | [`db/collections.py`](../../../apps/api/src/db/collections.py) | name, description, `public`, org, uuid |
| `collectioncourse` join | [`db/collections_courses.py`](../../../apps/api/src/db/collections_courses.py) | polymorphic collection ↔ resource (`course` / `podcast`) |
| CRUD API | [`routers/courses/collections.py`](../../../apps/api/src/routers/courses/collections.py) | create / read / update / delete / list |
| Service | [`services/courses/collections.py`](../../../apps/api/src/services/courses/collections.py) | CRUD |
| RBAC entry | [`security/rbac/config.py`](../../../apps/api/src/security/rbac/config.py) | `collection_` prefix, no access types |
| Learner listing | [`collections/CollectionsClient.tsx`](../../../apps/web/app/orgs/%5Borgslug%5D/(%5Bwithmenu%5D)/collections/CollectionsClient.tsx) | old styling, not in nav |
| Learner detail | [`collection/[collectionid]/collection.tsx`](../../../apps/web/app/orgs/%5Borgslug%5D/(%5Bwithmenu%5D)/collection/%5Bcollectionid%5D/collection.tsx) | grid of course cards |
| Feature toggle | `update_org_collections_config` | backend only, default enabled |
| Dashboard UI | — | **missing** |

Two existing defects must be fixed as part of this work:

1. `update_collection` deletes every `collectioncourse` row on **any** PUT. A price/name-only update silently empties the bundle. Must use `model_fields_set`.
2. `CollectionCreate` requires `courses: list[int]` and trusts a body-supplied `org_id`. The org must come from the route/auth, and `courses` must be optional at creation.

---

## 3. Locked decisions

| Topic | Decision |
|---|---|
| Platform | Desktop/web only |
| Refunds | Out of scope; entitlement revocation stays manual |
| Dashboard shape | Listing → General / Content / Access / SEO |
| Content tab | Add/remove item table (courses and podcasts; not a module builder) |
| Access model | Same three modes as courses |
| Private resources | Rejected from every collection |
| Purchase effect | Fan-out to per-resource entitlements + `TrailRun`s for course members |
| Media | Full parity: cover image, optional cover video, hero banner |
| SEO | Course-parity SEO tab (Phase 7) |
| Payment Groups tab | Removed — Collections is the bundle resource |

---

## 4. Field parity with courses

`CollectionBase` mirrors `CourseBase` minus `open_to_contributors`.

| Field | Collection | Notes |
|---|---|---|
| `name` | ✅ | required, ≤ 100 |
| `description` | ✅ | short text under the title |
| `about` | ✅ | long-form section |
| `learnings` | ✅ | JSON array — "What you'll learn" |
| `tags` | ✅ | search only |
| `thumbnail_type` | ✅ | `image` / `video` / `both`, default `image` |
| `thumbnail_image` | ✅ | card cover |
| `thumbnail_video` | ✅ | upload supported; rendering optional in v1 |
| `banner_image` | ✅ | detail-page hero |
| `public` | ✅ | legacy flag, kept in sync with `access_type` |
| `published` | ✅ | draft/publish |
| `access_type` | ✅ | `public` / `users_only` / `paid` |
| `price_amount` | ✅ | integer DZD |
| `price_currency` | ✅ | default `DZD` |
| `seo` (JSONB) | ✅ | Phase 7 — course-parity SEO tab |
| `extra_metadata` | ❌ | collection stats are computed from members |

Deliberately excluded: contributors, certifications, analytics, `open_to_contributors`.

```python
class CollectionBase(SQLModel):
    name: str
    description: Optional[str] = None
    about: Optional[str] = None
    learnings: Optional[str] = None
    tags: Optional[str] = None
    thumbnail_type: Optional[ThumbnailType] = Field(default=ThumbnailType.IMAGE)
    thumbnail_image: Optional[str] = Field(default="")
    thumbnail_video: Optional[str] = Field(default="")
    banner_image: Optional[str] = Field(default="")
    public: bool
    published: bool = Field(default=False)
    access_type: AccessTypeEnum = Field(default=AccessTypeEnum.PUBLIC)
    price_amount: Optional[int] = None
    price_currency: str = Field(default="DZD")
```

`CollectionRead` / `CollectionCreate` / `CollectionUpdate` follow the same split as `CourseRead` / `CourseCreate` / `CourseUpdate` (Update = all optional, applied via `model_fields_set`).

**Migration:** one Alembic revision adding `about`, `learnings`, `tags`, `thumbnail_type`, `thumbnail_image`, `thumbnail_video`, `banner_image`, `published`, `access_type`, `price_amount`, `price_currency`. Backfill: `access_type = 'public'`, `published = true` (existing rows are already visible), `price_currency = 'DZD'`.

**RBAC:** `has_published_field=True`, `supports_access_types=True`, `supports_usergroups=True`, `supports_authorship=False`.

---

## 5. Media pipeline

Mirrors the course flow exactly.

**Storage**

```
content/orgs/{org_uuid}/collections/{collection_uuid}/thumbnails/{file}
content/orgs/{org_uuid}/collections/{collection_uuid}/banners/{file}
```

**Backend**

- `services/courses/collection_media.py` — copies of `upload_thumbnail` / `delete_course_thumbnail_file` and `upload_course_banner` / `delete_course_banner_file`, scoped to collections.
- Routes:

```
POST   /collections/{uuid}/thumbnail      multipart: thumbnail, thumbnail_type
DELETE /collections/{uuid}/thumbnail
POST   /collections/{uuid}/banner         multipart: banner
DELETE /collections/{uuid}/banner
```

Same validation as courses: max 8 MB, JPEG/PNG only, replace deletes the previous file.

**Frontend**

- `services/courses/collections.ts` — `updateCollectionThumbnail`, `deleteCollectionThumbnail`, `updateCollectionBanner`, `deleteCollectionBanner`.
- `services/media/media.ts` — `getCollectionThumbnailMediaDirectory`, `getCollectionBannerMediaDirectory`.
- `CollectionMediaSection.tsx` — copy of `CourseMediaSection` with the same upload containers, states and toasts.
- `CollectionCard` uses `collection.thumbnail_image`, falling back to the first member course's cover.

---

## 6. API surface

Existing, hardened:

```
POST   /collections/                                   create (name, description, access_type, price)
GET    /collections/{uuid}
PUT    /collections/{uuid}                             partial update
DELETE /collections/{uuid}
GET    /collections/org/{org_id}/page/{page}/limit/{limit}
```

New:

```
GET    /collections/{uuid}/courses?search=&page=&limit=    lean rows for the content table
POST   /collections/{uuid}/courses?course_uuid=            add
DELETE /collections/{uuid}/courses?course_uuid=            remove
POST   /collections/{uuid}/thumbnail
DELETE /collections/{uuid}/thumbnail
POST   /collections/{uuid}/banner
DELETE /collections/{uuid}/banner
```

Payments touch-points:

- [`services/payments/checkout.py`](../../../apps/api/src/services/payments/checkout.py) — `_load_resources` accepts `collection_`.
- [`services/payments/entitlements.py`](../../../apps/api/src/services/payments/entitlements.py) — `_resolve_resource` accepts `collection_`.
- [`services/payments/webhooks.py`](../../../apps/api/src/services/payments/webhooks.py) — fan-out on `checkout.paid`.

---

## 7. Access model

| Collection `access_type` | Visible to | Get Access | Member courses |
|---|---|---|---|
| `public` | everyone when published | none — "Explore courses" | keep their own access |
| `users_only` | members of linked UserGroups | none | keep their own access |
| `paid` | everyone when published | price + checkout | must be published and non-private |

Global rules:

- Draft collections are invisible to learners and rejected at checkout.
- `paid` requires ≥ 1 course and `price_amount > 0`.
- `users_only` member courses are rejected on add.
- A course that belongs to **any** collection cannot be switched to `users_only` (409 listing the collection names). This prevents bundles becoming unsellable after the fact.
- `public` is kept in sync with `access_type` for legacy listing queries (`public = access_type == public`).

**Dashboard Access tab**

| Mode | Panel |
|---|---|
| Public | notice only — no user table (everyone has access) |
| Private | link/unlink UserGroups (`/usergroups/resource/{collection_uuid}`) |
| Paid | price field + entitlement roster (`/payments/{org_id}/entitlements?resource_uuid=collection_…`) with manual add/remove |

---

## 8. Purchase flow

Checkout is created with:

```
resource_uuid = "collection_abc"
resource_type = "collection"
amount        = collection.price_amount
price_snapshot = {
    amount,
    currency,
    resources: [member uuids at purchase time],  # courses + podcasts
    courses:   [course uuids at purchase time],  # backward compatibility
}
```

Membership is **snapshotted** so later edits never retroactively grant or remove content.

On `checkout.paid`:

1. Grant `resourceentitlement(collection_abc, source=purchase, order_id=…)`.
2. For each uuid in `price_snapshot.courses`:
   - skip if an active entitlement already exists (the learner may own a course individually),
   - create `resourceentitlement(course_x, source=purchase, order_id=…)`,
   - ensure the learner's `Trail` and `TrailRun` exist for the course.
3. Mark the order paid (`paid_at`, `fees`, `fees_on_merchant`, `payment_method`, `payload`).

Result: `/trail` lists the member courses exactly as if each had been bought separately. No learner-side changes are required.

Duplicate processing is already covered by `payment_webhook_event.event_id`.

---

## 9. Dashboard UX

### Listing — `/dash/collections`

Copy of the courses listing shell (`dash/courses/client.tsx`) without AI/import/SCORM/bulk actions:

- `ActionRow`: search, "New collection", filter.
- 4-column grid of `CollectionCard` (cover, name, description, "N courses").
- Pagination in the same position, both empty states.
- 3-dot menu per card: Edit → `/dash/collections/collection/{uuid}/general`, Delete.

### Editor — `/dash/collections/collection/{uuid}/{subpage}`

Same shell as the course editor: title row, `PageTabs variant="pill"`, `max-w-7xl` content.

| Tab | Content |
|---|---|
| **General** | name, description, about, learnings editor, tags, cover + banner media section, publish toggle, preview link |
| **Content** | `SectionCard bleed` + `DataTable`: Course (thumb + name + Draft tag), Access, Price, Lessons, Added, ⋯ → Remove. Toolbar: search + **Add course** picker (excludes `users_only` and existing members). Footer: "N courses · M lessons". |
| **Access** | three-mode cycle as described in §7 |

---

## 10. Learner UX

### Listing — `/collections`

Rebuilt on the courses listing: same scaffold, search, filter menu, grid, pagination, empty states. Card uses the collection's own cover.

### Detail — `/collection/{id}`

Course page → collection page mapping:

| Course element | Collection |
|---|---|
| Hero banner | collection banner → cover → placeholder |
| Title / description | same |
| Stats row | `N courses · M lessons · Xh` computed from members |
| Share | same, `/collection/{id}` |
| What you'll learn | same (`learnings`) |
| About | same (`about`) |
| Course curriculum | **replaced** by "What's included" — `CourseCard` list |
| Requirements | omitted |
| Sidebar: In progress / Get Access | same card. Paid → price + Buy; Public → "Explore courses"; owned → "You own this bundle" |
| Sidebar: This course includes | "This bundle includes" — courses, lessons, hours, certificate |
| Sidebar: Updates | same |
| Sidebar: Community | omitted |

Buy → `POST /payments/{org_id}/checkout` → Chargily → `/payment/success?resource=collection_…`.

### Success page

Add a `collection_` branch:

- `backHref → /collection/{id}`;
- activation when all snapshot courses have runs (or the first run appears if a faster flip is preferred);
- secondary action stays `/trail`.

### Navigation

- `DashLeftMenu`: **Collections** entry, gated on `resolved_features.collections.enabled`.
- `UserLeftMenu`: **Collections** entry, same gate.
- Desktop only — no `DashMobileMenu` entry.
- Retired the legacy learner-facing `/collections/new` form when the dashboard listing shipped; creation now lives only in the dashboard.

---

## 11. Validation rules

| Rule | Where | Response |
|---|---|---|
| Course exists and belongs to the org | add course | 404 |
| Course is not `users_only` | add course | 422 |
| Course is not already a member | add course | 409 |
| Collection is `paid` → `price_amount > 0` | publish / update | 422 |
| Collection is `paid` → at least one member | publish / update | 422 |
| Publish → all members published | publish | 422 with offender list |
| Add draft course to a published collection | add course | 422 |
| Member course cannot switch to `users_only` | course update | 409 with collection names |
| Member course cannot be unpublished while its collection is published | course update | 409 with collection names |
| Published paid bundle metadata is readable by non-buyers (product page) | get collection / members | 200 |
| Private (`users_only`) and draft bundles stay hidden from non-members | get collection / members | 403 |
| Draft collection cannot be purchased | checkout | 400 |
| Duplicate collection purchase | checkout | 400 |
| `update_collection` without `courses` keeps membership | update | — |

---

## 12. Edge cases

| Case | Behaviour |
|---|---|
| Learner already owns a member course | Fan-out skips that entitlement; no duplicate |
| Member added after purchase | Not granted — snapshot is authoritative |
| Member removed after purchase | Still owned (already granted) |
| Bundle contains only free courses | Allowed; purchase just enrolls |
| Empty paid bundle | Publish blocked |
| Collection deleted | Entitlements/runs remain; access is unchanged |
| Revoke | Manual via the Access tab (no refunds) |

Minor: `/trail` sorts by `creation_date`; six runs share one timestamp. Add a name tiebreak for stable ordering.

---

## 13. Phases

### Phase 0 — Pre-flight
- Verify the paid-content lock: a non-buyer opening a paid lesson must see the paywall, not content. Bundles multiply any leak.
- Exit: documented pass/fail with the enforcing endpoint.

### Phase 1 — Schema & models
- `CollectionBase` parity, `CollectionRead/Create/Update`, Alembic revision, RBAC flags.
- Exit: migration applies on a fresh DB; existing learner collections still render.

### Phase 2 — Backend CRUD & membership
- Fix partial-update semantics and org derivation.
- Add/remove course endpoints + validation.
- Block `users_only` transitions for member courses.
- Exit: tests green; curl round-trip works.

### Phase 3 — Media
- Thumbnail/banner services, routes, storage.
- Frontend service functions + media helpers + media section.
- Exit: upload → listing shows the cover, detail shows the banner, delete restores fallback.

### Phase 4 — Payments
- `collection_` in checkout + entitlements.
- Membership snapshot.
- Webhook fan-out + duplicate skip.
- Exit: a test checkout produces N entitlements + N `TrailRun`s visible in `/trail`.

### Phase 5 — Dashboard UI
- Listing, editor shell, General (+ media), Content table + picker, Access.
- Exit: create → upload cover → add courses → price → publish → buyable.

### Phase 6 — Learner UI & navigation
- Listing, detail, success-page branch, nav entries, retire the legacy create form.
- Exit: buy from the collection page → all courses in `/trail`.
- Verified: a signed `checkout.paid` for a 2-course bundle produced 3 active entitlements (bundle + 2 courses) and both courses on the Progress page; the Access tab Public → Paid → price → Save round-trip persists `access_type=PAID`.
- Post-audit fixes: paid bundle pages are browsable by non-buyers so the Get access CTA is reachable; adding a draft member to a published bundle is rejected; unpublishing a member of a published bundle is rejected; deleting a bundle removes its uploaded media; sitemap and breadcrumb links point at `/collection/:uuid` and `/collections`.

### Phase 7 — Delivered
- **SEO tab**: `collection.seo` JSONB (migration `t3e4f5a6b7c8`), `EditCollectionSEO` with the same validation as the course tab, fourth editor tab gated to `standard`.
- **Offers row type**: collections appear in Payments → Offers with their own `Layers` icon, `Collection` type label, editable price and filter option; `savePrices` routes collection rows through `updateCollection`.
- **Podcasts as members**: `collectioncourse` gained `resource_type` + `resource_uuid` (migration `u4f5a6b7c8d9`); `POST/DELETE /collections/{uuid}/resources` add/remove courses or podcasts; the Content tab picker bundles both; the learner page renders podcast cards with an episode count.
- **Purchase fan-out**: `price_snapshot.resources` snapshots every member; webhooks grant per-resource entitlements and only course members get a `TrailRun`.
- **Payment Groups removed**: tab, page, service and locale keys deleted; offers use Collections instead.

---

## 14. Testing strategy

**Backend**
- CRUD + membership: add/remove, duplicate, cross-org, non-member.
- Validation: `users_only` rejection, paid requires price + members, publish requires published members.
- Partial update: `PUT` with only `price_amount` keeps membership (regression test).
- Checkout: draft, free, empty, already-owned, price snapshot.
- Webhook: fan-out count, idempotency, duplicate skip, snapshot authority.
- Entitlements: `_resolve_resource` handles `collection_`.
- RBAC: public/private/paid access decisions for `collection_`.

**Frontend**
- `tsc --noEmit` must stay at the 25-line baseline.
- Visual check of: listing, editor tabs, media upload, detail page, buy flow, `/trail` result.

---

## 15. Risks

1. **RBAC flag change** affects every `collection_` decision. Re-verify anonymous read and draft hiding after Phase 1.
2. **Draft collections currently leak** to logged-in users (`statement_all` in `get_collections`). Fix in Phase 2.
3. **`update_collection`** is the highest-risk regression. Write the partial-update test before changing it.
4. **Bundle economics** are undefined: no proration when the learner already owns a member course. The snapshot model charges full price; document this in the admin guide.

---

## 16. Open decisions

| Question | Recommendation |
|---|---|
| Cover **video** support in v1 | Include the column and upload path; render image-only until needed |
| Retire `/collections/new` | Done — the learner route was deleted; the dashboard is the only creation flow |
| Success-page activation | Flip when **all** snapshot runs exist (accurate) rather than the first one (faster) |
