# Collections

> Collections are sellable bundles of courses and podcasts. They carry the same metadata and media as courses, expose three access modes, and fan a single purchase out to per-resource entitlements so the bundle appears in the learner's progress exactly like individually bought courses.

---

## Overview

A collection groups courses and podcasts from one organization into a bundle. It has its own cover, banner, description, learnings, tags and SEO metadata, plus the same access modes as a course:

| `access_type` | Who can browse the catalog | Who can reach the content |
|---|---|---|
| `public` | Everyone | Everyone (each course keeps its own rules) |
| `users_only` | Members of a linked UserGroup (and admins) | Members of the linked UserGroup |
| `paid` | Everyone, when `published=true` (product page) | Buyers (active entitlement) or linked UserGroup members |

A published paid collection is intentionally browsable by non-buyers so the **Get access** call to action is reachable. The lessons themselves remain protected by each member resource's own RBAC check.

Members are polymorphic: each `collectioncourse` row stores a `resource_type` (`course` or `podcast`) and a `resource_uuid` (`course_…` / `podcast_…`). The legacy nullable `course_id` is still populated for course members.

Learner inventory is tracked separately in `collectionuser` (one row per learner + bundle). A public bundle gains a row when the learner presses **Get access**, which is the collection equivalent of the `TrailRun` a public course creates when a learner starts it. Paid access keeps using payment entitlements and private access keeps using user groups.

All endpoints are under the Collections router at `/api/v1/collections`. The legacy `public` boolean is kept in sync with `access_type` (`public=true` ⇔ `access_type=public`).

`collection_uuid` values are prefixed (`collection_...`). Routes expect the full UUID.

---

## Access Rules

| Rule | Response |
|---|---|
| `users_only` or draft bundle, viewer is not a member/admin | `403` |
| Published `paid` bundle metadata and member list | `200` for any viewer |
| Write operations (`update`, `delete`, membership) | RBAC `collections` permission for the org |
| Member resource is `users_only` | `422` on add / create / replace |
| Member resource already in the bundle | `409` on add |
| Adding a draft resource to a published bundle | `422` with the offender list |
| Paid bundle with `price_amount <= 0` or no members | `422` on publish/update |
| Publishing a bundle with draft members | `422` with the offender list |
| Last member removed from a paid bundle | `422` |
| Member course switched to `users_only` | `409` (course update) with collection names |
| Member course unpublished while its bundle is published | `409` (course update) with collection names |
| Deleting a bundle | Uploaded media directory is removed; `collectioncourse` and `collectionuser` rows cascade |
| Claiming a public bundle | Requires org membership; idempotent |
| Access roster endpoints | RBAC `collections` update permission (admins/maintainers) |

---

## Create Collection

```
POST /api/v1/collections/?org_id={org_id}
```

The organization always comes from the query string, never from the body.

### Body

```json
{
  "name": "UI/UX Foundations",
  "description": "Everything you need to design production-ready interfaces.",
  "about": "Long-form page copy.",
  "learnings": "[{\"id\":\"1\",\"text\":\"Build an 8pt spacing system\",\"emoji\":\"📐\"}]",
  "tags": "design, figma, ux",
  "thumbnail_type": "image",
  "thumbnail_image": "",
  "thumbnail_video": "",
  "banner_image": "",
  "public": true,
  "published": false,
  "access_type": "public",
  "price_amount": null,
  "price_currency": "DZD",
  "extra_metadata": {
    "target_audience": {
      "for": ["Designers who want a structured path", "Career switchers"],
      "not_for": ["Complete beginners to design"]
    }
  },
  "seo": {
    "title": "UI/UX Foundations bundle",
    "description": "Learn UI/UX foundations in one bundle.",
    "keywords": "ui, ux, bundle"
  },
  "courses": [1, 2]
}
```

`courses` is optional and contains course **database ids**. Every course is validated (same org, not `users_only`) before anything is written. Online podcasts can only be attached after creation through the `resources` endpoints, because `courses` is course-id based. When `published` is omitted it defaults to `true` for backward compatibility with older clients.

### Response (200 OK)

`CollectionRead`: every `CollectionBase` field (including `seo`) plus `id`, `collection_uuid`, `creation_date`, `update_date`, `member_count` (courses + podcasts), and `courses` (member course objects).

---

## List Collections

