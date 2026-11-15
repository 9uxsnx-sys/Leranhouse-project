> Status: as-built · Last verified: 2026-11-15

# Demo Seed — Build Plan

One Python command fills a fresh `demo` organization with realistic rows; every generator writes real database records, never UI mocks.

## Entry point

```powershell
cd apps/api
.\.venv\Scripts\python.exe -m src.services.seed --demo --reset --assets-dir "path\to\assets"
```

| Flag | Effect |
|---|---|
| `--demo` | Required confirmation of the target |
| `--reset` | Deletes the existing `demo` org and its rows before seeding |
| `--assets-dir` | Optional image/audio folder; defaults to `apps/api/seed-assets` |

The Node CLI has no seed command. Translation backfills are separate flags on the same module: `--seed-activity-translations`, `--seed-collection-translations`, `--seed-community-translations`, `--seed-podcast-translations`.

## Guardrails

1. **Development only.** The runner refuses to start unless `general_config.development_mode` is true.
2. **One organization.** Every insert carries the demo `org_id`; the seeder never creates a second org.
3. **No silent duplication.** If the `demo` org exists and `--reset` is absent, the run aborts.
4. **Full reset.** `--reset` deletes the org and every referencing row in dependency order, then seeds again.
5. **Deterministic.** A fixed random seed (`20260224`) keeps counts and shapes stable between runs.
6. **Assets optional.** Missing artwork produces SVG placeholders; missing audio leaves episodes silent.

## Orchestration order

`services/seed/runner.py` runs the generators in this order, so every parent exists before its children:

| Step | Generator | Creates |
|---|---|---|
| 1 | `org.py` | Organization and configuration |
| 2 | `users.py` | Owner, teachers, moderators, students, groups, API tokens |
| 3 | `courses.py` | Courses, flagship curriculum, authors, updates, translations |
| 4 | `collections.py` | Bundles, members, owners, translations |
| 5 | `podcasts.py` | Shows, episodes, translations |
| 6 | `community.py` | Communities attached to courses/podcasts, discussions, replies, votes, reactions |
| 7 | `attach_group_resources` | Course and podcast links on user groups |
| 8 | `progress.py` | Trails, enrollments, progress steps, certificates |
| 9 | `assignments.py` | Returns early; no assignment activities exist to attach to |
| 10 | `payments.py` | Config, orders, entitlements, payout costs, webhook events |
| 11 | `notifications.py` | Templates, notifications, recipients |
| 12 | `webhooks.py` | One endpoint and a delivery history |
| 13 | `analytics.py` | Back-dated events |
| 14 | `_invalidate` | Clears org and course Redis caches |

The runner prints a summary with exact counts for users, courses, discussions, podcasts, enrollments, steps, orders, notifications, deliveries and analytics events.

## Generator rules

- **Courses.** 19 rows: 16 published and 3 drafts. Only the flagship has a curriculum (1 intro chapter + 6 modules, 2 + 24 video lessons). Every course gets landing copy, card metadata, authors, a cover and a translation row where copy exists.
- **Communities.** 18 rows, each attached to a course or podcast. The flagship community gets 60 discussions; 15 others get 3 each. Replies, votes and reactions are randomised.
- **Podcasts.** 18 rows; 16 published. The flagship has 14 episodes, the other published shows have 2 each. Show and episode translations are written alongside.
- **Progress.** 450 course enrollments weighted toward the flagship, 150 podcast listens, and two extra runs for the owner and CLI admin so "Continue learning" is never empty. 60 flagship learners complete every lesson and receive a certificate.
- **Payments.** 140 orders over six months with weighted statuses, entitlements for paid and refunded orders, six months of payout costs and one webhook event per order. The config is seeded inactive with no secret keys.
- **Analytics.** 181 days of events with a growth curve, weekend dips, varied devices, referrers and paths.

## Reset and caching

- `--reset` deletes in dependency order inside one transaction; a failure rolls the whole reset back.
- The runner invalidates the org and course caches after seeding.
- Next.js pages revalidate on their own schedule; restart or hard-refresh the web app before recording a demo.

## Related

- [Seed manifest](./seed-manifest.md) — counts and contents
- [Payments overview](../payments/overview.md) — how seeded orders render
- [Analytics overview](../analytics/overview.md) — how events feed the tabs
