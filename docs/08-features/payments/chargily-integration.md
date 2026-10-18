# Chargily Pay v2 Integration Plan

> Technical integration plan for Chargily Pay v2 — the Algerian payment gateway powering all transactions on Koodook via EDAHABIA and CIB payments in Algerian Dinar (DZD).

---

## Overview

Chargily Pay v2 is a payment service provider that specializes in Algerian payment methods. Koodook uses Chargily Pay v2 as its sole payment gateway. The integration follows a server-side architecture: the Koodook backend communicates with Chargily's REST API to create invoices and verify payments, while the frontend never holds Chargily credentials.

### Chargily Pay v2 API

- **Base URL (Production):** `https://pay.chargily.net/api/v2`
- **Base URL (Sandbox):** `https://pay.chargily.net/test/api/v2`
- **API Version:** v2
- **Authentication:** Bearer token via the `Authorization: Bearer <secret_key>` header
- **Content-Type:** `application/json`
- **Documentation:** [Chargily Pay API Docs](https://dev.chargily.com/)

### Key API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/checkouts` | POST | Create a checkout session |
| `/checkouts/{id}` | GET | Retrieve a checkout (reconciliation) |
| `/checkouts` | GET | List checkouts (reconciliation) |
| `/checkouts/{id}/expire` | POST | Expire a pending checkout |
| `/customers` | POST | Create a Chargily customer (optional) |

> **No refund endpoint exists in Chargily Pay v2.** The API reference covers checkouts, customers, products, prices, payment links and balance only. Refunds are issued from the Chargily merchant dashboard; our admin UI marks the order as refunded afterwards.

## Setup Requirements

### Prerequisites

1. A **Chargily merchant account** registered at [https://merchants.chargily.com](https://merchants.chargily.com).
2. Account approval (typically 24–48 hours after submitting business registration documents).
3. Access to the merchant dashboard.

### API Credentials

From the Chargily merchant dashboard, navigate to **Settings → API Keys**:

| Credential | Usage |
|---|---|
| **API Key** (Public Key) | Can be exposed to frontend (not currently used directly) |
| **Secret Key** | Server-side only. Used for API authentication and webhook signature verification |

> **Security:** The Secret Key must never be exposed client-side, logged, or committed to version control. Store it in environment variables or a secrets manager.

### Credentials Storage

Credentials are **per organization**, not global env vars. Each org has one `paymentconfig` row holding `provider = chargily`, `mode = test | live`, the public key, and the secret / webhook secrets **encrypted at rest**. The API never returns the secrets in clear text.

There is one global setting only — the API base URL, derived from the org's `mode`:

| Mode | Base URL |
|---|---|
| `test` | `https://pay.chargily.net/test/api/v2` |
| `live` | `https://pay.chargily.net/api/v2` |

> **Security:** The Secret Key must never be exposed client-side, logged, or committed to version control. Read it from `paymentconfig` at request time and keep it in memory only for the duration of the call.

### ChargilyClient Service

The `ChargilyClient` class wraps Chargily API interactions:

```python
class ChargilyClient:
    def __init__(self, config: PaymentConfig):
        # Credentials come from the org's paymentconfig row.
        self.mode = config.mode                     # PaymentModeEnum.TEST | LIVE
        self.secret_key = decrypt(config.secret_key_encrypted)
        self.base_url = (
            "https://pay.chargily.net/test/api/v2"
            if self.mode is PaymentModeEnum.TEST
            else "https://pay.chargily.net/api/v2"
        )

    async def create_checkout(
        self,
        amount: Decimal,
        currency: str,
        success_url: str,
        failure_url: str,
        metadata: dict,
        customer_id: str | None = None,
        payment_method: str = "edahabia",
    ) -> ChargilyCheckoutResponse:
        """POST /checkouts — returns checkout URL for redirect."""

    async def retrieve_checkout(self, checkout_id: str) -> dict:
        """GET /checkouts/{id} — for manual status checks."""

    async def expire_checkout(self, checkout_id: str) -> None:
        """POST /checkouts/{id}/expire — cancel unpaid checkouts."""

    def verify_webhook_signature(
        self, raw_body: bytes, signature_header: str
    ) -> bool:
        """HMAC-SHA256 signature verification."""
```

## Product Creation Model

We **do not sync products or prices to Chargily**. A course is not a Chargily Product — each purchase is a one-off checkout created with `amount` + `currency` + `description`, and the course is identified in `metadata`. This keeps the price in one place (our DB) and avoids a second source of truth.

Chargily's Products/Prices API remains available if we ever want per-course reporting inside the Chargily dashboard, but it is not part of v1.

The checkout request includes:

```json
{
  "amount": 1500,
  "currency": "dzd",
  "description": "Algebra Basics — course access",
  "locale": "ar",
  "success_url": "https://koodook.com/course/{uuid}/payment/success",
  "failure_url": "https://koodook.com/course/{uuid}/payment/failure",
  "webhook_endpoint": "https://koodook.com/api/v1/payments/webhook/chargily/{org_uuid}",
  "chargily_pay_fees_allocation": "merchant",
  "payment_method": "edahabia",
  "metadata": {
    "order_uuid": "order_abc-123",
    "course_uuid": "abc-123",
    "user_id": "user-456",
    "org_id": "org-789"
  }
}
```

Notes:

- `currency` must be **lowercase** (`dzd`), and `amount` is an **integer**.
- `locale` accepts `ar`, `en` or `fr` — pass the learner's current language.
- `webhook_endpoint` can be set per checkout, so multi-tenant routing and local ngrok work without touching the dashboard.
- `chargily_pay_fees_allocation` is `customer`, `merchant` or `split`. We use `merchant`, so the learner pays exactly the listed price and the fee becomes a cost line.
- `metadata` is documented as a dictionary but the create sample shows an array — verify the shape in sandbox before relying on it.
- `payment_method` accepts `edahabia`, `cib` and `chargily_app` (QR). The customer can change it on the hosted page, so always read the final method from the webhook.

## Fees, Locale and Refunds

### Fees

- Fees are **plan-based** (0% for the first month, then the chosen plan including a free one). There is no fixed percentage to hardcode.
- Read `fees`, `fees_on_merchant` and `fees_on_customer` from the checkout object and **store them on the order** — the 40/60 payout math uses the real number.
- `chargily_pay_fees_allocation` decides who pays: `merchant` (us), `customer` (added on top of the price) or `split`. We use `merchant` so the learner pays exactly the listed price.

### Locale

`locale` accepts `ar`, `en` or `fr`. Pass the learner's current UI language so the hosted payment page matches the platform.

### Refunds

- **There is no refund endpoint in Chargily Pay v2.** Refunds are issued from the Chargily merchant dashboard.
- Our admin flow: refund in Chargily → click **Mark refunded** in Payments → Transactions. That writes `status = refunded` on the order and revokes the entitlement (full refund) or keeps it (partial refund).
- If Chargily ever exposes a refund webhook, the handler already treats unknown event types as no-ops, so nothing breaks.

## Checkout Flow (Detailed)

### Step 1: User Clicks "Purchase"

On the course page, the user sees a **Purchase** button with payment method options (EDAHABIA / CIB). The frontend calls the checkout API:

```typescript
const handlePurchase = async (method: 'edahabia' | 'cib') => {
  const res = await fetch(`/api/v1/payments/checkout`, {
    method: 'POST',
    body: JSON.stringify({
      resource_uuid: courseUuid,
      resource_type: 'course',
      payment_method: method,
    })
  });
  const { checkout_url } = await res.json();
  window.location.href = checkout_url;  // Redirect to Chargily
};
```

### Step 2: Backend Creates Checkout Session

The backend endpoint `POST /api/v1/payments/{org_id}/checkout`:

1. Validates the user is authenticated and the course exists and is priced.
2. Creates a `paymentorder` row with status `pending` and a snapped `amount`.
3. Calls `ChargilyClient.create_checkout()` with the course amount, success/failure URLs, and metadata.
4. Returns `{ checkout_url }` to the frontend.

### Step 3: User Redirected to Chargily

The user's browser is redirected to the **`checkout_url` returned by `POST /checkouts`** — for example `https://pay.chargily.dz/test/checkouts/{id}/pay`. The domain and path are owned by Chargily; we never construct it ourselves.

### Step 4: User Pays

On the Chargily page, the user:

- Selects the payment method (pre-selected based on the checkout request).
- For **EDAHABIA**: enters e-wallet credentials and confirms via OTP.
- For **CIB**: enters card details and completes 3D Secure if required.

### Step 5: Chargily Sends Webhook

Chargily sends a `POST` request to the configured webhook URL with the payment result.

### Step 6: Webhook Handler Processes Payment

The webhook handler verifies the signature, updates the database, and grants access.

### Step 7: User Redirected Back

After payment, Chargily redirects the user to either the `success_url` or `failure_url`:

- **Success page:** Shows "Payment successful! You now have access to this course." with a "Go to course" button.
- **Failure page:** Shows "Payment failed or was cancelled." with a "Try again" button.

## Webhook Payload Format and Verification

### Webhook Endpoint

```
POST /api/v1/payments/webhook/chargily/{org_uuid}
```

### Webhook Events

| Event | Description |
|---|---|
| `checkout.paid` | Payment completed successfully |
| `checkout.failed` | Payment failed (insufficient funds, card declined, etc.) |
| `checkout.canceled` | Customer canceled the payment |

> Event names in Chargily Pay v2 are `checkout.*`, **not** `payment.*`. There is no `checkout.refunded` event — refunds happen in the dashboard.

### Payload Format

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
    "fees_on_customer": 0,
    "chargily_pay_fees_allocation": "merchant",
    "status": "paid",
    "locale": "ar",
    "payment_method": "edahabia",
    "customer_id": "01hjjjzf07chnbkcjax2vs58fv",
    "metadata": {
      "order_uuid": "order_abc-123",
      "course_uuid": "abc-123",
      "user_id": "user-456",
      "org_id": "org-789"
    },
    "success_url": "https://koodook.com/course/abc-123/payment/success",
    "failure_url": "https://koodook.com/course/abc-123/payment/failure",
    "url": "https://pay.chargily.dz/test/checkouts/01hjjj9aymmrwe664nbzrv84sg/pay",
    "created_at": 1703577693,
    "updated_at": 1703578418
  },
  "created_at": 1703578418,
  "updated_at": 1703578418
}
```

`data` is the **full Checkout object** — there is no separate payment object. Use `data.id` (the checkout id) to find the order, `data.metadata.order_uuid` as a cross-check, and `data.fees_on_merchant` for the accounting snapshot.

### Signature Verification

Every webhook request includes a header named **`signature`**: an HMAC-SHA256 hex digest of the **raw request body**, keyed with the org's **API secret key**. Verify it before parsing anything. Missing header → `400`; mismatch → `403`.

```python
def verify_webhook_signature(self, raw_body: bytes, signature_header: str) -> bool:
    """
    HMAC-SHA256 signature verification.
    The signature is computed over the raw request body using the Secret Key.
    """
    import hmac
    import hashlib

    expected_signature = hmac.new(
        self.secret_key.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature_header)
