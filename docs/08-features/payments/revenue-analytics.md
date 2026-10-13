# Revenue Analytics — Dashboard Section

> **Status:** Planned
> **Route:** `/orgs/{orgslug}/dash/revenue/{subpage}`
> **Sits beside:** [Payments](./overview.md) · [Teacher Payout Plan](./teacher-payout-plan.md)

Money gets its **own top-level dashboard section**, not a tab inside Analytics.

---

## 1. Why a separate section (not an Analytics tab)

Analytics covers **product / learning / audience health**. Revenue was originally one of its sub-tabs, but the money surface is:

- **audience-different** — owner / finance, not general admin,
- **deep** — teachers, payouts, refunds, fees, failures (4–5 sub-pages),
- **related to Payments** — same domain as the existing `/dash/payments/*` section.

So it is promoted to its own sidebar entry, beside **Payments**.

## 2. Structure

Left-to-right **pill sub-navigation**, the same pattern as the org-settings and Analytics pages, with a shared **date-range action row** above the content.

| # | Sub-tab | Core question |
|---|---------|----------------|
| 1 | **Overview** | "Are we making money?" |
| 2 | **By course** | "Which courses earn?" |
| 3 | **By teacher** | "Who earns what?" |
| 4 | **Payouts** | "What do we owe, and when?" |
| 5 | **Payments** | "What failed or got refunded?" |

## 3. Features per sub-tab

Pulled from the metrics catalog ([Analytics §2.3 / §2.5 / §2.7 / §2.9](../analytics/overview.md)).

### Overview
| Feature | Source | Tier |
|---------|--------|------|
| Revenue over time (DZD) | `payment_orders` | A |
| Sales over time (order count) | `payment_orders` | A |
| AOV · Refunds · Conversion | derived | A / B |

### By course
| Feature | Source | Tier |
|---------|--------|------|
| Revenue per course | `payment_orders` ⋈ `course` | A |
| Sales per course | `course_purchases` | A |
| View → purchase conversion per course | events ⋈ payments | B |

### By teacher
| Feature | Source | Tier |
|---------|--------|------|
| Gross → fees → net → 40/60 share | payments + [split logic](./teacher-payout-plan.md) | A |
| Revenue per teacher | payments ⋈ `resource_authors` | A |
| Active teachers | `resource_authors` | A |

### Payouts
| Feature | Source | Tier |
|---------|--------|------|
| Payout runs / history | payout ledger | A |
| Unpaid balance per teacher | ledger | A |

### Payments
| Feature | Source | Tier |
|---------|--------|------|
| Failed payments (recent) | `payment_orders.status = failed` | A |
| Failure reasons | `analytics_events.properties.error` | B |
| Refunds | `payment_orders.status = refunded` | A |
| Gateway fees | payment records | A |

## 4. Data sources

- **Tier A** — `payment_orders`, `course_purchases`, `resource_authors`, users (all existing Postgres tables).
- **Tier B** — `analytics_events` (`checkout_started`, `properties.error`), needed only for **checkout conversion** and **failure reasons**. Everything else is Tier A. `checkout_started` is the one event here that is **not wired yet** — it is absent from the ingest whitelist (`apps/api/src/services/analytics/events.py`); add it when the checkout is instrumented. The table itself already exists — see [Analytics — implementation plan §3](../analytics/implementation-plan.md).

## 5. UI approach

- **Reuse the locked analytics components** — `Card` / `ChartCard`, `TrendChart`, bar charts, `DataTable`, `Filters`. Nothing is rebuilt; the same cards simply render under this route.
- **No KPI stat cards.** Analytics tabs are chart-first; single numbers live in the **card header** (e.g. *Revenue over time — 238k DZD · AOV 5,780*).
- **12-column grid**: one full-width hero per view, then 2-up rows.
- Shared **date-range action row** (same `AnalyticsToolbar`).

## 6. Related

- [Payments — Architecture](./overview.md)
- [Teacher Payout Plan](./teacher-payout-plan.md)
- [Analytics — Feature Catalog & Plan](../analytics/overview.md)
