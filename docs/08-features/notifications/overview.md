# Notifications Feature

> In-app notifications for learners and admins: 39 platform events, audience resolution per event, per-organization template overrides with English / French / Arabic defaults, a management tab in the dashboard, and a monochrome bell dropdown with a centered reading window.

---

## Overview

The notification system turns platform activity into a per-user inbox. It shares the event registry with outgoing webhooks (`WEBHOOK_EVENTS`) but has its own delivery pipeline, so an event can fire a webhook, a notification, or both.

Three ideas drive the design:

- **One content row per event, one state row per recipient.** A `notification` row is written once and shared; `notification_recipient` carries the per-user read/mute state.
- **Rendered text is snapshotted at send time.** Editing a template later never rewrites past notifications.
- **Templates are data, defaults are code.** Organizations can override any event's copy; the built-in defaults ship in three languages.

```
Platform service
      │  notify(event, org_id, data, language)
      ▼
Audience rule  ──►  [user_id, ...]
      │
      ▼
Template resolution
  org override → platform default → built-in (en/fr/ar) → English fallback
      │
      ▼
notification (title, body, params, category, link)
      │
      ▼
notification_recipient (one row per user)
      │
      ├─► GET /notifications            (feed / bell dropdown)
      └─► GET /notifications/unread-count (badge)
```

---

## Data Model

### `notification`

Content for one event. Written once, read by every recipient.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | Primary key |
| `org_id` | integer | FK → `organization.id`, cascade delete |
| `event_type` | varchar(100) | e.g. `course_completed` |
| `category` | varchar(50) | e.g. `Learning Progress` |
| `title` | varchar(500) | Rendered snapshot |
| `body` | text | Rendered snapshot |
| `params` | json | Structured event data (used for re-rendering / clients) |
| `link_url` | varchar(2048) | Optional deep link |
| `source` | varchar(20) | `system` for events, `announcement` for broadcasts |
| `language` | varchar(10) | Language of the rendered snapshot (`en` / `fr` / `ar`) |
| `created_at` | varchar(50) | Timestamp |

Indexed on `org_id`, `event_type`, `created_at`.

### `notification_recipient`

Per-user state for one notification.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | Primary key — this is the `recipient_id` used by the read APIs |
| `notification_id` | integer | FK → `notification.id`, cascade delete |
| `user_id` | integer | FK → `user.id`, cascade delete |
| `read_at` | varchar(50) | `NULL` = unread |
| `muted_at` | varchar(50) | Non-null recipients are excluded from the feed |
| `created_at` | varchar(50) | Timestamp |

Indexed on `user_id`, `notification_id`, plus a partial index on `(user_id, read_at) WHERE read_at IS NULL` for unread counts.

### `notification_template`

Per-organization overrides and per-event kill switch.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | Primary key |
| `org_id` | integer, nullable | `NULL` = platform default row |
| `event_type` | varchar(100) | Unique per org (`uq_notification_template_org_event`) |
| `category` | varchar(50) | Copied from the event registry |
| `title_template` | text | Supports `{{placeholder}}` |
| `body_template` | text | Supports `{{placeholder}}` |
| `link_url` | varchar(2048) | Optional |
| `is_enabled` | boolean | `false` disables the event for this org |
| `created_at` / `updated_at` | varchar(50) | Timestamps |

---

## Event Catalog

39 events are registered across 10 categories. `ping` is diagnostic only — it fires webhooks but has an empty audience, so it never produces a notification.

| Category | Events |
|----------|--------|
| **System** | `ping` |
| **Learning Progress** | `course_completed`, `course_enrolled`, `activity_completed`, `assignment_submitted`, `assignment_graded`, `certificate_claimed` |
| **User & Access** | `user_signed_up`, `user_email_verified`, `user_role_changed`, `user_invited_to_org`, `user_removed_from_org` |
| **Course Lifecycle** | `course_created`, `course_published`, `course_deleted`, `course_update_published` |
| **Content Management** | `activity_version_created`, `activity_version_restored`, `course_contributor_added`, `course_contributor_removed`, `collection_created`, `podcast_episode_created` |
| **Collaboration** | `board_created`, `board_member_added`, `playground_created` |
| **Community** | `discussion_posted`, `comment_created`, `discussion_pinned`, `discussion_locked`, `discussion_vote_cast` |
| **Groups** | `usergroup_created`, `usergroup_deleted`, `usergroup_users_added`, `usergroup_resources_added` |
| **Subscriptions** | `pack_activated`, `pack_deactivated` |
| **Organization** | `org_signup_method_changed`, `org_ai_config_changed`, `org_payments_config_changed` |

The registry lives in `apps/api/src/services/webhooks/events.py` (`WEBHOOK_EVENTS`) and each entry declares a `data_schema`, which is also the source of available `{{placeholders}}`.

