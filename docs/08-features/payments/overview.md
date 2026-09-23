# Payment System Architecture

> The Koodook payment system uses Chargily Pay v2 to process Algerian Dinar payments via EDAHABIA and CIB cards, granting course access upon successful payment.

---

## High-Level Payment Flow

```
User Browser               Koodook API                Chargily Pay
     │                          │                         │
     │  1. POST /checkout       │                         │
     │─────────────────────────►│                         │
     │                          │  2. POST /checkouts     │
     │                          │────────────────────────►│
     │                          │                         │
     │  3. ← checkout URL       │                         │
     │◄─────────────────────────│                         │
     │                          │                         │
     │  4. Redirect to          │                         │
     │     Chargily page ───────┼────────────────────────►│
     │                          │                         │
     │  5. User pays via        │                         │
     │     EDAHABIA / CIB       │                         │
     │                          │                         │
     │                          │  6. Webhook:            │
     │                          │     payment.success     │
     │                          │◄────────────────────────│
     │                          │                         │
     │                          │  7. Verify signature    │
     │                          │     Update DB           │
     │                          │     Grant access        │
     │                          │                         │
     │  8. Redirect to          │                         │
     │     success page ◄───────│                         │
     │                          │                         │
```

1. User clicks **Purchase** on a course page.
2. Frontend calls `POST /api/payments/checkout/:courseUuid` with the selected payment method.
3. Backend creates a Chargily invoice via the Chargily Pay v2 API and returns a checkout URL.
4. User is redirected to the Chargily-hosted payment page.
5. User completes payment via **EDAHABIA** (Algérie Poste e-wallet) or **CIB** (interbank card).
6. Chargily sends a `payment.success` (or `payment.failed`) webhook to the Koodook webhook endpoint.
7. Webhook handler verifies the HMAC-SHA256 signature, updates the `payment_orders` table, and creates a `course_purchases` record to grant access.
8. User is redirected back to Koodook (success or failure page) and sees the course unlocked.

## Payment Provider: Chargily Pay v2

Chargily Pay v2 is the sole payment gateway integrated with Koodook. It supports Algerian payment methods exclusively.

- **API Base URL (Production):** `https://pay.chargily.net/api/v2`
- **API Base URL (Sandbox):** `https://pay.chargily.net/test/api/v2`
- **Authentication:** Bearer token using the Chargily Secret Key
- **Webhook Signature:** HMAC-SHA256 using the Secret Key

> See [Chargily Integration](./chargily-integration.md) for the detailed API integration plan.

## Supported Payment Methods

### EDAHABIA (Algérie Poste)

- Algeria's national e-wallet service operated by Algérie Poste.
- Users authenticate on the Chargily-hosted page using their EDAHABIA credentials.
- Payment is confirmed via OTP sent to the user's registered phone number.
- Funds are deducted from the user's EDAHABIA e-wallet balance.

### CIB (Cartes Interbancaires)

- Standard interbank cards issued by Algerian banks (SATIM network).
- Users enter card details (number, expiry, CVV) on the Chargily-hosted page.
- 3D Secure authentication is performed when supported by the issuing bank.
- Payments are processed through the Algerian interbank clearing system.

## Currency

All pricing is configured in **Algerian Dinar (DZD)**. Koodook is a single-currency platform — multi-currency support is not currently available. Prices are entered and displayed in DZD throughout the admin panel, course pages, and transaction records.

## Key Components

### Checkout Creation Endpoint

**`POST /api/payments/checkout/:courseUuid`**

- Accepts: `{ payment_method: "edahabia" | "cib" }`
- Creates a `payment_orders` record with status `pending`.
- Calls Chargily `POST /checkouts` to create an invoice.
- Returns `{ checkout_url: string }` for frontend redirect.
- Sets `success_url` and `failure_url` for post-payment redirects.

### Payment Webhook Handler

**`POST /api/payments/chargily/webhook`**

- Listens for `payment.success`, `payment.failed`, `payment.refunded` events.
- Verifies the HMAC-SHA256 webhook signature before processing.
- Uses idempotency keys to prevent duplicate processing.
- On `payment.success`: updates `payment_orders` status to `paid`, creates `course_purchases` record.
- On `payment.failed`: updates status to `failed`, no access granted.
- On `payment.refunded`: updates status to `refunded`, access remains (manual revocation).

