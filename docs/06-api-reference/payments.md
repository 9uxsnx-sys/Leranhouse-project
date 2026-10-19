# Payments

> Payment endpoints handle Chargily Pay v2 integration for Algerian Dinar (DZD) transactions — create checkout sessions, process webhooks, check purchase status, and manage payment history with full idempotency and signature verification.

> **Status:** **entitlements**, **orders**, **overview aggregates**, **payment configuration**, **checkout creation** and the **Chargily webhook** are implemented. The learner purchase-status/history endpoints are documented here as the **target contract** and are not live yet. See [Payments — Progress & Roadmap](../08-features/payments/progress.md).

---

## Overview

Koodook uses **Chargily Pay v2** as its sole payment gateway. All transactions are processed in **Algerian Dinar (DZD)** via **EDAHABIA** (Algérie Poste e-wallet) or **CIB** (interbank cards).

The payment system consists of:

- **Entitlements** ✅ — who currently holds access to a paid resource (list / candidates / grant / revoke)
- **Orders** ✅ — the organization's checkout history
- **Configuration** ✅ — per-org Chargily credentials (secrets write-only)
- **Checkout creation** ✅ — initiates a payment session and returns a redirect URL to Chargily's hosted page
- **Webhook handler** ✅ — receives asynchronous payment notifications from Chargily (signature-verified)
- **Purchase status** ⬜ — whether the current user holds an active entitlement
- **Payment history** ⬜ — the current user's own transactions

All communication with Chargily is server-to-server. The frontend never holds Chargily credentials.

---

## Implemented endpoints

All routes are mounted under `/api/v1/payments`, require an authenticated user, and additionally require an organization administrator at the service layer.

### List entitlements

```
GET /api/v1/payments/{org_id}/entitlements?resource_uuid=course_…&search=&page=1&limit=10
```

Returns the **active** access roster for a course, podcast, or collection: `{ items, total, page, limit, pages }`, each item carrying `user`, `role`, `joined_at`, `enrolled_at` (grant timestamp), `status`, `source`, `valid_until`.

### List entitlement candidates

```
GET /api/v1/payments/{org_id}/entitlements/candidates?resource_uuid=course_…&search=&page=1&limit=10
```

Same shape, but only organization members **without** an active entitlement — used by the search picker.

### Grant entitlements

```
POST /api/v1/payments/{org_id}/entitlements?resource_uuid=course_…&user_ids=1,2,3
```

Creates `resourceentitlement` rows with `source=manual`, `status=active`, `granted_by` = acting admin. Response: `{ granted, already, skipped }`.

### Revoke entitlements

```
DELETE /api/v1/payments/{org_id}/entitlements?resource_uuid=course_…&user_ids=1,2,3&reason=manual
```

Flips matching rows to `status=revoked` and sets `revoked_at` / `revoke_reason`. Rows are never deleted. Response: `{ revoked, not_found }`.

### List orders

```
GET /api/v1/payments/{org_id}/orders?search=&status=&page=1&limit=20
```

Newest first, joins the buyer. Search covers name, username, email, resource name and order uuid. Unknown `status` → `422`.

### Payments overview

```
GET /api/v1/payments/{org_id}/overview?range=30d
```

`range` is one of `7d` / `30d` / `90d` / `12m` (unknown values fall back to `30d`). Returns `{ range, currency, revenue, series }` where only `paid` orders inside the window are summed. `series` is zero-filled: one daily bucket per day for 7d/30d/90d, and the last 12 calendar months for 12m. Each point is `{ label, revenue }`.

### Payout report

```
GET /api/v1/payments/{org_id}/payouts?month=2026-10
```

`month` is `YYYY-MM`; malformed values → `422`. Only `paid` orders with `paid_at` inside the month are counted.

```json
{
  "month": "2026-10",
  "currency": "DZD",
  "gross_revenue": 15000,
  "gateway_fees": 375,
  "manual_costs": 3500,
  "total_costs": 3875,
  "net_profit": 11125,
  "teacher_share_percent": 40,
  "teacher_pool": 4450,
  "platform_pool": 6675,
  "attributed_revenue": 15000,
  "unattributed_revenue": 0,
  "order_count": 2,
  "teachers": [
    { "user_id": 1, "name": "Admin", "revenue": 15000, "share_percent": 100, "payout": 4450 }
  ]
}
```