---

## Audience Resolution

`AUDIENCE_RULES` in `apps/api/src/services/notifications/service.py` maps every event to a resolver. Resolvers receive the event data and the DB session and return the affected user IDs.

| Pattern | Used by | Behavior |
|---------|---------|----------|
| `_resolve_enrolled_student` | `course_completed`, `activity_completed` | The student who triggered the event |
| `_resolve_assignment_student` | `assignment_submitted`, `assignment_graded` | The student who owns the submission |
| `_resolve_certificate_student` | `certificate_claimed` | The certificate recipient |
| `_resolve_course_enrolled_users` | `course_update_published` | Every enrolled user |
| `_resolve_user_from_data` / `_resolve_user_id_direct` | user-facing events | The subject of the event |
| `_resolve_org_admins` | lifecycle / configuration events | Organization administrators |
| `_resolve_added_contributors` | `course_contributor_added/removed` | Only the contributors involved |
| `_resolve_usergroup_members` / `_resolve_usergroup_users` | group events | Members of the affected group |
| `_resolve_board_creator` | `board_member_added` | The board owner |
| `_resolve_discussion_author` | `comment_created`, votes | The discussion author |
| `_resolve_course_creator` | content management | The course owner |
| `_resolve_community_members` | `discussion_posted` | Members of the community |
| `_resolve_user_invited` | `user_invited_to_org` | Existing users matching invited emails |

Rules that resolve to an empty list short-circuit: no `notification` row is written.

---

## Templates and Languages

Default copy ships in three dictionaries in `apps/api/src/services/notifications/templates.py`:

```python
_TEMPLATE_LANGUAGES = {
    "en": "DEFAULT_TEMPLATES_EN",
    "fr": "DEFAULT_TEMPLATES_FR",
    "ar": "DEFAULT_TEMPLATES_AR",
}
```

`DEFAULT_TEMPLATES` remains as an alias of `DEFAULT_TEMPLATES_EN` for backwards compatibility.

### Resolution order

1. **Organization override** — a `notification_template` row for `(org_id, event_type)`.
2. **Platform default** — a `notification_template` row with `org_id = NULL`.
3. **Built-in for the requested language** — e.g. `DEFAULT_TEMPLATES_AR`.
4. **English fallback** — if the language dictionary has no entry for that event.

If the resolved template has `is_enabled = false`, `notify()` returns without writing anything.

### Rendering

`render_notification(org_id, event_type, params, db_session, language)` returns `(title, body, category, link_url, is_enabled)`. Placeholders use `{{snake_case}}` and are filled from `params`, which `_build_params()` derives from the event payload (course name, assignment grade, group name, etc.). Unknown placeholders are left untouched rather than raising.

### Snapshot semantics

`title`, `body` and `language` are stored on the `notification` row when the event fires. A notification sent before a template edit keeps its original wording — history is never rewritten.

---

## Dispatch Points

`notify(event_name, org_id, data, db_session=None, language="en")` is the single entry point. It is intentionally fire-and-forget: failures are logged and never break the caller's transaction.

Call sites are spread across the service layer, including:

| Area | Events dispatched |
|------|-------------------|
| `services/trail/trail.py` | `activity_completed`, `course_completed`, `course_enrolled` |
| `services/courses/activities/assignments.py` | `assignment_submitted`, `assignment_graded` |
| `services/courses/certifications.py` | `certificate_claimed` |
| `services/courses/updates.py` | `course_update_published` |
| `services/courses/courses.py` | `course_created`, `course_published`, `course_deleted` |
| `services/courses/contributors.py` | `course_contributor_added`, `course_contributor_removed` |
| `services/courses/activities/versioning.py` | `activity_version_created`, `activity_version_restored` |
| `services/courses/collections.py` | `collection_created` |
| `services/users/users.py`, `email_verification.py` | `user_signed_up`, `user_email_verified` |
| `services/orgs/users.py` | `user_removed_from_org`, `user_role_changed`, `user_invited_to_org` |
| `services/orgs/orgs.py` | `org_signup_method_changed`, `org_ai_config_changed`, `org_payments_config_changed` |
| `services/users/usergroups.py` | `usergroup_created`, `usergroup_deleted`, `usergroup_users_added`, `usergroup_resources_added` |
| `services/communities/*` | `discussion_posted`, `comment_created`, `discussion_pinned`, `discussion_locked`, `discussion_vote_cast` |
| `services/boards/boards.py`, `playgrounds/playgrounds.py` | `board_created`, `board_member_added`, `playground_created` |
| `services/podcasts/episodes.py` | `podcast_episode_created` |
| `services/packs/packs.py` | `pack_activated`, `pack_deactivated` |

