> Status: as-built · Last verified: 2026-11-15

# Payments Overview

Payments turns courses, podcasts and collections into purchasable products, processes Algerian Dinar (DZD) checkouts through Chargily Pay v2, and grants access through per-resource entitlements.

## What a paid resource is

There is no separate offer or subscription object. A resource is its own product: price and access live on the course, podcast or collection row (`price_amount`, `price_currency`, `access_type`). A resource is purchasable when `access_type = paid`, `published = true` and `price_amount > 0`; a collection also needs at least one member.

| Access type | Value | Who can open the content |
|---|---|---|
| Free | `public` | Public published content is readable without an entitlement |
| Restricted | `users_only` | Members of the linked user groups |
| Paid | `paid` | Users with an active entitlement; linked user-group members also pass |

A draft (`published = false`) overrides all three. A published paid resource is still readable as a **product page** (title, description, curriculum or episode titles, price) so a learner can decide before paying; lessons, episode audio and other content endpoints keep the strict check. See [Course Access Control](../../04-admin-guide/courses/access.md).

## Learner flow

| Surface | Behaviour |
|---|---|
| `/store` | Lists one card per published paid course, podcast and collection; each card links to the resource product page |
| Course product page | Shows the price and a **Get access** button; paid starts a Chargily checkout, free enrolls immediately |
| Podcast product page | Same price and **Get access** checkout |
| Collection product page | Same checkout; a bundle grants its members on payment |
| `/payment/success` and `/payment/failure` | Post-checkout result pages; success polls the trail (or collection access state) until access is active |

Every checkout starts from the resource page. The store is a shop window only and does not host a cart or a subscription screen; the old offer screens were removed.

## Checkout and webhook

`POST /payments/{org_id}/checkout` accepts `{ resource_uuid, resource_type, payment_method, locale }`. It validates organization membership, publication, paid access, a positive price, no existing active entitlement, and an active Chargily configuration with a stored secret. It writes a `paymentorder` (`status = pending`), snapshots the price (and, for collections, the member resource UUIDs), then creates a Chargily checkout and returns `checkout_url`.

Chargily calls `POST /payments/webhook/chargily/{org_uuid}` with no auth. The handler verifies the hex HMAC-SHA256 signature over the raw body, deduplicates on the Chargily event id, and then:

| Event | Effect |
|---|---|
| `checkout.paid` | Order becomes `paid`; active `resourceentitlement(source=purchase)` is created; a `TrailRun` enrols the learner |
| `checkout.failed` | Order becomes `failed`; no entitlement |
| `checkout.canceled` | Order becomes `canceled`; no entitlement |

A collection order grants one entitlement per snapshotted member and a `TrailRun` for each course member. Requests are idempotent; processing errors return `500` so Chargily retries. Full request and response contracts live in the [Payments API reference](../../06-api-reference/payments.md).

## Admin Payments area

The dashboard area has five pill tabs: **Overview**, **Transactions**, **Offers**, **Payouts** and **Configuration**. It is available in every deployment; only an explicit feature disable hides it.

| Tab | Content |
|---|---|
| Overview | Revenue total and trend for `7d`, `30d`, `90d` or `12m`, plus the latest orders and a **Preview shop** link |
| Transactions | Live order table with debounced search, status filter and server-side pagination |
| Offers | Price-management table over every course, podcast and collection, including drafts |
| Payouts | Monthly gross revenue, gateway fees, manual costs, 40/60 net split and pro-rata teacher payouts |
| Configuration | Per-organization Chargily mode, keys and enable toggle |

**Offers** is the only place prices are edited. Each row has an inline DZD field; `empty` means no price, `0` means explicitly free, and a positive value is the Chargily amount. One **Save** sends only the changed rows through the normal course, podcast or collection update endpoints.

**Payouts** are computed on demand from `paid` orders in the selected month; only the manually entered hosting, marketing and other costs are persisted. Gateway fees come from the order, net profit is `max(0, gross − total costs)`, and the teacher pool is 40% of net profit.

## Access roster

The Access tab on the course, podcast and collection editors renders the paid roster from the entitlements endpoints: `GET /payments/{org_id}/entitlements` for active holders, `GET /payments/{org_id}/entitlements/candidates` for members without access, `POST` to grant manually, and `DELETE` to revoke. Revoked rows are kept for audit. Rosters are paged (limit capped at 100) and fetched page by page.

## Data model

| Table | Purpose |
|---|---|
| `paymentorder` | One row per checkout and its status lifecycle; append-only |
| `resourceentitlement` | Who holds access to one resource; `source` is `purchase`, `manual`, `usergroup` or `free` |
| `payment_webhook_event` | Idempotency log keyed on the Chargily event id |
| `paymentconfig` | Per-organization Chargily credentials; secrets are encrypted and never returned |
| `payoutcost` | Manually entered monthly operating costs |

## Related

- [Payments API reference](../../06-api-reference/payments.md) — endpoints, payloads and data models
- [Payments admin guide](../../04-admin-guide/payments.md) — configuration and day-to-day use
- [Chargily integration](./chargily-integration.md) — provider details
- [Payments progress](./progress.md) — build history and constraints
