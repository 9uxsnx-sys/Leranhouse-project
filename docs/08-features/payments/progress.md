# Payments — Progress & Roadmap

> Where the payments work stopped, what is already shipped, and the ordered list of what remains. Update this file whenever a step lands.

**Last updated:** 2026-10-19

---

## Status at a glance

| # | Step | State |
|---|---|---|
| 1 | Data model (`paymentorder`, `resourceentitlement`, `payment_webhook_event`, `paymentconfig`) | ✅ Done |
| 2 | Entitlements API (list / candidates / grant / revoke) | ✅ Done |
| 3 | Orders API (org-scoped, search + status filter) | ✅ Done |
| 4 | Access tab — Public / Private / Paid tables | ✅ Done |
| 5 | Offers tab — inline prices for courses + podcasts | ✅ Done |
| 6 | Chargily checkout creation | ✅ Done |
| 7 | Chargily webhook receiver | ✅ Done |
| 8 | Wire Transactions tab to `GET /payments/{org_id}/orders` | ✅ Done |
| 9 | Wire Overview tab to real order data | ✅ Done |
| 9b | Wire Payouts tab (40/60 net split) | ⬜ Not started |
| 10 | Learner "Get access" → checkout → Progress tab | ✅ Done — paid unlocks via the webhook; free enrolls directly |
| 11 | Podcast Access tab parity | ⬜ Not started |
| 12 | Payments Configuration (per-org Chargily keys) | ✅ Done |
| 13 | Flip `OSS_GATE` back to `true` and ship | ⬜ Not started |

---

## What is done

### 1. Data model

Files: [`apps/api/src/db/payments/`](../../../apps/api/src/db/payments/)

- `paymentorder` — one row per Chargily checkout, append-only status machine.
- `resourceentitlement` — one row per (user, resource) grant; revoked rows are kept for audit.
- `payment_webhook_event` — idempotency log keyed on the unique `event_id`.
- `paymentconfig` — per-org credentials (`mode = test | live`), secrets encrypted at rest.
- Enums: `AccessTypeEnum`, `PaymentProviderEnum`, `PaymentModeEnum`, `PaymentMethodEnum`, `PaymentOrderStatusEnum`, `EntitlementSourceEnum`, `EntitlementStatusEnum`, `WebhookEventStatusEnum`.

### 2. Entitlements API

Files: [`services/payments/entitlements.py`](../../../apps/api/src/services/payments/entitlements.py), [`routers/payments.py`](../../../apps/api/src/routers/payments.py), [`web/services/payments/entitlements.ts`](../../../apps/web/services/payments/entitlements.ts)

| Route | Behaviour |
|---|---|
| `GET /payments/{org_id}/entitlements` | Active roster for `resource_uuid` (`course_…` / `podcast_…`), search + pagination |
| `GET /payments/{org_id}/entitlements/candidates` | Org members **without** an active entitlement |
| `POST /payments/{org_id}/entitlements?user_ids=…` | Manual grant, `source=manual`, `granted_by` = acting admin |
| `DELETE /payments/{org_id}/entitlements?user_ids=…` | Revoke → `status=revoked`, keeps the row |

- Org-admin authorization in `authorize_org_admin()`; superadmin bypasses.
- Cross-org resource lookups return `404`.
- Tests: [`test_payments_entitlements_service.py`](../../../apps/api/src/tests/services/test_payments_entitlements_service.py)

### 3. Orders API

Files: [`services/payments/orders.py`](../../../apps/api/src/services/payments/orders.py), [`routers/payments.py`](../../../apps/api/src/routers/payments.py)

- `GET /payments/{org_id}/orders?search=&status=&page=&limit=` — newest first, joins the buyer.
- Search covers name, username, email, resource name and order uuid.
- Unknown `status` → `422`.
- Tests: [`test_payments_orders_service.py`](../../../apps/api/src/tests/services/test_payments_orders_service.py)

### 4. Access tab (courses)

File: [`components/Dashboard/Pages/Course/EditCourseAccess/EditCourseAccess.tsx`](../../../apps/web/components/Dashboard/Pages/Course/EditCourseAccess/EditCourseAccess.tsx)

