# Koodook Documentation Plan

> A structured, scalable documentation architecture for the **Koodook** platform — a pay-to-access learning management system built on Learnhouse. Inspired by the best practices of top open-source projects (Next.js, Django, FastAPI).

**Date:** 2026-09-23
**Status:** Draft

---

## Platform Context

### What is Koodook?

Koodook is a **paid learning platform** where:
- Users sign in to browse courses
- Users **purchase** courses to access lesson content
- Course creators manage content through an admin dashboard
- Local Algerian payments (EDAHABIA/CIB) integrated via **Chargily Pay v2**
- Built on the open-source **Learnhouse** codebase

### Core Business Rules

| Rule | Description |
|------|-------------|
| **Pay-to-access** | Course content is gated behind purchase — users see course details but must pay to access lessons |
| **Free courses** | Creators can offer free courses (Public access) |
| **Group access** | Organizations can grant access via user groups without payment |
| **Local payments** | Chargily Pay v2 for EDAHABIA (Algérie Poste) and CIB card payments |
| **Multi-tenancy** | Multiple organizations on the same platform, each with their own courses and branding |

### Relationship to Learnhouse

Koodook is a **custom fork/deployment** of Learnhouse. The codebase is Learnhouse, but the platform is Koodook. Documentation should reflect this:
- **Technical docs** reference Learnhouse (the engine)
- **User/Admin docs** reference Koodook (the product)

---

## Table of Contents

