# Payments

> Payment endpoints handle Chargily Pay v2 integration for Algerian Dinar (DZD) transactions — create checkout sessions, process webhooks, check purchase status, and manage payment history with full idempotency and signature verification.

---

## Overview

Koodook uses **Chargily Pay v2** as its sole payment gateway. All transactions are processed in **Algerian Dinar (DZD)** via **EDAHABIA** (Algérie Poste e-wallet) or **CIB** (interbank cards).

The payment system consists of:

- **Checkout creation** — Initiates a payment session and returns a redirect URL to Chargily's hosted payment page
- **Webhook handler** — Receives asynchronous payment notifications from Chargily (signature-verified)
- **Purchase status** — Checks whether the current user has purchased a specific course
- **Payment history** — Lists past transactions for the current user or org

All communication with Chargily is server-to-server. The frontend never holds Chargily credentials.

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

Initiate a payment for a course. Creates a `payment_orders` record and returns a Chargily-hosted checkout URL for user redirect.

```
POST /api/payments/checkout/{course_uuid}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `course_uuid` | string | The UUID of the course to purchase |

### Request Body (JSON)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `payment_method` | string | No | `"edahabia"` | Payment method: `"edahabia"` or `"cib"` |

### Example Request

```json
{
  "payment_method": "edahabia"
}
```

### Response Body (200 OK)

```json
{
  "checkout_url": "https://pay.chargily.net/checkout/ch_xyz789",
  "checkout_id": "ch_xyz789",
  "amount": 1500,
  "currency": "DZD",
  "status": "pending"
}
```

### Flow

1. Backend validates the user is authenticated and the course exists with a price set
2. Creates a `payment_orders` record with status `pending`
3. Calls Chargily `POST /checkouts` with amount, success/failure URLs, and metadata
4. Returns the Chargily-hosted checkout URL for frontend redirect

### Errors

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Course is free or has no price configured |
| `401 Unauthorized` | Authentication required |
| `404 Not Found` | Course not found |
| `422 Unprocessable Entity` | Invalid payment method |
| `502 Bad Gateway` | Chargily API unavailable or returned an error |

---

## Check Purchase Status

Check whether the current user has purchased a specific course.

```
GET /api/payments/purchases/{course_uuid}/status
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `course_uuid` | string | The UUID of the course |

### Response Body (200 OK)

```json
{
  "purchased": true,
  "purchased_at": "2026-09-22T14:30:00Z",
  "payment_order_id": "po-001",
  "access_level": "paid"
}
```

### Errors

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Authentication required |
| `404 Not Found` | Course not found |

---

## Payment History

Retrieve the current user's payment history.

```
GET /api/payments/history
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
      "id": "po-001",
      "course_name": "Introduction to Algebra",
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

Receives asynchronous payment notifications from Chargily. This endpoint is called by Chargily, not by frontend clients.

```
POST /api/payments/chargily/webhook
```

### Headers

| Header | Description |
|--------|-------------|
| `Content-Type: application/json` | Request body format |
| `X-Chargily-Signature` | HMAC-SHA256 signature for verification |

### Webhook Events

| Event | Description |
|-------|-------------|
| `payment.success` | Payment completed successfully |
| `payment.failed` | Payment failed |
| `payment.refunded` | Payment was refunded |

### Payload

```json
{
  "type": "payment.success",
  "data": {
    "id": "pi_abc123",
    "checkout_id": "ch_xyz789",
    "amount": 1500,
    "currency": "DZD",
    "status": "paid",
    "payment_method": "edahabia",
    "metadata": {
      "course_uuid": "abc-123",
      "user_id": "user-456",
      "org_id": "org-789"
    },
    "paid_at": "2026-09-23T12:00:00Z",
    "customer": {
      "id": "cus_123",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

### Processing Logic

```
receive_webhook()
  ├─ Verify HMAC-SHA256 signature
  │    └─ Fail → 401 Unauthorized
  ├─ Check idempotency (already processed?)
  │    └─ Yes → 200 OK (no-op)
  ├─ Event type:
  │    ├─ payment.success → Update payment_orders → Create course_purchases
  │    ├─ payment.failed  → Update payment_orders status to failed
  │    └─ payment.refunded → Update payment_orders status to refunded
  └─ Return 200 OK
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
| `401 Unauthorized` | Invalid webhook signature |
| `200 OK` | (Returned even for idempotent duplicates to prevent retries) |

---

## Payment Orders Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `chargily_checkout_id` | string | Chargily checkout session identifier |
| `chargily_payment_intent_id` | string | Chargily payment intent identifier |
| `amount` | decimal | Transaction amount in DZD |
| `currency` | string | Always `DZD` |
| `status` | enum | `pending`, `paid`, `failed`, `expired`, `refunded`, `partially_refunded` |
| `metadata` | JSON | Course UUID, user ID, payment method |
| `paid_at` | datetime | Timestamp of successful payment |

## Course Purchases Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | integer | Foreign key to user |
| `course_id` | integer | Foreign key to course |
| `payment_order_id` | UUID | Foreign key to payment order |
| `purchased_at` | datetime | Purchase timestamp |

---

## Course Access Levels

| Level | Description | Payment Required |
|-------|-------------|-----------------|
| `public` | Anyone can view all content | No |
| `users_only` | Any authenticated user can access | No |
| `paid` | Must purchase to access | Yes |

Access is enforced at three levels: database flags, backend middleware, and frontend UI gating.

---

## Refund Flow

Refunds are initiated from the Admin Dashboard:

1. Admin opens a completed transaction
2. Admin clicks **Refund**, optionally enters partial amount and reason
3. Backend calls Chargily's refund API
4. `payment_orders` status updates to `refunded` or `partially_refunded`
5. User's course enrollment is **not** automatically removed — manual revocation required

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CHARGILY_API_KEY` | Chargily API public key |
| `CHARGILY_SECRET_KEY` | Chargily secret key (webhook signature verification) |
| `CHARGILY_TEST_MODE` | `true` for sandbox, `false` for production |
