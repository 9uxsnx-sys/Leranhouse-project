# Demo Seed — Manifest

> **Status:** built and seeded. Counts below match the live `demo` org.
> **Companion:** [seed-plan.md](./seed-plan.md) (how it gets built).
> **Purpose:** an exact, countable list of what lands in the database so the platform can be recorded for a demo video.

---

## 1. Decisions locked in

| # | Decision | Value |
|---|---|---|
| 1 | Seed method | Real database rows, not UI mocks |
| 2 | Target | **A new org, slug `demo`** — the existing `default` org stays untouched |
| 3 | Curriculum | **Only the flagship course** gets modules and lessons. The other courses get a filled landing page: title, subtitle, description, about, learnings, tags, price, authors, cover, banner |
| 4 | Flagship | **Backend Engineering with Python**. Six weeks from an empty folder to a deployed API: git, requests, database, auth, tests, deploy |
| 5 | Community link | The first community is named after the flagship course and linked to it with `course_id`, so the course page shows its feed and the course filter on the communities page is not empty |
| 6 | Listing density | Every public listing page shows **8 items per page**. Courses, communities, podcasts and collections each get **16 published items = exactly 2 full pages** |
| 7 | Images | Supplied in `pics/` and copied on every run. Subfolders are niches, matched per course, collection and community. Section 5 lists every slot |
| 8 | Copy | Written like real people. No AI tells, no hyphens, no underscores, no ellipses inside seeded text |

### Why the podcast count changed

The podcast page currently renders 12 cards per page ([podcasts.tsx](../../../apps/web/app/orgs/%5Borgslug%5D/(withmenu)/podcasts/podcasts.tsx)) while courses and communities render 8. That makes the podcast grid denser and its two pages would need 24 items. The plan changes it to 8 so all listings match, then seeds 16 podcasts. One line of UI, and every listing then behaves identically on camera.

---

## 2. Page math

| Listing | Items per page now | Change | Published items seeded | Result |
|---|---|---|---|---|
| Courses | 8 | none | 16 | 2 full pages |
| Communities | 8 | none | 16 | 2 full pages |
| Podcasts | 12 | **set to 8** | 16 | 2 full pages |
| Collections | 8 | none | 16 | 2 full pages |

Each listing also gets a few unpublished rows so the status and visibility filters have something to hide.

---

## 3. What gets seeded, table by table

Roughly **24,000 rows** in total.

### 3.1 Organization and people

| Table | Rows | What it is |
|---|---|---|
| `organization` | 1 | Koodook Academy, slug `demo`, logo, banner, description, SEO fields |
| `organizationconfig` | 1 | Every feature enabled, payments on, Chargily as provider |
| `role` | 4 (reused) | Existing global roles, not new ones |
| `user` | **158** | 1 owner, 4 teachers, 3 moderators, 150 students. Avatar, bio, links, back dated signup dates |
| `userorganization` | 158 | Every user attached to the demo org with a role |
| `usergroup` | 6 | Cohorts and teams, each with members and assigned content |
| `usergroupuser` | 60 | Group membership |
| `usergroupresource` | 20 | Courses and podcasts assigned to groups |
| `apitoken` | 2 | The token table is not empty |

### 3.2 Courses

| Table | Rows | What it is |
|---|---|---|
| `course` | **19** | 16 published plus 3 drafts |
| `chapter` + `coursechapter` | 7 + 7 | Intro chapter plus 6 modules, flagship only |
| `chapteractivity` | 26 | Flagship only: 2 intro lessons plus 6 modules of 4 lessons |
| `activity` | 26 | 22 video lessons and 4 assignment activities |
| `activityversion` | 8 | Version history panel has entries |
| `resourceauthor` | 20 | Teachers credited on courses |
| `courseupdate` | 25 | Course announcements written like a teacher posting |
| `course_translation` | 15 | 5 courses times 3 languages |

Lesson media: videos are YouTube embeds stored in `activity.content.uri`. No video files needed.

The 15 supporting courses carry every landing page field but no chapters, so their syllabus area is empty by design.

### 3.3 Enrollments, progress and certificates

| Table | Rows | What it is |
|---|---|---|
| `trail` | 32 | 16 course trails plus 16 podcast trails |
| `trailrun` | **600** | 450 course enrollments spread over 150 students plus 150 podcast listens |
| `trailstep` | **about 2,350** | Progress spread across quartiles: 60 learners finished the flagship, the rest sit anywhere between the first lesson and the last module |
| `certifications` | 3 | Certificate templates |
| `certificateuser` | 60 | Issued to students who completed the flagship course |

