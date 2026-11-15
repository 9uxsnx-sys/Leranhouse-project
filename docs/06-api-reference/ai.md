# AI API

> Status: as-built · Last verified: 2026-11-15

This area owns the AI copilot surfaces: activity chat, editor chat, MagicBlock HTML generation, course planning/activity content generation, and RAG chat over indexed course content. Everything is mounted under `/api/v1/ai` (`ai`, `magicblocks`, `courseplanning` and `rag` routers share the prefix).

All four routers are mounted with `require_authenticated_user`: anonymous callers get `401`, API tokens get `403`. AI usage is also gated per organization by the `ai` feature and the org's credit balance; credit reservations raise `403` when AI is disabled or the quota is exhausted, `404` when the organization has no config, and `503` when the credit store is unavailable. `POST /ai/rag/index` additionally requires an org admin/maintainer.

---

## Streaming session pattern

All streaming generation routes use Server-Sent Events (`text/event-stream`), not a JSON request/response. The lifecycle is:

1. **Start** — call a `.../start` route with no session id. The server creates a Redis-backed session and issues the id.
2. **Continue** — call the matching `.../send`, `.../iterate` or `.../message` route with that id.

Paths below are relative to `/api/v1`.

| Surface | Start route | Session id field | Continue route |
|---|---|---|---|
| Activity chat | `POST /ai/stream/start/activity_chat_session` | `aichat_uuid` | `POST /ai/stream/send/activity_chat_message` |
| Editor chat | `POST /ai/stream/editor/start` | `aichat_uuid` | `POST /ai/stream/editor/message` |
| MagicBlocks | `POST /ai/magicblocks/start` | `session_uuid` | `POST /ai/magicblocks/iterate` |
| Course planning | `POST /ai/courseplanning/start` | `session_uuid` | `POST /ai/courseplanning/iterate` |
| RAG chat | `POST /ai/rag/chat` without `aichat_uuid` | `aichat_uuid` | `POST /ai/rag/chat` with `aichat_uuid` |

Activity chat is the only surface that also has non-streaming `start`/`send` routes. There is **no** non-streaming `/generate` endpoint.

SSE frames are `data: <json>\n\n`. Every stream has `done`; error frames use `{"type": "error", "message": "..."}`. Activity/editor streams refund one credit if the model produced no output; course-planning/RAG/MagicBlocks reserves happen before the stream starts.

---

## Activity chat (non-streaming)

Auth: authenticated non-API-token user. The handler resolves the activity, course and organization by UUID; it does not run a separate course read check. Request body `StartActivityAIChatSession` / `SendActivityAIChatMessage`.

### Start session

```
POST /api/v1/ai/start/activity_chat_session
```

| Field | Type | Required |
|---|---|---|
| `activity_uuid` | string | Yes |
| `message` | string | Yes |

Response `200` (`ActivityAIChatSessionResponse`):

```json
{
  "aichat_uuid": "aichat_5f0c2a7e-...",
  "activity_uuid": "activity_31de...",
  "message": "Here is an explanation of the activity content..."
}
```

Errors: `401`, `403` (AI disabled or credits exhausted), `404` (course or organization not found).

### Send message

```
POST /api/v1/ai/send/activity_chat_message
```

| Field | Type | Required |
|---|---|---|
| `aichat_uuid` | string | Yes |
| `activity_uuid` | string | Yes |
| `message` | string | Yes |

Response `200`: same `ActivityAIChatSessionResponse` shape, with `message` set to the new AI reply.

Errors: `401`, `403`, `404` (session/activity not found).

---

## Activity chat (streaming)

Auth: authenticated user. Reserves 1 AI credit before generation (refunded if the stream fails before producing output).

### Start and stream

```
POST /api/v1/ai/stream/start/activity_chat_session
```

Body: same as the non-streaming start (`activity_uuid`, `message`).

### Send and stream

```
POST /api/v1/ai/stream/send/activity_chat_message
```

Body: same as the non-streaming send (`aichat_uuid`, `activity_uuid`, `message`).

SSE events:

| `type` | Payload |
|---|---|
| `start` | `aichat_uuid` |
| `chunk` | `content` |
| `done` | `aichat_uuid`, `activity_uuid` |
| `follow_ups` | `follow_up_suggestions` (array of strings) |
| `error` | `message` |

```text
data: {"type":"start","aichat_uuid":"aichat_5f0c2a7e-..."}

data: {"type":"chunk","content":"A variable is..."}

data: {"type":"done","aichat_uuid":"aichat_5f0c2a7e-...","activity_uuid":"activity_31de..."}
```

Errors before the stream opens: `401`, `403`, `404`.

---

## Editor chat (streaming)

Auth: authenticated user. These routes are aware of the current editor content and can emit content modifications wrapped by the model in `<<<CONTENT>>>` / `<<<END_CONTENT>>>` markers.

