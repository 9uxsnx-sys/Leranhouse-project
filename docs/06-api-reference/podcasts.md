# Podcasts

> Status: as-built · Last verified: 2026-11-15

Podcast series, episodes, media and content localization.

---

## Overview

Podcasts are org-scoped audio series. An episode stores its audio file on disk and streams through the media endpoints; the dashboard uploads it with `multipart/form-data`.

All routes are mounted under `/api/v1/podcasts` (episode routes share the same prefix). Read endpoints accept an authenticated session, an API token, or an anonymous visitor — the access rules below decide what each one may see. Write endpoints require an authenticated user or an API token with the matching RBAC permission.

| Model | Fields |
|---|---|
| `PodcastRead` | `id`, `org_id`, `podcast_uuid`, `name`, `description`, `about`, `tags`, `thumbnail_image`, `banner_image`, `public`, `published`, `access_type`, `price_amount`, `price_currency`, `extra_metadata`, `seo`, `authors[]`, `source_locale`, `content_locale`, `is_fallback`, `creation_date`, `update_date` |
| `PodcastReadWithEpisodeCount` | `PodcastRead` + `episode_count`, `total_duration_seconds` |
| `PodcastEpisodeRead` | `id`, `podcast_id`, `org_id`, `episode_uuid`, `title`, `description`, `audio_file`, `duration_seconds`, `episode_number`, `thumbnail_image`, `published`, `order`, `extra_metadata`, `creation_date`, `update_date` |

---

## Access rules

Every podcast has one access type, in sync with the legacy `public` flag (`public=true` ⇔ `access_type=public`). The table assumes `published=true`; drafts are covered by the bullet below.

| `access_type` | Who can read the metadata | Who can play the audio |
|---|---|---|
| `public` | Everyone (including anonymous visitors) | Everyone |
| `users_only` | Members of a linked UserGroup (and admins/maintainers/authors) | The same members |
| `paid` | Everyone (product page) | Buyers with an active entitlement, or linked UserGroup members |

- **Draft** (`published=false`): direct reads (`GET /podcasts/{uuid}`, `/meta`, `/episodes`) are limited to the podcast's resource authors and org admins/maintainers — every other viewer gets `403`. The list endpoint additionally surfaces drafts linked to a UserGroup the viewer belongs to.
- **Paid product page:** `GET /podcasts/{uuid}`, `GET /podcasts/{uuid}/meta` and `GET /podcasts/{uuid}/episodes` run the catalog read check. A published `paid` podcast therefore returns its metadata and episode titles/descriptions to non-buyers, but the episode list replaces every `audio_file` with `""`. Entitled buyers, linked UserGroup members, authors and admins receive the real `audio_file`.
- **Single episode read stays strict:** `GET /podcasts/episodes/{uuid}` uses the normal READ check, so a non-entitled viewer of a paid podcast gets `403` instead of a stripped episode.
- **List visibility:** anonymous visitors see only `published` podcasts with `access_type` in (`public`, `paid`). Signed-in users additionally see podcasts linked to one of their UserGroups and podcasts they author, including unpublished ones. Org admins/maintainers see every podcast when they pass `include_unpublished=true`.
- **Price snapshot:** a bundle/checkout records the price and membership at purchase time, so later price edits never change what a buyer already owns.

---

## Create Podcast

```
POST /api/v1/podcasts/?org_id={org_id}
Content-Type: multipart/form-data
```

Auth: authenticated user or API token with the podcast `create` permission.

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `description` | string | no |
| `about` | string | no |
| `tags` | string | no |
| `public` | boolean | no (default `false`) |
| `thumbnail` | file | no |

Returns `PodcastRead`. The new podcast is created unpublished with `source_locale = en`. Because the form does not expose `access_type`, it is derived from `public`: `true` → `public`, `false` → `users_only`.

---

## List Podcasts

```
GET /api/v1/podcasts/org_slug/{org_slug}/page/{page}/limit/{limit}
    ?include_unpublished={bool}&locale={locale}
```

Auth: any caller (anonymous allowed).

Returns a **bare JSON array** of `PodcastReadWithEpisodeCount` (not an envelope). `page` and `limit` are path parameters. Episode counts and total duration come from one grouped query; authors from one join.

`include_unpublished=true` only widens the result for org admins/maintainers (and superadmins). Authors and UserGroup members already see their own/unlocked pods, including drafts.

