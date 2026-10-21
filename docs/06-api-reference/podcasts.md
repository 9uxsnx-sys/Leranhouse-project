# Podcasts

> Podcast series, episodes, media and content localization.

---

## Overview

Podcasts are org-scoped audio series. An episode stores its audio file on disk and streams through the media endpoints; the dashboard uploads it with `multipart/form-data`.

| Model | Fields |
|---|---|
| `PodcastRead` | `id`, `org_id`, `podcast_uuid`, `name`, `description`, `about`, `tags`, `thumbnail_image`, `banner_image`, `public`, `published`, `access_type`, `price_amount`, `price_currency`, `extra_metadata` (hosts, total duration), `seo`, `authors[]`, `source_locale`, `content_locale`, `is_fallback`, dates |
| `PodcastReadWithEpisodeCount` | `PodcastRead` + `episode_count`, `total_duration_seconds` |
| `PodcastEpisodeRead` | `id`, `podcast_id`, `org_id`, `episode_uuid`, `title`, `description`, `audio_file`, `duration_seconds`, `episode_number`, `thumbnail_image`, `published`, `order`, dates |

Access rules:

- Anonymous visitors only see `published` podcasts with `access_type` in (`public`, `paid`).
- Signed-in learners also see `users_only` podcasts linked to one of their UserGroups.
- Authors, admins and maintainers can request unpublished content with `include_unpublished=true`.

---

## Create Podcast

```
POST /api/v1/podcasts/?org_id={org_id}
Content-Type: multipart/form-data
```

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `description` | string | no |
| `about` | string | no |
| `tags` | string | no |
| `public` | boolean | no (default `false`) |
| `thumbnail` | file | no |

Returns `PodcastRead`. The new podcast is created unpublished with `source_locale = en` (there is no per-org content locale yet).

---

## List Podcasts

```
GET /api/v1/podcasts/org_slug/{org_slug}/page/{page}/limit/{limit}?include_unpublished={bool}&locale={locale}
```

Returns a JSON array of `PodcastReadWithEpisodeCount`. Episode counts and total duration come from one grouped query; authors from one join.

Dashboard listings pass `include_unpublished=true`; the learner catalog does not.

---

## Count Podcasts

```
GET /api/v1/podcasts/org_slug/{org_slug}/count
```

```json
{ "count": 12 }
```

---

## Get Podcast

```
GET /api/v1/podcasts/{podcast_uuid}?locale={locale}
```

Returns `PodcastRead` with `authors[]`.

---

## Get Podcast Meta

```
GET /api/v1/podcasts/{podcast_uuid}/meta?locale={locale}
```

```json
{
  "podcast": { "...": "PodcastRead" },
  "episodes": [ { "...": "PodcastEpisodeRead" } ]
}
```

This is the single call used by both the dashboard editor and the learner podcast page. With `locale`, the podcast **and** every episode title/description are overlaid.

---

## Update Podcast

```
PUT /api/v1/podcasts/{podcast_uuid}
```

Accepts any subset of: `name`, `description`, `about`, `tags`, `thumbnail_image`, `banner_image`, `public`, `published`, `access_type`, `price_amount`, `price_currency`, `seo`, `extra_metadata`.

Changing `public`, `access_type` or `price_amount` additionally requires owner, admin or maintainer rights (403 otherwise). Returns `PodcastRead`.

---

## Media

| Method | Path | Body |
|---|---|---|
| `PUT` | `/podcasts/{uuid}/thumbnail` | `thumbnail` file |
| `DELETE` | `/podcasts/{uuid}/thumbnail` | — |
| `PUT` | `/podcasts/{uuid}/banner` | `banner` file |
| `DELETE` | `/podcasts/{uuid}/banner` | — |

All four return the updated `PodcastRead`.

---

## Delete Podcast

```
DELETE /api/v1/podcasts/{podcast_uuid}
```

Deletes the row (episodes cascade) and the stored media directory.

---

## Rights

```
GET /api/v1/podcasts/{podcast_uuid}/rights
```