### 3.4 Collections

| Table | Rows | What it is |
|---|---|---|
| `collection` | 18 | 16 published plus 2 drafts |
| `collectioncourse` | 70 | 3 to 6 items per bundle |
| `collectionuser` | 80 | Owned badges appear in the grid |
| `collection_translation` | 12 | 4 collections times 3 languages |

### 3.5 Community

| Table | Rows | What it is |
|---|---|---|
| `community` | 18 | 16 published plus 2 drafts |
| `discussion` | **105** | The main community gets 60 posts, the other 15 get 3 each |
| `discussioncomment` | **239** | The main community gets most of them, including replies from one line to three paragraphs |
| `discussionreaction` | 500 | Mixed reactions from real members |
| `discussionvote` | 450 | Upvotes and downvotes |
| `discussioncommentvote` | 250 | Same, on replies |

### 3.6 Podcasts

| Table | Rows | What it is |
|---|---|---|
| `podcast` | 18 | 16 published plus 2 drafts |
| `podcastepisode` | 44 | The main show gets 14 episodes, the rest get 2 each |
| `podcast_translation` | 9 | 3 shows times 3 languages |
| `podcast_episode_translation` | 10 | A few translated episodes |

Audio: one short mp3 supplied in the assets folder is reused across all 44 episodes so every player works.

### 3.7 Assignments

| Table | Rows | What it is |
|---|---|---|
| `assignment` | 4 | Inside flagship lessons |
| `assignmenttask` | 12 | Tasks per assignment |
| `assignmenttasksubmission` | 60 | Mixed graded, pending and late |
| `assignmentusersubmission` | 45 | Student answers |
| `code_submission` | 30 | Submission history in code blocks |

Playgrounds and boards are not seeded. The routes exist but nothing in the public menu or the dashboard links to them, so they cannot be reached during the demo.

### 3.8 Payments

| Table | Rows | What it is |
|---|---|---|
| `paymentconfig` | 1 | Chargily, DZD, test mode |
| `paymentorder` | **140** | Six months of orders: paid, pending, failed, canceled, expired, refunded |
| `resourceentitlement` | 104 | Who owns what, one active entitlement per person and resource |
| `payoutcost` | 6 | Monthly operating costs so the payout report has real numbers |
| `paymentwebhookevent` | 140 | Webhook log matching the orders |

This fills the Payments Overview, Transactions, Payouts and Offers pages.

### 3.9 Notifications

| Table | Rows | What it is |
|---|---|---|
| `notification` | 26 | Announcements plus learning and system events, back dated |
| `notification_recipient` | **about 2,400** | About 65 percent read and 35 percent unread, so the bell badge, dropdown and reading window all have content |
| `notification_template` | 12 | Org overrides in English, French and Arabic |

### 3.10 Infrastructure

| Table | Rows | What it is |
|---|---|---|
| `webhook_endpoint` | 1 | |
| `webhook_delivery_log` | 60 | Successful and failed deliveries |
| `analytics_events` | **about 12,000** | Six months of page views, activity views, time on activity, enrollments, completions, signups, discussion posts and podcast listens, with varied referrers, devices and countries |

Analytics reads directly from `analytics_events`, so all Analytics tabs render real curves without Tinybird.

---

## 4. Content voice rules

These are hard rules for every generated string that a human will read.

**Banned in copy**
- Hyphens and underscores as separators or punctuation
- Ellipses
- Em dashes
- Words that read like marketing copy: delve, unlock, elevate, seamless, robust, game changer, in today's world, journey
- Perfectly parallel sentence lists and identical sentence rhythms
- Emoji spam

**Required**
- Sentences of uneven length, including a few very short ones
- Contractions, casual phrasing, occasional lowercase start in community posts
- Specific details: tool names, exact numbers, real situations
- A mix of tone across authors. Some enthusiastic, some blunt, some asking for help
- French and Arabic copy written by native phrasing, not translated word for word

**Samples so you can judge the voice**

Course landing description:

> Six weeks building one API from an empty folder to something running on a server. We start with git and a clean project layout, then move through requests, a real database, auth, tests and deployment. You finish with a service you can show and explain. Bring a laptop with Python installed.

Community post:

> been stuck on the login screen all morning. everything returned 401 and i could not tell why. turned out the token was fine and the role check was reading the wrong field. one line and the whole flow worked.

