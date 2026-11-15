# Search API

> Status: as-built · Last verified: 2026-11-15

This router owns the cross-resource search used on organization pages. It is mounted at `/api/v1/search` and contains a single endpoint.

---

## Search an organization

```
GET /api/v1/search/org_slug/{org_slug}
```

Auth: `get_current_user` — anonymous visitors are admitted but only see public content. API tokens must belong to the target organization and, when the token has configured rights, need `search.action_read`.

| Param | In | Type | Required | Notes |
|---|---|---|---|---|
| `org_slug` | path | string | Yes | Organization slug |
| `query` | query | string | Yes | 1–200 characters |
| `page` | query | integer | No | Default `1`, minimum `1` |
| `limit` | query | integer | No | Default `10`, min `1`, max `50` |
| `locale` | query | string | No | Overlays translated content; falls back to the source locale |

Query matching is case-insensitive (`ilike` with escaped wildcards). Translation tables are searched across **all** locales, so a translated course/show is found regardless of the UI locale; `locale` only controls which translation is returned.

### What it searches

| Resource | Match fields | Visibility |
|---|---|---|
| Courses | `name`, `description`, `about`, `learnings`, `tags`, translated equivalents | Per-user access filter applied by the courses search service |
| Collections | `name`, `description`, translated `name`/`description`/`about`/`tags` | Anonymous: `public` only; signed-in users are not filtered by `public` |
| Users | `username`, `first_name`, `last_name`, `bio` | Org members only; anonymous and non-members get `[]` |
| Communities | `name`, `description`, translated `name`/`description` | Anonymous and non-members: `public` only |
| Discussions | `title`, `content` | Anonymous and non-members: discussions in public parent communities only |
| Playgrounds | `name`, `description` | Published only; anonymous and non-members: `public`; org members: `public` + `authenticated` (`restricted` excluded) |
| Podcasts | `name`, `description`, `tags`, translated `name`/`description`/`about`/`tags` | Published only; anonymous and non-members: `public` only |

Every list is capped at `limit` per page. `total_*` fields hold the full count for that resource, except `total_courses`, which is the number of courses returned by the course search page.

### Response `200` (`SearchResult`)

```json
{
  "courses": [
    {
      "id": 12,
      "org_id": 1,
      "course_uuid": "course_4a7e...",
      "name": "Introduction to Algebra",
      "description": "A beginner-friendly course.",
      "public": true,
      "published": true,
      "access_type": "public",
      "content_locale": "en",
      "is_fallback": false,
      "authors": []
    }
  ],
  "collections": [],
  "users": [],
  "communities": [],
  "discussions": [],
  "playgrounds": [],
  "podcasts": [],
  "total_courses": 1,
  "total_collections": 0,
  "total_users": 0,
  "total_communities": 0,
  "total_discussions": 0,
  "total_playgrounds": 0,
  "total_podcasts": 0
}
```

Each item uses the standard read model for its type (`CourseRead`, `CollectionRead`, `UserRead`, `CommunityRead`, `SearchDiscussionRead`, `PlaygroundRead`, `PodcastRead`). `SearchDiscussionRead` adds `community_uuid` so the client can deep-link to the discussion. Playground results additionally carry `org_uuid` and `org_slug`.

### Errors

| Status | When |
|---|---|
| `403` | API token belongs to another org, or lacks `search.action_read` |
| `429` | Per-user search throttle exceeded; response carries `Retry-After` |

Anonymous callers are not rejected; they receive public results only (and no user results).

An unknown `org_slug` does **not** return `404`: it returns `200` with empty lists and zero totals.
