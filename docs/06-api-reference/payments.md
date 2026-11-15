# Payments

> Status: as-built · Last verified: 2026-11-15

Payment endpoints handle Chargily Pay v2 integration for Algerian Dinar (DZD) transactions — create checkout sessions, process webhooks, list orders, compute revenue/payout aggregates, manage entitlements, and manage per-org payment credentials.

---

## Overview

Koodook uses **Chargily Pay v2** as its sole payment gateway. All transactions are processed in **Algerian Dinar (DZD)** via **EDAHABIA** (Algérie Poste e-wallet) or **CIB** (interbank cards).

The payment system consists of:

- **Entitlements** — who currently holds access to a paid resource (list / candidates / grant / revoke)
- **Orders** — the organization's checkout history
- **Overview aggregates** — revenue total and time series
- **Payouts** — monthly gross/fees/costs, the 40/60 net split and pro-rata teacher payouts
- **Configuration** — per-org Chargily credentials (secrets write-only)
- **Checkout creation** — initiates a payment session and returns a redirect URL to Chargily's hosted page
- **Webhook handler** — receives asynchronous payment notifications from Chargily (signature-verified)

All communication with Chargily is server-to-server. The frontend never holds Chargily credentials.

**There is no `/offers` route.** An "offer" is simply a resource's own `price_amount` / `price_currency` fields, edited through the course, podcast or collection update endpoints. See [Pricing & Offers](#pricing--offers).

**Payouts are computed on the fly.** Nothing is persisted except the manually entered operating costs (`payoutcost`); the report is rebuilt from the paid orders of the month every time.

---

## Implemented endpoints

All routes are mounted under `/api/v1/payments`. The webhook route is public (called by Chargily); every other route requires an authenticated user session and rejects API tokens (`require_authenticated_user`). The admin routes call `authorize_org_admin` at the service layer; **checkout only requires organization membership**, not an administrator role.

### List entitlements

```
GET /api/v1/payments/{org_id}/entitlements?resource_uuid=course_…&search=&page=1&limit=10
```

Admin only. Returns the **active** access roster for a course, podcast, or collection. The envelope has **no `pages` key**:

