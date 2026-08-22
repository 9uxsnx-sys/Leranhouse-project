# LearnHouse — Custom Platform Vision

## Base Project

- **Forked from** [LearnHouse](https://github.com/9uxsnx-sys/Leranhouse-project) v1.2.0
- **Goal**: Full UI redesign using the **Medusa Design System** ([`/medusa`](file:///c%3A/Projects/learnhouse-dev/learnhouse-dev/medusa)) as the style reference
- **Target**: A premium, high-quality course platform with clean UI and rich functionality
- **Design System Source**: Medusa UI components, tokens, icons, and design language live in [`/medusa`](file:///c%3A/Projects/learnhouse-dev/learnhouse-dev/medusa) — pull styles, colors, spacing, and patterns from there

---

## Architecture — Two Distinct Parts

### 🧑‍🎓 User Part (Learner Interface)

| Aspect | Detail |
|--------|--------|
| **Routes** | `/orgs/[orgslug]/(withmenu)/*` |
| **Layout** | Sidebar menu layout — **Medusa redesign applied here** |
| **Access** | Login required (no public/anonymous access) |
| **Audience** | Students, learners, end-users |
| **Pages** | Home, Courses, Collections, Communities, Playgrounds, Store, Trail, Account, etc. |
| **Design Goal** | Clean, minimal, educational, premium — NOT an admin dashboard |
| **Status** | 🟡 In progress (Medusa redesign being applied) |

### 🔧 Admin Dashboard (Management Interface)

| Aspect | Detail |
|--------|--------|
| **Routes** | `/orgs/[orgslug]/dash/*` |
| **Layout** | `ClientAdminLayout` — **keep original LearnHouse design** |
| **Access** | Admin-only (course creators, managers) |
| **Audience** | Teachers, admins, content managers |
| **Pages** | Course management, Analytics, Users, Boards, Payments, etc. |
| **Design Goal** | Functional, management-focused — do NOT apply Medusa redesign |
| **Status** | 🔴 Do NOT touch (keep original) |

---

## ⚠️ Critical Rule

The **User Part** and **Admin Dashboard** are completely separate. They use different components, different layouts, and different design languages. **Never apply User Part components (like `CourseCard`) to Admin Dashboard pages, and vice versa.**

---

## Future Goals

| Goal | Priority | Notes |
|------|----------|-------|
| Login-only access | High | Platform requires authentication to access |
| Payments (Stripe) | Medium | For paid courses |
| Additional features | Medium | Community features, gamification, etc. |
| Full Medusa UI consistency | High | Apply Medusa tokens system-wide for User Part |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Original LearnHouse codebase (initial commit) |
| `backup/learnhouse-1.2.0-custom` | Backup of original state before Medusa redesign |
| `feat/learnhouse-1.2.0-custom` | **Active development** — Medusa redesign work happens here |
