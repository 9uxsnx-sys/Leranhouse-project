# Course Access Control

> Configuring who can view and interact with your course.

---

## Overview

The **Access** tab controls how learners discover and access your course. Koodook supports three access types, designed to support everything from free public content to paid, gated courses powered by Chargily Pay v2.

---

## Access Types

Three visual cards let you choose the access model:

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│       🌐             │  │       👥             │  │       🛒             │
│      Public          │  │    Users Only         │  │       Paid           │
│  Free access for     │  │  Requires login,      │  │  Requires purchase   │
│  everyone            │  │  no purchase needed   │  │  + login             │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

### Public

- **Anyone** can view the course and its lessons — no account or payment required
- Best for: free introductory content, marketing material, sample lessons
- No additional configuration needed

### Users Only

- Only **authenticated (logged-in) users** can view the course
- No payment required — just a valid account on the platform
- Best for: member-only content, internal training, community courses
- Optionally restrict further by assigning **user groups**

### Paid

- Users must **purchase the course** to access lessons
- Course details (description, modules list, thumbnail) are visible to everyone
- Lesson content is locked until purchase is confirmed
- Powered by **Chargily Pay v2** — accepts EDAHABIA and CIB card payments
- Best for: premium courses, workshops, certification programs

> **Important:** Even with Paid access, you can grant supplementary access via user groups. Users who are members of a linked group get access without purchasing — useful for beta testers, reviewers, or comped accounts.

---

## Setting Pricing for Paid Courses

When **Paid** is selected, a price configuration section appears:

```
┌─── Pricing ──────────────────────────────────────┐
│                                                   │
│  Amount       Currency                            │
│  ┌──────────┐ ┌─────────────┐                     │
│  │ 2500     │ │ DZD  ▼      │                     │
│  └──────────┘ └─────────────┘                     │
│                                                   │
│  Price shown to learners: DA 2,500.00             │
│                                                   │
└───────────────────────────────────────────────────┘
```

| Field | Description |
|-------|-------------|
| **Amount** | The price in numeric value (e.g., `2500`) |
| **Currency** | Currently supports **DZD** (Algerian Dinar) only |

The formatted price is displayed to learners on the course detail page alongside the **Purchase with EDAHABIA** and **Purchase with CIB Card** buttons.

---

## User Group Assignment

User groups let you grant access to specific sets of users without changing the course's access type.

```
┌─── User Groups ──────────────────────────────────┐
│                                                   │
│  ☑ Beta Testers        — 12 users                │
│  ☐ Premium Members     — 48 users                │
│  ☐ Staff               — 5 users                 │
│  ☐ Reviewers           — 3 users                 │
│                                                   │
│  + Create new group                               │
│                                                   │
│  Groups get access without purchase (Paid only)   │
└───────────────────────────────────────────────────┘
```

- Check the box next to each group that should have access
- Available for **Users Only** and **Paid** access types
- For **Paid** courses: group membership grants access **without requiring purchase**
- Groups are managed separately in the **Groups** section of the admin dashboard

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

### What learners see after purchasing

- Full access to all lessons and activities
- A **"You own this course"** badge on the course page
- The course appears in their **My Courses** list

### What learners see for free courses (Public / Users Only)

- Full access immediately — no purchase step
- Public courses are accessible even without logging in
- Users Only courses require a simple login

---

## Purchase History (Admin View)

When **Paid** is selected, a purchase history table appears at the bottom of the Access tab:

```
┌─── Purchase History ─────────────────────────────┐
│                                                   │
│  User          │ Amount  │ Date       │ Status    │
│  ───────────── │ ─────── │ ────────── │ ───────── │
│  ali@example   │ 2500 DA │ 23 Sep 26 │ Active    │
│  sana@example  │ 2500 DA │ 22 Sep 26 │ Active    │
│  test@example  │ 2500 DA │ 20 Sep 26 │ Revoked   │
│                                                   │
│  [Manual Grant Access]                            │
└───────────────────────────────────────────────────┘
```

| Feature | Description |
|---------|-------------|
| **View purchases** | See who has purchased the course, when, and for how much |
| **Manual grant** | Grant access to a user without payment (for testing or comped accounts) |
| **Revoke access** | Remove a user's access manually (e.g., after a refund) |

---

## Access Enforcement

Access rules are enforced at multiple layers:

| Layer | Enforcement |
|-------|-------------|
| **Database** | The `access_type` and `price_amount` columns on the course record |
| **Backend API** | `check_course_access()` middleware on all lesson/chapter endpoints — returns 403 if access is denied |
| **Frontend** | UI hides lesson content and shows purchase/lock banners for Paid courses without a valid purchase |

This means even if a user tries to bypass frontend restrictions, the backend will still block access.

---

## UI Pattern

The Access tab follows the same sectioned white card layout as other tabs:

```
┌────────────────────────────────────────────────────┐
│  Page background: #f8f8f8                          │
│                                                     │
│  ┌─── White Card: Access Type Selection ─────────┐ │
│  │  🌐 Public     👥 Users Only     🛒 Paid      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Pricing (Paid only) ───────────┐ │
│  │  Amount: [____]  Currency: [DZD ▼]            │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: User Groups ───────────────────┐ │
│  │  ☑ Group 1   ☐ Group 2   ☐ Group 3           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Purchase History (Paid only) ──┐ │
│  │  Purchase records table + Manual Grant button  │ │
│  └───────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```