`gateway_fees` comes from `fees_on_merchant` (falling back to `fees`). `manual_costs` is the sum of the month's `hosting` + `marketing` + `other`. `net_profit = max(0, gross − total_costs)`, `teacher_pool = round(net × 40%)`, `platform_pool = net − teacher_pool`.

Attribution: course orders belong to their course; collection orders are split evenly across `price_snapshot["courses"]` (rounding remainder to the first teacher). Each course's revenue goes to its active **MAINTAINERs**, else its active **CREATORs**. Revenue without an active author is reported in `unattributed_revenue` and stays with the platform.

### Update payout costs

```
PUT /api/v1/payments/{org_id}/payouts/costs
```

Body: `{ "month": "2026-10", "hosting": 2000, "marketing": 1000, "other": 500 }`.

Upserts one row per `(org_id, month)` and returns the recalculated report in the same shape as the GET. Negative values or a malformed month → `422`. Omitting a field leaves that cost at `0`.

### Get payment configuration

```
GET /api/v1/payments/{org_id}/config
```

Returns `{ configured, provider, mode, public_key, active, has_secret_key, has_webhook_secret }`. **Secret keys are never returned** — only flags saying whether they are stored. An unconfigured org answers `configured: false` with `mode: "test"`.

### Update payment configuration

```
PUT /api/v1/payments/{org_id}/config
```

Body: `{ provider?, mode, public_key?, secret_key?, webhook_secret?, active? }`.

- `mode` accepts `test` or `live`; anything else → `422`.
- `secret_key` / `webhook_secret` are **write-only**: send a non-empty value to replace, omit or send an empty string to keep the stored one. They are stored Fernet-encrypted.
- Setting `active: true` requires both a public key and a stored secret key, otherwise `400`.
- Upserts a single row per `(org_id, provider)`.

### Create a checkout

```
POST /api/v1/payments/{org_id}/checkout
```