Reply:

> same thing happened to me last week. check the foreign key order too, mine was off and the migration ran twice.

Announcement:

> Module 4 is live. Three lessons on auth and one where we fix a broken login together. Push your version to the community and I will review the first ten.

Notification title and body:

> New lesson unlocked
>
> Module 4 is live now. Three lessons on auth and one walkthrough where we fix a broken login.

---

## 5. Artwork

Artwork lives in `pics/`. Subfolders are niches. Each course, collection and community pulls from the folder matching its subject, and anything without a folder pulls from the general pool. Files in `pics/avatars` are used only for user avatars and never for cards.

| Slot | Filled | Source | Ratio | Size |
|---|---|---|---|---|
| Course covers | 19 | `coding/flagship course.jpg` for the flagship, niche folders for the rest | 16:9 | 1280 × 720 |
| Course banners | 1 | `banner.png`, flagship only | 3:1 | 1920 × 640 |
| Collection covers | 18 | `design/collection flasgship.jpg` for the first, niche folders for the rest | 16:9 | 1280 × 720 |
| Collection banners | 1 | `collection banner.png`, first collection only | 3:1 | 1920 × 640 |
| Community covers | 18 | flagship reuses the course cover, niche folders for the rest | 16:9 | 1280 × 720 |
| Community banners | 1 | `banner.png`, flagship only | 3:1 | 1920 × 640 |
| Podcast covers | 18 | general pool, no audio artwork folder yet | 16:9 | 1280 × 720 |
| Podcast banners | 0 | last step, not now | 3:1 | 1920 × 640 |
| Episode covers | 0 | left empty | 1:1 | 600 × 600 |
| User avatars | 158 | `pics/avatars`, 100 unique faces | 1:1 | 400 × 400 |
| Org logo | 0 | left empty | 1:1 | 512 × 512 |
| Org cover | 0 | left empty | 16:9 | 1280 × 720 |

**Total files copied: 234.**

Only the flagship course, its community and the first collection get banners. Every other detail page is never opened on camera. The course page falls back to its cover when the banner is empty, so those pages still look filled. Community and collection pages show their gradient placeholder instead.

The hero strip sits inside a 1280 px container and the image is `object-cover`, so anything off ratio gets cropped from the sides. Keep the focal point in the middle half of a banner.

**Niche routing** lives in `COURSE_NICHES`, `COLLECTION_NICHES` and `COMMUNITY_NICHES` in `apps/api/src/services/seed/copy.py`. Video, writing and brand have no folder, so they fall back to the general pool.

**Repeats.** The four niche folders hold 23 pictures while the cards need 73. Pictures are dealt from a shuffled deck per folder, so two neighbouring cards never share one, but a folder holding three pictures cannot cover eight slots. Add more art to `Business and career` and `coding` if the grids look repetitive.

**How it is applied.**

```
.\.venv\Scripts\python.exe -m src.services.seed --demo --reset --assets-dir "c:\Projects\learnhouse-dev\learnhouse-dev\pics"
```

The seeder copies each file into the content tree using the same layout the upload endpoints use, and stores only the filename. `--reset` removes the previous org and its files first, so nothing is orphaned.

One audio file is still optional:

| Asset | Count | Effect if missing |
|---|---|---|
| Sample mp3 | 1 | Episodes are seeded with no audio and the player stays empty |

---

## 6. Not seeded, and why

| Table | Reason |
|---|---|
| `customdomain` | Hosting level, not visible in the demo |
| `superadmin_apitoken` | Platform admin only |
| `orgpack` | Unused in this build |
| `usageevent` | SaaS plan metering only, not used in OSS mode |
| `aigeneration` | No UI reads it |
| `course_embedding` | Search embeddings need real vectors, faking them is worse than leaving empty |
| `folder`, `foldercontent`, `media`, `mediasharetoken` | Legacy tables with no model and no UI in this build |
| `playground`, `playgroundreaction`, `board`, `boardmember` | The routes exist but no public or dashboard menu links to them, so they are unreachable in the demo |

---

## 7. Sign off checklist

- [x] New `demo` org is the target
- [x] Only the flagship course has modules and lessons
- [x] All four listings at 8 per page and 16 published items
- [x] Podcasts moved from 12 to 8 per page
- [x] Counts above match the live run
- [x] Voice rules and sample copy are what you want
- [x] Artwork is seeded from `pics/` with niche routing, as listed in section 5
