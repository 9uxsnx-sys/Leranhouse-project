# Webhooks

> Webhook endpoints manage the lifecycle of outgoing webhook configurations per organization — create, list, update, delete webhook endpoints, regenerate signing secrets, test delivery, and view delivery logs.

---

## Overview

Koodook supports organization-level outgoing webhooks that notify external services when specific events occur (e.g., course created, user enrolled, payment processed). Webhooks are managed per-organization and each has a unique signing secret for payload verification.

The webhook management endpoints are at `/api/v1/webhooks/{org_id}/webhooks/`. These are separate from the inbound Chargily payment webhook receiver.

---

## List Available Webhook Events

Retrieve the list of event types that can be subscribed to.

```
GET /api/v1/webhooks/{org_id}/webhooks/events
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org_id` | integer | The organization ID |

### Response Body (200 OK)

```json
[
  {
    "event_type": "course.created",
    "description": "A new course was created",
    "category": "courses"
  },
  {
    "event_type": "course.updated",
    "description": "A course was updated",
    "category": "courses"
  },
  {
    "event_type": "course.deleted",
    "description": "A course was deleted",
    "category": "courses"
  },
  {
    "event_type": "user.enrolled",
    "description": "A user was enrolled in a course",
    "category": "enrollments"
  },
  {
    "event_type": "payment.success",
    "description": "A payment was completed successfully",
    "category": "payments"
  },
  {
    "event_type": "payment.failed",
    "description": "A payment failed",
    "category": "payments"
  }
]
```

---

## Create Webhook Endpoint

Register a new webhook endpoint to receive event notifications.

