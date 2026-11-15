# Documentation refresh — tracking (completed)

> Status: complete · Started: 2026-11-15 · Completed: 2026-11-15 · Source of truth: the code.
>
> Archived record of the docs refresh. Every page in the live tree was verified
> against the code before this file was moved here.

## Conventions (applied to every page)

- Header on each page: `> Status: as-built · Last verified: 2026-11-15`.
- No hand-maintained file trees, route maps or payload dumps — summarise and link to the code.
- A shipped or abandoned plan moves to `docs/_archive/`; `08-features/*-plan.md` only survives while it is genuinely future work.
- People data (`extra_metadata.instructors` / `hosts`) is structural: entries and avatars shared, `name`/`title` per locale.

## Phase 1 — Developer guide

☑ environment-variables, troubleshooting, project-structure, cli, backend/{database,overview,routers,security}, 02-architecture/security, testing + testing/api/{01,17,19}, frontend/{overview,services,ui-components}, collab-server, 01-getting-started/{development-setup,quick-start}.
☑ `05-developer-guide/testing/agent/*` archived to `docs/_archive/docs/testing-agent/`.

Acceptance: banned strings (`LEARNHOUSE_JWT_SECRET`, `NEXT_PUBLIC_API_URL`, `API_INTERNAL_KEY`, `src/db/models`, `packages/`) return 0 hits outside the archive.

## Phase 2 — API reference

☑ Mount prefixes corrected (`/chapters`, `/activities`, `/orgs/{id}/webhooks`, `POST /courses/?org_id=`).
☑ Payloads, status codes and response shapes aligned with the routers.
☑ "Planned" payments endpoints removed; `/access` and `/translations/*` documented.
☑ New pages: usergroups, roles, trail, assignments, certifications, analytics, communities, discussions, boards, playgrounds, AI, code, search, media.

## Phase 3 — User + admin guides

☑ Archived: `org-settings/features.md`, `org-settings/landing.md`, `content-library.md`, `courses/certification.md`, `courses/analytics.md`.
☑ Rewritten: dashboard getting-started, courses (overview/general/content-structure/access/contributors/seo/translations), users, roles, user-groups, analytics, assignments, payments, org general/SEO/audit-logs, admin README.
☑ New: podcast admin guide, collection admin guide, course translations page.
☑ Learner guide rewritten: getting-started, courses, podcasts, collections, communities, activities, boards, playgrounds, certificates, account, store.

## Phase 4 — Feature docs + hubs

☑ Archived: mobile-app, desktop-app, video DRM, `episode-admin-editing-plan`, `teacher-payout-plan`, `revenue-analytics`, `posthog-integration-plan`, `DOCUMENTATION-PLAN.md`, `collections/implementation-plan`.
☑ Refreshed: payments (overview/progress), i18n-rtl (rtl-plan, content/podcasts/collections localisation, progress), communities, demo-seed (manifest/plan), analytics, AI, home-page, navigation breadcrumbs.
☑ Rebuilt: `10-changelog/README.md`, `docs/README.md`, `docs/08-features/README.md`.

## Phase 5 — Code fixes found by the audit

| Issue | Fix | State |
|---|---|---|
| `/store` called unregistered offer endpoints | Store rebuilt as a paid-product catalogue over the existing course/podcast/collection listings; offer UI and client deleted | ☑ |
| Paid podcast never opened a checkout | Podcast product page now starts the Chargily checkout like courses and collections | ☑ |
| Course list difficulty filter unused | Predicate applied on the learner list and the dashboard table | ☑ |
| Demo podcast hosts not seeded | Base `extra_metadata.hosts` written by the seeder, with inline avatars and fr/ar overrides | ☑ |
| Course updates RBAC checked a non-existent resource | Update/delete resolve the parent course; list endpoint gained a catalogue read check | ☑ |
| `open_to_contributors` flag ignored | Contributor applications rejected with 403 when the course is closed | ☑ |
| Dead payment surfaces (offers, enrollments, Stripe, billing portal) | Deleted unused clients and components | ☑ |
| Test baseline in payments progress | 2574 passed, 2 skipped | ☑ |