### Start editor session

```
POST /api/v1/ai/stream/editor/start
```

Body (`StartEditorAIChatSession`):

| Field | Type | Required |
|---|---|---|
| `activity_uuid` | string | Yes |
| `message` | string | Yes |
| `current_content` | object (TipTap JSON) | Yes |
| `selected_text` | string | No |
| `cursor_position` | integer | No |

### Send editor message

```
POST /api/v1/ai/stream/editor/message
```

Body (`SendEditorAIChatMessage`): same fields plus `aichat_uuid` (required).

SSE events:

| `type` | Payload |
|---|---|
| `start` | `aichat_uuid` |
| `chat_chunk` | `content` (explanatory text) |
| `content_start` | — |
| `content_chunk` | `content` (editor content fragment) |
| `content_end` | `full_content` (complete replacement/insertion payload) |
| `done` | `aichat_uuid`, `activity_uuid` |
| `follow_ups` | `follow_up_suggestions` |
| `error` | `message` |

Errors: `401`, `403`, `404`.

---

## MagicBlocks

Auth: authenticated user. Each start/iterate reserves **3** AI credits and is rate-limited per user and per org. Model selection follows the org plan (`gemini-3-flash-preview` for pro+, `gemini-2.5-flash-lite` otherwise).

### Start generation

```
POST /api/v1/ai/magicblocks/start
```

Body (`StartMagicBlockSession`):

| Field | Type | Required |
|---|---|---|
| `activity_uuid` | string | Yes |
| `block_uuid` | string | Yes |
| `prompt` | string | Yes |
| `context` | object | Yes |

`context` (`MagicBlockContext`):

| Field | Type |
|---|---|
| `course_title` | string |
| `course_description` | string |
| `activity_name` | string |
| `activity_content_summary` | string |

The session is created server-side. Events: `chunk` (`content`), `done` (`session_uuid`), `error` (`message`). The `session_uuid` is only delivered on `done`; keep it for iteration and state reads.

### Iterate

```
POST /api/v1/ai/magicblocks/iterate
```

Body (`SendMagicBlockMessage`):

| Field | Type | Required |
|---|---|---|
| `session_uuid` | string | Yes |
| `activity_uuid` | string | Yes |
| `block_uuid` | string | Yes |
| `message` | string | Yes |
| `current_html` | string | No |

`activity_uuid` and `block_uuid` must match the session. Iteration is capped at 6; exceeding it returns `400`.

Response: SSE stream with `chunk` / `done` / `error` events.

### Get session state

```
GET /api/v1/ai/magicblocks/session/{session_uuid}
```

Response `200` (`MagicBlockSessionResponse`):

```json
{
  "session_uuid": "mb_9c1e...",
  "iteration_count": 2,
  "max_iterations": 6,
  "html_content": "<div>...</div>",
  "message_history": [
    { "role": "user", "content": "Create a quiz about fractions" },
    { "role": "model", "content": "<div>...</div>" }
  ]
}
```

Errors: `401`, `404` (session not found).

---

## Course planning

Auth: authenticated user who is a member of the target organization (superadmins bypass). Start/iterate/generate reserve 3 credits on pro models (`gemini-2.5-pro`) or 1 on the default model (`gemini-2.5-flash`), after a per-user/per-org rate limit. Planning is capped at 10 iterations; per-activity content at 6.

### Start planning

```
POST /api/v1/ai/courseplanning/start
```