```json
[
  {
    "id": 3,
    "org_id": 1,
    "podcast_uuid": "podcast_8f3c1e2a-...",
    "name": "Design Notes",
    "description": "Weekly conversations about product design.",
    "about": "Long-form show notes.",
    "tags": "design, product",
    "thumbnail_image": "thumbnail_abc.png",
    "banner_image": "",
    "public": true,
    "published": true,
    "access_type": "public",
    "price_amount": null,
    "price_currency": "DZD",
    "extra_metadata": null,
    "seo": null,
    "authors": [
      {
        "user": {
          "id": 1,
          "user_uuid": "user_...",
          "username": "admin",
          "first_name": "Yacine",
          "last_name": "Benali",
          "email": "admin@school.dev",
          "avatar_image": ""
        },
        "authorship": "CREATOR",
        "authorship_status": "ACTIVE",
        "creation_date": "2026-09-01 10:00:00.000000",
        "update_date": "2026-09-01 10:00:00.000000"
      }
    ],
    "source_locale": "en",
    "content_locale": "en",
    "is_fallback": false,
    "episode_count": 4,
    "total_duration_seconds": 9360,
    "creation_date": "2026-09-01 10:00:00.000000",
    "update_date": "2026-10-02 09:12:00.000000"
  }
]
```

---

## Count Podcasts

```
GET /api/v1/podcasts/org_slug/{org_slug}/count
```

Auth: any caller. Applies the same public / UserGroup / author visibility as the list; superadmins count everything.

```json
{ "count": 12 }
```

---

## Get Podcast

```
GET /api/v1/podcasts/{podcast_uuid}?locale={locale}
```

Auth: any caller, subject to the access rules. Returns `PodcastRead` with `authors[]`.

```json
{
  "id": 3,
  "org_id": 1,
  "podcast_uuid": "podcast_8f3c1e2a-...",
  "name": "Design Notes",
  "description": "Weekly conversations about product design.",
  "about": "Long-form show notes.",
  "tags": "design, product",
  "thumbnail_image": "thumbnail_abc.png",
  "banner_image": "banner_abc.png",
  "public": true,
  "published": true,
  "access_type": "public",
  "price_amount": null,
  "price_currency": "DZD",
  "extra_metadata": {
    "hosts": [
      {
        "name": "Yacine Benali",
        "title": "Host & Founder",
        "avatar": "data:image/png;base64,..."
      }
    ]
  },
  "seo": { "title": "Design Notes" },
  "authors": [],
  "source_locale": "en",
  "content_locale": "en",
  "is_fallback": false,
  "creation_date": "2026-09-01 10:00:00.000000",
  "update_date": "2026-10-02 09:12:00.000000"
}
```

Errors: `404` podcast not found or the podcasts feature is disabled for the org; `403` when the access rules deny the caller (for example a draft or a `users_only` podcast).

---

## Get Podcast Meta

```
GET /api/v1/podcasts/{podcast_uuid}/meta?locale={locale}
```

Auth: any caller, subject to the access rules.

```json
{
  "podcast": { "...": "PodcastRead" },
  "episodes": [ { "...": "PodcastEpisodeRead" } ]
}
```

This is the single call used by both the dashboard editor and the learner podcast page. With `locale`, the podcast **and** every episode title/description/`extra_metadata` are overlaid. The episode list follows the same audio-stripping rule as **List episodes**: for a published `paid` podcast viewed without an entitlement, every episode's `audio_file` is `""`.

Errors: `404` podcast not found or the podcasts feature is disabled for the org; `403` when the access rules deny the caller.

---

## Update Podcast

```
PUT /api/v1/podcasts/{podcast_uuid}
```

Auth: RBAC UPDATE on the podcast (podcast author, org admin/maintainer, or a role granting update).

Accepts any subset of: `name`, `description`, `about`, `tags`, `thumbnail_image`, `banner_image`, `public`, `published`, `access_type`, `price_amount`, `price_currency`, `seo`, `extra_metadata`.

Changing `public`, `access_type` or `price_amount` additionally requires owner (CREATOR/MAINTAINER), admin or maintainer rights (`403` otherwise). A `paid` podcast without a positive `price_amount` is rejected with `422`. Returns `PodcastRead`.

---

## Media

