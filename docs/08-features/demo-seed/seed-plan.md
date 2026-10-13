# Demo Seed — Plan

> **Status:** Plan (not built). This is the build contract for a one-command seeder that fills a LearnHouse instance with realistic fake data so the platform can be demoed "fully alive" on demand.
> **Decision made:** we **seed the database** (real rows), not mock the UI.
> **Companion docs:** [data-model.md](../../02-architecture/data-model.md), [development-setup.md](../../01-getting-started/development-setup.md), [cli.md](../../05-developer-guide/cli.md).

---

## 1. Why seeding, not UI mocks

The web app is already fully wired to real API endpoints. So the two ways to fake a "living" platform are:

| | **DB seeding** (chosen) | UI mock data |
|---|---|---|
| What it is | A script inserts real rows into Postgres | Components swap API calls for hardcoded fixtures |
| Pages that work | **Every page** — listing, detail, search, pagination, enrollments, analytics | Only the ones you hand-edit |
| Analytics tabs | Populated with real numbers | Empty or fake |
| Effort | One script | Touch dozens of components |
| Reverting | `--reset` deletes exactly the demo data | Remove mock code from every file (risky leftovers) |
| Risk | None if guarded to dev mode | Mock branches leak to production |

Seeding wins: the owner sees the *actual* product, and every shipped feature (including the 7 Analytics tabs) is exercised. UI mocks would demo a fake shell that proves nothing.

---

## 2. Where the demo data lives

**Recommended default: a dedicated demo organization** (slug `demo`), seeded into the normal database.

| Option | Pros | Cons |
|---|---|---|
| **Dedicated demo org (recommended)** | Proves real multi-tenant behavior; `--reset` deletes exactly that org; runs alongside real data | All demo data shares one DB (isolation is by `org_id`, which every table already carries) |
| Separate demo database | Cleanest isolation — drop the DB to reset | Must point the API at it when demoing |
| Fill an existing org | Fastest to view | Mixes fake with real data; hard to cleanly undo |

> **TODO — confirm before building.** The script's reset logic depends on this. The plan below assumes the **dedicated demo org**; switching to a separate DB only changes the connection/reset step.

---

## 3. What the seeder must generate (the graph)

The demo must be a **connected graph**, not isolated rows, because every page joins across tables:

```
demo org
 ├─ roles        → reuse the existing global role IDs (1 admin, 2 maintainer, 3 instructor, 4 user)
 ├─ users        → ~4 teachers (instructor) + ~1 admin + ~150 students (user), faker names/emails
 ├─ courses      → ~2 listing pages worth (≈24; confirm listing page size when implementing)
 │    ├─ intro      → activities that appear BEFORE the first module
 │    ├─ modules    → ≥5 chapters per course
 │    │    └─ lessons → 3 activities each (mixed types: video / document / dynamic)
 │    ├─ thumbnail + banner  → random pick from the image folder
 │    └─ tags / description / about / learnings (faker prose)
 ├─ trails
 │    └─ trailrun + trailstep → enrollments with PARTIAL progress (spread across quartiles)
 ├─ podcasts     → ~6 shows → episodes → listens (podcast run_type)
 ├─ communities  → ~5 communities → discussions (varied labels/lengths)
 │    └─ comments → replies of different sizes (1 line … several paragraphs)
 │    └─ reactions → +1 / ❤ / 🎉 spread across members
 └─ analytics_events → page_view + time_on_activity, back-dated over the window
```

### Realism rules (these are what make it look real, not generated)

1. **Spread the timestamps.** `creation_date` / `update_date` are ISO strings — back-date them across ~6 months. Flat timestamps are the #1 tell: charts won't curve, DAU won't vary, "recent activity" won't look alive.
2. **Vary sizes.** Not every course is equal — some 3 lessons, some 12. Not every student is equal — some 90% through, some 5%, some abandoned after one lesson. Partial `trailstep` progress is what fills learner-progress buckets and drop-off curves.
3. **Vary text.** Discussion titles/comment bodies should range from one-liners to multi-paragraph, mixing questions, ideas, and announcements (use the real `DISCUSSION_LABELS`).
4. **Realistic referrers/devices** on `page_view` events (google.com, facebook.com, direct; desktop/mobile) so the Audience tab has a real distribution.
5. **Some drafts.** Leave a few unpublished courses/podcasts/episodes so status filters have something to hide.

---

## 4. Images / banner folder

Because the DB stores only a **filename** and the web builds the URL, the seeder does not need the upload API — it copies files the same way the real uploader does.

**Expected layout (to be created by whoever runs it):**

```
apps/api/seed-assets/
 ├─ course-covers/     *.jpg / *.png   (picked randomly, one per course)
 ├─ course-banners/    *.jpg / *.png
 ├─ podcast-covers/    *.jpg / *.png
 └─ community-covers/  *.jpg / *.png
```

**What the seeder does per resource:**

1. Pick a random file from the matching folder.
2. Copy it to `content/orgs/{org_uuid}/{subdir}/{unique_filename}` (filesystem delivery, per `config.yaml`).
3. Store **only the generated filename** in the DB column (`thumbnail_image`, `banner_image`, …).