Body (`StartCoursePlanningSession`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `org_id` | integer | Yes | |
| `prompt` | string | Yes | Initial course description |
| `language` | string | No | Default `"en"` |
| `attachments` | array | No | `{type, name, url?, content_base64?, mime_type?}`; `type` is `image` \| `video` \| `file` \| `youtube` |

SSE events: `chunk` (`content`), `done` (`session_uuid`), `error` (`message`).

Errors: `401`, `403` (not an org member, credits exhausted), `404` (org not found).

### Iterate plan

```
POST /api/v1/ai/courseplanning/iterate
```

Body (`SendCoursePlanningMessage`): `session_uuid`, `message` (required), `current_plan` (optional `CoursePlan`), `attachments` (optional).

SSE events: `chunk`, `done` (`session_uuid`), `error`. Errors include `400` when the 10-iteration cap is reached, plus `401`, `403`, `404`.

### Finalize plan

```
POST /api/v1/ai/courseplanning/finalize
```

Body (`FinalizeCoursePlanRequest`):

| Field | Type | Required |
|---|---|---|
| `session_uuid` | string | Yes |
| `plan` | object (`CoursePlan`) | Yes |

`CoursePlan`: `{name, description, learnings?, tags?, chapters: [{name, description, activities: [{name, type?, description, suggested_blocks?}]}]}`.

Creates the course, chapters, chapter links and dynamic activities (unpublished), makes the caller the creator, and stores the new `course_id` on the session. Response `200` (`FinalizeCoursePlanResponse`):

```json
{
  "course_uuid": "course_4a7e...",
  "course_id": 128,
  "chapters": [
    {
      "chapter_uuid": "chapter_8b2d...",
      "chapter_id": 55,
      "name": "Getting Started",
      "activities": [
        {
          "activity_uuid": "activity_31de...",
          "activity_id": 904,
          "name": "What is a Variable?",
          "description": "Introduces variables.",
          "suggested_blocks": ["heading1", "paragraph"]
        }
      ]
    }
  ]
}
```

Errors: `400` (course already created from this session), `401`, `403`, `404`.

### Generate activity content

```
POST /api/v1/ai/courseplanning/generate-activity
```

Body (`GenerateActivityContentRequest`):

| Field | Type | Required |
|---|---|---|
| `session_uuid` | string | Yes |
| `activity_uuid` | string | Yes |
| `activity_name` | string | Yes |
| `activity_description` | string | Yes |
| `chapter_name` | string | Yes |
| `course_name` | string | Yes |
| `course_description` | string | Yes |
| `prompt` | string | No |

SSE events: `chunk`, `done` (`session_uuid`), `error`. Content is **not** persisted by the stream; call `save-activity-content` afterwards.

Errors: `400` (6-iteration cap per activity), `401`, `403` (feature disabled, not an org member, credits exhausted), `404` (session/activity/org not found).

### Save activity content

```
POST /api/v1/ai/courseplanning/save-activity-content
```

Body (`SaveActivityContentRequest`): `activity_uuid` (string), `content` (object). `content` must be a valid ProseMirror document (`type: "doc"` with a `content` array).

Response `200`:

```json
{ "success": true, "activity_uuid": "activity_31de..." }
```

Errors: `400` (invalid ProseMirror structure), `401`, `403`, `404`, `500`.

### Get session state

```
GET /api/v1/ai/courseplanning/session/{session_uuid}
```

Response `200` (`CoursePlanningSessionResponse`):

```json
{
  "session_uuid": "cp_2f8a...",
  "planning_iteration_count": 3,
  "max_planning_iterations": 10,
  "current_plan": null,
  "message_history": [{ "role": "user", "content": "Create a beginner algebra course" }],
  "course_id": 128
}
```

Errors: `401`, `404` (session not found).

---

## RAG copilot

Auth: authenticated user and an org member. The endpoint resolves the org from `course_uuid`, `org_slug`, or the caller's first membership; it returns `403` if AI or copilot is disabled for that org. Chat reserves 2 credits.

### Chat (streaming)

```
POST /api/v1/ai/rag/chat
```

Body (`RAGChatRequest`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `message` | string | Yes | |
| `course_uuid` | string | No | Restrict retrieval to this course |
| `aichat_uuid` | string | No | Omit to start a new session |
| `mode` | string | No | `course_only` (default) or `general` |
| `org_slug` | string | No | Used when `course_uuid` is absent |

SSE events:

| `type` | Payload |
|---|---|
| `start` | `aichat_uuid` |
| `chunk` | `content` |
| `sources` | `sources` (array of source references) |
| `done` | `aichat_uuid` |
| `follow_ups` | `follow_up_suggestions` |
| `session_title` | `title` (new sessions only) |
| `error` | `message` |

Errors: `401`, `403` (not an org member, AI/copilot disabled, no org), `404` (course/org not found).

### Reindex a course

```
POST /api/v1/ai/rag/index
```

Auth: org admin/maintainer on the course's organization (`403` otherwise).

| Field | Type | Required |
|---|---|---|
| `course_uuid` | string | Yes |

Response `200` (`RAGIndexResponse`):

```json
{ "status": "success", "chunks_indexed": 42 }
```

Errors: `401`, `403`, `404` (course not found).

### Sessions

| Method | Path | Params | Response |
|---|---|---|---|
| `GET` | `/api/v1/ai/rag/sessions` | `org_slug` (optional query) | `{ "sessions": [...] }` |
| `GET` | `/api/v1/ai/rag/sessions/{aichat_uuid}/messages` | — | `{ "messages": [...] }` |
| `PATCH` | `/api/v1/ai/rag/sessions/{aichat_uuid}` | body `{title?, favorite?}` | `{ "session": {...} }` |
| `DELETE` | `/api/v1/ai/rag/sessions/{aichat_uuid}` | — | `{ "status": "deleted" }` |

Session routes only operate on sessions owned by the caller. Unknown or unowned ids return `404` (`401` if unauthenticated).

```json
{ "sessions": [ { "aichat_uuid": "aichat_5f0c...", "title": "Variables", "favorite": false } ] }
```
