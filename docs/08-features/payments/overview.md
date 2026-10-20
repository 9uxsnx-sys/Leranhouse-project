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
     │                          │     checkout.paid       │
     │                          │◄────────────────────────│
     │                          │                         │
     │                          │  7. Verify signature    │
     │                          │     Update paymentorder │
     │                          │     Grant entitlement   │
     │                          │                         │
     │  8. Redirect to          │                         │
     │     success page ◄───────│                         │
     │                          │                         │
```

1. User clicks **Purchase** on a course page.
2. Frontend calls `POST /api/v1/payments/{org_id}/checkout` with the resource and payment method.
3. Backend creates a Chargily checkout via the Chargily Pay v2 API and returns `checkout_url`.
4. User is redirected to the Chargily-hosted payment page.
5. User completes payment via **EDAHABIA** (Algérie Poste e-wallet) or **CIB** (interbank card).
6. Chargily sends a `checkout.paid` (or `checkout.failed` / `checkout.canceled`) webhook.
7. The webhook handler verifies the hex HMAC-SHA256 `signature` over the raw body, moves the `paymentorder` row to `paid`, and creates a `resourceentitlement` row (`source=purchase`).
8. User is redirected back to Koodook (success or failure page) and sees the course unlocked.

> **Implementation status:** the whole server-side purchase loop is built — checkout creation, signature-verified webhook, order lifecycle, entitlement grant, and course enrollment. Collections are purchasable bundles: the order snapshots their members and the webhook grants one entitlement plus one `TrailRun` per member course. The post-payment result pages, the Transactions tab and the Overview tab are live. What remains is wiring Payouts to real orders, podcast Access parity, and lifting the OSS gate. See [Progress & Roadmap](./progress.md).

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

### Implemented today

All routes are mounted under `/api/v1/payments` and require an authenticated user; the service layer additionally requires an organization administrator.

| Route | Purpose |
|---|---|
| `GET /payments/{org_id}/entitlements?resource_uuid=…` | Active access roster for a course/podcast/collection (Paid mode table) |
| `GET /payments/{org_id}/entitlements/candidates?resource_uuid=…` | Org members **without** access (the search picker) |
| `POST /payments/{org_id}/entitlements?resource_uuid=…&user_ids=1,2` | Manual grant (`source=manual`, `granted_by` = acting admin) |
| `DELETE /payments/{org_id}/entitlements?resource_uuid=…&user_ids=1,2&reason=…` | Revoke — flips `status` to `revoked`, keeps the row for audit |
| `GET /payments/{org_id}/orders?search=…&status=…&page=…&limit=…` | Paginated order list, newest first |
| `GET /payments/{org_id}/config` | Chargily settings (secrets never returned) |
| `PUT /payments/{org_id}/config` | Upsert settings; secrets write-only, encrypted at rest |
| `POST /payments/{org_id}/checkout` | Create a pending order + Chargily checkout, return `checkout_url` |
| `POST /payments/webhook/chargily/{org_uuid}` | Chargily webhook (no auth; HMAC-verified, idempotent) |

Supporting services:

- [`services/payments/entitlements.py`](../../../apps/api/src/services/payments/entitlements.py) — resolve resource (`course_…` / `podcast_…`), authorize org admin, grant/revoke/list.
- [`services/payments/orders.py`](../../../apps/api/src/services/payments/orders.py) — org-scoped order list with user join, multi-field search and status filter (unknown status → `422`).
- [`services/payments/config.py`](../../../apps/api/src/services/payments/config.py) — per-org Chargily credentials; Fernet-encrypted secrets, write-only.
- [`services/payments/chargily.py`](../../../apps/api/src/services/payments/chargily.py) — `ChargilyClient` wrapper (`POST /checkouts`).
- [`services/payments/checkout.py`](../../../apps/api/src/services/payments/checkout.py) — validation, order creation, Chargily call, redirect URLs.
- [`services/payments/webhooks.py`](../../../apps/api/src/services/payments/webhooks.py) — signature verification, idempotency, order/entitlement/enrollment updates.
- [`routers/payments.py`](../../../apps/api/src/routers/payments.py) / [`routers/payments_webhooks.py`](../../../apps/api/src/routers/payments_webhooks.py) — HTTP layers.

### Webhook Handler

**`POST /api/v1/payments/webhook/chargily/{org_uuid}`** — no auth dependency (Chargily calls it); included before the authenticated payments router.

- Receives `checkout.paid`, `checkout.failed`, `checkout.canceled`.
- Verifies the `signature` header (hex HMAC-SHA256 of the **raw body**) with the webhook secret, falling back to the API secret key. Missing header → `400`, mismatch → `403`.
- Idempotent via `payment_webhook_event.event_id` (unique) — a processed duplicate returns `200` and is skipped.
- `checkout.paid` → order `paid` + `resourceentitlement(source=purchase, status=active)` + `TrailRun` (Progress tab).
- `checkout.failed` / `checkout.canceled` → order `failed` / `canceled`, no entitlement.
- Unknown orders are acknowledged with `200`; processing errors return `500` so Chargily retries.

### Not built yet

- Learner-facing access-status and own purchase-history endpoints.

### Access Gating Logic

Access is enforced at three levels:

1. **Database** — `access_type` and `published` on the resource; `resourceentitlement` records who holds paid access.
2. **Backend** — `check_resource_access()` runs on every read: draft → author/admin/maintainer, then access type (paid → active entitlement, restricted → linked user group, public → allow). Denials return `403`.
3. **Frontend** — inaccessible resources are hidden from catalogs; Paid resources render a price/lock banner instead of lesson content.

There is no anonymous browsing: the platform is login-only, so every check starts from a valid session.

## Course Access Model

LearnHouse is a **login-only platform** — no route is reachable without a session. Each course then has one of three access types:

| Access Type | `access_type` | Description | Payment Required |
|---|---|---|---|
| **Free** | `public` | Every logged-in user can view all content | No |
| **Restricted** | `users_only` | Only members of the user groups linked to the course. A whitelist — other logged-in users get `403` and the course is absent from their catalog | No |
| **Paid** | `paid` | Only users with an active purchase entitlement | Yes |

`published = false` (draft) overrides all three: only the author, admin or maintainer can open the course, including via a direct checkout call.

The access type is configured in the course editor under the **Access** tab. See [Course Access Control](../../04-admin-guide/courses/access.md) for the full rule table.

## Purchase History and Transaction Records

### `paymentorder`

One row per Chargily checkout and its lifecycle. Append-only: rows move through the status machine and are never deleted.

| Field | Description |
|---|---|
| `id` | Integer primary key |
| `order_uuid` | Public order identifier (unique, indexed) |
| `org_id` / `user_id` | Owning organization and buyer |
| `resource_uuid` / `resource_type` / `resource_name` | What is being sold (`course_…` / `podcast_…` / `collection_…`) |
| `amount` / `currency` | Integer DZD, snapshotted at order creation (`currency` defaults to `DZD`) |
| `price_snapshot` | JSONB — the resource price at checkout time |
| `payment_method` | `edahabia`, `cib` or `chargily_app` |
| `status` | `pending`, `processing`, `paid`, `failed`, `canceled`, `expired`, `refunded`, `partially_refunded` |
| `chargily_checkout_id` | Chargily checkout id (unique) — the webhook lookup key |
| `chargily_payment_id` / `checkout_url` | Chargily identifiers and the redirect URL |
| `idempotency_key` | Unique — blocks double-submit from the checkout page |
| `customer_name` / `customer_email` / `customer_phone` | Receipt data (identity always comes from `user_id`) |
| `fees` / `fees_on_merchant` | Read from Chargily, never computed locally |
| `failure_code` / `failure_message` / `provider_payload` | Failure detail and the raw provider payload |
| `expires_at` / `paid_at` | Checkout expiry (30 min) and payment timestamp |

### `resourceentitlement`

Grants a user access to one paid resource. Created by the webhook on `checkout.paid`, by an admin manual grant, or by a user-group sync. A revoked row is kept for audit — it is never deleted.

| Field | Description |
|---|---|
| `org_id` / `user_id` | Organization and grantee |
| `resource_uuid` / `resource_type` | The course, podcast, or collection |
| `source` | `purchase`, `manual`, `usergroup`, `free` |
| `order_id` | FK to `paymentorder` (nullable, `SET NULL` on delete) |
| `status` | `active`, `revoked` |
| `valid_from` / `valid_until` | `NULL` = lifetime |
| `granted_by` / `granted_at` | Acting admin (manual grants) and grant timestamp |
| `revoked_at` / `revoke_reason` | Set when the row is revoked |

An active entitlement is unique per `(user_id, resource_uuid)` — enforced by a partial unique index in the migration.

### `payment_webhook_event`

Idempotency log for Chargily deliveries: `event_id` (unique), `event_type`, `status` (`received` / `processing` / `processed` / `failed`), `attempts`, `raw_payload` (JSONB), `error_message`, `received_at`, `processed_at`.

### `paymentconfig`

Per-organization provider credentials — `provider` (`chargily`), `mode` (`test` / `live`), `public_key`, encrypted secret keys, `active`. One row per `(org_id, provider)`.

### Admin Transaction View

Admins can view all transactions in **Admin Dashboard → Payments → Transactions**, which displays: learner name and email, resource name, amount (DZD), payment method, status, and date. Backed by `GET /payments/{org_id}/orders` with server-side search, status filter and pagination.

## Admin Dashboard UI (v1 — implemented)

The `/dash/payments/{subpage}` section uses the same shell as **Organization Settings** and **Users Settings**:

- `bg-[#f8f8f8]` page, three `max-w-7xl` rows (title → tab bar → content)
- `text-3xl md:text-4xl font-semibold text-ui-fg-base` page title
- one `PageTabs variant="pill"` row (sliding white indicator), no nested tab bars
- content in `mt-8 pb-10` with the shared `rounded-xl border border-gray-100 shadow-sm` card shell

### Tabs

| Tab | Route | Content |
|---|---|---|
| **Overview** | `/dash/payments/overview` | Date-range action row + *Preview shop*, full-width revenue area chart, recent payments table (10 rows) |
| **Transactions** | `/dash/payments/transactions` | Search + status filter, table: learner, course, method (EDAHABIA/CIB), amount, status, date |
| **Offers** | `/dash/payments/offers` | Single table of every course and podcast: resource, type, access, inline **Price (DZD)** input, added date. Toolbar = search + filter + one Save for all edited rows. **This is the only place prices are set.** |
| **Payment Groups** | `/dash/payments/groups` | Removed — superseded by Collections; the route redirects to the overview |
| **Payouts** | `/dash/payments/payouts` | Month picker (month name only), editable monthly costs, live 40/60 profit split, pro-rata teacher payout table with total row |
| **Configuration** | `/dash/payments/configuration` | Single Chargily section: Test/Live mode, public key, secret key, webhook secret, enable toggle |

Removed in this pass: the old `overview | offers | groups | configuration` underline bar, the header buttons, and the **second** tab bar inside Overview (`customers | transactions | subscriptions`). Customers and subscriptions are folded into **Transactions**; Stripe-only surfaces are dropped because Chargily has no subscription model.

### Status

| Area | State |
|---|---|
| Entitlements (list / candidates / grant / revoke) | **Done** — service + router + tests, wired to the Access tab's Paid mode |
| Orders list | **Done** — service + router + tests |
| Offers tab (prices for courses & podcasts) | **Done** — reads `price_amount`, writes via the existing update endpoints |
| Chargily checkout creation | **Done** — `POST /payments/{org_id}/checkout` + course page redirect |
| Chargily webhook receiver | **Done** — HMAC-verified, idempotent, grants entitlement + enrolls |
| Transactions / Overview / Payouts tabs | **Done** — live orders, revenue and payout reports from `GET /payments/{org_id}/orders`, `/overview` and `/payouts` |
| Payments Configuration | **Done** — `GET` / `PUT /payments/{org_id}/config` + Chargily form |
| Learner checkout ("Get access") | **Done** — paid redirects to Chargily and unlocks via the webhook; free enrolls immediately |
| Post-payment success/failure page | **Done** — `/orgs/{slug}/payment/{success,failure}`, polls until the entitlement lands |

- Payments is available in **every deployment**: the OSS gate and the plan requirement were removed, so the tab never shows an upgrade screen.
- The ordered remaining work is tracked in [Progress & Roadmap](./progress.md).

### Frontend files

| File | Purpose |
|---|---|
| `app/orgs/[orgslug]/dash/payments/[subpage]/page.tsx` | Shell + tab set (no plan/OSS gate) |
| `components/Dashboard/Pages/Payments/PaymentsOverviewPage.tsx` | Overview tab — live revenue chart + recent payments |
| `components/Dashboard/Pages/Payments/PaymentsTransactionsPage.tsx` | Transactions tab — live orders (search, status filter, pagination) |
| `components/Dashboard/Home/PaymentsTable.tsx` | Recent payments table — fetches the newest orders |
| `components/Dashboard/Pages/Payments/PaymentsOffersPage.tsx` | Offers tab — courses + podcasts, inline prices, filter, toolbar Save |
| `components/Dashboard/Pages/Payments/PaymentsConfigurationPage.tsx` | Configuration tab — Chargily mode/keys/enable |
| `components/Dashboard/Pages/Payments/PaymentsPayoutsPage.tsx` | Payouts tab |
| `components/Dashboard/Pages/Course/EditCourseAccess/EditCourseAccess.tsx` | Access tab — Public / Private / Paid tables |
| `app/orgs/[orgslug]/(withmenu)/payment/[status]/page.tsx` | Post-payment success/failure result page |
| `services/payments/entitlements.ts` | Grant / revoke entitlement calls |
| `services/payments/checkout.ts` | Create a Chargily checkout for a resource |
| `services/courses/access.ts` | Link / unlink users for Public mode |
| `components/Dashboard/Pages/Payments/PaymentStatus.tsx` | Shared status square (paid / failed / pending / refunded) |
| `components/Dashboard/Home/PaymentsTable.tsx` | Recent payments table, reused by Overview |

## Refund Flow

1. Admin opens the order in **Admin Dashboard → Payments → Transactions**.
2. Admin issues the refund in the **Chargily merchant dashboard** (Chargily Pay v2 has no refund endpoint).
3. Admin clicks **Mark refunded** in Koodook, entering the amount (full or partial) and an optional reason.
4. The `paymentorder` status becomes `refunded` or `partially_refunded`.
5. A full refund revokes the entitlement; a partial refund keeps it. Revocation is explicit — nothing is deleted.

## Development Setup

### Sandbox Mode

- Credentials are **per organization** in `paymentconfig` (`mode = test` / `live`).
- Use test API keys from the Chargily merchant dashboard (Settings → API Keys → Test Mode).
- Test card numbers are available for EDAHABIA and CIB simulations.

### Webhook Testing with ngrok

Since Chargily webhooks require a publicly accessible HTTPS URL during development:

1. Start ngrok against the API port: `ngrok http 1338`
2. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`).
3. Set `webhook_endpoint` on the checkout (or in the Chargily dashboard) to: `https://abc123.ngrok.io/api/v1/payments/webhook/chargily/{org_uuid}`
4. Keep the ngrok tunnel running alongside the dev servers.

### Environment Variables

Chargily credentials are **not global env vars** — they live per organization in `paymentconfig` with the secret keys encrypted at rest. The only global setting is the API base URL selection, derived from the org's `mode`:

| Value | Base URL |
|---|---|
| `test` | `https://pay.chargily.net/test/api/v2` |
| `live` | `https://pay.chargily.net/api/v2` |

## Future Payment Provider Extensibility

The payment system is designed with provider abstraction in mind:

- **`ChargilyClient`** wraps Chargily Pay v2 API calls in a dedicated service class.
- The checkout creation and webhook handling follow a pattern that can be adapted for additional providers.
- A future `PaymentProvider` abstract interface could standardize methods like `create_checkout()`, `process_webhook()`, `verify_signature()`, and `process_refund()`.

Potential future providers could include Stripe (for international payments), Paypal, or local Algerian fintech alternatives.

---

> See [Chargily Integration](./chargily-integration.md) for the detailed API integration plan.
> See [Revenue Analytics](./revenue-analytics.md) for the planned Revenue dashboard section.
> See [Payment Configuration (Admin Guide)](../../04-admin-guide/payments.md) for step-by-step admin setup.
> See [Store (User Guide)](../../03-user-guide/store.md) for the learner's purchase experience.
