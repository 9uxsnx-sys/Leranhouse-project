# Course Access Control

> Configuring who can view and interact with your course.

---

## Overview

The **Access** tab controls **who, among logged-in users, may open this resource**. LearnHouse is a **login-only platform** — nothing is browsable, playable or downloadable without a session.

Two independent things decide access:

1. **Published** — is the resource live at all?
2. **Access type** — who is entitled once it is live?

Publishing is not an access type. It sits in front of all three modes and overrides them.

---

## Access Types

The mode is chosen from the **mode button in the Access toolbar**. It cycles Public → Private → Paid; Paid is skipped (with a toast) while the course has no price set. Each mode swaps the table below the toolbar.

```
🌐 Public (public)     👥 Private (users_only)     🛒 Paid (paid)
Every logged-in user.  Only the linked user        Only users with an
No group, no payment.  groups. Nobody else.        active entitlement.
```

### Free (`public`)

- **Every logged-in user** can open the course and its lessons.
- No user group, no payment, no extra configuration.
- This is the open-catalog mode.
- Best for: free introductory content, sample lessons, marketing material.

### Restricted (`users_only`)

- **Only members of the user groups linked to the course.** Nobody else — not even other logged-in users.
- Non-members are not shown a paywall: the course does not appear in their catalog, and a direct URL returns `403`.
- This is a **whitelist**, not "any signed-in user".
- Requires at least one linked user group. If none is linked, only authors and admins can open it, and the tab warns the admin.
- Best for: internal cohorts, partner classes, beta programmes, staff training.

### Paid (`paid`)

- Only users holding an **active purchase entitlement** can open the lessons.
- The course page, description and curriculum are visible to every logged-in user; lesson content is locked until the Chargily webhook confirms payment.
- Powered by **Chargily Pay v2** — accepts EDAHABIA and CIB card payments.
- Best for: premium courses, workshops, certification programs.

### Draft (any access type)

- `published = false` overrides everything.
- Only the **author**, **admin** and **maintainer** can open it — including via a direct URL and a direct checkout call.
- The course never appears in any catalog, for anyone.

---

## The Rule Table

| Access type | Published | Who can open it |
|---|---|---|
| Free (`public`) | yes | Every logged-in user |
| Restricted (`users_only`) | yes | Only members of the linked user groups |
| Paid (`paid`) | yes | Only buyers (active entitlement) |
| any | **draft** | Only author / admin / maintainer |

Evaluation order — first match wins:

```
draft?               → author / admin / maintainer only
not logged in?       → login wall (platform-wide)
author / admin?      → allow
paid + entitlement?  → allow
paid                 → locked, show price
restricted + member? → allow
restricted           → 403, hidden from catalog
free                 → allow
```

> **Paid + user groups:** a paid course may also be linked to user groups to grant free access (beta testers, reviewers, comped accounts). This is an exception layered on top of Paid, not a fourth access type.

---

## Setting Pricing for Paid Courses

Prices are **not** edited in the Access tab — the Access tab is access-only and never shows a price.

To price a course:

1. Go to **Payments → Offers**.
2. Find the course in the table (use the search bar or the **Needs price** filter).
3. Type the amount in the **Price (DZD)** column.
4. Press **Save** in the toolbar — one save covers every row you edited.

Semantics:

| Value | Meaning |
|---|---|
| empty | not priced — Paid mode refuses to activate |
| `0` | explicitly **Free** |
| `> 0` | price in DZD |

If no price is set, switching to Paid is skipped and a toast tells the admin to set it in **Payments → Offers**.

---

## Public Mode: learners with access

Public mode lists the users who currently have the course in their inventory (a `TrailRun` row).

- **Empty search** → learners linked to the course, with the date access was granted.
- **Typing** → organization members **not linked yet** (already-linked users are filtered out).
- Tick rows → **Remove N** (red) when browsing the linked list, **Add N** when searching.
- Removing deletes the enrollment and the user's progress for the course, so it disappears from their Progress tab.
- Each row has a 3-dot menu: **Details** (floating user card) and **Delete** (remove access).

