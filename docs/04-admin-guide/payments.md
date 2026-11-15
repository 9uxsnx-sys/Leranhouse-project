> Status: as-built · Last verified: 2026-11-15

# Payments

Payments covers Chargily configuration, order history, per-resource prices, and the monthly teacher-payout report. All amounts are in Algerian dinars (DZD).

## Tabs

The area has five tabs: **Overview**, **Transactions**, **Offers**, **Payouts** and **Configuration**. When payments are disabled for the organization, the area renders a feature-disabled view.

## Overview

The overview shows revenue for a selected range (`7d`, `30d`, `90d`, `12m`) and a **Preview shop** link that opens the learner store in a new tab.

| Block | Content |
|---|---|
| Revenue | Total for the range, with a trend chart; zero revenue shows a "No revenue yet" state |
| Recent payments | The latest ten orders |

## Transactions

Search is debounced and combines with a status filter: All, Paid, Pending, Processing, Failed, Canceled or Refunded.

| Column | Content |
|---|---|
| Learner | Name and email |
| Resource | Purchased course, podcast or collection |
| Method | EDAHABIA, CIB, Chargily, or a dash |
| Amount | Amount and currency |
| Status | Colored status dot and label |
| Date | Paid date, falling back to creation date |

The table is read-only: there is no refund or status-edit control in this tab.

## Offers

Offers is the price-management screen. It lists **all** organization resources — courses, podcasts and collections — regardless of access mode or publish state.

| Column | Content |
|---|---|
| Resource | Kind icon, name, and a Draft label when unpublished |
| Type | Course, Podcast or Collection |
| Access | Public, Members (`users_only`) or Paid, with a colored dot |
| Price | Inline numeric field, fixed to DZD; empty means no price |
| Added | Creation date |

Search and a filter menu complete the toolbar. Filters cover type, access, price (needs price, has price, free), status (published, draft) and sort (name, price, newest). After editing any number of rows, press **Save** once; only changed rows are sent.

| Price value | Meaning |
|---|---|
| Empty | No price; the resource cannot switch to Paid |
| `0` | Explicitly free |
| Greater than `0` | Chargily price in DZD |

## Payouts

Payouts is a monthly reconciliation report. It does not move money.

1. Pick a month from the selector (the last twelve months are available).
2. Enter **Hosting**, **Marketing** and **Other** operating costs, then press **Save**.

| Row | Calculation |
|---|---|
| Gross revenue | Paid orders in the month |
| Gateway fees | Chargily fees, read-only |
| Total costs | Gateway fees plus the three manual costs |
| Net profit | Gross revenue minus total costs, never below zero |
| Teacher pool | Net profit × the teacher share (40% by default) |
| Platform pool | Remaining net profit |
| Unattributed revenue | Revenue without an active author, when present |

The teacher table lists each teacher with course count, gross attributed revenue, share and payout. Payouts are pro-rata against the teacher pool; a total row sums them.

## Configuration

| Field | Behaviour |
|---|---|
| Mode | Test or live |
| Public key | Readable and editable |
| Secret key | Password field; write-only, shown as stored when set |
| Webhook secret | Optional password field; write-only |
| Active | Enables payments for the organization |

The status pill reads not configured, active or inactive. **Save** only becomes actionable when something changed. Secret keys are encrypted at rest; enabling payments without a stored secret shows a warning.

## How a paid purchase works

1. An admin sets `access_type = paid` on a published resource and a positive price in Offers.
2. The product page shows the price and a **Get access** button.
3. For a course or collection, the button calls checkout with the resource UUID and redirects to Chargily.
4. Chargily returns the learner to the payment result page; the webhook grants the entitlement.
5. Back on the resource, the access card shows progress and a continue/start action.

For a paid podcast the same rule applies: the podcast page shows the price and **Get access** opens the checkout, and episode audio stays gated by the entitlement.

## Related

- [Store](../03-user-guide/store.md) — the learner-facing shop.
- [Payments API](../06-api-reference/payments.md) and [Chargily integration](../08-features/payments/chargily-integration.md).
- [Developer guide](../05-developer-guide/README.md).
