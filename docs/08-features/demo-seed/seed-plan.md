# Demo Seed — Build Plan

> **Status:** built and seeded. The manifest in [seed-manifest.md](./seed-manifest.md) is the current contract.
> **Goal:** one command fills a fresh `demo` org with believable data so every public page and every dashboard tab looks like a platform that has been running for months.
> **Decision:** seed the database with real rows. We do not mock the UI.

---

## 1. Scope

| In | Out |
|---|---|
| The org with slug `demo` | More than one organization on the instance |
| 16 published courses, 1 with full curriculum | Lessons on the other 15 |
| 16 communities, 1 heavily active | Moderation queues and reports |
| 16 podcasts, 1 with a full season | Real audio production |
| 16 collections, payments, notifications, analytics | Email delivery, external webhooks actually firing |

---

## 2. Guardrails

1. **Development only.** The runner refuses to start unless `general_config.development_mode` is true. Local `.env` already sets `LEARNHOUSE_DEVELOPMENT_MODE=true`.
2. **One org only.** Every insert carries the demo `org_id` and every delete is scoped to it. The old `default` org is gone, and `auto_install` now only runs when the database holds zero organizations, so a restart cannot recreate a second one.
3. **No silent duplication.** If the `demo` org exists, the run aborts and tells you to pass `--reset`.
4. **Full reset.** `--reset` deletes the demo org and every row that references it, in dependency order, then seeds again.
5. **Artwork is optional and niche aware.** Pictures in `pics/` are copied in. Each subfolder is a niche, matched to the subject of the course, collection or community. Files in `pics/avatars` are used only for user avatars. Without a folder the run continues and the slots stay empty.
6. **Deterministic.** A fixed random seed so two runs produce the same numbers, which keeps screenshots and retakes consistent.

---

## 3. Where the code lives

One Python package inside the API app, reusing the existing engine and session so there is no second database layer.

```
apps/api/src/services/seed/
  __init__.py          # public entry: run_demo_seed(reset: bool, ...)
  __main__.py          # python -m src.services.seed
  runner.py            # orchestration, guard, reset, summary report
  reset.py             # dependency ordered delete of the demo org
  assets.py            # niche pools, shuffled decks, avatars kept apart, copy files
  copy.py              # human sounding text fragments (English, French, Arabic)
  generators/
    org.py             # org, config, roles, groups, api tokens
    users.py           # owner, teachers, moderators, students, avatars, bios
    courses.py         # 19 courses, flagship curriculum, translations, updates
    progress.py        # trail, trailrun, trailstep, certificates
    collections.py     # bundles and membership
    community.py       # communities, discussions, comments, reactions, votes
    podcasts.py        # shows, episodes, translations, listens
    assignments.py     # assignments, tasks, submissions, code submissions
    payments.py        # config, orders, entitlements, payout costs, webhooks
    notifications.py   # templates, notifications, recipients
    analytics.py       # back dated events
```

Playgrounds and boards are not seeded. The routes exist but no menu links to them, so they cannot be reached in the demo.

Entry point:

```
cd apps/api
.venv/Scripts/python -m src.services.seed --demo --reset --assets-dir "c:\Projects\learnhouse-dev\learnhouse-dev\pics"
```

Required flag: `--demo`. Optional: `--reset`, `--assets-dir`.

The Node CLI gets a thin `seed` command later only if we want it. Python module first, no wrapper.

---

## 4. Build order

Each step ends with the API still booting and the affected page rendering.

### Step 1 — Skeleton
`runner.py`, guard, `reset.py`, summary output. Prove `--reset` on an empty org.

### Step 2 — Org and people
Org, config, roles, 158 users, memberships, groups, tokens. Verify the admin Users page and the org switcher.

### Step 3 — Courses
19 courses. Covers and banners are copied only when an asset folder is supplied, otherwise those fields stay empty. Verify the course grid shows 2 full pages.

### Step 4 — Flagship curriculum
6 chapters with `coursechapter.order`, 26 activities with `chapteractivity.order`, YouTube URIs, translations, course updates. Verify the course page, lesson navigation and the video player.

### Step 5 — Progress and certificates
Trails, 600 runs, 2,293 steps in quartiles, 60 certificates. Verify learner Progress and the course progress bars.