See [Create Checkout Session](#create-checkout-session).

### Chargily webhook

```
POST /api/v1/payments/webhook/chargily/{org_uuid}
```

No auth dependency. See [Chargily Webhook](#chargily-webhook).

---

## Chargily Pay v2 API

| Detail | Value |
|--------|-------|
| Production Base URL | `https://pay.chargily.net/api/v2` |
| Sandbox Base URL | `https://pay.chargily.net/test/api/v2` |
| Authentication | `Authorization: Bearer <secret_key>` |
| Signature | HMAC-SHA256 over raw request body |

---

## Create Checkout Session

> Implemented. Requires an authenticated organization member.

Initiate a payment for a course, podcast, or collection. Creates a `paymentorder` record and returns a Chargily-hosted checkout URL for user redirect.

```
POST /api/v1/payments/{org_id}/checkout
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resource_uuid` | string | Yes | `course_…`, `podcast_…`, or `collection_…` |
| `resource_type` | string | Yes | `course`, `podcast`, or `collection` |
| `payment_method` | string | No | `edahabia`, `cib` or `chargily_app` (the customer can change it on the hosted page) |

### Example Request

```json
{
  "resource_uuid": "course_abc-123",
  "resource_type": "course",
  "payment_method": "edahabia"
}
```

### Response Body (200 OK)

```json
{
  "order_uuid": "order_abc-123",
  "checkout_url": "https://pay.chargily.dz/test/checkouts/01hjjj9aymmrwe664nbzrv84sg/pay",
  "amount": 1500,
  "currency": "dzd",
  "status": "pending"
}
```

### Flow

1. Validate the user is authenticated, the resource exists, `access_type = paid`, and `price_amount > 0`.
2. Reject if the user already holds an active entitlement.
3. Create a `paymentorder` row (`status=pending`, `amount` = price, `price_snapshot`).
4. Call Chargily `POST /checkouts` — integer `amount`, lowercase `currency: "dzd"`, `success_url`, `failure_url`, `webhook_endpoint`, `metadata`.
5. Persist `chargily_checkout_id` + `checkout_url` and return the URL.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Resource is free, has no price, or the user already owns it |
| `401 Unauthorized` | Authentication required |
| `404 Not Found` | Resource not found in this organization |
| `422 Unprocessable Entity` | Invalid payment method |
| `502 Bad Gateway` | Chargily API unavailable or returned an error |

---

## Check Access Status (planned)

> Not implemented yet. The learner-side "do I own this?" check.

```
GET /api/v1/payments/{org_id}/access/{resource_uuid}
```

### Response Body (200 OK)

```json
{
  "has_access": true,
  "source": "purchase",
  "granted_at": "2026-09-22T14:30:00Z",
  "order_uuid": "order_abc-123",
  "valid_until": null
}
```

Access is derived from an active `resourceentitlement` row. `access_type != paid` resources answer `has_access: true` for anyone allowed by the access rules (see [Course Access Levels](#course-access-levels)).

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `404 Not Found` | Resource not found |

---

## Payment History

**Admin (implemented):** `GET /api/v1/payments/{org_id}/orders` — see [List orders](#list-orders).

**Learner (planned):**

```
GET /api/v1/payments/history?page=1&limit=20
```

### Response Body (200 OK)

```json
{
  "items": [
    {
      "order_uuid": "order_abc-123",
      "resource_name": "Introduction to Algebra",
      "amount": 1500,
      "currency": "DZD",
      "payment_method": "edahabia",
      "status": "paid",
      "paid_at": "2026-09-22T14:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

---

## Chargily Webhook

> Implemented. Called by Chargily — **no auth dependency**.

Receives asynchronous payment notifications from Chargily. This endpoint is called by Chargily, not by frontend clients.

```
POST /api/v1/payments/webhook/chargily/{org_uuid}
```

### Headers

| Header | Description |
|--------|-------------|
| `Content-Type: application/json` | Request body format |
| `signature` | Hex HMAC-SHA256 of the **raw body**, keyed with the org's Secret Key |

### Webhook Events

| Event | Description |
|-------|-------------|
| `checkout.paid` | Payment completed successfully |
| `checkout.failed` | Payment failed |
| `checkout.canceled` | Customer canceled the payment |

> Event names are `checkout.*`, **not** `payment.*`. There is no `checkout.refunded` — refunds are issued in the Chargily dashboard.

### Payload

```json
{
  "id": "01hjjjzf7wbc454te45mwx35fe",
  "entity": "event",
  "livemode": false,
  "type": "checkout.paid",
  "data": {
    "id": "01hjjj9aymmrwe664nbzrv84sg",
    "entity": "checkout",
    "amount": 50000,
    "currency": "dzd",
    "fees": 1250,
    "fees_on_merchant": 1250,
    "status": "paid",
    "payment_method": "edahabia",
    "metadata": {
      "order_uuid": "order_abc-123",
      "user_id": "1",
      "org_id": "1"
    },
    "created_at": 1703577693,
    "updated_at": 1703578418
  },
  "created_at": 1703578418,
  "updated_at": 1703578418
}
```

`data` is the **full Checkout object** — there is no separate payment object. Use `data.id` (the checkout id) to find the order, `data.metadata.order_uuid` as a cross-check, and `data.fees_on_merchant` for the accounting snapshot.

### Processing Logic

```
receive_webhook()
  ├─ Verify hex HMAC-SHA256 over the raw body with the org's secret key
  │    ├─ missing header → 400
  │    └─ mismatch       → 403
  ├─ Insert payment_webhook_event(event_id = payload.id)   # unique
  │    └─ conflict → 200 OK (no-op)
  ├─ Event type:
  │    ├─ checkout.paid     → order paid → resourceentitlement(source=purchase)
  │    ├─ checkout.failed   → order failed
  │    └─ checkout.canceled → order canceled
  └─ mark event processed → 200 OK
```

### Signature Verification

```python
import hmac
import hashlib

expected = hmac.new(
    secret_key.encode(),
    raw_body,
    hashlib.sha256
).hexdigest()

is_valid = hmac.compare_digest(expected, signature_header)
```

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Missing `signature` header |
| `403 Forbidden` | Signature mismatch |
| `500 Internal Server Error` | Processing failed — Chargily will retry |
| `200 OK` | Success, including idempotent duplicates |

---

## Data Models

### `paymentorder`

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `order_uuid` | string | Public identifier (unique) |
| `org_id` / `user_id` | integer | Organization and buyer |
| `resource_uuid` / `resource_type` / `resource_name` | string | What is sold |
| `amount` / `currency` | integer / string | Snapshot at creation (`DZD`) |
| `price_snapshot` | JSONB | Resource price at checkout time |
| `payment_method` | enum | `edahabia`, `cib`, `chargily_app` |
| `status` | enum | `pending`, `processing`, `paid`, `failed`, `canceled`, `expired`, `refunded`, `partially_refunded` |
| `chargily_checkout_id` | string | Chargily checkout id (unique) — webhook lookup key |
| `chargily_payment_id` / `checkout_url` | string | Chargily identifiers |
| `idempotency_key` | string | Unique — blocks double-submit |
| `customer_name` / `customer_email` / `customer_phone` | string | Receipt data |
| `fees` / `fees_on_merchant` | integer | Read from Chargily |
| `failure_code` / `failure_message` / `provider_payload` | string / JSONB | Failure detail |
| `expires_at` / `paid_at` | datetime | Checkout expiry / payment time |

### `resourceentitlement`

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Primary key |
| `org_id` / `user_id` | integer | Organization and grantee |
| `resource_uuid` / `resource_type` | string | Course, podcast, or collection |
| `source` | enum | `purchase`, `manual`, `usergroup`, `free` |
| `order_id` | integer | FK to `paymentorder` (`SET NULL`) |
| `status` | enum | `active`, `revoked` |
| `valid_from` / `valid_until` | datetime | `NULL` = lifetime |
| `granted_by` / `granted_at` | integer / datetime | Acting admin and timestamp |
| `revoked_at` / `revoke_reason` | datetime / string | Revocation audit |

### `payment_webhook_event`

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | string | Unique — Chargily payload `id` |
| `event_type` | string | `checkout.paid`, … |
| `status` | enum | `received`, `processing`, `processed`, `failed` |
| `attempts` | integer | Delivery attempts seen |
| `raw_payload` | JSONB | Raw body |
| `error_message` | string | Failure detail |
| `received_at` / `processed_at` | datetime | Timestamps |

### `paymentconfig`

| Field | Type | Description |
|-------|------|-------------|
| `org_id` / `provider` | integer / enum | Unique pair (`chargily`) |
| `mode` | enum | `test`, `live` |
| `public_key` | string | Chargily public key |
| `secret_key_encrypted` / `webhook_secret_encrypted` | string | Encrypted at rest, never returned |
| `active` | boolean | Provider enabled for the org |

---

## Course Access Levels

| Level | Description | Payment Required |
|-------|-------------|-----------------|
| `public` | Free — every logged-in user can view all content | No |
| `users_only` | Restricted — only members of the linked user groups | No |
| `paid` | Must purchase to access | Yes |

`published = false` (draft) overrides all three: author / admin / maintainer only.

Access is enforced at three levels: database flags, backend middleware, and frontend UI gating. The platform itself is login-only — there is no anonymous tier.

> See [Course Access Control](../../04-admin-guide/courses/access.md) for the full rule table.

---

## Refund Flow

Refunds are issued from the Chargily merchant dashboard — Chargily Pay v2 exposes **no refund endpoint**.

1. Admin refunds the payment in the Chargily dashboard.
2. Admin marks the order as refunded in Koodook with an optional reason.
3. `paymentorder.status` becomes `refunded` or `partially_refunded`.
4. A full refund revokes the entitlement; a partial refund keeps it.

---

## Credentials

Chargily credentials are **per organization** in `paymentconfig` (`provider = chargily`, `mode = test | live`). Secret keys are encrypted at rest and never returned by the API. There are no global `CHARGILY_*` environment variables.

| Mode | Chargily base URL |
|------|-------------------|
| `test` | `https://pay.chargily.net/test/api/v2` |
| `live` | `https://pay.chargily.net/api/v2` |
