> Status: as-built · Last verified: 2026-11-15

# Store

The store is the organization's shop window. It lists the paid, published courses, podcasts and collections in one grid at `/store`.

## What appears

A resource is listed only when all of these are true:

- Access type is `paid`.
- It is published.
- It has a numeric price greater than zero.

There is no separate offer product, no subscription and no invoice page. Each resource is one card.

| Card element | Content |
|---|---|
| Thumbnail | Resource cover when set, otherwise a shopping-bag placeholder |
| Type badge | Course, Podcast or Collection |
| Name and description | Resource title and short description |
| Price | Formatted in the resource currency (DZD) |
| Action | **Get access**, which is part of the card link |

A count line above the grid states how many products are available. When the organization disables payments, the page shows an availability message instead of the grid; when no resource qualifies, it shows an empty state.

## Buying a course or collection

1. Select a card. It opens the resource's own product page, not a separate store offer page.
2. Press **Get access** in the access card.
3. You are redirected to Chargily Pay.
4. Choose **EDAHABIA** (Algérie Poste) or **CIB** (bank card) on the Chargily page.
5. After payment, you return to a result page that confirms the outcome.
6. Return to the resource; the access card now shows **Continue learning** or the start action.

If the payment fails or is cancelled, the result page reports it and no entitlement is granted. You can start the checkout again from the same resource page.

## Payment methods

| Method | What you need |
|---|---|
| EDAHABIA | An Algérie Poste e-wallet; you confirm on the Chargily page |
| CIB | An Algerian bank card; you enter the card details on the Chargily page |

Card and wallet details are entered on Chargily, not on the organization site. The checkout returns you to the organization with a success or failure status.

## Podcasts

Paid podcasts are listed in the store like any other product, and their podcast page stays readable. On that page the access card shows the price and **Get access** opens the same Chargily checkout; episode audio remains gated by the entitlement.

## Where prices come from

Prices are set by the organization in **Payments → Offers**. The store reads the price stored on the resource; it never edits it. A resource with an empty price or a zero price is not listed here.

## Related

- [Courses](./courses.md), [Collections](./collections.md) and [Podcasts](./podcasts.md) — the product pages.
- [Payments admin guide](../04-admin-guide/payments.md) — pricing and Chargily configuration.
- [Payments API](../06-api-reference/payments.md).