| Method | Path | Body |
|---|---|---|
| `PUT` | `/podcasts/{uuid}/thumbnail` | multipart: `thumbnail` (image) |
| `DELETE` | `/podcasts/{uuid}/thumbnail` | — |
| `PUT` | `/podcasts/{uuid}/banner` | multipart: `banner` (image) |
| `DELETE` | `/podcasts/{uuid}/banner` | — |

Auth: RBAC UPDATE on the podcast. All four return the updated `PodcastRead`. Files are stored under `content/orgs/{org_uuid}/podcasts/{podcast_uuid}/thumbnails/` and `.../banners/`.

Errors: `404` podcast not found; `422` invalid file; `500` upload failed.

---

## Delete Podcast

```
DELETE /api/v1/podcasts/{podcast_uuid}
```

Auth: RBAC DELETE on the podcast. Deletes the row (episodes cascade) and the stored media directory.

```json
{ "detail": "Podcast deleted" }
```

---

## Rights

```
GET /api/v1/podcasts/{podcast_uuid}/rights
```

Auth: any caller. Returns the caller's permissions, ownership and role flags; used by the dashboard to hide tabs.

```json
{
  "podcast_uuid": "podcast_8f3c1e2a-...",
  "user_id": 1,
  "is_anonymous": false,
  "permissions": {
    "read": true,
    "create": true,
    "update": true,
    "delete": true,
    "create_episodes": true,
    "update_episodes": true,
    "delete_episodes": true,
    "manage_access": true
  },
  "ownership": {
    "is_owner": true,
    "is_creator": true,
    "is_maintainer": false,
    "is_contributor": false,
    "authorship_status": "ACTIVE"
  },
  "roles": {
    "is_admin": false,
    "is_maintainer_role": false,
    "is_instructor": true,
    "is_user": true
  }
}
```

Errors: `404` podcast not found.

---

## Episodes

### List episodes

```
GET /api/v1/podcasts/{podcast_uuid}/episodes?include_unpublished={bool}&locale={locale}
```

Auth: any caller, subject to the access rules. Returns a **bare JSON array** of `PodcastEpisodeRead` ordered by `order`.

For a published `paid` podcast viewed without an entitlement, every row is returned with `"audio_file": ""`. `include_unpublished=true` is honored for authors and org admins/maintainers.

```json
[
  {
    "id": 17,
    "podcast_id": 3,
    "org_id": 1,
    "episode_uuid": "episode_1a2b3c4d-...",
    "title": "Designing with constraints",
    "description": "How deadlines shape the work.",
    "audio_file": "",
    "duration_seconds": 2340,
    "episode_number": 1,
    "thumbnail_image": "thumbnail_ep1.png",
    "published": true,
    "order": 0,
    "extra_metadata": { "learning_objectives": ["..."] },
    "creation_date": "2026-09-02 08:00:00.000000",
    "update_date": "2026-09-02 08:00:00.000000"
  }
]
```

Errors: `404` podcast not found; `403` when the access rules deny the caller (draft or `users_only`).

### Create episode

```
POST /api/v1/podcasts/{podcast_uuid}/episodes
Content-Type: multipart/form-data
```

Auth: RBAC CREATE on the parent podcast. Fields: `title` (required), `description`, `duration_seconds`, `published`, `audio` (file), `thumbnail` (file). `episode_number` and `order` are assigned from the current maximum (+1 / next), so new episodes land at the end. Returns `PodcastEpisodeRead`.

Errors: `404` podcast not found; `403` lacking permission.

### Reorder episodes

```
PUT /api/v1/podcasts/{podcast_uuid}/episodes/reorder
```

Auth: RBAC UPDATE on the podcast.

```json
[
  { "episode_uuid": "episode_1a2b3c4d-...", "order": 0 },
  { "episode_uuid": "episode_5e6f7g8h-...", "order": 1 }
]
```

Returns the updated `PodcastEpisodeRead[]` (includes unpublished episodes).

### Get / update / delete one episode

| Method | Path |
|---|---|
| `GET` | `/podcasts/episodes/{episode_uuid}?locale={locale}` |
| `PUT` | `/podcasts/episodes/{episode_uuid}` |
| `DELETE` | `/podcasts/episodes/{episode_uuid}` |
| `PUT` | `/podcasts/episodes/{episode_uuid}/audio` (`audio` file) |
| `PUT` | `/podcasts/episodes/{episode_uuid}/thumbnail` (`thumbnail` file) |