```

If signature verification fails, the webhook is rejected with `403 Forbidden` (a missing header is `400`).

### Webhook Processing Logic

```
receive_webhook()
  ├─ verify HMAC-SHA256 over the raw body using the org's API secret key
  │    └─ missing header → 400 · mismatch → 403
  ├─ check idempotency (event id already processed?)
  │    └─ yes → 200 OK (no-op)
  ├─ event type:
  │    ├─ checkout.paid     → order paid → entitlement → enroll + community
  │    ├─ checkout.failed   → order failed
  │    └─ checkout.canceled → order canceled
  └─ return 200 OK
```

## Error Handling

### Failed Payments

- Chargily sends a `checkout.failed` webhook with the checkout object.
- The backend updates the `paymentorder` status to `failed`.
- The user is redirected to the failure page with an appropriate message.
- No access is granted.

### Expired / Canceled Sessions

- A checkout **expires automatically after 30 minutes** while still `pending`.
- The backend can cancel it earlier with `POST /checkouts/{id}/expire`.
- Chargily reports a canceled payment as `checkout.canceled`. There is **no `expired` status in the API** — if reconciliation finds a pending order past its 30-minute window, we mark it `expired` locally and stop reusing its checkout URL.

### Network Failures

- Webhook delivery is retried by Chargily with exponential backoff.
- The handler is idempotent — processing the same webhook twice does not duplicate access grants.
- Idempotency is achieved by recording every delivery in `payment_webhook_event` before doing any work.

### Idempotency

Chargily may deliver the same webhook event multiple times (at-least-once delivery). The handler guarantees idempotency by:

1. Inserting `payment_webhook_event` with `event_id` = the payload's top-level `id`. The column is **unique**.
2. If the insert conflicts, the event was already received → return `200 OK` immediately, no side effects.
3. Otherwise process inside a single transaction: resolve the order by `chargily_checkout_id`, move the status, upsert `resourceentitlement`, then mark the event `processed`.
4. On failure, mark the event `failed`, store `error_message`, and return `500` so Chargily retries.

Never key idempotency off the order status alone — a retried delivery for an already-`paid` order must still be acknowledged without touching the entitlement.

## Testing with Sandbox Environment

### Enabling Sandbox

1. Set the org's `paymentconfig.mode` to `test`.
2. Use test API keys from the Chargily merchant dashboard (Settings → API Keys → Test Mode).
3. Set the same values in **Admin Dashboard → Payments → Configuration** (once that tab is wired; today it is UI-only).

### Test Credentials

| Payment Method | Test Data |
|---|---|
| **EDAHABIA** | Use the Chargily sandbox e-wallet simulator. Any test credentials provided in Chargily docs will work. |
| **CIB Card** | Card: `4242 4242 4242 4242`, Expiry: any future date, CVV: any 3 digits |
| **Failed Payment (CIB)** | Card: `4000 0000 0000 0002` |

### Testing Checklist

- [ ] Create a checkout and verify redirect to Chargily sandbox page.
- [ ] Complete payment with EDAHABIA test credentials — verify webhook received and access granted.
- [ ] Complete payment with CIB test card — verify webhook received and access granted.
- [ ] Test failed payment scenario — verify `checkout.failed` webhook and no access granted.
- [ ] Verify webhook signature verification — send a tampered payload and expect `403`.
- [ ] Verify idempotency — simulate duplicate webhook delivery and confirm no duplicate access grants.
- [ ] Verify success/failure redirect URLs work correctly.

## Development Workflow with ngrok

Since Chargily webhooks require a public HTTPS URL:

1. Start the Koodook development server: `bun run dev` (or equivalent).
2. Start ngrok on the same port: `ngrok http 3000`.
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`).
4. In the Chargily merchant dashboard (Settings → Webhooks), set the webhook URL to: `https://abc123.ngrok.io/api/v1/payments/webhook/chargily/{org_uuid}`
5. Register for the following events: `checkout.paid`, `checkout.failed`, `checkout.canceled`.
6. Keep ngrok running — each restart generates a new URL, requiring a dashboard update.

