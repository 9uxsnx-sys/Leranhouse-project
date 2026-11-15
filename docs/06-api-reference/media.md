# Media API

> Status: as-built · Last verified: 2026-11-15

This area covers media in three distinct surfaces: block upload/read (`/api/v1/blocks`), byte-range playback (`/api/v1/stream`), and raw content delivery (`/content`, mounted at the application root). The code under `apps/api/src/routers` is the source of truth for every path below.

---

## Access enforcement

All three surfaces resolve access through the same unified RBAC read model, but through different entry points:

| Surface | Guard | Denial response |
|---|---|---|
| `/content/{file_path:path}` | `require_resource_read` | `401` for an anonymous caller, `403` for an authenticated caller without access |
| `/api/v1/blocks/...` (GET) | `check_resource_access(..., AccessAction.READ)` | `403` |
| `/api/v1/stream/...` | `ResourceAccessChecker.check_access(..., READ, PUBLIC_VIEW)` | `403` |

- Course activity media and podcast episode media are both checked against their parent resource; public + published (and free) resources remain readable anonymously.
- `/api/v1/blocks` and `/api/v1/stream` are mounted with `get_non_api_token_user`: API tokens get `403`.
- For guarded course/podcast content, `/content` accepts an API token only when the token's `org_id` matches the owning organization; otherwise `403`.
- `HEAD` is supported on `/api/v1/stream/...` and on `/content/...` (both storage backends). The `/api/v1/blocks/...` routes are `GET` only.
- The `401` / `403` split applies to the `/content` surface. Block media and streaming return `403` for any denied caller (anonymous or authenticated), because `check_resource_access` and `ResourceAccessChecker` raise a single `403`.

---

## Surface 1 — Block media (`/api/v1/blocks`)

Mounted at `/api/v1/blocks`. Creation uses the authenticated user's `update` permission on the parent course; reads require `read` on that course. For non-public courses, authenticated non-members are rejected with an extra org-membership check.

### Routes

| Method | Path | Accepted formats (upload) |
|---|---|---|
| `POST` | `/api/v1/blocks/image` | `jpg`, `jpeg`, `png`, `gif`, `webp` |
| `POST` | `/api/v1/blocks/video` | `mp4`, `webm`, `ogg` |
| `POST` | `/api/v1/blocks/pdf` | `pdf` |
| `POST` | `/api/v1/blocks/audio` | `mp3`, `wav`, `ogg`, `m4a` |
| `GET` | `/api/v1/blocks/image` | — |
| `GET` | `/api/v1/blocks/video` | — |
| `GET` | `/api/v1/blocks/pdf` | — |
| `GET` | `/api/v1/blocks/audio` | — |

Upload request: `multipart/form-data` with `file_object` (file, required) and `activity_uuid` (form string, required).

Read request: query parameter `block_uuid` (string, required).

```text
GET /api/v1/blocks/image?block_uuid=block_9a2f...
```

Response `200` (`BlockRead`):

```json
{
  "id": 88,
  "block_type": "BLOCK_IMAGE",
  "content": {
    "file_id": "5e1c-...",
    "file_format": "png",
    "file_name": "diagram.png",
    "file_size": 48213,
    "file_type": "image/png",
    "activity_uuid": "activity_31de..."
  },
  "org_id": 1,
  "course_id": 12,
  "chapter_id": null,
  "activity_id": 904,
  "block_uuid": "block_9a2f...",
  "creation_date": "2026-11-15 10:00:00",
  "update_date": "2026-11-15 10:00:00"
}
```

`block_type` is one of `BLOCK_IMAGE`, `BLOCK_VIDEO`, `BLOCK_DOCUMENT_PDF`, `BLOCK_AUDIO`, `BLOCK_QUIZ`, `BLOCK_CUSTOM`. `content` is the uploaded `BlockFile` metadata (`file_id`, `file_format`, `file_name`, `file_size`, `file_type`, `activity_uuid`).

Errors: `400` (no file), `403` (API token or no RBAC permission), `404` (activity/course/block not found), `415` (file type or content rejected by the upload validator).

---

## Surface 2 — Streaming (`/api/v1/stream`)

Mounted at `/api/v1/stream`. These routes stream the file bytes and support HTTP Range requests:

- `GET` with no `Range` → `200` with the full file body.
- `GET` with `Range` → `206` plus `Content-Range: bytes {start}-{end}/{size}`.
- `HEAD` → `200` with metadata headers only (`Accept-Ranges`, `Content-Length`, `Content-Type`, `Cache-Control`).