> If a folder is empty, fall back to a generated placeholder so the seed never fails on missing assets.

---

## 5. Hard requirements (non-negotiable)

1. **Production guard.** The seeder must **refuse to run** unless development mode is on (`LEARNHOUSE_DEVELOPMENT_MODE=true` / `general.development_mode`) — reuse the existing mode-bypass pattern. Accidentally seeding fake courses into a live tenant is a disaster.
2. **Idempotent.** Re-running must not duplicate. Either every run starts by deleting the demo org's data (`--reset`), or use deterministic UUIDs/slugs so re-inserts upsert.
3. **Reversible.** `--reset` (and ideally a plain run, if idempotent) must leave **zero residue** — count demo rows before and after to prove it.
4. **Reuse real defaults.** Use the existing global roles (IDs 1–4) and the real feature/config rows — do not invent a parallel permission model.

---

## 6. Technical gotchas to respect (learned the hard way)

| # | Gotcha | What to do |
|---|---|---|
| 1 | `creation_date` / `update_date` are **VARCHAR** holding ISO-8601 **with time**; empty string is possible | Always write full ISO strings; never `''` |
| 2 | `user` is a **reserved word** in Postgres | Quote it: `"user"` |
| 3 | Enums in the live DB are **UPPERCASE** (`PUBLIC`, `STATUS_COMPLETED`, `RUN_TYPE_COURSE`) | Write labels, not Python enum *names* |
| 4 | `userorganization.role_id` is **NOT NULL** | Always attach a real role |
| 5 | `user.failed_login_attempts`, `user.is_superadmin`, `activity.current_version` are **NOT NULL** even though the model defaults them | Set them explicitly (`0`, `false`, `1`) |
| 6 | `trailstep` needs a valid `trailrun_id` **and** `trail_id` | Create the `trail` first |
| 7 | Progress is derived from `chapteractivity` rows (`COUNT(DISTINCT ca.id)`) | Link activities to chapters or progress reads 0% |
| 8 | `analytics_events.created_at` is a real `timestamptz` (not a string) | Pass datetimes, not ISO strings |
| 9 | Course chapter order lives on `coursechapter.order`, activity order on `chapteractivity.order` | Set both so ordering/drop-off work |

---

## 7. Proposed structure

**Location:** one Python package in the API app (not spread across the frontend), mirroring the test factories we just added.

```
apps/api/src/services/seed/
 ├─ __init__.py
 ├─ runner.py          # orchestrates: org → users → courses → podcasts → community → analytics
 ├─ generators/
 │    ├─ users.py
 │    ├─ courses.py    # courses, chapters, activities, intro lesson
 │    ├─ progress.py   # trail / trailrun / trailstep with partial completion
 │    ├─ podcasts.py
 │    ├─ community.py  # discussions, comments, reactions
 │    └─ events.py     # analytics_events (back-dated)
 └─ assets.py          # random image pick + copy into content/…
```

**Entry point — a CLI command** (consistent with `dev`, `setup`, etc.):

```
learnhouse seed --demo            # create/refresh the demo org
learnhouse seed --demo --reset    # wipe demo data first, then reseed
learnhouse seed --demo --courses 24 --students 150   # override counts
```

> Implementation note: the CLI (`apps/cli`) is Node/TypeScript, so `learnhouse seed` would either call the Python script via the same mechanism `dev` uses to spawn the API, **or** be a thin wrapper that runs `python -m src.services.seed` inside the api container/env. Confirm the cleanest path at build time.

**How the seeder talks to the DB:** reuse the app's existing engine/session ([database.py](../../../apps/api/src/core/events/database.py)) — no new connection code.

---

## 8. Acceptance checklist (how we'll know it's done)

- [ ] `learnhouse seed --demo` fills the platform; the course listing shows ~2 full pages.
- [ ] Every course has ≥5 modules × 3 lessons, plus lessons before the first module.
- [ ] Course covers/banners render (random picks from the folder).
- [ ] Analytics tabs are **non-empty** with plausible, varied numbers (not flat lines).
- [ ] Community shows discussions with replies of clearly different sizes, plus reactions.
- [ ] Podcasts show episodes and listening numbers.
- [ ] `--reset` leaves **zero** demo rows (verified by count) and the app still works.
- [ ] Running it twice does **not** duplicate.
- [ ] With development mode **off**, the command refuses to run.

---

## 9. Build order (when we start)

1. `runner.py` + demo-org creation + production guard + `--reset`.
2. Users + roles (reuse global roles).
3. Courses → chapters → activities → intro, with image copying.
4. Progress (`trail*`) with varied percentages.
5. Community (discussions/comments/reactions).
6. Podcasts + episodes + listens.
7. `analytics_events` back-dated events.
8. CLI wiring + the acceptance checklist.

---

## 10. Open decisions to confirm before building

1. **Placement** — dedicated demo org (assumed) vs separate database vs fill an existing org.
2. **Counts** — the exact course/student/discussion numbers (rough targets above).
3. **CLI integration** — `learnhouse seed` (Node wrapper) vs a direct `python -m` command.
4. **Assets** — are you providing the image folder, or should the seeder generate placeholders when it's empty?