```
GET /api/v1/collections/org/{org_id}/page/{page}/limit/{limit}
```

Returns a JSON array of `CollectionRead` (not a paginated envelope).

- Learners only see `published` collections with `access_type` in (`public`, `paid`), plus `users_only` bundles linked to one of their UserGroups.
- Admins and maintainers see drafts and every access type.

---

## Get Collection

```
GET /api/v1/collections/{collection_uuid}
```

Returns `CollectionRead`. Draft members are included for org admins; learners only receive published members with a `public`/`paid` access type.

---

## List Collection Members

```
GET /api/v1/collections/{collection_uuid}/courses?search={q}&page={page}&limit={limit}
```

The path keeps its historical name, but the endpoint returns every member (courses and podcasts) as lean rows used by the dashboard Content table and the learner "What is included" grid:

```json
[
  {
    "id": 4,
    "resource_type": "course",
    "resource_uuid": "course_5e6c9e17-...",
    "course_uuid": "course_5e6c9e17-...",
    "name": "UI/UX Design Masterclass",
    "description": "Learn modern interface design principles...",
    "thumbnail_image": "cover.png",
    "access_type": "public",
    "published": true,
    "price_amount": null,
    "price_currency": "DZD",
    "lessons": 12,
    "creation_date": "2026-10-19 12:00:00"
  },
  {
    "id": 5,
    "resource_type": "podcast",
    "resource_uuid": "podcast_fa21aa1b-...",
    "course_uuid": null,
    "name": "Design Notes",
    "description": "Weekly conversations about product design.",
    "thumbnail_image": "cover.png",
    "access_type": "public",
    "published": true,
    "price_amount": null,
    "price_currency": "DZD",
    "lessons": 4,
    "creation_date": "2026-08-31 09:30:00"
  }
]
```

`limit` is capped at 100. `lessons` is the number of activities across all chapters for a course, or the number of episodes for a podcast. Rows are sorted by `creation_date` descending.

---

## Paginated Collection Members (dashboard)

```
GET /api/v1/collections/{collection_uuid}/members
    ?filter=linked|available
    &search={q}
    &kind=course|podcast
    &status=published|draft
    &page={page}&limit={limit}
```

Powers the dashboard **Content** tab. Returns a paginated envelope instead of a bare array:

```json
{
  "items": [ /* CollectionCourseRead rows, same shape as above */ ],
  "total": 12
}
```

| Parameter | Behaviour |
|---|---|
| `filter=linked` (default) | Members already in the bundle |
| `filter=available` | Org courses and podcasts that can still be added (skips members, `users_only` items, and drafts when the bundle is published) |
| `search` | Case-insensitive match on name/description |
| `kind` | `course` or `podcast`; omitted = both |
| `status` | `published` or `draft`; omitted = both |
| `page` / `limit` | Server-side pagination, `limit` capped at 100 |

---

## Access Roster

Learner-inventory endpoints behind the dashboard **Access → Public** table. They mirror `/courses/{uuid}/access/users`.

```
GET /api/v1/collections/{collection_uuid}/access/users
    ?filter=enrolled|available&search={q}&page={page}&limit={limit}
```

- `filter=enrolled` (default) → learners with a `collectionuser` row, newest first.
- `filter=available` → org members without a row (the search picker).

