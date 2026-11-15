> Status: as-built · Last verified: 2026-11-15

# AI Features Overview

AI powers a learner copilot, an editor assistant, an interactive-block generator and a course-planning assistant, all backed by Google Gemini and gated by the organization's AI plan and credit balance.

## Feature gate and credits

| Piece | Behaviour |
|---|---|
| Feature flag | `resolve_feature("ai", …)`; the frontend reads `resolved_features.ai.enabled`, falling back to `!admin_toggles.ai.disabled` |
| Plan | AI is plan-gated; the model tier depends on the plan |
| Credits | Each request reserves a credit through `reserve_ai_credit`; a failed or empty stream refunds it |
| Provider | Google Gemini through the `google-genai` SDK; the API key is instance configuration |

Model selection is plan-based. Course planning uses `gemini-2.5-flash` and upgrades to `gemini-2.5-pro` on the Pro plan; the learner copilot and activity chat use `gemini-2.5-flash`; Magic Blocks use `gemini-2.5-flash-lite` and upgrade to `gemini-3-flash-preview` on Pro.

## Learner copilot (RAG)

`Copilot` is a chat page at `/orgs/{org}/copilot`, available to signed-in learners. `POST /api/v1/ai/rag/chat` streams an answer grounded in course content.

| Mode | Behaviour |
|---|---|
| `course_only` | Answers from the course material; outside knowledge is marked as supplementary |
| `general` | Answers from the course plus general model knowledge |

The pipeline embeds the question, searches `course_embedding` with pgvector cosine distance, builds a grounded prompt and streams the response. The stream emits `start`, `chunk`, `sources` and `done` events; sources are deduplicated and numbered so the UI can link back to a course, chapter or activity. Sessions and messages are persisted and can be listed, renamed, continued or deleted.

`POST /api/v1/ai/rag/index` re-indexes a course for administrators.

## Editor assistant

The training editor can ask AI to write or modify content while keeping the current document in context. The assistant streams over SSE through:

| Endpoint | Purpose |
|---|---|
| `POST /ai/stream/editor/start` | Start an editor session aware of the current content |
| `POST /ai/stream/editor/message` | Continue the session |

Stream events separate chat explanation from content edits: `chat_chunk` carries prose, while `content_start` / `content_chunk` / `content_end` carry the block the editor should insert or replace. Follow-up suggestions arrive as a separate event.

Activity-scoped chat uses the same pattern through `POST /ai/start/activity_chat_session`, `POST /ai/send/activity_chat_message` and their streaming variants.

## Magic Blocks

A Magic Block is a single AI-generated interactive widget embedded in a lesson. Rather than choosing from a fixed list of block types, the author describes what they want and the model returns self-contained HTML with embedded CSS and JavaScript.

| Endpoint | Purpose |
|---|---|
| `POST /ai/magicblocks/start` | Start a generation session and stream the HTML |
| `POST /ai/magicblocks/iterate` | Modify the existing widget from a follow-up instruction |
| `GET /ai/magicblocks/session/{uuid}` | Load a stored session |

The editor renders the returned HTML in a sandboxed preview and stores the session id, HTML and iteration count on the block. Iteration is capped by `MAX_ITERATIONS`.

## Course planning

Course planning builds a structure from a topic and audience, then creates real chapters and activities.

| Endpoint | Purpose |
|---|---|
| `POST /ai/courseplanning/start` | Start a planning session and stream a plan |
| `POST /ai/courseplanning/iterate` | Refine the plan |
| `POST /ai/courseplanning/finalize` | Create the course, chapters and activities |
| `POST /ai/courseplanning/generate-activity` | Generate content for one activity |
| `POST /ai/courseplanning/save-activity-content` | Persist generated activity content |
| `GET /ai/courseplanning/session/{uuid}` | Reload a session |

The plan shape is a course name, description, learnings, tags and chapters, each with activities and suggested block types. Iteration counts are capped per session stage.

## Not built

- OpenAI, Anthropic or local model providers; Gemini is the only implementation.
- A tool-calling admin agent that can query the database or take administrative actions.
- AI-generated assignments or assessments outside the planning flow.
- Adaptive learning paths, AI tutoring outside the copilot chat and voice interaction.

## Related

- [AI API reference](../../06-api-reference/ai.md)
- [AI credits and plans](../../04-admin-guide/org-settings/general.md)
- [Editor patterns](../../07-ui-reference/patterns.md)