```
POST /api/v1/webhooks/{org_id}/webhooks
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `org_id` | integer | The organization ID |

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | HTTPS URL that will receive webhook payloads |
| `events` | array of strings | Yes | List of event types to subscribe to |
| `description` | string | No | Human-readable description |
| `is_active` | boolean | No | Whether the webhook is active (default: `true`) |

### Example Request

```json
{
  "url": "https://my-app.example.com/webhooks/koodook",
  "events": ["course.created", "course.updated", "user.enrolled"],
  "description": "Sync new courses to my external LMS",
  "is_active": true
}
```

### Response Body (201 Created)

```json
{
  "uuid": "wh-001",
  "url": "https://my-app.example.com/webhooks/koodook",
  "events": ["course.created", "course.updated", "user.enrolled"],
  "description": "Sync new courses to my external LMS",
  "is_active": true,
  "signing_secret": "whsec_abc123def456...",
  "created_at": "2026-09-23T10:00:00Z"
}
```

> **Important:** The `signing_secret` is only returned once upon creation. Store it securely. It cannot be retrieved later.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Invalid URL or event type |
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Insufficient permissions |
| `429 Too Many Requests` | Rate limit exceeded for webhook creation |

---

## List Webhook Endpoints

Retrieve all registered webhook endpoints for an organization.

```
GET /api/v1/webhooks/{org_id}/webhooks
```

### Response Body (200 OK)

```json
[
  {
    "uuid": "wh-001",
    "url": "https://my-app.example.com/webhooks/koodook",
    "events": ["course.created", "course.updated", "user.enrolled"],
    "description": "Sync new courses to my external LMS",
    "is_active": true,
    "created_at": "2026-09-23T10:00:00Z",
    "updated_at": "2026-09-23T10:00:00Z"
  }
]
```

Note: The `signing_secret` is never included in list responses.

---

## Get Webhook Endpoint

Retrieve a specific webhook endpoint by UUID.

```
GET /api/v1/webhooks/{org_id}/webhooks/{webhook_uuid}
```

### Response Body (200 OK)

```json
{
  "uuid": "wh-001",
  "url": "https://my-app.example.com/webhooks/koodook",
  "events": ["course.created", "course.updated", "user.enrolled"],
  "description": "Sync new courses to my external LMS",
  "is_active": true,
  "created_at": "2026-09-23T10:00:00Z",
  "updated_at": "2026-09-23T10:00:00Z"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Webhook endpoint not found |

---

## Update Webhook Endpoint

Update an existing webhook endpoint's configuration.

```
PUT /api/v1/webhooks/{org_id}/webhooks/{webhook_uuid}
```

### Request Body (JSON)

All fields are optional (only provided fields are updated).

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | New HTTPS URL |
| `events` | array of strings | New list of event types |
| `description` | string | New description |
| `is_active` | boolean | Enable or disable the webhook |

### Example Request

```json
{
  "url": "https://my-app.example.com/webhooks/koodook-v2",
  "events": ["course.created", "course.updated", "course.deleted", "user.enrolled"],
  "is_active": true
}
```

### Response Body (200 OK)

Returns the updated webhook endpoint object.

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Webhook endpoint not found |
| `403 Forbidden` | Insufficient permissions |

---

## Delete Webhook Endpoint

Remove a webhook endpoint.

```
DELETE /api/v1/webhooks/{org_id}/webhooks/{webhook_uuid}
```

### Response

`204 No Content` on success.

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Webhook endpoint not found |
| `403 Forbidden` | Insufficient permissions |

---

## Regenerate Signing Secret

Generate a new signing secret for a webhook endpoint. The previous secret is immediately invalidated.

```
POST /api/v1/webhooks/{org_id}/webhooks/{webhook_uuid}/regenerate-secret
```

### Response Body (200 OK)

```json
{
  "signing_secret": "whsec_new_secret_value..."
}
```

> **Important:** The new signing secret is only returned once. Update your external service immediately.

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Webhook endpoint not found |

---

## Test Webhook

Send a test payload to the webhook endpoint to verify connectivity and processing.

```
POST /api/v1/webhooks/{org_id}/webhooks/{webhook_uuid}/test
```

### Response Body (200 OK)

```json
{
  "status": "delivered",
  "status_code": 200,
  "duration_ms": 345
}
```

### Errors

| Status | Description |
|--------|-------------|
| `404 Not Found` | Webhook endpoint not found |
| `429 Too Many Requests` | Rate limit exceeded for test operations |

---

## Delivery Logs

Retrieve the delivery history (logs) for a webhook endpoint.

```
GET /api/v1/webhooks/{org_id}/webhooks/{webhook_uuid}/deliveries
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |

### Response Body (200 OK)

```json
{
  "items": [
    {
      "id": "dl-001",
      "event_type": "course.created",
      "url": "https://my-app.example.com/webhooks/koodook",
      "status": "delivered",
      "status_code": 200,
      "duration_ms": 312,
      "attempt": 1,
      "delivered_at": "2026-09-23T10:05:00Z"
    },
    {
      "id": "dl-002",
      "event_type": "course.updated",
      "url": "https://my-app.example.com/webhooks/koodook",
      "status": "failed",
      "status_code": 500,
      "duration_ms": 5000,
      "attempt": 3,
      "error_message": "Connection timeout",
      "delivered_at": "2026-09-23T10:06:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

---

## Webhook Payload Format

When an event triggers, Koodook sends a POST request to the registered webhook URL with the following JSON payload:

```json
{
  "event_type": "course.created",
  "event_id": "evt_abc123",
  "timestamp": "2026-09-23T10:05:00Z",
  "org_id": 1,
  "data": {
    "course_uuid": "abc123-def456",
    "course_name": "Introduction to Algebra"
  }
}
```

### Headers

| Header | Description |
|--------|-------------|
| `Content-Type: application/json` | Payload format |
| `X-Koodook-Webhook-Signature` | HMAC-SHA256 signature for verification |
| `X-Koodook-Webhook-Event` | The event type |
| `X-Koodook-Webhook-ID` | Unique event identifier (for idempotency) |

### Signature Verification

To verify that a webhook payload came from Koodook, compute the HMAC-SHA256 signature of the raw request body using the webhook's signing secret:

```python
import hmac
import hashlib

expected = hmac.new(
    signing_secret.encode(),
    raw_body,
    hashlib.sha256
).hexdigest()

is_valid = hmac.compare_digest(expected, signature_header)
```

---

## Security Best Practices

- Always verify the `X-Koodook-Webhook-Signature` header before processing a payload
- Return `200 OK` quickly to acknowledge receipt (process asynchronously if needed)
- Use the `X-Koodook-Webhook-ID` header for idempotent processing
- Store the signing secret securely and rotate it periodically
- Use HTTPS for all webhook URLs
- Regenerate the signing secret immediately if compromised

---

## Rate Limiting

Webhook mutations (create, test) are rate-limited per-organization to prevent abuse. Delivery logs and read operations are not rate-limited.

| Operation | Limit | Scope |
|-----------|-------|-------|
| Create webhook | Per-org, configurable | Organization |
| Test webhook | Per-org, configurable | Organization |
| Regenerate secret | Per-org, configurable | Organization |