### Access Gating Logic

Access is enforced at three levels:

1. **Database flags** — The `course_purchases` table records which users have purchased which courses. The `course` table has an `access` field (`public`, `users_only`, `paid`).
2. **Backend middleware** — API endpoints for course content check whether the current user has purchased the course (or belongs to a group with access) before returning lesson data.
3. **Frontend UI gating** — The course page checks purchase status via `GET /api/payments/purchases/:courseUuid/status` and conditionally renders lesson content or a purchase prompt.

## Course Access Model

Each course has one of three access levels:

| Access Level | Description | Payment Required |
|---|---|---|
| **Public** | Anyone can view all content without authentication or payment | No |
| **Users Only** | Any authenticated (logged-in) user can access content | No |
| **Paid** | Users must purchase the course to access content | Yes |

The access level is configured in the course editor under the **Access** tab.

## Purchase History and Transaction Records

### Payment Orders Table

The `payment_orders` table stores the lifecycle of each Chargily checkout session:

| Field | Description |
|---|---|
| `id` | UUID primary key |
| `chargily_checkout_id` | Chargily checkout session identifier |
| `chargily_payment_intent_id` | Chargily payment intent identifier |
| `amount` | Transaction amount in DZD |
| `currency` | Always `DZD` |
| `status` | `pending`, `paid`, `failed`, `expired`, `refunded`, `partially_refunded` |
| `metadata` | JSONB — stores course UUID, user ID, payment method |
| `paid_at` | Timestamp of successful payment |

### Course Purchases Table

The `course_purchases` table records that a specific user purchased access to a specific course:

| Field | Description |
|---|---|
| `id` | UUID primary key |
| `user_id` | Foreign key to the user |
| `course_id` | Foreign key to the course |
| `payment_order_id` | Foreign key to the payment order |
| `purchased_at` | Timestamp of purchase |

### Admin Transaction View

Admins can view all transactions in **Admin Dashboard → Payments → Transactions**, which displays: transaction ID, course name, customer name and email, amount (DZD), payment method, status, and date. Each transaction can be expanded for full details.

## Refund Flow

1. Admin navigates to **Admin Dashboard → Payments → Transactions** and opens a completed transaction.
2. Admin clicks **Refund**, enters the refund amount (partial refunds supported), optionally enters a reason.
3. The backend calls Chargily's refund API (or handles it via the webhook).
4. The `payment_orders` status updates to `refunded` or `partially_refunded`.
5. The user's course enrollment is **not** automatically removed — manual revocation is required if needed.

## Development Setup

### Sandbox Mode

- Toggle **Sandbox Mode** ON in **Admin Dashboard → Settings → Payments → Chargily**.
- Use test API keys from the Chargily merchant dashboard (Settings → API Keys → Test Mode).
- Test card numbers are available for EDAHABIA and CIB simulations.

### Webhook Testing with ngrok

Since Chargily webhooks require a publicly accessible HTTPS URL during development:

1. Start ngrok: `ngrok http 3000`
2. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`).
3. Configure the webhook URL in the Chargily merchant dashboard: `https://abc123.ngrok.io/api/payments/chargily/webhook`
4. Keep the ngrok tunnel running alongside the local development server.

### Environment Variables

| Variable | Description |
|---|---|
| `CHARGILY_API_KEY` | Chargily API key (public key) |
| `CHARGILY_SECRET_KEY` | Chargily secret key (used for webhook verification) |
| `CHARGILY_TEST_MODE` | Boolean — `true` for sandbox, `false` for production |

## Future Payment Provider Extensibility

The payment system is designed with provider abstraction in mind:

- **`ChargilyClient`** wraps Chargily Pay v2 API calls in a dedicated service class.
- The checkout creation and webhook handling follow a pattern that can be adapted for additional providers.
- A future `PaymentProvider` abstract interface could standardize methods like `create_checkout()`, `process_webhook()`, `verify_signature()`, and `process_refund()`.

Potential future providers could include Stripe (for international payments), Paypal, or local Algerian fintech alternatives.

---

> See [Chargily Integration](./chargily-integration.md) for the detailed API integration plan.
> See [Payment Configuration (Admin Guide)](../../04-admin-guide/payments.md) for step-by-step admin setup.
> See [Store (User Guide)](../../03-user-guide/store.md) for the learner's purchase experience.
