# Payments — Progress & Roadmap

> Where the payments work stopped, what is already shipped, and the ordered list of what remains. Update this file whenever a step lands.

**Last updated:** 2026-10-18

---

## Status at a glance

| # | Step | State |
|---|---|---|
| 1 | Data model (`paymentorder`, `resourceentitlement`, `payment_webhook_event`, `paymentconfig`) | ✅ Done |
| 2 | Entitlements API (list / candidates / grant / revoke) | ✅ Done |
| 3 | Orders API (org-scoped, search + status filter) | ✅ Done |
| 4 | Access tab — Public / Private / Paid tables | ✅ Done |
| 5 | Offers tab — inline prices for courses + podcasts | ✅ Done |
| 6 | Chargily checkout creation | ⬜ Not started |
| 7 | Chargily webhook receiver | ⬜ Not started |
| 8 | Wire Transactions tab to `GET /payments/{org_id}/orders` | ⬜ Not started |
| 9 | Wire Overview + Payouts tabs to real order data | ⬜ Not started |
| 10 | Learner "Get access" → checkout → Progress tab | ⬜ Not started |
| 11 | Podcast Access tab parity | ⬜ Not started |
| 12 | Payments Configuration (per-org Chargily keys) | ⬜ Not started |
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

---

## What remains — in order

### 6. Chargily checkout creation

**Goal:** a learner can start a payment and land on the Chargily page.

- New `services/payments/chargily.py` with `ChargilyClient`:
  - `create_checkout(amount: int, currency: str = "dzd", success_url, failure_url, webhook_endpoint, description, locale, metadata)`.
  - Base URL from `paymentconfig.mode`; `Authorization: Bearer <secret_key>`.
  - Read `id`, `checkout_url`, `fees`, `fees_on_merchant` from the response.
- New route `POST /api/v1/payments/{org_id}/checkout`:
  - Body: `{ resource_uuid, resource_type, payment_method }`.
  - Validate: resource exists, `access_type == paid`, `price_amount` set and `> 0`.
  - Reject if the user already holds an active entitlement (return the existing access instead).
  - Create `paymentorder(status=pending, amount=price, price_snapshot=…)`, then call Chargily, then persist `chargily_checkout_id` + `checkout_url`.
  - `success_url` / `failure_url` point at the web app; `webhook_endpoint` = `{API_URL}/api/v1/payments/webhook/chargily/{org_uuid}`.
  - Return `{ order_uuid, checkout_url }`.
- Frontend: `services/payments/checkout.ts` + wire the course page "Get access" button to redirect to `checkout_url`.

**Reference:** [Chargily Integration — Product Creation Model](./chargily-integration.md#product-creation-model).

### 7. Chargily webhook receiver

**Goal:** paid checkouts grant access automatically.

- New route `POST /api/v1/payments/webhook/chargily/{org_uuid}` — **no auth dependency** (Chargily calls it), `Request` body read raw.
- Verify header `signature` = hex HMAC-SHA256 of the **raw body** with the org's secret key, `hmac.compare_digest`. Missing header → `400`, mismatch → `403`.
- Idempotency: insert `payment_webhook_event(event_id=<payload.id>)`; unique conflict → `200` no-op.
- `checkout.paid` → order `paid` (`paid_at`, `fees`, `fees_on_merchant`, `provider_payload`, final `payment_method`) → create `resourceentitlement(source=purchase, status=active, order_id=…)`.
- `checkout.failed` → order `failed` (+ `failure_code` / `failure_message`).
- `checkout.canceled` → order `canceled`.
- Always `200` on success. Never trust `metadata` for identity beyond cross-checking `order_uuid`.
- Tests: signature valid / missing / tampered, duplicate event, each event type.

### 8. Wire the Transactions tab

- Replace `SAMPLE_ROWS` in [`PaymentsTransactionsPage.tsx`](../../../apps/web/components/Dashboard/Pages/Payments/PaymentsTransactionsPage.tsx) with `GET /payments/{org_id}/orders`.
- Map the response to the existing columns (learner, course, method, amount, status, date).
- Server-side search + status filter; keep the table's pagination in the card footer.
- Add a shared `services/payments/orders.ts` client.

### 9. Wire Overview and Payouts

- **Overview:** derive revenue and the recent-payments table from orders (`status=paid`), not sample data.
- **Payouts:** feed the 40/60 net-profit split from paid orders + `fees_on_merchant` + the manually entered operating costs; keep the pro-rata rule (see [Teacher Payout Plan](./teacher-payout-plan.md)).
- Both tabs stay display-only until real paid orders exist.

### 10. Learner checkout and Progress tab

- Course page "Get access" → `POST /payments/{org_id}/checkout` → redirect.
- Success page confirms access; the course must appear in the Progress tab right after the webhook lands.
- Failure page offers "Try again" and creates no entitlement.
- Locked state for `paid` without entitlement: show price + purchase prompt, hide lesson content.

### 11. Podcast Access tab parity

- Mirror the three modes and the 3-dot menus in the podcast editor.
- Entitlements already accept `podcast_…` uuids — the work is frontend only.
- Decide whether the podcast needs the Public (`TrailRun`) equivalent or only Private/Paid.

### 12. Payments Configuration

- Add `GET` / `PUT /payments/{org_id}/config` over `paymentconfig` (secrets write-only, never returned).
- Wire [`PaymentsConfigurationPage.tsx`](../../../apps/web/components/Dashboard/Pages/Payments/PaymentsConfigurationPage.tsx): provider, mode, public key, secret key, webhook status.
- Remove the Stripe leftovers from that page — Chargily is the only provider.

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

Baseline at the time of writing: **2353 passed, 2 skipped, 8 failed** — all 8 are pre-existing Windows/environment failures (path separators, SVG heuristic, community config, chapters tuple unpack, communities list). They are not caused by payments work.

### Frontend typecheck

```bash
cd apps/web
..\..\node_modules\.bin\tsc.cmd --noEmit --ignoreDeprecations 6.0
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
- **Payments are EE-only.** `OSS_GATE` must be `true` before shipping.
