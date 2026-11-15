> Status: as-built · Last verified: 2026-11-15

# Demo Seed — Manifest

The seeder fills a single `demo` organization with real database rows so every public page and dashboard tab has believable data.

## Target

| Item | Value |
|---|---|
| Organization | Koodook Academy, slug `demo` |
| Owner login | `owner@koodook.academy` / `Demo12345` |
| Bootstrap admin | `admin@school.dev` is attached to the org if that account exists |
| Instance | One organization; the seeder never creates a second |

## Verified row counts

| Table | Rows |
|---|---|
| `organization` / `organizationconfig` | 1 each |
| `user` | 158 (1 owner, 4 teachers, 3 moderators, 150 students) |
| `userorganization` | 158, plus the bootstrap admin when present |
| `usergroup` / `usergroupuser` / `usergroupresource` | 6 / 60 / 20 |
| `apitoken` | 2 |
| `course` | 19 (16 published, 3 drafts) |
| `chapter` / `coursechapter` | 7 / 7 |
| `activity` / `chapteractivity` | 26 / 26 |
| `resourceauthor` | 23 |
| `courseupdate` | 25 |
| `course_translation` | 38 |
| `trailrun` | 450 course runs + 150 podcast runs + 2 demo-viewer runs |
| `trailstep` | One per completed flagship lesson; no fixed total |
| `certifications` / `certificateuser` | 3 / up to 60 |
| `collection` | 18 (16 published, 2 drafts) |
| `collectioncourse` / `collectionuser` | 3 to 6 members and 3 to 7 owners per published bundle |
| `collection_translation` | 36 (18 collections × 2 locales) |
| `community` | 18, all published |
| `community_translation` | 36 (18 × 2) |
| `discussion` | 105 (60 in the flagship community, 3 in each of 15 others) |
| `discussioncomment`, votes, reactions | Variable; generated per discussion |
| `podcast` | 18 (16 published, 2 drafts) |
| `podcastepisode` | 44 (14 flagship + 2 for each of 15 other published shows) |
| `podcast_translation` | 36 (18 × 2) |
| `podcast_episode_translation` | 88 |
| `paymentconfig` | 1 (Chargily, test mode, inactive, no secret keys) |
| `paymentorder` / `paymentwebhookevent` | 140 / 140 |
| `resourceentitlement` | One per unique buyer/resource among paid and refunded orders |
| `payoutcost` | 6 months |
| `notification` / `notification_template` | 26 / 12 |
| `notification_recipient` | Variable; 40 to 150 students per notification |
| `webhook_endpoint` / `webhook_delivery_log` | 1 / 60 |
| `analytics_events` | 181 days of events at a growing daily volume |

The runner prints the exact counts for the current run after seeding.

## What the data contains

- **Courses.** 19 courses share filled landing pages (title, description, about, learnings, tags, price, authors, cover). Only the flagship **Backend Engineering with Python** has a curriculum: 1 intro chapter, 6 weekly modules, 2 intro lessons and 4 lessons per module, all video activities.
- **Course translations.** French and Arabic rows carry display fields, SEO, requirements and instructor names; chapter and lesson translations live in `extra_metadata`.
- **Collections.** 18 bundles with course members and owner badges; the first is paid and leads with the flagship course.
- **Communities.** Every community is attached to a course or podcast and inherits its access; the flagship community carries the bulk of the discussions.
- **Podcasts.** 18 shows; the flagship **The Pixel Hour** has 14 episodes with hosts, descriptions and objectives. Other published shows have 2 episodes.
- **Progress.** 450 course enrollments weighted toward the flagship, 150 podcast listens, 60 completing learners and 3 certificate templates.
- **Payments.** Six months of orders with a realistic status mix, entitlements, monthly payout costs and a webhook log.
- **Analytics.** Page views, course and activity views, enrollments, completions, searches, discussion posts and signups.

## Not seeded

| Item | Reason |
|---|---|
| Assignments, tasks and submissions | The generator only acts on `TYPE_ASSIGNMENT` activities, and the seeder creates video activities only, so it returns early |
| Boards, playgrounds | No shipped menu links to them |
| Custom domains, superadmin tokens, packs, usage events, AI generations, course embeddings | Platform-level or unused in this build |
| Media files | Optional; the seeder copies images and an optional audio sample when an assets folder is supplied, otherwise it writes SVG placeholders |

## Artwork and audio

The default assets folder is `apps/api/seed-assets` (avatars and a banner). If artwork is supplied, each subfolder is a niche matched to the course, collection or community subject; files in `avatars` are used only for people. Episode audio is copied from a supplied audio file; without one, episodes are seeded with no audio. No file-tree layout is listed here because it depends entirely on what the operator supplies.

## Related

- [Seed plan](./seed-plan.md) — how the runner and generators work
- [Payments overview](../payments/overview.md) — how seeded orders appear in the dashboard