Returns the caller's permissions (`read`, `create`, `update`, `delete`, episode-level flags) plus ownership and role flags. Used by the dashboard to hide tabs.

---

## Episodes

### List episodes

```
GET /api/v1/podcasts/{podcast_uuid}/episodes?include_unpublished={bool}&locale={locale}
```

Returns `PodcastEpisodeRead[]` ordered by `order`.

### Create episode

```
POST /api/v1/podcasts/{podcast_uuid}/episodes
Content-Type: multipart/form-data
```

`title` (required), `description`, `duration_seconds`, `published`, `audio`, `thumbnail`. `episode_number` and `order` are assigned from the current maximum (+1), so new episodes land at the end.

### Reorder episodes

```
PUT /api/v1/podcasts/{podcast_uuid}/episodes/reorder
```

```json
[
  { "episode_uuid": "episode_…", "order": 0 },
  { "episode_uuid": "episode_…", "order": 1 }
]
```

### Get / update / delete one episode

| Method | Path |
|---|---|
| `GET` | `/podcasts/episodes/{episode_uuid}?locale={locale}` |
| `PUT` | `/podcasts/episodes/{episode_uuid}` |
| `DELETE` | `/podcasts/episodes/{episode_uuid}` |
| `PUT` | `/podcasts/episodes/{episode_uuid}/audio` (`audio` file) |
| `PUT` | `/podcasts/episodes/{episode_uuid}/thumbnail` (`thumbnail` file) |

`PUT` accepts `title`, `description`, `duration_seconds`, `episode_number`, `thumbnail_image`, `published`, `order`. Audio is replaced through the upload endpoint, never by a JSON field.

---

## Localization

Content locale is a query parameter on every read endpoint. Omitting it returns the source row.

| Endpoint | Localized fields |
|---|---|
| `GET /podcasts/{uuid}?locale=fr` | name, description, about, tags, seo |
| `GET /podcasts/{uuid}/meta?locale=fr` | podcast fields + every episode `title` / `description` |
| `GET /podcasts/org_slug/{slug}/page/{p}/limit/{l}?locale=fr` | name, description, about, tags, seo (one query per page) |
| `GET /podcasts/{uuid}/episodes?locale=fr` | episode `title` / `description` |
| `GET /podcasts/episodes/{uuid}?locale=fr` | episode `title` / `description` |

`PodcastRead` always carries:

```json
{
  "source_locale": "en",
  "content_locale": "fr",
  "is_fallback": false
}
```

`is_fallback: true` means the locale was requested but no translation exists, so the source text is returned. Episodes inherit the podcast's source locale and fall back silently (no `is_fallback` on the episode model).

### Podcast translations

```
GET    /api/v1/podcasts/{podcast_uuid}/translations
PUT    /api/v1/podcasts/{podcast_uuid}/translations/{locale}
DELETE /api/v1/podcasts/{podcast_uuid}/translations/{locale}
```

```json
{
  "name": "Podcast FR",
  "description": "Description FR",
  "about": "…",
  "tags": "audio,fr",
  "seo": { "title": "SEO FR" }
}
```

`name` is required. Writing the podcast's source locale returns **422**. Requires update permission on the podcast.

### Episode translations

```
GET    /api/v1/podcasts/episodes/{episode_uuid}/translations
PUT    /api/v1/podcasts/episodes/{episode_uuid}/translations/{locale}
DELETE /api/v1/podcasts/episodes/{episode_uuid}/translations/{locale}
```

```json
{
  "title": "Titre FR",
  "description": "Description de l'épisode FR"
}
```

`title` is required; the same 422 rule applies for the podcast's source locale. Permissions are checked against the parent podcast.

---

## Related Resources

| Document | Description |
|---|---|
| [Collections](./collections.md) | Bundles that can include podcasts |
| [Courses](./courses.md) | Course CRUD and access modes |
| [Podcasts localization](../08-features/i18n-rtl/podcasts-localization.md) | Storage, overlay resolution, dashboard and learner surfaces |
| [Podcasts user guide](../03-user-guide/podcasts.md) | Episode management from the dashboard |
