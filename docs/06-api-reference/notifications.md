# Notifications

> In-app notification endpoints: the per-user feed and unread counter, read state, the organization event catalog with template status, per-event overrides and kill switches, and admin announcements.

---

## Overview

All notification endpoints are mounted under `/api/v1/notifications` and require an authenticated user session. API tokens are rejected on this router — the feed is personal to the signed-in user.

Every list endpoint takes `org_id` as a query parameter; notifications are always scoped to one organization.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/notifications` | Paginated feed |
| `GET` | `/notifications/unread-count` | Unread badge count |
| `PATCH` | `/notifications/{recipient_id}/read` | Mark one as read |
| `POST` | `/notifications/read-all` | Mark all as read |
| `GET` | `/notifications/events` | Event catalog with template status |
| `PUT` | `/notifications/events/{event_type}/template` | Save an org template override |
| `PUT` | `/notifications/events/{event_type}/toggle` | Enable/disable an event for the org |
| `POST` | `/notifications/announcements` | Send a manual broadcast |
| `GET` | `/notifications/announcements` | List sent announcements |

---

## Get Notification Feed

```
GET /api/v1/notifications?org_id={org_id}&page=1&limit=20
```

Returns the current user's notifications for the organization, newest first. Recipients with `muted_at` set are excluded.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `org_id` | integer | required | Organization ID |
| `page` | integer | `1` | Page number (1-indexed, min 1) |
| `limit` | integer | `20` | Page size (1–100) |

### Response Body (200 OK)

```json
{
  "notifications": [
    {
      "id": 12,
      "notification_id": 8,
      "event_type": "assignment_graded",
      "category": "Learning Progress",
      "title": "Assignment Graded",
      "body": "Your submission for \"Build a responsive navbar\" received 18/20.",
      "source": "system",
      "params": {
        "assignment_uuid": "assignment_9f2c",
        "grade": 18,
        "max_grade": 20
      },
      "link_url": "/courses",
      "read_at": null,
      "created_at": "2026-10-24 15:26:05.869367"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

### Field Notes

| Field | Description |
|-------|-------------|
| `id` | `notification_recipient.id` — use this for the read endpoint |
| `notification_id` | Shared content row ID |
| `title` / `body` | Rendered at send time; immutable afterwards |
| `params` | Structured event data used to render the snapshot |
| `link_url` | Optional deep link the client can follow |
| `source` | `system` for events, `announcement` for broadcasts |
| `read_at` | `null` while unread |
| `created_at` | Server timestamp |

---

## Get Unread Count

```
GET /api/v1/notifications/unread-count?org_id={org_id}
```

Used by the header bell badge. Polled by the frontend every 30 seconds and revalidated on window focus.

### Response Body (200 OK)

```json
{
  "count": 3
}
```

---

## Mark Notification as Read

```
PATCH /api/v1/notifications/{recipient_id}/read
```

`recipient_id` is the `id` field from the feed response, not the `notification_id`.

### Response Body (200 OK)

```json
{
  "success": true
}
```

### Errors

| Code | Detail |
|------|--------|
| `404` | `Notification not found` — the recipient row does not belong to the current user |

---

## Mark All Notifications as Read

```
POST /api/v1/notifications/read-all?org_id={org_id}
```

Marks every unread notification for the current user in the organization.

### Response Body (200 OK)

```json
{
  "count": 3
}
```

---

## Get Event Catalog

```
GET /api/v1/notifications/events?org_id={org_id}
```

Returns every registered event (39 today) annotated with this organization's template status. Used by the dashboard **Events** tab.

### Response Body (200 OK)

```json
[
  {
    "event_type": "course_completed",
    "category": "Learning Progress",
    "description": "Triggered when a user completes all activities in a course",
    "data_schema": {
      "user": { "user_uuid": "string", "email": "string", "username": "string" },
      "course": { "course_uuid": "string", "name": "string" }
    },
    "title_template": "Course Completed",
    "body_template": "You completed \"{{course_name}}\".",
    "link_url": "/courses",
    "is_enabled": true,
    "is_customized": false,
    "has_audience": true,
    "audience_description": "The enrolled student"
  }
]
```

| Field | Description |
|-------|-------------|
| `title_template` / `body_template` | Effective template (override if any, otherwise the built-in default) |
| `is_enabled` | Whether the event currently produces notifications for this org |
| `is_customized` | `true` when an org override row exists |
| `has_audience` | `false` for diagnostic events such as `ping` |
| `audience_description` | Human-readable audience summary |

---

## Save Template Override

```
PUT /api/v1/notifications/events/{event_type}/template?org_id={org_id}
```

Creates or updates the organization's template for one event. Requires an authenticated user; the dashboard exposes this from the row's three-dot menu.

### Request Body

```json
{
  "title_template": "Assignment Graded",
  "body_template": "Your submission received {{grade}}/{{max_grade}}.",
  "link_url": "/courses"
}
```

All three fields are optional. Send `null` to clear a field and fall back to the built-in default for that value.

### Response Body (200 OK)

```json
{
  "success": true
}
```

---

## Toggle Event

```
PUT /api/v1/notifications/events/{event_type}/toggle?org_id={org_id}
```

Per-organization kill switch. When disabled, `notify()` returns without writing a notification row, regardless of the audience rule.

### Request Body

```json
{
  "is_enabled": false
}
```

### Response Body (200 OK)

```json
{
  "success": true,
  "is_enabled": false
}
```

---

## Send Announcement

```
POST /api/v1/notifications/announcements?org_id={org_id}
```

Creates a manual broadcast notification for explicit user IDs. The dashboard resolves user-group membership to user IDs before calling this endpoint.

### Request Body

```json
{
  "title": "Platform maintenance on Sunday",
  "body": "The platform will be unavailable between 02:00 and 03:00 UTC.",
  "link_url": null,
  "category": "Announcement",
  "recipient_user_ids": [1, 2, 3]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Announcement title |
| `body` | string | yes | Announcement body |
| `link_url` | string \| null | no | Optional deep link |
| `category` | string | no | Defaults to `Announcement` |
| `recipient_user_ids` | integer[] | yes | At least one recipient |

### Response Body (200 OK)

```json
{
  "success": true,
  "notification_id": 12,
  "recipient_count": 3
}
```

### Errors

| Code | Detail |
|------|--------|
| `400` | `At least one recipient is required` |
| `400` | `Title or body is required` |
| `500` | `Failed to create announcement` |

---

## List Announcements

```
GET /api/v1/notifications/announcements?org_id={org_id}&page=1&limit=20
```

Returns previously sent announcements for the organization, newest first.

### Response Body (200 OK)

```json
{
  "announcements": [
    {
      "id": 12,
      "title": "Platform maintenance on Sunday",
      "body": "The platform will be unavailable between 02:00 and 03:00 UTC.",
      "link_url": null,
      "category": "Announcement",
      "created_at": "2026-10-24 15:26:05.869367"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

---

## Related

- [Notifications feature](../../08-features/notifications/overview.md) — architecture, event catalog, templates and UI
- [Webhooks](./webhooks.md) — outgoing webhook endpoints that share the event registry