### Step 6 — Collections
16 bundles with members and owners. Verify the Collections grid.

### Step 7 — Community
16 communities, 105 discussions, 239 comments, reactions and votes. Verify the listing, community feed and a discussion thread.

### Step 8 — Podcasts
16 shows, 44 episodes, optional audio reuse. Verify the podcast grid at 8 per page and episode lists.

### Step 9 — Assignments
Verify the Assignments page and the code block submission history.

### Step 10 — Payments
Config, 140 orders, entitlements, payout costs, webhook log. Verify Overview, Transactions, Payouts and Offers.

### Step 11 — Notifications
Templates, 26 notifications, 2,369 deliveries with a 35 percent unread mix. Verify the bell badge, dropdown and reading window.

### Step 12 — Webhooks and analytics
Webhook deliveries and 12,000 events. Verify every Analytics tab.

### Step 13 — Polish and verification
Cache invalidation, full acceptance pass, twice run plus reset proof.

---

## 5. Data rules each generator follows

### Courses
- 16 published, 3 drafts.
- Only the flagship gets chapters and lessons.
- Every course has a `thumbnail_image` filename pointing at a copied file, plus description, about, learnings, tags and price. Only the flagship also has a `banner_image`.
- Mix of access types: mostly free public, a few paid, one users only. Paid ones are what the payment orders reference.
- Creation and update dates spread across six months, not all on the same day.

### Progress
- Enrollment counts follow a power curve. A handful of courses are popular, the long tail has a few learners.
- Completion quartiles: 15 percent near done, 35 percent mid, 30 percent early, 20 percent abandoned after one or two lessons.
- Only the flagship can reach 100 percent, and only for the 60 certified students.

### Community
- The main community carries the weight. Posts written by named people with history, not by anonymous accounts.
- Reply depth from one word to three paragraphs. Not every post has replies.
- Reactions and votes uneven. Some posts get none.

### Podcasts
- The main show has 14 episodes with real titles and descriptions, sequential dates.
- Other shows have 2 episodes so their detail page is not empty.
- Listens attach to `trailrun` with `RUN_TYPE_PODCAST` plus matching analytics events.

### Payments
- Orders spread across six months with a realistic status mix: 78 percent paid, 8 percent pending, 6 percent failed, 4 percent expired, 4 percent refunded.
- Fees vary with amount so the payout math is not a flat line.
- Entitlements only exist for paid orders that succeeded.

### Notifications
- 26 notifications: announcements, learning events, system notices.
- Delivery is targeted, not everyone gets everything.
- Most read, a third unread, three of them recent enough to sit at the top of the bell.

### Analytics
- 12,000 events across roughly 180 days.
- Daily volume follows weekdays and a slow growth curve. Weekends dip.
- Referrers, devices and countries vary per event so the Audience tab is not three identical columns.
- Every event carries a real `user_id`, `org_id`, `course_uuid` or `podcast_uuid` where the query expects one.

---

## 6. Copy rules (hard)

Applies to course descriptions, about sections, learnings, tags, course updates, discussion titles and bodies, comments, podcast and episode descriptions, notification titles and bodies, media names, group names.

- No hyphens or underscores as punctuation or separators.
- No ellipses, no em dashes.
- No marketing filler: delve, unlock, elevate, seamless, robust, journey, game changer, in today's world.
- No uniform sentence length or repeated structures across items.
- Community text reads like people typing: lowercase starts, short reactions, corrections, inside references.
- French and Arabic written as native phrasing, not literal translation.
- Names and situations stay consistent across generators. A student who posts in the community is enrolled in the course they mention.

The manifest holds the sample strings we agree on before writing the generators.

---

## 7. Database gotchas