- One toolbar mode-cycle: Public → Private → Paid. Paid is skipped with a toast while `price_amount` is empty.
- **Public** — `TrailRun` enrollment. Empty search lists linked learners, typing lists org members not linked. `Remove N` / `Add N`. Removing deletes the enrollment **and** the user's progress.
- **Private** — linked user groups with **members count** and **link date**; typing lists unlinked groups; `Remove N` / `Add N`.
- **Paid** — active entitlements via the entitlements API; `Remove N` revokes, `Add N` grants manually.
- Every row has a 3-dot menu: **Details** + **Delete** (Public/Paid), **Delete** only (Private).
- Selection clears on query / page / mode change.
- Mode + status indicators are rounded squares (`w-2.5 h-2.5 rounded`).

Backend for Public mode: [`services/courses/access.py`](../../../apps/api/src/services/courses/access.py), [`routers/courses/access.py`](../../../apps/api/src/routers/courses/access.py), [`web/services/courses/access.ts`](../../../apps/web/services/courses/access.ts).

### 5. Offers tab

File: [`components/Dashboard/Pages/Payments/PaymentsOffersPage.tsx`](../../../apps/web/components/Dashboard/Pages/Payments/PaymentsOffersPage.tsx)

- Single table of every course **and** podcast, including drafts.
- Columns: Resource (name + `Draft` tag), Type, Access, **Price (DZD)** (borderless inline input), Added.
- Toolbar: search, filter menu (Type / Access / Price / Status / Sort / Clear), one **Save** for all edited rows.
- Price semantics: empty = not priced, `0` = Free, `> 0` = DZD.
- Saving calls the existing course/podcast update endpoints with `price_amount`; explicit `null` clears the price (backend distinguishes "not provided" via `model_fields_set`).
- Status squares match the dashboard home tables.

### 6. Chargily checkout creation

Files: [`services/payments/chargily.py`](../../../apps/api/src/services/payments/chargily.py), [`services/payments/checkout.py`](../../../apps/api/src/services/payments/checkout.py), [`routers/payments.py`](../../../apps/api/src/routers/payments.py), [`web/services/payments/checkout.ts`](../../../apps/web/services/payments/checkout.ts)

- `POST /api/v1/payments/{org_id}/checkout` — body `{ resource_uuid, resource_type, payment_method, locale }`.
- Validates org membership, published resource, `access_type = paid`, `price_amount > 0`, no existing active entitlement, and an active `paymentconfig` with a stored secret.
- Creates a `paymentorder(status=pending, amount=price, price_snapshot=…)`, then calls Chargily `POST /checkouts` (integer amount, lowercase `dzd`, per-checkout `webhook_endpoint`).
- Persists `chargily_checkout_id`, `checkout_url`, `fees`, `fees_on_merchant`, `provider_payload`; returns `{ order_uuid, checkout_url, amount, currency, status }`.
- Provider failure marks the order `failed` and returns `502`.
- Course page "Get Access" now shows the price and redirects to `checkout_url`; non-paid courses enroll the learner via `POST /trail/add_course/{uuid}` (creating the trail when missing) so the course lands in the Progress tab.
- Tests: [`test_payments_checkout_service.py`](../../../apps/api/src/tests/services/test_payments_checkout_service.py)

### 12. Payments Configuration

Files: [`services/payments/config.py`](../../../apps/api/src/services/payments/config.py), [`routers/payments.py`](../../../apps/api/src/routers/payments.py), [`PaymentsConfigurationPage.tsx`](../../../apps/web/components/Dashboard/Pages/Payments/PaymentsConfigurationPage.tsx)

- `GET /payments/{org_id}/config` — provider, mode, public key, `active`, and `has_secret_key` / `has_webhook_secret` flags. Secrets are **never** returned.
- `PUT /payments/{org_id}/config` — upsert; secrets encrypted with Fernet, write-only; activating requires both a public and a secret key.
- Configuration tab rebuilt as a Chargily form: Test/Live mode, public key, secret key, webhook secret, enable toggle, and the shared Save / Saved / Saving action row.
- Tests: [`test_payments_config_service.py`](../../../apps/api/src/tests/services/test_payments_config_service.py)

### 7. Chargily webhook receiver

Files: [`services/payments/webhooks.py`](../../../apps/api/src/services/payments/webhooks.py), [`routers/payments_webhooks.py`](../../../apps/api/src/routers/payments_webhooks.py)