> **Tip:** Consider upgrading to a paid ngrok plan for fixed subdomains to avoid reconfiguring webhooks on every restart.

## Security Considerations

### Webhook Signature Verification

- Every webhook request must be verified using HMAC-SHA256 before processing.
- The signature is computed over the raw request body using the Secret Key.
- Failed verification must return `403 Forbidden` immediately (missing header → `400`).
- Never process a webhook without verifying its signature.

### Secret Key Protection

- The Secret Key must be stored in environment variables, never in code.
- Do not log the Secret Key or any Chargily credentials.
- Rotate the Secret Key periodically from the Chargily dashboard.
- Use different keys for sandbox and production environments.

### Idempotency

- Always check for duplicate webhook processing to prevent double access grants.
- Use database-level constraints and transactions to ensure atomicity.

### HTTPS

- All communication with Chargily APIs uses HTTPS.
- The webhook endpoint must be served over HTTPS in production.
- ngrok provides HTTPS tunnels for local development.

### Rate Limiting

- Chargily API endpoints have rate limits. Implement appropriate backoff and retry logic in the `ChargilyClient`.
- The webhook handler should respond quickly (200 OK) and process asynchronously if needed.

---

> See [Payment System Overview](./overview.md) for the architectural context.
> See [Payment Configuration (Admin Guide)](../../04-admin-guide/payments.md) for step-by-step admin setup.
> See [Chargily Pay Documentation](https://dev.chargily.com/) for the official API reference.