| # | Gotcha | Handling |
|---|---|---|
| 1 | `creation_date` and `update_date` are VARCHAR holding full ISO timestamps | Always write ISO strings with time, never empty |
| 2 | `user` is a reserved word | Quote it in raw SQL, use the model in ORM paths |
| 3 | Enum columns store UPPERCASE labels | Write labels such as `PUBLIC`, `RUN_TYPE_COURSE`, not Python enum names |
| 4 | `userorganization.role_id` is NOT NULL | Attach a real role id to every membership |
| 5 | `user.failed_login_attempts`, `user.is_superadmin`, `activity.current_version` are NOT NULL despite defaults | Set them explicitly |
| 6 | `trailstep` needs both `trailrun_id` and `trail_id` | Create the trail first |
| 7 | Learner progress counts `chapteractivity` rows | Flagship lessons must all be linked to a chapter |
| 8 | `analytics_events.created_at` is a real timestamptz | Pass datetimes |
| 9 | Chapter order lives on `coursechapter.order`, activity order on `chapteractivity.order` | Set both |
| 10 | Courses without activities divide by zero in progress math | Server already guards it, but avoid enrolling in empty courses beyond analytics needs |
| 11 | Course listings are cached in Redis for 60 seconds | Call `invalidate_courses_cache(slug)` and clear `courses_cache:*` at the end of a run |
| 12 | Next.js pages revalidate at 120 seconds | Hard refresh after seeding, or restart the web app before recording |

---

## 8. One UI change

`apps/web/app/orgs/[orgslug]/(withmenu)/podcasts/podcasts.tsx` renders 12 cards per page. Change `itemsPerPage` to 8 so podcasts, courses, communities and collections all page identically. Nothing else in the file changes.

---

## 9. Reset strategy

`--reset` deletes in this order, all scoped to the demo org:

1. Rows with a direct `org_id` foreign key: analytics events, notifications and recipients, webhooks and deliveries, payment orders, entitlements, payout costs, usage, api tokens, media and folders.
2. Content leaves: comments, reactions, votes, discussions, communities, episodes, podcasts, collection links, assignments and submissions, code submissions, playgrounds, boards.
3. Learning: trail steps, runs, trails, certificates, chapter activities, activities and versions, chapters, course chapters, course translations and updates, courses.
4. People: group memberships, groups, user organizations, non owner users created by the seed.
5. Config, roles created by the seed, then the organization row last.

Every step runs inside one transaction. If any step fails, nothing is deleted.

---

## 10. Acceptance checklist

- [ ] Seed refuses to run when development mode is off.
- [ ] Seed refuses to run twice without `--reset`.
- [ ] Courses page shows exactly 2 full pages of 8.
- [ ] Every card has a cover from the matching niche folder, or from the general pool when the niche has no folder.
- [ ] Every course card shows lesson count, duration and difficulty. No card is missing metadata.
- [ ] Every card description fills three lines in the grid, no card stops at one line.
- [ ] Collection cards show a real level instead of "All levels".
- [ ] Only the flagship course, its community and the first collection have banners. Episode covers and the org logo stay empty by choice.
- [ ] Flagship course opens, shows 6 modules and 26 lessons, video plays.
- [ ] The other 15 course pages render their landing content with an empty syllabus.
- [ ] Communities page shows 2 full pages. The main community has 60 posts with replies, reactions and votes.
- [ ] Podcasts page shows 2 full pages at 8 per page. The main show has 14 episodes.
- [ ] Collections page shows 2 full pages.
- [ ] Progress page shows enrolled courses with varied percentages plus issued certificates.
- [ ] Payments pages show orders, revenue, fees and a payout report with non zero numbers.
- [ ] Notifications bell shows an unread badge, a populated dropdown and readable windows.
- [ ] All Analytics tabs render charts with variation, no flat lines, no empty states.
- [ ] No string in the UI violates the copy rules.
- [ ] `--reset` leaves zero demo rows, verified by count, and the app still boots.
- [ ] A second `--reset` run produces the same numbers.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Empty syllabus on the 15 supporting courses looks odd if clicked on camera | Presenter stays on the flagship. If that is not acceptable later, add one stub module per course, which is a small delta |
| 158 avatars clashing in style | You control the assets folder when you supply it. The seeder only rotates what is there |
| Analytics numbers clamp or look synthetic | Volume curves and per entity variation are tuned and checked against the real chart queries before sign off |
| Demo org polluting a real database | Guard plus org scoped reset. Safe to run on a local or staging database only |
| Frontend caching showing old empty state after seeding | Redis invalidation in the runner plus a documented hard refresh before recording |

---

## 12. Open items before code

1. Confirm the asset folder path and that you will drop images plus one mp3.
2. Confirm the demo org display name, default "Koodook Academy" with slug `demo`.
3. Confirm English as the main language with a few French and Arabic items for realism.