1. [Guiding Principles](#1-guiding-principles)
2. [Documentation Structure Overview](#2-documentation-structure-overview)
3. [Section Breakdown](#3-section-breakdown)
   - [01-getting-started](#01-getting-started)
   - [02-architecture](#02-architecture)
   - [03-user-guide](#03-user-guide)
   - [04-admin-guide](#04-admin-guide)
   - [05-developer-guide](#05-developer-guide)
   - [06-api-reference](#06-api-reference)
   - [07-ui-reference](#07-ui-reference)
   - [08-features](#08-features)
   - [09-contributing](#09-contributing)
   - [10-changelog](#10-changelog)
4. [File Naming Conventions](#4-file-naming-conventions)
5. [Writing Standards](#5-writing-standards)
6. [Cross-Referencing Strategy](#6-cross-referencing-strategy)
7. [Implementation Phases](#7-implementation-phases)
8. [Appendix: Current State & Migration Path](#8-appendix-current-state--migration-path)

---

## 1. Guiding Principles

### 1.1 Audience-First Organization

Every document must clearly serve one of these audiences:

| Audience | Goal | Docs They Read |
|----------|------|----------------|
| **End-user (Learner)** | Browse and purchase courses on Koodook | User Guide, FAQ |
| **Admin (Teacher/Creator)** | Manage courses, content, users, pricing | Admin Guide, Feature Docs |
| **Developer (Contributor)** | Set up dev env, contribute code | Getting Started, Dev Guide, API Ref |
| **Self-hoster** | Deploy and maintain their Koodook instance | Getting Started (Deploy), Operations |

### 1.2 Progressive Depth

- **First 5 lines** tell you if this doc is for you
- **First section** gets you running in 2 minutes
- **Later sections** cover edge cases, configuration, troubleshooting

### 1.3 Single Source of Truth

- No duplicated content between docs
- Use `> See [Related Doc](...)` cross-references
- Every concept lives in exactly one place

### 1.4 Living Docs

- Docs are updated **alongside** code changes (not after)
- Each feature branch includes doc updates
- Stale docs are worse than no docs — archive instead of keep

---

## 2. Documentation Structure Overview

```
docs/
├── README.md                          # Entry point — links to all sections
├── 01-getting-started/
│   ├── README.md                      # Overview + quick links
│   ├── quick-start.md                 # 5-min setup
│   ├── development-setup.md           # Full dev environment guide
│   └── deployment.md                  # Production deployment guide
│
├── 02-architecture/
│   ├── README.md
│   ├── overview.md                    # High-level system architecture
│   ├── tech-stack.md                  # Technology decisions and rationale
│   ├── data-model.md                  # Core entities and relationships
│   ├── routing.md                     # Frontend routing structure
│   ├── security.md                    # Auth, RBAC, permissions model
│   └── multi-tenancy.md               # Multi-org architecture
│
├── 03-user-guide/
│   ├── README.md
│   ├── getting-started.md             # First steps as a learner
│   ├── courses.md                     # Browsing and purchasing courses
│   ├── activities.md                  # Types of activities (video, quiz, code, etc.)
│   ├── communities.md                 # Community features
│   ├── collections.md                 # Course collections/bundles
│   ├── playgrounds.md                 # Interactive playgrounds
│   ├── podcasts.md                    # Podcast features
│   ├── boards.md                      # Collaborative whiteboards
│   ├── certificates.md                # Certificate system
│   ├── account.md                     # Profile, settings, preferences
│   └── store.md                       # Purchasing courses
│
├── 04-admin-guide/
│   ├── README.md
│   ├── getting-started.md             # First steps as an admin
│   ├── courses/
│   │   ├── overview.md                # Course management overview
│   │   ├── general.md                 # General settings tab
│   │   ├── content-structure.md       # Modules & lessons (Content tab)
│   │   ├── access.md                  # Access control tab (Public / Users Only / Paid)
│   │   ├── certification.md           # Certification tab
│   │   ├── contributors.md            # Contributors tab
│   │   ├── seo.md                     # SEO tab
│   │   └── analytics.md              # Course analytics tab
│   ├── org-settings/
│   │   ├── general.md                 # Organization general settings
│   │   ├── branding.md                # Custom branding & fonts
│   │   ├── domains.md                 # Custom domains
│   │   ├── landing.md                 # Landing page builder
│   │   ├── sso.md                     # SSO configuration
│   │   ├── seo.md                     # SEO settings
│   │   ├── features.md                # Feature flags
│   │   ├── api-access.md              # API token management
│   │   └── audit-logs.md              # Audit logging
│   ├── users.md                       # User management
│   ├── user-groups.md                 # Group-based access control
│   ├── roles.md                       # RBAC roles & permissions
│   ├── analytics.md                   # Platform analytics
│   ├── assignments.md                 # Assignment management
│   ├── payments.md                    # Payment configuration (Chargily)
│   └── content-library.md            # Media & content files
│
├── 05-developer-guide/
│   ├── README.md
│   ├── getting-started.md             # Clone, install, run
│   ├── project-structure.md           # Monorepo layout explained
│   ├── frontend/
│   │   ├── overview.md                # Next.js architecture
│   │   ├── components.md              # Component patterns
│   │   ├── contexts.md               # React contexts (Auth, Course, Org, etc.)
│   │   ├── services.md               # API service layer
│   │   ├── ui-components.md          # UI component library
│   │   └── state-management.md       # SWR, local state patterns
│   ├── backend/
│   │   ├── overview.md                # FastAPI architecture
│   │   ├── routers.md                 # API route structure
│   │   ├── services.md                # Business logic layer
│   │   ├── database.md               # SQLModel, Alembic, migrations
│   │   └── security.md               # Auth, RBAC, API tokens
│   ├── collab-server.md               # Yjs/Hocuspocus realtime collaboration
│   ├── cli.md                         # CLI tool reference
│   ├── testing.md                     # Testing strategy
│   ├── environment-variables.md       # All env vars reference
│   └── troubleshooting.md             # Common dev issues
│
├── 06-api-reference/
│   ├── README.md
│   ├── authentication.md              # Auth endpoints
│   ├── courses.md                     # Course CRUD
│   ├── chapters.md                    # Chapter/module endpoints
│   ├── activities.md                  # Activity/lesson endpoints
│   ├── users.md                       # User endpoints
│   ├── orgs.md                        # Organization endpoints
│   ├── communities.md                 # Community endpoints
│   ├── boards.md                      # Board endpoints
│   ├── analytics.md                   # Analytics endpoints
│   ├── payments.md                    # Payment endpoints (Chargily)
│   ├── webhooks.md                    # Webhook endpoints
│   └── admin.md                       # Admin endpoints
│
├── 07-ui-reference/
│   ├── README.md
│   ├── design-tokens.md               # Colors, spacing, typography
│   ├── components/
│   │   ├── button.md
│   │   ├── input.md
│   │   ├── dialog.md
│   │   ├── dropdown-menu.md
│   │   ├── switch.md
│   │   ├── select.md
│   │   ├── table.md
│   │   ├── tabs.md
│   │   └── ... (one per component)
│   ├── pages/
│   │   ├── user-part.md               # User-facing route designs
│   │   └── admin-dashboard.md         # Admin dashboard route designs
│   └── patterns.md                    # Common UI patterns
│
├── 08-features/
│   ├── README.md
│   ├── payments/
│   │   ├── overview.md                # Payment system architecture
│   │   └── chargily-integration.md    # Chargily Pay v2 plan
│   ├── ai/
│   │   ├── overview.md                # AI features (Copilot, Magic Blocks, etc.)
│   │   └── rag.md                     # RAG system architecture
│   ├── realtime.md                    # Realtime collaboration (Yjs)
│   └── seo.md                         # SEO system
│
├── 09-contributing/
│   ├── README.md
│   ├── code-of-conduct.md
│   ├── how-to-contribute.md
│   ├── coding-standards.md
│   ├── pull-request-guide.md
│   ├── commit-conventions.md
│   └── branch-strategy.md
│
├── 10-changelog/
│   └── README.md                      # Points to GitHub releases
│
└── _archive/                          # Moved from old docs/ — kept for reference
```

---

## 3. Section Breakdown

### 01-getting-started

**Audience:** Developers, self-hosters, new contributors

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Section overview + quick links to each sub-guide | P0 |
| `quick-start.md` | 5-minute setup: prerequisites — clone — `npx learnhouse dev` — see it running | P0 |
| `development-setup.md` | Full guide: Docker, Bun, uv, ports (5434!), env files, `bun run apps/cli/...`, interactive controls | ✅ Already exists (migrate from `_archive/root/DEV_SETUP.md`) |
| `deployment.md` | Production deployment: Docker, domains, SSL, backups, payment webhooks (ngrok for dev), Chargily keys | P2 |

**Key decisions:**
- `development-setup.md` is the most critical doc in this section — it captures the exact working config (port 5434, `--webpack` flag, admin credentials)
- `quick-start.md` should be a single terminal command + screenshot

---

### 02-architecture

**Audience:** Developers, technical decision-makers

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Section overview with architecture diagram (ASCII or Mermaid) | P0 |
| `overview.md` | High-level: 4 apps (API, Web, Collab, CLI), Docker infra, communication flow | P0 |
| `tech-stack.md` | Why FastAPI? Why Next.js? Why Yjs? Decision log with alternatives considered | P1 |
| `data-model.md` | Core entities: Organization — Course — Chapter — Activity, User, UserGroup, etc. | P0 |
| `routing.md` | Frontend: `(withmenu)` vs `dash` split, User Part vs Admin Dashboard rule | P0 |
| `security.md` | Authentication (JWT, OAuth, SSO), RBAC, API tokens, permission model | P0 |
| `multi-tenancy.md` | Multi-org architecture — migrate from `_archive/docs/multi-tenancy.md` | P1 |

**Key decisions:**
- The `(withmenu)` vs `dash` routing split is a core architectural concept that needs clear documentation
- The Medusa redesign rule (only User Part, NOT Admin Dashboard) must be documented explicitly

---

### 03-user-guide

**Audience:** Learners, end-users of Koodook

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Section overview + quick links | P1 |
| `getting-started.md` | Create account, browse courses, purchase, start learning | P1 |
| `courses.md` | Browse courses, purchase, track progress | P1 |
| `activities.md` | Video lessons, quizzes, code exercises, documents, assignments | P1 |
| `communities.md` | Join communities, post discussions, interact | P2 |
| `collections.md` | Course bundles | P2 |
| `playgrounds.md` | Interactive AI-generated elements | P2 |
| `podcasts.md` | Audio content | P2 |
| `boards.md` | Real-time collaborative whiteboards | P2 |
| `certificates.md` | Earning and verifying certificates | P1 |
| `account.md` | Profile, settings, password, purchase history | P1 |
| `store.md` | Purchasing courses via Chargily | P1 |

**Key decisions:**
- User guide should be screenshot-rich — every page should show the actual UI
- Written in simple, non-technical language
- **Store/purchase flow is central** to the Koodook experience

---

### 04-admin-guide

**Audience:** Teachers, course creators, organization administrators

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Section overview | P0 |
| `getting-started.md` | First login, create first course | P0 |
| `courses/overview.md` | Dashboard course list, filtering, search | P0 |
| `courses/general.md` | Name, description, difficulty, thumbnail, certificate toggle | P0 |
| `courses/content-structure.md` | Modules & lessons: create, reorder, edit | P0 |
| `courses/access.md` | **3 options: Public, Users Only, Paid** — access control, purchase requirements, user group management | P0 |
| `courses/certification.md` | Certificate design, passing criteria | P1 |
| `courses/contributors.md` | Adding co-authors | P1 |
| `courses/seo.md` | SEO metadata, social preview | P1 |
| `courses/analytics.md` | Course analytics dashboard | P1 |
| `org-settings/general.md` | Org name, logo, locale | P1 |
| `org-settings/branding.md` | Custom fonts, colors, branding | P1 |
| `org-settings/domains.md` | Custom domain setup | P2 |
| `org-settings/landing.md` | Landing page builder | P2 |
| `org-settings/sso.md` | SSO providers | P2 |
| `org-settings/seo.md` | Org-level SEO | P1 |
| `org-settings/features.md` | Feature flags | P1 |
| `org-settings/api-access.md` | API tokens for integrations | P2 |
| `org-settings/audit-logs.md` | Audit trail | P2 |
| `users.md` | Managing users, invites | P1 |
| `user-groups.md` | Creating groups, assigning users | P1 |
| `roles.md` | Custom roles & permissions | P1 |
| `analytics.md` | Platform-wide analytics | P1 |
| `assignments.md` | Creating and grading assignments | P2 |
| `payments.md` | Payment setup — Chargily Pay v2 (EDAHABIA/CIB), pricing, webhooks | P1 |
| `content-library.md` | Media library | P2 |

**Key decisions:**
- Course admin is the most complex section — it mirrors the 6-tab layout of the course editor
- Each tab in the course editor gets its own doc file
- **Payments and access control** are core to the Koodook admin experience

---

### 05-developer-guide

**Audience:** Developers contributing to the codebase

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Section overview | P0 |
| `getting-started.md` | Prerequisites, clone, dev setup, first run | ✅ Already exists (migrate) |
| `project-structure.md` | Monorepo layout: `apps/`, `packages/`, key directories explained | P0 |
| `frontend/overview.md` | Next.js App Router, `(withmenu)` vs `dash`, layouts | P0 |
| `frontend/components.md` | Component hierarchy, patterns, naming | P1 |
| `frontend/contexts.md` | AuthContext, CourseContext, OrgContext, LHSessionContext, I18nContext | P1 |
| `frontend/services.md` | API service layer (`@services/courses/activities.ts`, etc.) | P1 |
| `frontend/ui-components.md` | UI library (`@components/ui/`), Medusa components | P1 |
| `frontend/state-management.md` | SWR caching, local state, auto-save patterns | P1 |
| `backend/overview.md` | FastAPI structure, router registration | P0 |
| `backend/routers.md` | Route organization, dependency injection | P0 |
| `backend/services.md` | Business logic layer, service patterns | P1 |
| `backend/database.md` | SQLModel, Alembic migrations, models | P1 |
| `backend/security.md` | Auth middleware, RBAC, API token handling | P0 |
| `collab-server.md` | Yjs/Hocuspocus server, websocket connections | P2 |
| `cli.md` | CLI commands, dev workflow orchestration | P1 |
| `testing.md` | Test structure, running tests, coverage | P1 |
| `environment-variables.md` | Complete env var reference table | P0 |
| `troubleshooting.md` | Common errors, solutions, FAQ | P1 |

**Key decisions:**
- The developer guide is the most technical section — it should include code snippets
- Critical developer knowledge must be captured: port 5434, `--webpack` flag, SWR patterns, auto-save flush-on-unmount, `Form.Control asChild` pitfalls
- This section serves as onboarding for new contributors

---

### 06-api-reference

**Audience:** Developers integrating with the API, building frontend services

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Base URL, auth header format, response format | P1 |
| `authentication.md` | Login, token refresh, OAuth, SSO, API tokens | P1 |
| `courses.md` | CRUD, slim queries, metadata, chapters | P1 |
| `chapters.md` | Chapter/module CRUD, reorder | P1 |
| `activities.md` | Activity CRUD, lesson content, types | P1 |
| `users.md` | User CRUD, profile, settings | P1 |
| `orgs.md` | Organization CRUD, settings | P1 |
| `communities.md` | Community CRUD, discussions, votes | P2 |
| `boards.md` | Board CRUD, realtime | P2 |
| `analytics.md` | Analytics queries | P2 |
| `payments.md` | Payment endpoints: create checkout, purchase verification, Chargily webhooks | P1 |
| `webhooks.md` | Webhook management | P2 |
| `admin.md` | Admin-only endpoints | P2 |

**Key decisions:**
- Auto-generated from FastAPI OpenAPI spec would be ideal, but for now hand-written
- Focus on the endpoints frontend services actually call
- Each endpoint should show: method, path, request body, response body, errors

---

### 07-ui-reference

**Audience:** Developers, designers working on frontend

| File | Content | Priority |
|------|---------|----------|
| `README.md` | How to use this reference | P1 |
| `design-tokens.md` | Color palette, spacing scale, typography, shadows, border radii | P1 |
| `components/*.md` | One file per UI component — props, variants, usage examples | P1 |
| `pages/user-part.md` | All user-facing routes with screenshots | P2 |
| `pages/admin-dashboard.md` | All admin routes with screenshots | P2 |
| `patterns.md` | Common patterns: auto-save, drag-and-drop, form validation | P1 |

**Key decisions:**
- Design tokens should be the single source of truth for `bg-ui-bg-field`, `shadow-borders-base`, etc.
- Component docs should show both Medusa and original variants where applicable

---

### 08-features

**Audience:** Developers, technical decision-makers, future planners

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Section overview | P1 |
| `payments/overview.md` | Payment system design: Chargily as provider, course purchase flow, access gating | P1 |
| `payments/chargily-integration.md` | ✅ Already exists (`_archive/docs/payment-access-plan.md`) | P1 |
| `ai/overview.md` | AI features: Copilot, Magic Blocks, course planning, RAG | P2 |
| `ai/rag.md` | RAG system: embeddings, LlamaIndex, Gemini | P2 |
| `realtime.md` | Yjs collaboration, Hocuspocus, cursors | P2 |
| `seo.md` | SEO: metadata, sitemaps, Open Graph, JSON-LD | P2 |

**Key decisions:**
- This section documents significant feature areas that span multiple parts of the codebase
- The `payments/` subfolder will grow when Chargily integration is built

---

### 09-contributing

**Audience:** Open-source contributors

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Section overview | P2 |
| `code-of-conduct.md` | Code of conduct | P2 |
| `how-to-contribute.md` | Finding issues, making PRs, communication | P2 |
| `coding-standards.md` | TypeScript, Python, Tailwind conventions | P2 |
| `pull-request-guide.md` | PR template, review process | P2 |
| `commit-conventions.md` | Conventional commits | P2 |
| `branch-strategy.md` | Branch naming, workflow | P2 |

---

### 10-changelog

| File | Content | Priority |
|------|---------|----------|
| `README.md` | Links to GitHub releases, describes versioning scheme | P2 |

---

## 4. File Naming Conventions

### Rules

| Element | Convention | Example |
|---------|------------|---------|
| Folders | `NN-section-name` (zero-padded numbers for ordering) | `04-admin-guide/` |
| Files | `kebab-case.md` | `content-structure.md` |
| Sub-folders | `kebab-case/` | `org-settings/` |
| README | `README.md` (one per section folder) | `04-admin-guide/README.md` |
| Images | `kebab-case.webp` or `.png` in `assets/` subfolder | `assets/course-editor-tabs.webp` |

### Why

- Zero-padded numbers ensure sections appear in the correct order in file explorers
- `README.md` per folder gives GitHub and VS Code a landing page for each section
- `kebab-case` is URL-friendly and standard across the industry

---

## 5. Writing Standards

### 5.1 Voice & Tone

| Audience | Tone | Example |
|----------|------|---------|
| Learners | Simple, encouraging | "Browse courses on Koodook, purchase the ones you want, and start learning." |
| Admins (Creators) | Direct, instructional | "In the General tab, set your course price and access level." |
| Developers | Technical, precise | "The API uses JWT tokens in the Authorization header." |
| Self-hosters | Step-by-step, cautious | "Before proceeding, ensure Docker is running." |

### 5.2 Document Structure

Every document should follow this structure:

```markdown
# Title

> One-sentence summary of what this document covers.

---

## Overview

2-3 paragraphs explaining the concept, who it's for, and what they'll learn.

## Prerequisites (if any)

- Item 1
- Item 2

## Main Content

### Sub-section 1

Content...

### Sub-section 2

Content...

## Troubleshooting (if applicable)

Common issues and solutions.

## Next Steps

> See [Related Document](link)
```

### 5.3 Code Blocks

- TypeScript code blocks must specify language: ````typescript`
- Python: ````python`
- Shell commands: ````bash`
- API responses: ````json`

### 5.4 Callouts

```markdown
> **Note:** Important but non-critical information.

> **Warning:** Potential pitfalls or breaking changes.

> **Tip:** Helpful shortcuts or best practices.
```

### 5.5 Cross-References

```markdown
> See [Development Setup](../01-getting-started/development-setup.md) for prerequisites.
```

---

## 6. Cross-Referencing Strategy

### Within the same section
```markdown
See [User Groups](./user-groups.md) for details.
```

### Across sections
```markdown
See [Architecture Overview](../02-architecture/overview.md) for context.
```

### To code
```markdown
See [`EditCourseStructure.tsx`](../../apps/web/components/Dashboard/Pages/Course/EditCourseStructure/EditCourseStructure.tsx) for the implementation.
```

### To external resources
```markdown
See [FastAPI Documentation](https://fastapi.tiangolo.com/) for the framework reference.
```

---

## 7. Implementation Phases

### Phase 1 — Foundation (Priority P0)

**Goal:** Core docs that every developer needs to get started

| Task | Est. Time |
|------|-----------|
| Create `01-getting-started/` — migrate `DEV_SETUP.md`, write `quick-start.md` | 2 hours |
| Create `02-architecture/` — write `overview.md`, `routing.md`, `security.md`, `data-model.md` | 4 hours |
| Create `05-developer-guide/` — write `project-structure.md`, `environment-variables.md`, `getting-started.md` | 3 hours |
| Create `04-admin-guide/` — write `README.md`, `courses/overview.md`, `courses/general.md`, `courses/content-structure.md` | 4 hours |
| Create root `README.md` that links to all sections | 1 hour |

**Total Phase 1: ~14 hours**

### Phase 2 — User & Admin Docs (Priority P1)

**Goal:** Complete coverage for end-users and admins

| Task | Est. Time |
|------|-----------|
| Complete `03-user-guide/` — all files | 6 hours |
| Complete `04-admin-guide/` — org settings, users, groups, roles | 6 hours |
| Create `07-ui-reference/` — design tokens, key components | 4 hours |
| Create `08-features/` — payments overview, AI overview | 3 hours |

**Total Phase 2: ~19 hours**

### Phase 3 — Developer & API Docs (Priority P1)

**Goal:** Complete developer onboarding and API reference

| Task | Est. Time |
|------|-----------|
| Complete `05-developer-guide/` — frontend/backend deep dives, testing, troubleshooting | 8 hours |
| Create `06-api-reference/` — key endpoints | 6 hours |
| Complete `07-ui-reference/` — remaining components, patterns | 4 hours |

**Total Phase 3: ~18 hours**

### Phase 4 — Polish & Contributing (Priority P2)

**Goal:** Open-source readiness, final polish

| Task | Est. Time |
|------|-----------|
| Create `09-contributing/` — all files | 3 hours |
| Create `10-changelog/` | 1 hour |
| Complete `08-features/` — remaining feature docs | 3 hours |
| Cross-reference audit — ensure all links work | 2 hours |
| Screenshot audit — add images to user/admin guides | 4 hours |

**Total Phase 4: ~13 hours**

---

## 8. Appendix: Current State & Migration Path

### Files to Migrate from `_archive/`

| Archive Path | New Path | Action |
|-------------|----------|--------|
| `_archive/root/DEV_SETUP.md` | `01-getting-started/development-setup.md` | Migrate content, update links |
| `_archive/root/README.md` | `_archive/` (keep) | Already archived |
| `_archive/root/LESSON-PREVIEW-PLAN.md` | `08-features/lesson-preview.md` | Migrate when stable |
| `_archive/docs/AGENT_GUIDELINES.md` | `_archive/` (keep) | Agent instructions, not user docs |
| `_archive/docs/multi-tenancy.md` | `02-architecture/multi-tenancy.md` | Migrate content |
| `_archive/docs/payment-access-plan.md` | `08-features/payments/chargily-integration.md` | Already migrated |
| `_archive/docs/PROJECT_VISION.md` | `02-architecture/overview.md` | Incorporate key points |
| `_archive/docs/UI_ROUTES_MAP.md` | `02-architecture/routing.md` | Incorporate route table |
| `_archive/root/CONTRIBUTING.md` | `09-contributing/how-to-contribute.md` | Migrate when building Phase 4 |

### What to Delete

Once migration is complete:
- Delete `_archive/` folder entirely (or keep as historical reference)
- Delete old `future-coming-features/` from archive if content is migrated

### What to Ignore (Keep in Archive)

- Old Medusa-clone docs (MEDUSA_DASHBOARD_CLONE_CHECKLIST, MEDUSA_UI_MASTER_INSTRUCTIONS, etc.) — no longer relevant, keep in archive only for history
- `error.md` — already stale, keep archived
- `AGENTS.md`, `CLAUDE.md` — agent instructions, not user-facing docs

---

*End of Koodook Documentation Plan*