```json
{
  "items": [
    {
      "user": { "id": 2, "user_uuid": "user_...", "username": "learner", "first_name": "Amine", "last_name": "K.", "email": "learner@school.dev", "avatar_image": "" },
      "role": { "id": 4, "name": "User" },
      "joined_at": "2026-09-01 10:00:00",
      "enrolled_at": "2026-10-20T09:12:00",
      "status": "active",
      "source": "purchase",
      "valid_until": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

`limit` is declared `le=100` (larger values return `422`); rows are newest-granted first. `404` when the resource does not exist in the org.

### List entitlement candidates

```
GET /api/v1/payments/{org_id}/entitlements/candidates?resource_uuid=course_…&search=&page=1&limit=10
```

Admin only. Same envelope, but only organization members **without** an active entitlement — used by the search picker. Candidate rows carry `enrolled_at`, `status`, `source` and `valid_until` as `null`.

### Grant entitlements

```
POST /api/v1/payments/{org_id}/entitlements?resource_uuid=course_…&user_ids=1,2,3
```

Admin only. Creates `resourceentitlement` rows with `source=manual`, `status=active`, `granted_by` = acting admin. Non-members are skipped.

```json
{ "granted": [1, 2], "already": [3], "skipped": [9] }
```

### Revoke entitlements

```
DELETE /api/v1/payments/{org_id}/entitlements?resource_uuid=course_…&user_ids=1,2,3&reason=manual
```

Admin only. Flips matching rows to `status=revoked` and sets `revoked_at` / `revoke_reason`. Rows are never deleted.

```json
{ "revoked": [1, 2], "not_found": [3] }
```

**Collection cascade:** when `resource_uuid` is a `collection_…`, the revoke also flips every ACTIVE entitlement for the same user and the same `order_id` (the per-course/per-podcast rows granted by that bundle purchase). Items bought separately have a different `order_id` and manual grants have none, so they stay active. `TrailRun`s are never deleted — progress is kept, access is denied by the entitlement check.

### List orders

```
GET /api/v1/payments/{org_id}/orders?search=&status=&page=1&limit=20
```

Admin only. Newest first, joins the buyer. Same envelope shape (`items`, `total`, `page`, `limit`); `limit` is `le=100`. Search covers first name, last name, username, email, resource name and order uuid. Unknown `status` → `422`.

```json
{
  "items": [
    {
      "order_uuid": "order_abc-123",
      "resource_uuid": "course_abc-123",
      "resource_type": "course",
      "resource_name": "Introduction to Algebra",
      "amount": 1500,
      "currency": "DZD",
      "status": "paid",
      "payment_method": "edahabia",
      "checkout_url": "https://pay.chargily.dz/test/checkouts/01hjjj9aymmrwe664nbzrv84sg/pay",
      "customer_name": "Amine K.",
      "customer_email": "learner@school.dev",
      "fees": 375,
      "fees_on_merchant": 375,
      "user": {
        "id": 2,
        "user_uuid": "user_...",
        "username": "learner",
        "first_name": "Amine",
        "last_name": "K.",
        "email": "learner@school.dev",
        "avatar_image": ""
      },
      "creation_date": "2026-10-19T12:00:00",
      "paid_at": "2026-10-19T12:04:11"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### Payments overview

```
GET /api/v1/payments/{org_id}/overview?range=30d
```

Admin only. `range` is one of `7d` / `30d` / `90d` / `12m` (unknown values fall back to `30d`). Only `paid` orders inside the window are summed. `series` is zero-filled: one daily bucket per day for 7d/30d/90d, and the last 12 calendar months for 12m. Each point is `{ label, revenue }`.

```json
{
  "range": "30d",
  "currency": "DZD",
  "revenue": 15000,
  "series": [
    { "label": "17 Oct", "revenue": 0 },
    { "label": "18 Oct", "revenue": 5000 }
  ]
}
```

### Payout report

```
GET /api/v1/payments/{org_id}/payouts?month=2026-10
```

Admin only. `month` is `YYYY-MM` (defaults to the current month); malformed values → `422`. Only `paid` orders with `paid_at` inside the month are counted. Computed on the fly from the orders + saved manual costs.

```json
{
  "month": "2026-10",
  "currency": "DZD",
  "gross_revenue": 15000,
  "gateway_fees": 375,
  "manual_costs": { "hosting": 2000, "marketing": 1000, "other": 500 },
  "total_costs": 3875,
  "net_profit": 11125,
  "teacher_share_percent": 40,
  "teacher_pool": 4450,
  "platform_pool": 6675,
  "attributed_revenue": 15000,
  "unattributed_revenue": 0,
  "order_count": 2,
  "teachers": [
    {
      "user_id": 1,
      "name": "Admin",
      "email": "admin@school.dev",
      "courses": 2,
      "gross": 15000,
      "share": 1.0,
      "payout": 4450
    }
  ]
}
```

- `gateway_fees` comes from `fees_on_merchant` (falling back to `fees`).
- `manual_costs` is the month's saved `{ hosting, marketing, other }`; nothing else is stored.
- `total_costs = gateway_fees + hosting + marketing + other`.
- `net_profit = max(0, gross − total_costs)`, `teacher_pool = round(net × 40%)`, `platform_pool = net − teacher_pool`.
- Attribution: a course order belongs to its course; a collection order is split evenly across `price_snapshot["courses"]` (rounding remainder to the first teacher). Each course's revenue goes to its active **MAINTAINERs**, else its active **CREATORs**. Revenue without an active author is reported in `unattributed_revenue` and stays with the platform.
- Per teacher, `share = teacher gross / total gross revenue` (a 0–1 fraction) and `payout = round(teacher_pool × share)`.
- `teachers` is sorted by `payout` descending.

### Update payout costs

```
PUT /api/v1/payments/{org_id}/payouts/costs
```

Admin only. Body: `{ "month": "2026-10", "hosting": 2000, "marketing": 1000, "other": 500 }`.

Upserts one row per `(org_id, month)` and returns the recalculated report in the same shape as the GET. Negative values or a malformed month → `422`. Omitting a field leaves that cost at `0`.

### Get payment configuration

```
GET /api/v1/payments/{org_id}/config
```

Admin only. An unconfigured org answers:

```json
{
  "configured": false,
  "provider": "chargily",
  "mode": "test",
  "public_key": null,
  "active": false,
  "has_secret_key": false,
  "has_webhook_secret": false
}
```

A configured org additionally returns `id`, `creation_date` and `update_date`. **Secret keys are never returned** — only the `has_secret_key` / `has_webhook_secret` flags.

### Update payment configuration

```
PUT /api/v1/payments/{org_id}/config
```

Admin only. Body: `{ provider?, mode, public_key?, secret_key?, webhook_secret?, active? }`.

- `provider` accepts only `chargily`; anything else → `422`.
- `mode` accepts `test` or `live`; anything else → `422`.
- `secret_key` / `webhook_secret` are **write-only**: send a non-empty value to replace, omit or send an empty string to keep the stored one. They are stored Fernet-encrypted.
- Setting `active: true` requires both a public key and a stored secret key, otherwise `400`.
- Removing the public key while payments are active → `400`.
- Upserts a single row per `(org_id, provider)`.

### Create a checkout

```
POST /api/v1/payments/{org_id}/checkout
```

Requires an authenticated organization member. See [Create Checkout Session](#create-checkout-session).

### Chargily webhook

```
POST /api/v1/payments/webhook/chargily/{org_uuid}
```

No auth dependency. See [Chargily Webhook](#chargily-webhook).

---

## Pricing & Offers

There is no offers table and no `/offers` route. What the store calls an "offer" is a paid resource:

| Resource | Where to set the price |
|---|---|
| Course | Course update endpoint (`price_amount`, `price_currency`) |
| Podcast | `PUT /api/v1/podcasts/{podcast_uuid}` |
| Collection | `PUT /api/v1/collections/{collection_uuid}` |

A resource is purchasable when `access_type=paid`, `published=true`, and `price_amount > 0`. Collections also need at least one member.

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

> Implemented. Requires an authenticated organization member (not necessarily an admin).

Initiate a payment for a course, podcast, or collection. Creates a `paymentorder` record and returns a Chargily-hosted checkout URL for user redirect.

```
POST /api/v1/payments/{org_id}/checkout
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resource_uuid` | string | Yes | `course_…`, `podcast_…`, or `collection_…` |
| `resource_type` | string | No | `course`, `podcast`, or `collection` (inferred from the UUID) |
| `payment_method` | string | No | `edahabia`, `cib` or `chargily_app` (the customer can change it on the hosted page) |
| `locale` | string | No | `ar`, `en` or `fr` for the hosted page; defaults to `en` |

### Example Request

```json
{
  "resource_uuid": "course_abc-123",
  "resource_type": "course",
  "payment_method": "edahabia",
  "locale": "fr"
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

1. Validate the caller is an org member, the resource exists, `published=true`, `access_type=paid`, and `price_amount > 0` (a collection also needs at least one member).
2. Reject if the caller already holds an active entitlement.
3. Require an active payment configuration with a stored secret key.
4. Create a `paymentorder` row (`status=pending`, `amount` = price, `price_snapshot`).
5. Call Chargily `POST /checkouts` — integer `amount`, lowercase `currency: "dzd"`, `success_url`, `failure_url`, `webhook_endpoint`, `metadata`.
6. Persist `chargily_checkout_id` + `checkout_url` and return the URL.

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Resource not published / not paid / no price / collection has no items / user already owns it / payments not configured |
| `401 Unauthorized` | Authentication required |
| `403 Forbidden` | Caller is not a member of the organization |
| `404 Not Found` | Organization or resource not found in this organization |
| `422 Unprocessable Entity` | Invalid payment method |
| `502 Bad Gateway` | Chargily API unavailable or returned an error |

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
| `signature` | Hex HMAC-SHA256 of the **raw body**, keyed with the org's webhook secret (falling back to the Chargily secret key when no webhook secret is stored) |

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
  ├─ Verify hex HMAC-SHA256 over the raw body with the org's webhook/secret key
  │    ├─ missing header → 400
  │    └─ mismatch       → 403
  ├─ Insert paymentwebhookevent(event_id = payload.id)   # unique
  │    └─ conflict / already processed → 200 OK (no-op)
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
| `400 Bad Request` | Org missing payments config, missing `signature` header, invalid JSON, or missing event id |
| `403 Forbidden` | Signature mismatch |
| `404 Not Found` | Unknown organization UUID |
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
| `price_snapshot` | JSONB | Resource price + member UUIDs at checkout time |
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

### `paymentwebhookevent`

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

### `payoutcost`

| Field | Type | Description |
|-------|------|-------------|
| `org_id` / `month` | integer / string | Unique pair; `month` is `YYYY-MM` |
| `hosting` / `marketing` / `other` | integer | Manually entered operating costs (DZD) |

Gateway fees are **not** stored here; they are summed from the paid orders when the report is built.

---

## Course Access Levels

| Level | Description | Payment Required |
|-------|-------------|-----------------|
| `public` | Free — published public content is readable by everyone, including anonymous visitors | No |
| `users_only` | Restricted — only members of the linked user groups | No |
| `paid` | Metadata is a product page; content requires an active entitlement | Yes |

`published = false` (draft) overrides all three: author / admin / maintainer only.

Access is enforced at three levels: database flags, backend middleware, and frontend UI gating.

> See [Course Access Control](../../04-admin-guide/courses/access.md) for the full rule table.

---

## Refund Flow

Refunds are issued from the Chargily merchant dashboard — Chargily Pay v2 exposes **no refund endpoint**, and this API has no refund route or `checkout.refunded` event.

1. Admin refunds the payment in the Chargily dashboard.
2. The order is recorded as `refunded` / `partially_refunded` operationally (`paymentorder.status` supports both values).
3. Access is not revoked automatically. For a full refund, call `DELETE /api/v1/payments/{org_id}/entitlements` with the revoked user to flip the entitlement to `revoked`. A partial refund can keep the entitlement.

---

## Credentials

Chargily credentials are **per organization** in `paymentconfig` (`provider = chargily`, `mode = test | live`). Secret keys are encrypted at rest and never returned by the API. There are no global `CHARGILY_*` environment variables.

| Mode | Chargily base URL |
|------|-------------------|
| `test` | `https://pay.chargily.net/test/api/v2` |
| `live` | `https://pay.chargily.net/api/v2` |
