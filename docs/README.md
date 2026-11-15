> Status: as-built · Last verified: 2026-11-15

# LearnHouse Documentation

LearnHouse is a learning platform for creating and selling courses, podcasts and communities. The backend is a FastAPI application in `apps/api`, the frontend is a Next.js app in `apps/web`, `apps/cli` is a Bun-based command line for installation and maintenance, and `apps/collab` is a Yjs collaboration server for real-time editing.

The pages below describe what the code does today. Every page is written against the current source, not against an earlier plan.

## Sections

| Section | What it covers |
|---------|----------------|
| [01 — Getting Started](./01-getting-started/README.md) | Quick start and full development setup |
| [02 — Architecture](./02-architecture/README.md) | System overview, data model, routing and security |
| [03 — User Guide](./03-user-guide/README.md) | What a learner sees: courses, podcasts, collections, communities, activities, certificates and account |
| [04 — Admin Guide](./04-admin-guide/README.md) | Organization staff: courses, users, roles, payments, analytics and organization settings |
| [05 — Developer Guide](./05-developer-guide/README.md) | Backend, frontend, CLI, collaboration server, environment variables, testing and troubleshooting |
| [06 — API Reference](./06-api-reference/README.md) | HTTP endpoints by resource, with request and response shapes |
| [07 — UI Reference](./07-ui-reference/README.md) | Design tokens, shared components, page patterns and admin dashboard structure |
| [08 — Features](./08-features/README.md) | Deep dives into cross-cutting areas: payments, analytics, AI, communities, notifications, localization |
| [09 — Contributing](./09-contributing/README.md) | Branch strategy, coding standards, commit conventions and pull requests |
| [10 — Changelog](./10-changelog/README.md) | Chronological record of the current development line |

## How to use these docs

- **Learners** start with the [User Guide](./03-user-guide/README.md), which walks through every screen a learner can reach.
- **Organization staff** use the [Admin Guide](./04-admin-guide/README.md) for course setup, access rules, users, payments and settings.
- **Contributors** start with [Getting Started](./01-getting-started/README.md), then read the [Developer Guide](./05-developer-guide/README.md) and [Architecture](./02-architecture/README.md) before changing code.
- **Integrators** use the [API Reference](./06-api-reference/README.md) together with [Authentication](./06-api-reference/authentication.md) and the organization API access settings in the admin guide.

## Archive

`docs/_archive/` holds superseded plans and documentation for features that were removed or never shipped. It is kept for history only and is not maintained; nothing there describes the current product. Live pages that used to link to an archived plan now name the plan as plain text instead.
