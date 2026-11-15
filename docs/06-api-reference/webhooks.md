# Webhooks

> Status: as-built · Last verified: 2026-11-15

---

## Overview

Organization-level outgoing webhooks notify external services when events occur. The router is mounted at:

```
/api/v1/orgs/{org_id}/webhooks
```

Authentication: a real user session (API-token auth is rejected) and a **Pro plan** (`Webhooks` feature). CRUD, test, and delivery routes additionally require organization admin rights and resolve the endpoint within `org_id` (an endpoint UUID from another org returns `404`). The `GET /events` route is a static catalogue and does not validate the organization.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/orgs/{org_id}/webhooks/events` | Event catalogue |
| `POST` | `/api/v1/orgs/{org_id}/webhooks` | Create endpoint |
| `GET` | `/api/v1/orgs/{org_id}/webhooks` | List endpoints |
| `GET` | `/api/v1/orgs/{org_id}/webhooks/{webhook_uuid}` | Get endpoint |
| `PUT` | `/api/v1/orgs/{org_id}/webhooks/{webhook_uuid}` | Update endpoint |
| `DELETE` | `/api/v1/orgs/{org_id}/webhooks/{webhook_uuid}` | Delete endpoint |
| `POST` | `/api/v1/orgs/{org_id}/webhooks/{webhook_uuid}/regenerate-secret` | New signing secret |
| `POST` | `/api/v1/orgs/{org_id}/webhooks/{webhook_uuid}/test` | Send a `ping` event |
| `GET` | `/api/v1/orgs/{org_id}/webhooks/{webhook_uuid}/deliveries` | Delivery log |

Shared errors: `401` not authenticated, `403` not an org admin (or no Pro plan), `404` organization or webhook endpoint not found. The `GET /events` route can only return `401` / `403`.

---

## List Available Events

```
GET /api/v1/orgs/{org_id}/webhooks/events
```

No request parameters beyond `org_id`.

### Response (200 OK)

```json
{
  "events": {
    "ping": {
      "category": "System",
      "description": "Test event sent to verify endpoint connectivity",
      "data_schema": { "message": "string" }
    },
    "course_completed": {
      "category": "Learning Progress",
      "description": "Triggered when a user completes all activities in a course",
      "data_schema": {
        "user": { "user_uuid": "string", "email": "string", "username": "string" },
        "course": { "course_uuid": "string", "name": "string" }
      }
    }
  }
}
```

### Full event registry

| Event | Category |
|-------|----------|
| `ping` | System |
| `course_completed` | Learning Progress |
| `course_enrolled` | Learning Progress |
| `activity_completed` | Learning Progress |
| `assignment_submitted` | Learning Progress |
| `assignment_graded` | Learning Progress |
| `certificate_claimed` | Learning Progress |
| `user_signed_up` | User & Access |
| `user_email_verified` | User & Access |
| `user_role_changed` | User & Access |
| `user_invited_to_org` | User & Access |
| `user_removed_from_org` | User & Access |
| `course_created` | Course Lifecycle |
| `course_published` | Course Lifecycle |
| `course_deleted` | Course Lifecycle |
| `course_update_published` | Course Lifecycle |
| `activity_version_created` | Content Management |
| `activity_version_restored` | Content Management |
| `course_contributor_added` | Content Management |
| `course_contributor_removed` | Content Management |
| `collection_created` | Content Management |
| `podcast_episode_created` | Content Management |
| `board_created` | Collaboration |
| `board_member_added` | Collaboration |
| `playground_created` | Collaboration |
| `discussion_posted` | Community |
| `comment_created` | Community |
| `discussion_pinned` | Community |
| `discussion_locked` | Community |
| `discussion_vote_cast` | Community |
| `usergroup_created` | Groups |
| `usergroup_deleted` | Groups |
| `usergroup_users_added` | Groups |
| `usergroup_resources_added` | Groups |
| `pack_activated` | Subscriptions |
| `pack_deactivated` | Subscriptions |
| `org_signup_method_changed` | Organization |
| `org_ai_config_changed` | Organization |
| `org_payments_config_changed` | Organization |

The `data_schema` in the response is the authoritative shape of the `data` object for each event.

---

## Create Webhook Endpoint

```
POST /api/v1/orgs/{org_id}/webhooks
```

### Request body (`WebhookEndpointCreate`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `url` | string | Yes | `https://` (or `http://` for local testing); private/internal IPs and unresolvable hosts are rejected with `400` |
| `description` | string | No | Max 500 |
| `events` | array of strings | Yes | Every name must be in the event registry |