- `POST /api/v1/payments/webhook/chargily/{org_uuid}` — **no auth dependency**; registered before the authenticated payments router so `webhook/chargily/...` never hits the `/{org_id}` routes.
- Verifies the `signature` header (hex HMAC-SHA256 of the **raw body**) with `hmac.compare_digest`. Missing header → `400`, mismatch → `403`, unknown org → `404`.
- Secret selection: `webhook_secret` when set, otherwise the API secret key.
- Idempotency via `payment_webhook_event.event_id` (unique). A `processed` duplicate returns `200 {duplicate: true}` and does nothing; failed deliveries may be retried.
- `checkout.paid` → order `paid` (`paid_at`, `fees`, `fees_on_merchant`, `payment_method`, `provider_payload`) + active `resourceentitlement(source=purchase)` + `TrailRun` so the course appears in the Progress tab.
- `checkout.failed` / `checkout.canceled` → order `failed` / `canceled`; no entitlement.
- Unknown order or unknown event type → acknowledged with `200` and recorded, no side effects.
- Processing errors mark the event `failed`, store `error_message`, and return `500` so Chargily retries.
- Tests: [`test_payments_webhooks_service.py`](../../../apps/api/src/tests/services/test_payments_webhooks_service.py)

### Post-payment result pages

File: [`app/orgs/[orgslug]/(withmenu)/payment/[status]/page.tsx`](../../../apps/web/app/orgs/[orgslug]/(withmenu)/payment/[status]/page.tsx)

- `GET /orgs/{org_slug}/payment/success?resource=…&order=…` and `/payment/failure?resource=…&order=…`.
- Checkout now sends these as `success_url` / `failure_url` instead of returning to the course page.
- Success polls the learner trail every 2s (the webhook creates the `TrailRun`), then flips from "activating" to "You're all set"; after 20s it shows a "still confirming" state.
- Failure states that no charge was made and offers a retry path.
- Both pages use the same centered card and a **Back to course** button that returns to the resource they came from (course, podcast, or `/courses` as fallback).
- The old `?payment=success|failure` toast on the course page was removed.

### 8. Transactions tab

Files: [`components/Dashboard/Pages/Payments/PaymentsTransactionsPage.tsx`](../../../apps/web/components/Dashboard/Pages/Payments/PaymentsTransactionsPage.tsx), [`web/services/payments/orders.ts`](../../../apps/web/services/payments/orders.ts)

- `GET /payments/{org_id}/orders` replaces the old `SAMPLE_ROWS`.
- Columns: Learner (name + email), Resource, Method (`EDAHABIA` / `CIB` / `Chargily` / `—`), Amount (right-aligned, tabular DZD), Status, Date.
- Backend statuses map onto the shared four-colour square: `canceled` / `expired` → failed, `partially_refunded` → refunded, `processing` → pending.
- Toolbar: 300 ms debounced search + status filter menu; both reset the page to 1.
- Server-side pagination (20/page) rendered in the card footer: "Showing X–Y of Z" + prev/next with "Page N of M".
- Loading spinner, error card and empty state included; `keepPreviousData` keeps the table stable while paging.

### 9. Overview tab

Files: [`services/payments/overview.py`](../../../apps/api/src/services/payments/overview.py), [`routers/payments.py`](../../../apps/api/src/routers/payments.py), [`PaymentsOverviewPage.tsx`](../../../apps/web/components/Dashboard/Pages/Payments/PaymentsOverviewPage.tsx), [`web/services/payments/overview.ts`](../../../apps/web/services/payments/overview.ts)

- `GET /payments/{org_id}/overview?range=7d|30d|90d|12m` — returns `{ range, currency, revenue, series }`.
- Only `paid` orders count; the sum is taken over `paid_at` inside the selected window.
- Daily buckets for 7d/30d/90d (zero-filled, including today); the 12m range returns the last 12 calendar months so axis labels stay unique.
- The revenue card heading shows the range total (`29,990 DZD`); the area chart plots the buckets.
- `PaymentsTable` (also used on the dashboard home) now fetches live orders instead of `SAMPLE_ROWS`.
- Tests: [`test_payments_overview_service.py`](../../../apps/api/src/tests/services/test_payments_overview_service.py)

---

## What remains — in order

### 9b. Wire Payouts

- Feed the 40/60 net-profit split from paid orders + `fees_on_merchant` + the manually entered operating costs; keep the pro-rata rule (see [Teacher Payout Plan](./teacher-payout-plan.md)).
- The tab currently reads a non-existent `earnings_ledger`, so it still renders sample data.