Common response headers: `Accept-Ranges: bytes`, `Content-Type` (detected MIME), `Cache-Control: public, max-age=86400`, `X-Content-Type-Options: nosniff`.

### Routes

| Method | Path | Serves |
|---|---|---|
| `GET` / `HEAD` | `/api/v1/stream/video/{org_uuid}/{course_uuid}/{activity_uuid}/{filename}` | Activity video (`orgs/{org}/courses/{course}/activities/{activity}/video/...`) |
| `GET` / `HEAD` | `/api/v1/stream/block/{org_uuid}/{course_uuid}/{activity_uuid}/{block_uuid}/{filename}` | Video block (`.../dynamic/blocks/videoBlock/{block_uuid}/...`) |
| `GET` / `HEAD` | `/api/v1/stream/block/audio/{org_uuid}/{course_uuid}/{activity_uuid}/{block_uuid}/{filename}` | Audio block (`.../dynamic/blocks/audioBlock/{block_uuid}/...`) |
| `GET` / `HEAD` | `/api/v1/stream/audio/{org_uuid}/{podcast_uuid}/{episode_uuid}/{filename}` | Podcast episode audio (`orgs/{org}/podcasts/{podcast}/episodes/{episode}/audio/...`) |

All path segments are required. `{filename}` accepts sub-paths.

Course routes verify that the activity belongs to the supplied course and then run the course read check; the podcast route verifies the episode belongs to the supplied podcast and runs the podcast read check.

```http
GET /api/v1/stream/block/audio/org_4c1e.../course_4a7e.../activity_31de.../block_9a2f.../lesson.mp3
Range: bytes=0-1048575
```

```http
HTTP/1.1 206 Partial Content
Accept-Ranges: bytes
Content-Range: bytes 0-1048575/4823104
Content-Type: audio/mpeg
```

Errors: `403` (RBAC denial; the router rejects API tokens too), `404` (activity/course or podcast/episode mismatch, or the file is missing).

---

## Surface 3 — Raw content delivery (`/content`)

Mounted at the application root, **not** under `/api/v1`. `apps/api/app.py` includes exactly one implementation based on the content delivery backend:

| `LEARNHOUSE_CONTENT_DELIVERY_TYPE` | Router included | Backend |
|---|---|---|
| `filesystem` (default) | `local_content_router` | Local `content/` directory, served with `FileResponse` |
| `s3api` | `content_files_router` | S3-compatible object storage, streamed in 1 MB chunks |

The env var overrides `hosting_config.content_delivery.type` in `config.yaml`; the default is `filesystem`.

### Routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/content/{file_path:path}` | Full file; `Range` is honored (S3 backend implements `206` explicitly, local uses `FileResponse`) |
| `HEAD` | `/content/{file_path:path}` | Metadata only |

```text
GET /content/orgs/org_4c1e.../courses/course_4a7e.../activities/activity_31de.../video/lesson1.mp4
```

### Path-based access rules

The path prefix decides what is checked:

| Path pattern | Access |
|---|---|
| `orgs/{org}/courses/{course}/activities/...` | Course read via `require_resource_read` |
| `orgs/{org}/podcasts/{podcast}/episodes/...` | Podcast read via `require_resource_read` |
| `orgs/{org}/...` (other) | Public (course thumbnails, org branding) |
| `users/{user}/...` | Public (avatars, profile images) |
| Unknown pattern | Authentication required; anonymous → `401` |

For the two guarded patterns, an anonymous caller that cannot read the resource gets `401`; an authenticated caller without access gets `403`. Paths are double-URL-decoded and canonicalized; traversal attempts return `400`.

Errors: `400` (invalid/unsafe path), `401` (anonymous, guarded content), `403` (no access), `404` (file missing), `500` (S3 client not configured, S3 backend only), `502` (S3 storage service error, S3 backend only).

---

## Notes

- Uploaded block files are stored under the organization prefix: `orgs/{org_uuid}/courses/{course_uuid}/activities/{activity_uuid}/dynamic/blocks/{blockType}/{block_uuid}/`, where `{blockType}` is `imageBlock`, `videoBlock`, `pdfBlock` or `audioBlock`.
- Activity videos and podcast audio use their own directory segments (`video/` and `audio/`), which is why they have dedicated stream routes rather than the generic block route.
- `/api/v1/blocks` returns block metadata, not raw bytes; playback goes through `/api/v1/stream` or `/content`.