---

## Private Mode: linking user groups

Private mode lists the user groups linked to the course.

- **Empty search** → linked groups with their **member count** and **link date**.
- **Typing** → matching groups that are **not linked yet**.
- Tick rows → **Remove N** (red) when browsing linked groups, **Add N** when searching.
- Each row has a 3-dot menu with **Delete** (unlink the group).
- Selection clears when the query, the page or the mode changes.

---

## How the Pay-to-Access Model Works

This is the core flow for a Paid course:

```
Learner finds course → Sees details & price → Clicks Purchase
                                                        │
                    ┌───────────────────────────────────┘
                    ▼
          Redirected to Chargily payment page
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
    Payment success       Payment fails/cancelled
          │                    │
    Webhook received      Learner sees "Try Again"
    Access granted        No access granted
          │
    Learner can view
    all lessons
```

### What learners see before purchasing

- Course thumbnail, title, description
- Module names (but not lesson content)
- Price and purchase buttons
- A lock icon on lesson content

All of the above is visible to **logged-in users** only; the platform itself requires a session.

### What learners see after purchasing

- Full access to all lessons and activities
- A **"You own this course"** badge on the course page
- The course appears in their **My Courses** list

### What learners see for free courses (Free / Restricted)

- **Free** — full access immediately, no purchase step
- **Restricted** — full access for members of the linked user groups; everyone else never sees the course in their catalog
- Neither type has a payment step
- Both still require a session — the platform has no anonymous browsing

---

## Paid Mode: managing access

Paid mode lists every user with an **active entitlement** — buyers plus manual grants.

- **Empty search** → entitled users, with the date access was granted.
- **Typing** → organization members **without** access (already-entitled users are filtered out).
- Tick rows → **Remove N** (revokes access) or **Add N** (manual grant, `source=manual`).
- Each row has a 3-dot menu: **Details** (role, verification status, granted date, org join date, last login) and **Delete** (revoke).
- Revoking flips the entitlement to `revoked` and keeps the row for audit. The learner immediately loses access and the course disappears from their Progress tab.

Manual grants are recorded with `granted_by` = the admin who performed them.

---

## Access Enforcement

Access rules are enforced at multiple layers:

| Layer | Enforcement |
|-------|-------------|
| **Session** | No route is reachable without a valid session — there is no anonymous browsing |
| **Database** | `published`, `access_type` and `price_amount` on the course record |
| **Backend API** | `check_resource_access()` on every read — enforces draft, then access type, then groups/entitlement; returns `403` when denied |
| **Frontend** | Hides inaccessible resources from catalogs and shows purchase/lock banners for Paid courses without a valid entitlement |

This means even if a user tries to bypass frontend restrictions, the backend will still block access.

---

## UI Pattern

The tab is a single card with a sticky toolbar and one table, and the table's content is whatever the current mode shows:

```
┌──────────────────────────────────────────────────────────┐
│  Page background: #f8f8f8                                │
│                                                          │
│  ┌─── Card ─────────────────────────────────────────────┐ │
│  │  ● Paid            [🔍 Search…]      [⚙ mode]       │ │
│  │  ─────────────────────────────────────────────────── │ │
│  │  NAME             ROLE     STATUS   JOINED   ADDED │ │
│  │  ● John Doe       User     ● Active 12 Mar   14 Mar │ │
│  │  ● Jane Roe       User     ● Active 03 Apr   03 Apr │ │
│  │                                                      │ │
│  │  [ ] 3 selected           [ 🗑 Remove 3 ]  [Save]   │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- Mode dot, status dot and the type indicator are **rounded squares** (`w-2.5 h-2.5 rounded`), not circles or pills — same convention as the dashboard home tables.
- Searching swaps the table to *not-yet-linked* rows; the toolbar action flips from **Remove N** to **Add N**.
- Every row ends with a 3-dot menu: **Details** + **Delete** in Public/Paid, **Delete** only in Private.
- Selection resets whenever the query, the page or the mode changes.