### 10. Learner checkout and Progress tab

- **Done:** the "Get Access" button shows the price for paid courses and redirects to Chargily; after `checkout.paid` the webhook grants the entitlement and creates the `TrailRun`, so the course appears in the Progress tab. Non-paid courses enroll immediately. Chargily returns to the dedicated `payment/success` / `payment/failure` pages.
- **Remaining:** verify the locked state for `paid` without an entitlement on every lesson/activity page (price + purchase prompt, no content leak).

### 11. Podcast Access tab parity

- Mirror the three modes and the 3-dot menus in the podcast editor.
- Entitlements already accept `podcast_…` uuids — the work is frontend only.
- Decide whether the podcast needs the Public (`TrailRun`) equivalent or only Private/Paid.

### 12. Collections as a sellable bundle

- The **Payment Groups** tab is superseded for bundles by the existing Collections resource. Once Collections ships, remove the Groups tab rather than building its missing backend.
- Collections gain course-grade fields (media, access modes, price), a dashboard editor, and a purchase flow that fans out to per-course entitlements + `TrailRun`s.
- Full plan: [Collections — Implementation Plan](../collections/implementation-plan.md).

### 13. Ship gate

- Set `OSS_GATE = true` in [`app/orgs/[orgslug]/dash/payments/[subpage]/page.tsx`](../../../apps/web/app/orgs/[orgslug]/dash/payments/[subpage]/page.tsx).
- Confirm the plan gate (`standard`) is the intended requirement for cloud users.
- Run the full backend suite and the frontend typecheck (see below).

---

## How to resume

### Dev servers

```bash
bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
```

Ports: web `3000`, api `1338`, collab `4000`, postgres `5434`, redis `6379`.

> **Gotcha:** editing any file under `apps/api/` makes the dev CLI's watcher shut the **whole** session down ("Shutting down dev servers…"). Restart the CLI after every backend edit.

> **Gotcha:** a stale `apps/web/.next` cache produces `404` on course edit pages. Fix: stop the CLI, delete `apps/web/.next`, restart.

### Backend tests

```bash
cd apps/api
.\.venv\Scripts\python.exe -m pytest
```

Single file / single test:

```bash
.\.venv\Scripts\python.exe -m pytest src/tests/services/test_payments_entitlements_service.py -q
```

Baseline at the time of writing: **2382 passed, 2 skipped, 8 failed** — all 8 are pre-existing Windows/environment failures (path separators, SVG heuristic, community config, chapters tuple unpack, communities list). They are not caused by payments work.

### Frontend typecheck

```bash
cd apps/web
.\node_modules\.bin\tsc.cmd --noEmit --ignoreDeprecations 6.0
```

Baseline: **25 output lines**. Compare against that number, not against zero.

> ESLint cannot run repo-wide (`Cannot find package '@eslint/js'`) — pre-existing, unrelated to payments.

### API probing

```powershell
# login
$r = Invoke-RestMethod -Method Post -Uri http://localhost:1338/api/v1/auth/login `
  -ContentType 'application/x-www-form-urlencoded' `
  -Body 'username=admin@school.dev&password=admin123456'
$h = @{ Authorization = "Bearer $($r.tokens.access_token)" }

# entitlements roundtrip
Invoke-RestMethod -Uri "http://localhost:1338/api/v1/payments/1/entitlements?resource_uuid=course_<uuid>" -Headers $h
Invoke-RestMethod -Uri "http://localhost:1338/api/v1/payments/1/orders?limit=5" -Headers $h
```

Admin: `admin@school.dev` / `admin123456`, user id `1`, org slug `default`, org id `1`.

---

## Known constraints

- **No refund endpoint in Chargily Pay v2.** Refunds are issued in the merchant dashboard and recorded manually (`refunded` / `partially_refunded`).
- **Chargily `currency` must be lowercase `dzd`** and `amount` must be an **integer**.
- **Fees are plan-based.** Never hardcode a percentage — read `fees` and `fees_on_merchant` from Chargily and store them on the order.
- **`webhook_endpoint` is per checkout**, so multi-tenant routing and ngrok work without dashboard changes.
- **Signature is computed over the raw request body.** Read `await request.body()` before any JSON parsing; never re-serialize the payload before verifying.
- **Payments are EE-only.** `OSS_GATE` must be `true` before shipping.