---

## API

All endpoints live under `/api/v1/notifications` and require an authenticated session (API tokens are rejected). See the [Notifications API reference](../../06-api-reference/notifications.md) for request and response shapes.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/notifications` | Paginated feed for the current user |
| `GET` | `/notifications/unread-count` | Unread badge count |
| `PATCH` | `/notifications/{recipient_id}/read` | Mark one as read |
| `POST` | `/notifications/read-all` | Mark all as read |
| `GET` | `/notifications/events` | Event catalog with template status |
| `PUT` | `/notifications/events/{event_type}/template` | Save an org template override |
| `PUT` | `/notifications/events/{event_type}/toggle` | Enable/disable an event for the org |
| `POST` | `/notifications/announcements` | Send a manual broadcast |
| `GET` | `/notifications/announcements` | List sent announcements |

---

## Dashboard Management

Route: `/dash/notifications` (main sidebar tab, two sub-tabs).

### Events

A table of every registered event with:

| Column | Content |
|--------|---------|
| Toggle | Per-org enable/disable switch (writes `is_enabled`) |
| Event | Description plus the raw `event_type` |
| Category | Pill badge |
| Audience | Human-readable audience description, or `No audience` |
| Actions | Three-dot menu → **Edit template** |

Editing opens a dedicated view (not an inline panel): action row with **Back** on the left and a standard save button on the right (`Save` → `Saving…` → `Saved`, with toasts), followed by a **Notification template** section card holding **Title template**, **Body template**, and **Link URL**.

Search filters by event type/description; the category filter maps to the registry categories.

### Announcements

Compose a manual broadcast and browse previously sent announcements. Recipients are selected through user-group containers; the composer resolves each selected group to its member IDs before sending. Announcements are stored with `source = 'announcement'` and `event_type = 'announcement'`.

---

## Learner Surface (Bell)

The bell (`components/Objects/Notifications/NotificationBell.tsx`) is mounted in both headers — `AdminTopBar` (dashboard) and `OrgMenu` (public site).

- **Trigger** — bell icon with a monochrome unread count badge (`gray-900`, no red).
- **Dropdown** — latest 8 notifications, one-line truncated titles, relative time (`5m`, `5h`, `2d`, `3w`, `4mo`, `1y`), category label, and a dot for unread items. Header carries "Mark all read"; rows are rounded hover pills with no dividers.
- **Reading window** — selecting a row opens a centered dialog (480 × 560, capped at `85vh`) containing only the title and the body. Body paragraphs are split on blank lines with `space-y-4` and a hidden scrollbar; the title stays pinned while the body scrolls. No border, dividers, buttons, or close icon — dismiss with a click outside or `Esc`.
- **Read state** — opening a notification marks it read immediately (optimistic, reverted on API failure).

> **Mockup mode.** `MOCK_MODE` at the top of `NotificationBell.tsx` is currently `true`, which renders a fixed sample set (including long multi-paragraph bodies) for design review and skips all API calls. Set it to `false` to switch to live data — the fetch keys, read mutations and unread count then go through the real endpoints.

### Related frontend files

| File | Role |
|------|------|
| `components/Objects/Notifications/NotificationBell.tsx` | Bell, dropdown, reading window, mockup data |
| `components/Dashboard/Pages/Notifications/NotificationsManagement.tsx` | Events and Announcements tabs |
| `services/notifications.ts` | Types plus feed, read, catalog, template and announcement calls |

---

## Database Migrations

| Revision | Change |
|----------|--------|
| `a1b2c3d4e5f7` | Create `notification` and `notification_recipient` |
| `a1b2c3d4e5f8` | Add `notification_template`, plus `title`, `body`, `source` on `notification` |
| `a1b2c3d4e5f9` | Add `language` on `notification` |

Run migrations from `apps/api`:

```bash
uv run alembic upgrade head
```

---

## Adding a New Event

1. Register it in `WEBHOOK_EVENTS` with a `category`, `description` and `data_schema`.
2. Add an `AUDIENCE_RULES` entry with a resolver.
3. Add the default copy to `DEFAULT_TEMPLATES_EN`, `DEFAULT_TEMPLATES_FR` and `DEFAULT_TEMPLATES_AR`.
4. Call `notify(...)` from the service where the action happens.
5. Add a locale key to `apps/web/locales/*.json` only if the learner UI needs a bespoke sentence; the stored `title`/`body` already cover the reading window.

The event appears in the dashboard catalog automatically — no UI change is required.

---

## Related

- [Notifications API](../../06-api-reference/notifications.md)
- [Webhooks API](../../06-api-reference/webhooks.md) — shares the event registry
- [Webhooks feature](../../06-api-reference/webhooks.md) — outgoing delivery
