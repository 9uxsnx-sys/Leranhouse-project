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
| `/checkouts` | POST | Create a new checkout session (invoice) |
| `/checkouts/{id}` | GET | Retrieve checkout details |
| `/checkouts/{id}/expire` | POST | Expire an unpaid checkout |
| `/payments/{id}` | GET | Retrieve payment details |
| `/payments/{id}/refund` | POST | Refund a payment |

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

### Environment Variables

```bash
CHARGILY_API_KEY="your_api_key_here"
CHARGILY_SECRET_KEY="your_secret_key_here"
CHARGILY_TEST_MODE=true   # Set to false in production
```

### ChargilyClient Service

The `ChargilyClient` class wraps Chargily API interactions:

```python
class ChargilyClient:
    def __init__(self):
        self.test_mode = settings.CHARGILY_TEST_MODE
        self.secret_key = settings.CHARGILY_SECRET_KEY
        self.base_url = (
            "https://pay.chargily.net/test/api/v2"
            if self.test_mode
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

Each course on Koodook maps to a product in Chargily. The product is created implicitly when a checkout is generated — Chargily treats each checkout as a unique invoice line item.

The checkout request includes:

```json
{
  "amount": 1500,
  "currency": "DZD",
  "success_url": "https://koodook.com/courses/{uuid}/payment/success",
  "failure_url": "https://koodook.com/courses/{uuid}/payment/failure",
  "payment_method": "edahabia",
  "metadata": {
    "course_uuid": "abc-123",
    "user_id": "user-456",
    "org_id": "org-789"
  }
}
```

## Checkout Flow (Detailed)

### Step 1: User Clicks "Purchase"

On the course page, the user sees a **Purchase** button with payment method options (EDAHABIA / CIB). The frontend calls the checkout API:

```typescript
const handlePurchase = async (method: 'edahabia' | 'cib') => {
  const res = await fetch(`/api/payments/checkout/${courseUuid}`, {
    method: 'POST',
    body: JSON.stringify({ payment_method: method })
  });
  const { checkout_url } = await res.json();
  window.location.href = checkout_url;  // Redirect to Chargily
};
```

### Step 2: Backend Creates Checkout Session

The backend endpoint `POST /api/payments/checkout/:courseUuid`:

1. Validates the user is authenticated and the course exists and is priced.
2. Creates a `payment_orders` record with status `pending`.
3. Calls `ChargilyClient.create_checkout()` with the course amount, success/failure URLs, and metadata.
4. Returns `{ checkout_url }` to the frontend.

### Step 3: User Redirected to Chargily

The user's browser is redirected to the Chargily-hosted payment page. The URL is of the form:

```
https://pay.chargily.net/checkout/{checkout_id}
```

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
POST /api/payments/chargily/webhook
```

### Webhook Events

| Event | Description |
|---|---|
| `payment.success` | Payment completed successfully |
| `payment.failed` | Payment failed (insufficient funds, card declined, etc.) |
| `payment.refunded` | Payment was refunded |

### Payload Format

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

### Signature Verification

Every webhook request includes a signature header. The handler verifies the signature using the Secret Key:

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

If signature verification fails, the webhook is rejected with `401 Unauthorized`.

### Webhook Processing Logic

```
receive_webhook()
  ├─ verify HMAC-SHA256 signature
  │    └─ fail → 401 Unauthorized
  ├─ check idempotency (already processed?)
  │    └─ yes → 200 OK (no-op)
  ├─ event type:
  │    ├─ payment.success → update payment_orders → create course_purchases
  │    ├─ payment.failed  → update payment_orders status to failed
  │    └─ payment.refunded → update payment_orders status to refunded
  └─ return 200 OK
```

## Error Handling

### Failed Payments

- Chargily sends a `payment.failed` webhook with a failure reason (insufficient funds, card declined, expired card, etc.).
- The backend updates the `payment_orders` status to `failed`.
- The user is redirected to the failure page with an appropriate message.
- No access is granted.

### Expired Sessions

- Unpaid checkout sessions expire after a Chargily-defined period.
- The backend can proactively expire sessions via `POST /checkouts/{id}/expire`.
- Expired sessions are handled gracefully — if a webhook arrives after expiry, it is processed if the signature is valid and the order is still in `pending` status.

### Network Failures

- Webhook delivery is retried by Chargily with exponential backoff.
- The handler should be idempotent — processing the same webhook twice should not duplicate access grants.
- Idempotency is achieved by checking `payment_orders.chargily_checkout_id` before processing.

### Idempotency

Chargily may deliver the same webhook event multiple times (at-least-once delivery). The webhook handler ensures idempotency by:

1. Checking if a `payment_orders` record with the given `chargily_checkout_id` already has a non-`pending` status.
2. If already processed, returning `200 OK` without side effects.
3. Using database transactions to atomically update payment status and create purchase records.

## Testing with Sandbox Environment

### Enabling Sandbox

1. Set `CHARGILY_TEST_MODE=true` in environment variables.
2. Use test API keys from the Chargily merchant dashboard (Settings → API Keys → Test Mode).
3. Toggle **Sandbox Mode** ON in Admin Dashboard → Settings → Payments → Chargily.

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
- [ ] Test failed payment scenario — verify `payment.failed` webhook and no access granted.
- [ ] Verify webhook signature verification — send a tampered payload and expect 401.
- [ ] Verify idempotency — simulate duplicate webhook delivery and confirm no duplicate access grants.
- [ ] Verify success/failure redirect URLs work correctly.

## Development Workflow with ngrok

Since Chargily webhooks require a public HTTPS URL:

1. Start the Koodook development server: `bun run dev` (or equivalent).
2. Start ngrok on the same port: `ngrok http 3000`.
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`).
4. In the Chargily merchant dashboard (Settings → Webhooks), set the webhook URL to: `https://abc123.ngrok.io/api/payments/chargily/webhook`
5. Register for the following events: `payment.success`, `payment.failed`, `payment.refunded`.
6. Keep ngrok running — each restart generates a new URL, requiring a dashboard update.

> **Tip:** Consider upgrading to a paid ngrok plan for fixed subdomains to avoid reconfiguring webhooks on every restart.

## Security Considerations

### Webhook Signature Verification

- Every webhook request must be verified using HMAC-SHA256 before processing.
- The signature is computed over the raw request body using the Secret Key.
- Failed verification must return `401 Unauthorized` immediately.
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