```json
{
  "items": [
    {
      "user": { "id": 2, "username": "learner", "...": "UserRead" },
      "role": { "id": 4, "name": "User" },
      "joined_at": "2026-09-01 10:00:00",
      "enrolled_at": "2026-10-20 09:12:00",
      "status": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

```
POST   /api/v1/collections/{collection_uuid}/access/users?user_ids=1,2
DELETE /api/v1/collections/{collection_uuid}/access/users?user_ids=1,2
```

- `POST` adds org members to the inventory; non-members are returned in `skipped`.
- `DELETE` removes the inventory rows. It does not touch paid entitlements or UserGroups.
- Both return `{ "enrolled": [...], "already_enrolled": [...], "skipped": [...] }` / `{ "removed": [...], "not_enrolled": [...] }`.

---

## Claim Collection

```
POST /api/v1/collections/{collection_uuid}/claim
```

Called by the learner's **Get access** button on a public bundle. Adds a `collectionuser` row so the bundle enters the learner's inventory and appears in the Public roster. Idempotent:

```json
{ "claimed": true, "already_claimed": false }
```

Repeat calls return `{ "claimed": false, "already_claimed": true }`. Requires org membership (`403` otherwise) and read access to the bundle.

---

## My Library & Access State

Two learner-facing endpoints power the catalog **Owned** badge, the **My bundles** filter, and the collection page sidebar.

```
GET /api/v1/collections/org/{org_id}/mine
```

Returns the published collections in the learner's library — claimed public bundles plus bundles with an active paid entitlement. Anonymous callers receive an empty list.

```json
[
  { "collection_uuid": "collection_abc", "name": "Web Fundamentals", "...": "CollectionRead" }
]
```

```
GET /api/v1/collections/{collection_uuid}/access/state
```

Returns the acting learner's relationship to one bundle:

```json
{
  "claimed": true,
  "has_paid_access": false,
  "has_group_access": false,
  "owned": true
}
```

- `owned` = `claimed or has_paid_access`; it drives the "Your bundle" sidebar and the catalog badge.
- `has_group_access` is reported separately because a private bundle lent through a UserGroup is borrowed access, not ownership.

---

## Add Resource

```
POST /api/v1/collections/{collection_uuid}/resources?resource_uuid={resource_uuid}
```

Accepts a `course_…` or `podcast_…` UUID. The resource type is inferred from the prefix. Returns the updated `CollectionRead`.

| Status | Meaning |
|---|---|
| `404` | Collection or resource not found, or resource belongs to another org |
| `409` | Resource is already a member |
| `422` | Resource is `users_only`, or the bundle is published and the resource is a draft |

## Remove Resource

```
DELETE /api/v1/collections/{collection_uuid}/resources?resource_uuid={resource_uuid}
```

Accepts a `course_…` or `podcast_…` UUID. Returns the updated `CollectionRead`. A `paid` bundle must keep at least one member (`422`).

---

## Add Course (legacy)

```
POST /api/v1/collections/{collection_uuid}/courses?course_uuid={course_uuid}
```

Thin wrapper around `POST /resources` for existing clients. Returns the updated `CollectionRead`. Same status codes as **Add Resource**.

| Status | Meaning |
|---|---|
| `404` | Collection or course not found, or course belongs to another org |
| `409` | Course is already a member |
| `422` | Course is `users_only`, or the bundle is published and the course is a draft |

---

## Remove Course (legacy)

```
DELETE /api/v1/collections/{collection_uuid}/courses?course_uuid={course_uuid}
```

Thin wrapper around `DELETE /resources`. Returns the updated `CollectionRead`. A `paid` bundle must keep at least one member (`422`).

---

## Update Collection

```
PUT /api/v1/collections/{collection_uuid}
```

Partial update: only fields present in the JSON body are applied (used for name, description, about, learnings, tags, `seo`, `extra_metadata`, `access_type`, `price_amount`, `published`, and full membership replacement via `courses`).

- Omitting `courses` keeps the current membership untouched.
- Sending `courses` replaces the whole membership and re-validates every course. Podcast members are not affected unless they are re-added through the `resources` endpoints.
- `seo` replaces the whole JSON object; send `{}` to clear it.
- `price_amount: null` clears the price. Switching to `paid` without a positive price is rejected (`422`).
- Publish/access-type changes re-run validation: paid requires a positive price and at least one member; publishing requires every member to be published.
- Switching `access_type` also updates the legacy `public` flag.

---

## Delete Collection

```
DELETE /api/v1/collections/{collection_uuid}
```

Deletes the collection, cascades its membership (`collectioncourse`) and inventory (`collectionuser`) rows, and removes its uploaded media directory (`content/orgs/{org_uuid}/collections/{collection_uuid}`). Existing entitlements and `TrailRun` rows are intentionally left untouched, so learners who already bought the bundle keep access.

---

## Media

| Method | Endpoint | Body |
|---|---|---|
| `PUT` | `/api/v1/collections/{collection_uuid}/thumbnail` | multipart: `thumbnail` (file), `thumbnail_type` (`image` / `video` / `both`) |
| `DELETE` | `/api/v1/collections/{collection_uuid}/thumbnail` | — clears image and video, resets type to `image` |
| `PUT` | `/api/v1/collections/{collection_uuid}/banner` | multipart: `banner` (file) |
| `DELETE` | `/api/v1/collections/{collection_uuid}/banner` | — |

Files are stored under:

```
content/orgs/{org_uuid}/collections/{collection_uuid}/thumbnails/{file}
content/orgs/{org_uuid}/collections/{collection_uuid}/banners/{file}
```

All four endpoints return the updated `CollectionRead`.

---

## Purchase Flow

```json
POST /api/v1/payments/{org_id}/checkout
{
  "resource_uuid": "collection_a8c9dba8-...",
  "resource_type": "collection"
}
```

Checkout requirements:

1. The collection is published and `access_type=paid`.
2. `price_amount > 0` and the bundle has at least one member.
3. The buyer has no active entitlement for the bundle.

At order creation every member UUID is snapshotted into `price_snapshot.resources`; course-only members are also mirrored into `price_snapshot.courses` for backward compatibility. Later bundle edits never retroactively grant or revoke content.

On `checkout.paid`, the webhook:

- grants one active entitlement for the bundle (`resource_type=collection`),
- grants one active entitlement per member resource (`course_…` or `podcast_…`), skipping resources the learner already owns,
- creates one `TrailRun` per member **course** so the Progress page lists them like individually bought courses. Podcasts are entitlement-only and do not create a `TrailRun`.

Members added after the purchase are **not** included; members removed after the purchase remain owned.

The price itself is edited in **Payments → Offers**, not in the collection Access tab. `POST /collections/{uuid}` with `price_amount` remains available for the Offers editor.

For a **public** bundle there is no checkout: `POST /collections/{uuid}/claim` records the learner in `collectionuser` (inventory). Removing that row through the Access roster removes the bundle from their inventory.

Revoking a buyer's bundle entitlement (`DELETE /payments/{org_id}/entitlements?resource_uuid=collection_…`) also revokes the member entitlements created by the same order (`order_id`). Separately purchased items and manual grants are untouched. No refund is issued.

---

## Localization

Content locale is a query parameter on every read endpoint. Omitting it returns the source row.

| Endpoint | Localized fields |
|---|---|
| `GET /collections/{uuid}?locale=fr` | name, description, about, learnings, tags, seo |
| `GET /collections/org/{org_id}/page/{page}/limit/{limit}?locale=fr` | same, one translation query per page |
| `GET /collections/{uuid}/courses?locale=fr` | member course names/descriptions |
| `GET /collections/{uuid}/members?locale=fr` | dashboard Content table (linked + available) |
| `GET /collections/org/{org_id}/mine?locale=fr` | "My bundles" |

`CollectionRead` always carries:

```json
{
  "source_locale": "en",
  "content_locale": "fr",
  "is_fallback": false
}
```

`is_fallback: true` means a locale was requested but no translation row exists, so the source text is returned. `content_locale` then equals `source_locale`.

### List translations

```
GET /api/v1/collections/{collection_uuid}/translations
```

Returns every `CollectionTranslationRead` row (`locale`, `name`, `description`, `about`, `learnings`, `tags`, `seo`, `state`, `source_updated_at`, `translated_by`, dates). Requires update permission on the collection.

### Upsert a translation

```
PUT /api/v1/collections/{collection_uuid}/translations/{locale}
```

```json
{
  "name": "Paquet de test FR",
  "description": "Description FR",
  "about": "…",
  "learnings": "[{\"id\":\"1\",\"text\":\"…\",\"emoji\":\"✅\"}]",
  "tags": "design,ux",
  "seo": { "title": "SEO FR" }
}
```

`name` is required. Writing the collection's source locale returns **422** — update the collection itself instead. Supports the same RBAC as the dashboard General tab.

### Delete a translation

```
DELETE /api/v1/collections/{collection_uuid}/translations/{locale}
```

Removes the row; subsequent reads fall back to the source locale.

---

## Related Resources

| Document | Description |
|---|---|
| [Courses](./courses.md) | Course CRUD and access modes |
| [Podcasts](./podcasts.md) | Podcast and episode CRUD, localization |
| [Payments](./payments.md) | Checkout, orders, entitlements, webhooks |
| [Collections Implementation Plan](../08-features/collections/implementation-plan.md) | Design decisions, schema, access model, phased delivery |
| [Collections localization](../08-features/i18n-rtl/collections-localization.md) | Storage, overlay resolution and dashboard/learner surfaces |