Auth: RBAC on the parent podcast (READ for GET, UPDATE for PUT, DELETE for DELETE).

- `PUT` accepts `title`, `description`, `duration_seconds`, `episode_number`, `thumbnail_image`, `published`, `order`, `extra_metadata`. Audio is replaced through the upload endpoint, never by a JSON field (`audio_file: ""` is ignored).
- `GET` is strict: a non-entitled viewer of a paid podcast gets `403`.
- `DELETE` returns `{ "detail": "Episode deleted" }`.
- `PUT /audio` and `PUT /thumbnail` require a file and return `PodcastEpisodeRead`; `400` when no file is provided.

---

## Localization

Content locale is a query parameter on every read endpoint. Omitting it returns the source row.

| Endpoint | Localized fields |
|---|---|
| `GET /podcasts/{uuid}?locale=fr` | name, description, about, tags, seo, extra_metadata (`hosts`) |
| `GET /podcasts/{uuid}/meta?locale=fr` | podcast fields + every episode `title` / `description` / `extra_metadata` |
| `GET /podcasts/org_slug/{slug}/page/{p}/limit/{l}?locale=fr` | name, description, about, tags, seo, extra_metadata (`hosts`) |
| `GET /podcasts/{uuid}/episodes?locale=fr` | episode `title` / `description` / `extra_metadata` |
| `GET /podcasts/episodes/{uuid}?locale=fr` | episode `title` / `description` / `extra_metadata` |

`PodcastRead` always carries:

```json
{
  "source_locale": "en",
  "content_locale": "fr",
  "is_fallback": false
}
```

`is_fallback: true` means the locale was requested but no translation exists, so the source text is returned and `content_locale` equals `source_locale`. Episodes inherit the podcast's source locale and fall back silently (no `is_fallback` on the episode model). The overlay is applied after the access checks, so a translation can never reveal locked content.

### Podcast translations

```
GET    /api/v1/podcasts/{podcast_uuid}/translations
PUT    /api/v1/podcasts/{podcast_uuid}/translations/{locale}
DELETE /api/v1/podcasts/{podcast_uuid}/translations/{locale}
```

Auth: RBAC UPDATE on the podcast (dashboard context for the upsert).

```json
{
  "name": "Podcast FR",
  "description": "Description FR",
  "about": "…",
  "tags": "audio,fr",
  "seo": { "title": "SEO FR" },
  "extra_metadata": {
    "hosts": [
      { "name": "ياسين بن علي", "title": "المؤسس والمقدم" }
    ]
  },
  "state": "published"
}
```

- `name` is required.
- `extra_metadata.hosts` is **index-aligned** with the base row's `hosts` list: each entry only carries the translatable `name` / `title`. Avatars stay on the base podcast row and are merged by `apps/api/src/services/people_locale.py`; blank or missing values keep the source text.
- `state` is `draft` (default) / `machine` / `reviewed` / `published`; v1 serves every row regardless of state.
- Writing the podcast's source locale returns **422**. Accepting a translation returns the saved `PodcastTranslationRead`; deleting a missing row returns `404`.

### Episode translations

```
GET    /api/v1/podcasts/episodes/{episode_uuid}/translations
PUT    /api/v1/podcasts/episodes/{episode_uuid}/translations/{locale}
DELETE /api/v1/podcasts/episodes/{episode_uuid}/translations/{locale}
```

Auth: RBAC UPDATE on the parent podcast.

```json
{
  "title": "Titre FR",
  "description": "Description de l'épisode FR",
  "extra_metadata": { "learning_objectives": ["…"] },
  "state": "published"
}
```

- `title` is required.
- `extra_metadata` is merged over the episode's base metadata (shallow merge).
- `state` uses the same `draft` / `machine` / `reviewed` / `published` values.
- The same 422 rule applies for the podcast's source locale; deleting a missing row returns `404`.

---

## Related Resources

| Document | Description |
|---|---|
| [Collections](./collections.md) | Bundles that can include podcasts |
| [Payments](./payments.md) | Checkout, entitlements, price fields |
| [Podcasts localization](../08-features/i18n-rtl/podcasts-localization.md) | Storage, overlay resolution, dashboard and learner surfaces |
| [Podcasts user guide](../03-user-guide/podcasts.md) | Episode management from the dashboard |