`is_active` is not accepted on create; new endpoints are always active.

```json
{
  "url": "https://my-app.example.com/webhooks/learnhouse",
  "description": "Sync courses to my LMS",
  "events": ["course_completed", "course_enrolled", "user_signed_up"]
}
```

### Response (200 OK)

```json
{
  "webhook_uuid": "webhook_9f2c...",
  "url": "https://my-app.example.com/webhooks/learnhouse",
  "description": "Sync courses to my LMS",
  "events": ["course_completed", "course_enrolled", "user_signed_up"],
  "is_active": true,
  "secret": "whsec_abc123def456...",
  "created_by_user_id": 1,
  "creation_date": "2026-11-15 09:00:00.000000"
}
```

`secret` is returned only on create and regenerate.

### Errors

| Status | Description |
|--------|-------------|
| `400` | Invalid URL scheme/hostname, private/reserved address, or unknown event name |
| `401` | Authentication required |
| `403` | Caller is not an org admin or lacks a Pro plan |
| `404` | Organization not found |
| `429` | More than 20 create requests per hour for this org |

---

## List Webhook Endpoints

```
GET /api/v1/orgs/{org_id}/webhooks
```

### Response (200 OK)

Bare array of `WebhookEndpointRead`:

```json
[
  {
    "id": 7,
    "webhook_uuid": "webhook_9f2c...",
    "org_id": 1,
    "url": "https://my-app.example.com/webhooks/learnhouse",
    "description": "Sync courses to my LMS",
    "events": ["course_completed", "course_enrolled", "user_signed_up"],
    "is_active": true,
    "has_secret": true,
    "source": "manual",
    "zap_name": null,
    "zap_id": null,
    "created_by_user_id": 1,
    "creation_date": "2026-11-15 09:00:00.000000",
    "update_date": "2026-11-15 09:00:00.000000"
  }
]
```

The secret is never included. `source` is `manual` for UI-created webhooks or `zapier` for Zapier-managed ones.

---

## Get Webhook Endpoint

```
GET /api/v1/orgs/{org_id}/webhooks/{webhook_uuid}
```

Response: `WebhookEndpointRead` (same shape as a list item). `404` when not found within the org.

---

## Update Webhook Endpoint

```
PUT /api/v1/orgs/{org_id}/webhooks/{webhook_uuid}
```

### Request body (`WebhookEndpointUpdate`)

All fields optional:

| Field | Type | Notes |
|-------|------|-------|
| `url` | string | Validated like create |
| `description` | string | |
| `events` | array of strings | Validated against the registry |
| `is_active` | boolean | Enable/disable deliveries |

For `source="zapier"` endpoints, editing `url` or `events` returns `400`; edit the Zap instead. Response: `WebhookEndpointRead`.

---

## Delete Webhook Endpoint

```
DELETE /api/v1/orgs/{org_id}/webhooks/{webhook_uuid}
```

Deletes the endpoint and its delivery logs. Returns `200 OK`:

```json
{ "detail": "Webhook endpoint deleted successfully" }
```

---

## Regenerate Signing Secret

```
POST /api/v1/orgs/{org_id}/webhooks/{webhook_uuid}/regenerate-secret
```

### Response (200 OK)

```json
{
  "webhook_uuid": "webhook_9f2c...",
  "url": "https://my-app.example.com/webhooks/learnhouse",
  "description": "Sync courses to my LMS",
  "events": ["course_completed", "course_enrolled", "user_signed_up"],
  "is_active": true,
  "secret": "whsec_newSecretValue...",
  "created_by_user_id": 1,
  "creation_date": "2026-11-15 09:00:00.000000"
}
```

