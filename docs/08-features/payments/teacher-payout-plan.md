# Teacher Payout & Revenue Share Plan

> Architecture and implementation plan for the Koodook teacher payout system: how teachers are assigned to courses, how revenue is collected, how monthly profit is calculated, and how the 40/60 pro-rata split is distributed automatically.

---

## Table of Contents

- [Business Model](#business-model)
- [Revenue Flow Overview](#revenue-flow-overview)
- [Core Architecture Layers](#core-architecture-layers)
  - [Layer 1: Teacher-to-Course Assignment](#layer-1-teacher-to-course-assignment)
  - [Layer 2: Earnings Ledger](#layer-2-earnings-ledger)
  - [Layer 3: Monthly Profit Calculation](#layer-3-monthly-profit-calculation)
  - [Layer 4: Pro-Rata Distribution](#layer-4-pro-rata-distribution)
  - [Layer 5: Payout Execution](#layer-5-payout-execution)
  - [Layer 6: Analytics & Reporting](#layer-6-analytics--reporting)
- [Database Schema](#database-schema)
- [Admin Dashboard Design](#admin-dashboard-design)
- [Teacher Dashboard Design](#teacher-dashboard-design)
- [Implementation Order](#implementation-order)

---

## Business Model

| Element | Value |
|---------|-------|
| **Revenue Split** | 40% Teacher / 60% Platform |
| **Split Basis** | Net profit (after costs) |
| **Distribution Method** | Pro-rata by revenue contribution |
| **Payout Schedule** | Monthly |
| **Payout Method** | Bank transfer (Algeria) |
| **Hold Period** | None (all costs deducted first, then profit split) |
| **Minimum Payout** | 2,000 DZD |

### The Formula

```
Gross Revenue (all courses)
  - Platform Costs (hosting, ads, payment fees, salaries, etc.)
  = Net Profit

Teacher Pool (40% of Net Profit)
Platform Pool (60% of Net Profit)

Each Teacher's Share = (Teacher's Gross Revenue / Total Gross Revenue) × Teacher Pool
```

### Why Pro-Rata Is Fair

- Teachers whose courses generate more revenue earn a larger share of the teacher pool
- Platform costs (hosting, marketing, fees) are shared infrastructure — deducted before the split
- No manual calculations needed — the system computes everything from one data source
- Scales to any number of teachers without extra effort

---

## Revenue Flow Overview

```
Student pays via Chargily (Edahabia/CIB)
        │
        ▼
Chargily sends webhook: checkout.completed
        │
        ▼
Backend verifies signature
  → Creates course_purchases record (student gets access)
  → Creates earnings_ledger row (records the sale for teacher payout)
  → Sends event to PostHog (analytics)
        │
        ▼
End of month:
  1. Admin enters monthly costs (hosting, ads, fees)
  2. System calculates total gross revenue per teacher
  3. System deducts costs → Net Profit
  4. System splits 40/60 → Teacher Pool
  5. System calculates pro-rata per teacher
  6. Admin reviews → marks payouts as paid
        │
        ▼
Teacher receives bank transfer
```

---

## Core Architecture Layers

### Layer 1: Teacher-to-Course Assignment

Teachers are linked to courses using the **existing Contributors system** (already built).

#### How It Works

1. A user signs up to the platform (no special "teacher signup" needed)
2. Admin goes to **Course → Contributors tab** → searches for the user
3. Admin adds the user as a **MAINTAINER** contributor
4. The earnings system identifies MAINTAINERs as "teachers" for payout purposes

#### Alternative: Dedicated Teacher Role

If the existing contributors system is not sufficient, a dedicated `course_teachers` table can be created:

```sql
CREATE TABLE course_teachers (
  id UUID PRIMARY KEY,
  course_id INTEGER REFERENCES course(id),
  user_id INTEGER REFERENCES users(id),
  share_percentage DECIMAL(5,2) DEFAULT 40.00,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

#### Teacher Permissions

Teachers need access to:
- Their course's edit page (already handled by MAINTAINER role)
- Their course's community (to answer questions)
- Their earnings dashboard (new)
- Their payout history (new)

### Layer 2: Earnings Ledger

The **single source of truth** for all money movement. Every purchase creates one row.

#### Design

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID PK | Unique identifier |
| `course_id` | INTEGER FK | Which course was purchased |
| `teacher_id` | INTEGER FK | Teacher assigned to the course |
| `student_id` | INTEGER FK | Student who purchased |
| `chargily_checkout_id` | TEXT | Chargily checkout reference |
| `gross_amount` | DECIMAL(10,2) | What the student paid |
| `chargily_fee` | DECIMAL(10,2) | Chargily's gateway commission |
| `currency` | TEXT | Always DZD |
| `status` | TEXT | `pending` / `available` / `paid` / `refunded` |
| `created_at` | TIMESTAMP | Sale timestamp |
| `paid_at` | TIMESTAMP | When teacher was paid |

### Layer 3: Monthly Profit Calculation

At the end of each month, the admin enters the month's costs.

#### Admin Input

| Cost Item | Example | How It's Entered |
|-----------|---------|------------------|
| Hosting/servers | 100,000 DZD | Manual input |
| Marketing/ads | 150,000 DZD | Manual input |
| Payment gateway fees | 30,000 DZD | Auto-calculated from ledger |
| Salaries/other | 20,000 DZD | Manual input |
| **Total Costs** | **300,000 DZD** | Auto-calculated |

#### Calculation Steps (System Does This Automatically)

```
Step 1: SUM(gross_amount) FROM earnings_ledger WHERE month = October → 1,000,000 DZD
Step 2: Subtract costs → 1,000,000 - 300,000 = 700,000 DZD (Net Profit)
Step 3: Teacher Pool = 700,000 × 40% = 280,000 DZD
Step 4: Platform Pool = 700,000 × 60% = 420,000 DZD
```

### Layer 4: Pro-Rata Distribution

Each teacher gets paid based on their course's share of total revenue.

#### Calculation

```sql
-- Query: total revenue per teacher for the month
SELECT
  teacher_id,
  SUM(gross_amount) as teacher_revenue
FROM earnings_ledger
WHERE created_at BETWEEN '2026-10-01' AND '2026-10-31'
  AND status != 'refunded'
GROUP BY teacher_id;

-- Then in application code:
-- teacher_payout = (teacher_revenue / total_revenue) × teacher_pool
```

#### Example

| Teacher | Revenue | Share % | Payout (of 280,000 DZD) |
|---------|---------|---------|------------------------|
| Ahmed | 600,000 DZD | 60% | 168,000 DZD |
| Sarah | 300,000 DZD | 30% | 84,000 DZD |
| Omar | 100,000 DZD | 10% | 28,000 DZD |
| **Total** | **1,000,000 DZD** | **100%** | **280,000 DZD** |

### Layer 5: Payout Execution

Since Chargily does not support automatic split payouts (all funds go to the platform's merchant account), payouts are handled via bank transfer.

#### Flow

1. Teacher sees available balance in their dashboard
2. Teacher requests withdrawal (or monthly auto-payout)
3. Admin reviews in the admin dashboard
4. Admin initiates bank transfer from the platform's business account
5. Admin marks the payout as "paid" in the system
6. Teacher receives notification

#### Payout Statuses

| Status | Description |
|--------|-------------|
| `pending` | Purchase made, awaiting month-end calculation |
| `calculated` | Month-end calculation done, payout amount determined |
| `processing` | Admin has initiated the bank transfer |
| `paid` | Bank transfer completed |
| `failed` | Transfer failed (retry available) |

### Layer 6: Analytics & Reporting

**PostHog** will be used for analytics, not accounting. The earnings ledger is for accounting.

#### What PostHog Tracks

- Revenue trends over time
- Course performance comparison
- Purchase conversion funnel
- User behavior on checkout pages
- Session recordings for UX optimization

#### What the Ledger Tracks

- Exact amounts per teacher per month
- Payout history
- Refund adjustments
- Tax reporting data

---

## Database Schema

### Table: `earnings_ledger`

```sql
CREATE TABLE earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id INTEGER NOT NULL REFERENCES course(id),
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  payment_order_id UUID REFERENCES payment_orders(id),
  chargily_checkout_id TEXT,
  gross_amount DECIMAL(10,2) NOT NULL,
  chargily_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) GENERATED ALWAYS AS (gross_amount - chargily_fee) STORED,
  currency TEXT DEFAULT 'DZD',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_ledger_teacher_month ON earnings_ledger(teacher_id, created_at);
CREATE INDEX idx_ledger_course_month ON earnings_ledger(course_id, created_at);
CREATE INDEX idx_ledger_status ON earnings_ledger(status);
```

### Table: `monthly_payouts`

```sql
CREATE TABLE monthly_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_gross DECIMAL(12,2) NOT NULL,
  total_costs DECIMAL(12,2) NOT NULL,
  net_profit DECIMAL(12,2) NOT NULL,
  teacher_pool DECIMAL(12,2) NOT NULL,
  platform_pool DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'calculated',
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);
```

### Table: `teacher_payouts`

```sql
CREATE TABLE teacher_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_payout_id UUID NOT NULL REFERENCES monthly_payouts(id),
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  gross_revenue DECIMAL(10,2) NOT NULL,
  revenue_share_percent DECIMAL(5,2) NOT NULL,
  payout_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'calculated',
  paid_at TIMESTAMP,
  bank_reference TEXT
);
```

---

## Admin Dashboard Design

A new tab under the admin dashboard: **Earnings**.

### Tab 1 — Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Earnings Overview — October 2026                                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Total Revenue │  │ Total Costs  │  │ Net Profit    │           │
│  │ 1,200,000 DZD │  │  300,000 DZD │  │  900,000 DZD │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │ Teacher Pool  │  │ Platform Pool│                              │
│  │ 360,000 DZD   │  │ 540,000 DZD  │                              │
│  └──────────────┘  └──────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

### Tab 2 — Costs Input

```
┌──────────────────────────────────────────────┐
│  Monthly Costs — October 2026                 │
│                                               │
│  Hosting & Infrastructure    [100,000] DZD    │
│  Marketing & Ads             [150,000] DZD    │
│  Payment Gateway Fees        [ 30,000] DZD    │  ← auto-calculated
│  Other Operating Costs       [ 20,000] DZD    │
│  ────────────────────────────────────────     │
│  Total:                       300,000 DZD     │
│                                               │
│  [Calculate Payouts]                          │
└──────────────────────────────────────────────┘
```

### Tab 3 — Teacher Payouts (auto-calculated)

```
┌──────────┬────────────┬────────┬────────────┬───────────┐
│ Teacher  │ Revenue    │ Share  │ Payout     │ Status    │
├──────────┼────────────┼────────┼────────────┼───────────┤
│ Ahmed    │ 600,000    │ 60%    │ 168,000    │ Paid ✓    │
│ Sarah    │ 360,000    │ 30%    │ 100,800    │ Processing │
│ Omar     │ 240,000    │ 10%    │ 67,200     │ Pending   │
├──────────┼────────────┼────────┼────────────┼───────────┤
│ Total    │ 1,200,000  │ 100%   │ 336,000    │           │
└──────────┴────────────┴────────┴────────────┴───────────┘

[Mark as Paid] [Download Report]
```

### Tab 4 — Transaction Log

```
┌──────────┬────────────┬──────────┬───────────┬──────────┐
│ Date     │ Course     │ Amount   │ Teacher   │ Status   │
├──────────┼────────────┼──────────┼───────────┼──────────┤
│ Oct 1    │ React      │ 5,000    │ Ahmed     │ Pending  │
│ Oct 2    │ Python     │ 5,000    │ Sarah     │ Pending  │
│ Oct 3    │ React      │ 5,000    │ Ahmed     │ Pending  │
│ ...      │ ...        │ ...      │ ...       │ ...      │
└──────────┴────────────┴──────────┴───────────┴──────────┘
```

### Tab 5 — Settings

```
┌──────────────────────────────────────────────┐
│  Payout Settings                              │
│                                               │
│  Teacher Share Percentage  [40] %             │
│  Platform Share Percentage [60] %             │
│  Payout Schedule           [Monthly] ▼        │
│  Minimum Payout Threshold  [2,000] DZD        │
│  Payout Method             [Bank Transfer]    │
│                                               │
│  [Save Settings]                              │
└──────────────────────────────────────────────┘
```

---

## Teacher Dashboard Design

Each teacher sees their own earnings dashboard.

```
┌──────────────────────────────────────────────┐
│  My Earnings                                  │
│                                               │
│  ┌────────────────┐  ┌────────────────┐       │
│  │ Available       │  │ Last Payout     │       │
│  │ 168,000 DZD     │  │ 120,000 DZD     │       │
│  │                 │  │ (September 2026)│       │
│  └────────────────┘  └────────────────┘       │
│                                               │
│  ┌──────────────────────────────────────┐     │
│  │ My Courses              Revenue      │     │
│  │ React Masterclass       600,000 DZD  │     │
│  │ Python Basics           200,000 DZD  │     │
│  └──────────────────────────────────────┘     │
│                                               │
│  ┌──────────────────────────────────────┐     │
│  │ Payout History                       │     │
│  │ Sep 2026 — 120,000 DZD — Paid        │     │
│  │ Aug 2026 — 90,000 DZD  — Paid        │     │
│  │ Jul 2026 — 75,000 DZD  — Paid        │     │
│  └──────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

---

## Implementation Order

| Step | What | Why First |
|------|------|-----------|
| 1 | Add `teacher_id` or use Contributors as teacher identifier | Foundation for everything |
| 2 | Create `earnings_ledger` table + Chargily webhook handler | Records every sale from day one |
| 3 | Admin Costs Input page (simple form) | Needed to calculate monthly profit |
| 4 | Monthly Payout Calculation service (pro-rata logic) | The core business logic |
| 5 | Admin Payout Management page | Review, approve, mark as paid |
| 6 | Teacher Earnings Dashboard | Teachers see their numbers |
| 7 | Payout Settings page | Configure percentages, thresholds |
| 8 | PostHog revenue event tracking | Analytics on top of accounting |

### Priority Order (MVP)

1. **Steps 1 + 2** — Get the data flowing (teacher assignment + sale recording)
2. **Steps 3 + 4** — Get the calculation working (costs in → payouts out)
3. **Step 5** — Admin can manage payouts
4. **Step 6** — Teachers can see their earnings
5. **Steps 7 + 8** — Polish and analytics

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Split basis** | Net profit (after costs) | Platform never loses money on fees |
| **Cost deduction** | Before split, not after | Clean, transparent, industry standard |
| **Distribution** | Pro-rata by revenue share | Fair, automatic, scales to N teachers |
| **Teacher assignment** | Via existing Contributors system | No new UI needed, already built |
| **Payout method** | Bank transfer (manual) | Chargily doesn't support auto-splits |
| **Payout schedule** | Monthly | Simple, predictable, low transfer costs |
| **Accounting vs Analytics** | Ledger for accounting, PostHog for analytics | Separate concerns, each tool does one thing well |
| **No hold period** | Costs deducted first, then profit split | No need for pending/available statuses |

---

## Relation to Existing System

### What Already Exists (No Changes Needed)

- **Course Contributors** — The contributors tab in the course edit page (CREATOR, MAINTAINER, CONTRIBUTOR, REPORTER roles)
- **Org Roles** — Custom role creation with fine-grained permissions
- **User Management** — Search, filter, assign roles to users
- **Payment System** — Chargily integration, `payment_orders`, `course_purchases` tables
- **Course Access Model** — Public / Users Only / Paid access levels

### What Needs to Be Built

- **`earnings_ledger`** table + webhook handler
- **`monthly_payouts`** table
- **`teacher_payouts`** table
- Admin earnings dashboard (5 tabs)
- Teacher earnings dashboard
- Payout calculation service
- Payout settings

---

## Chargily Webhook Integration

When a payment succeeds, the existing webhook handler needs to also create an `earnings_ledger` row:

```python
# In chargily_webhook handler (existing)
def handle_checkout_completed(checkout_data):
    # Existing: create course_purchases record
    # Existing: grant access to student

    # New: create earnings_ledger row
    earnings_ledger.create(
        course_id=course.id,
        teacher_id=get_teacher_for_course(course.id),
        student_id=user.id,
        chargily_checkout_id=checkout_data["id"],
        gross_amount=checkout_data["amount"],
        chargily_fee=calculate_chargily_fee(checkout_data["amount"]),
        status="pending"
    )

    # New: send event to PostHog
    posthog.capture(
        user.id,
        "purchase_completed",
        {"revenue": checkout_data["amount"], "course": course.name}
    )
```

> **Note:** The `get_teacher_for_course` function queries the contributors table for the MAINTAINER of the course. If no MAINTAINER is found, the earnings go to the CREATOR.

---

> See [Payment System Overview](./overview.md) for the existing payment architecture.
> See [Chargily Integration](./chargily-integration.md) for the Chargily API integration details.
> See [PostHog Integration](../analytics/posthog-integration-plan.md) for analytics setup.