The previous secret stops validating immediately. Store the new one; it is not retrievable later.

---

## Test Webhook

```
POST /api/v1/orgs/{org_id}/webhooks/{webhook_uuid}/test
```

Dispatches a `ping` event with `{"message": "This is a test webhook event from LearnHouse."}` to this endpoint only.

### Response (200 OK)

```json
{ "detail": "Test event dispatched" }
```

Delivery is fire-and-forget; the response does not wait for the HTTP request to finish. Check `/deliveries` for the result.

### Errors

| Status | Description |
|--------|-------------|
| `404` | Webhook endpoint not found |
| `429` | More than 20 test requests per hour for this org |

---

## Delivery Logs

```
GET /api/v1/orgs/{org_id}/webhooks/{webhook_uuid}/deliveries?limit=50
```

### Query parameters

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `limit` | integer | 50 | Clamped to 200 |

Only `limit` is accepted; there is no pagination cursor.

### Response (200 OK)

Bare array, newest first:

```json
[
  {
    "id": 31,
    "webhook_id": 7,
    "event_name": "course_completed",
    "delivery_uuid": "dlv_9f2c1a7b3d4e5f60",
    "request_payload": {
      "event": "course_completed",
      "delivery_id": "dlv_9f2c1a7b3d4e5f60",
      "timestamp": "2026-11-15T09:00:00Z",
      "org_id": 1,
      "data": {
        "user": { "user_uuid": "user_...", "email": "john@example.com", "username": "johndoe" },
        "course": { "course_uuid": "course_abc123", "name": "Introduction to Algebra" }
      }
    },
    "response_status": 200,
    "response_body": "ok",
    "success": true,
    "attempt": 1,
    "error_message": null,
    "created_at": "2026-11-15 09:00:00.123456"
  }
]
```

At most 200 logs are retained per endpoint; older rows are pruned after each delivery.

---

## Delivered Payload

Each delivery POSTs JSON:

```json
{
  "event": "course_completed",
  "delivery_id": "dlv_9f2c1a7b3d4e5f60",
  "timestamp": "2026-11-15T09:00:00Z",
  "org_id": 1,
  "data": {
    "user": { "user_uuid": "user_...", "email": "john@example.com", "username": "johndoe" },
    "course": { "course_uuid": "course_abc123", "name": "Introduction to Algebra" }
  }
}
```

### Headers

| Header | Description |
|--------|-------------|
| `Content-Type: application/json` | Payload format |
| `User-Agent: LearnHouse-Webhooks/1.0` | Fixed user agent |
| `X-Webhook-Event` | Event name |
| `X-Webhook-Delivery` | Delivery UUID (use for idempotency) |
| `X-Webhook-Signature` | `sha256=<hex HMAC-SHA256 of the raw body>` |

### Signature verification

The signature is an HMAC-SHA256 over the **raw request body bytes**, keyed with the endpoint secret (`whsec_...`), formatted as `sha256=<hex>`.

```python
import hmac
import hashlib

expected = "sha256=" + hmac.new(
    signing_secret.encode(),
    raw_body,
    hashlib.sha256,
).hexdigest()

is_valid = hmac.compare_digest(expected, request.headers["X-Webhook-Signature"])
```

### Delivery behaviour

- Requests time out after 10 seconds; redirects are not followed.
- Up to 3 attempts with exponential backoff (1 s, 4 s, 16 s).
- URLs are SSRF-checked at create/update time and again at delivery time (DNS rebinding guard).
- A delivery counts as successful only for a `2xx` response.

---

## Rate Limits

| Operation | Limit | Scope |
|-----------|-------|-------|
| Create webhook | 20 / hour | Organization |
| Test webhook | 20 / hour | Organization |

Read operations and regeneration are not throttled by the webhook mutation limiter.

---

## Inbound Provider Webhooks

These are separate from outgoing organization webhooks. Chargily payment callbacks are mounted at `/api/v1/payments/...` and are unauthenticated because the provider calls them; see [Payments](./payments.md).
