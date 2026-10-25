# Demo Seed — Manifest

> **Status:** awaiting sign off. Nothing is built yet.
> **Companion:** [seed-plan.md](./seed-plan.md) (how it gets built).
> **Purpose:** an exact, countable list of what lands in the database so the platform can be recorded for a demo video.

---

## 1. Decisions locked in

| # | Decision | Value |
|---|---|---|
| 1 | Seed method | Real database rows, not UI mocks |
| 2 | Target | **A new org, slug `demo`** — the existing `default` org stays untouched |
| 3 | Curriculum | **Only the flagship course** gets modules and lessons. The other courses get a filled landing page: title, subtitle, description, about, learnings, tags, price, authors, cover, banner |
| 4 | Listing density | Every public listing page shows **8 items per page**. Courses, communities, podcasts and collections each get **16 published items = exactly 2 full pages** |
| 5 | Images | You drop one folder of pictures. The seeder picks at random and copies them into the content tree. No generated placeholders |
| 6 | Copy | Written like real people. No AI tells, no hyphens, no underscores, no ellipses inside seeded text |

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
| `chapter` + `coursechapter` | 6 + 6 | Modules of the flagship course only |
| `chapteractivity` | 26 | Flagship only: 2 intro lessons plus 6 modules of 4 lessons |
| `activity` | 26 | 18 video, 4 document, 2 dynamic, 2 assignment |
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
| `trailstep` | **6,500** | Progress spread across quartiles: some learners at 95 percent, some stuck at the first lesson, some abandoned |
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
| `discussioncomment` | **330** | The main community gets 250, including nested replies from one line to three paragraphs |
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

### 3.7 Assignments, playgrounds and boards

| Table | Rows | What it is |
|---|---|---|
| `assignment` | 4 | Inside flagship lessons |
| `assignmenttask` | 12 | Tasks per assignment |
| `assignmenttasksubmission` | 60 | Mixed graded, pending and late |
| `assignmentusersubmission` | 45 | Student answers |
| `code_submission` | 30 | Submission history in code blocks |
| `playground` | 6 | Playgrounds listing is not empty |
| `playgroundreaction` | 40 | |
| `board` | 3 | |
| `boardmember` | 12 | |

### 3.8 Payments

| Table | Rows | What it is |
|---|---|---|
| `paymentconfig` | 1 | Chargily, DZD, test mode |
| `paymentorder` | **140** | Six months of orders: paid, pending, failed, canceled, expired, refunded |
| `resourceentitlement` | 110 | Who owns what |
| `payoutcost` | 6 | Monthly operating costs so the payout report has real numbers |
| `paymentwebhookevent` | 140 | Webhook log matching the orders |

This fills the Payments Overview, Transactions, Payouts and Offers pages.

### 3.9 Notifications

| Table | Rows | What it is |
|---|---|---|
| `notification` | 26 | Announcements plus learning and system events, back dated |
| `notification_recipient` | **1,900** | About 65 percent read and 35 percent unread, so the bell badge, dropdown and reading window all have content |
| `notification_template` | 12 | Org overrides in English, French and Arabic |

### 3.10 Media and infrastructure

| Table | Rows | What it is |
|---|---|---|
| `folder` | 6 | Media library folders |
| `foldercontent` | 40 | |
| `media` | 40 | Real files copied into the content directory |
| `mediasharetoken` | 3 | |
| `webhook_endpoint` | 1 | |
| `webhook_delivery_log` | 60 | Successful and failed deliveries |
| `analytics_events` | **12,000** | Six months of page views, activity views, time on activity, enrollments, completions, signups, discussion posts and podcast listens, with varied referrers, devices and countries |

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

> Six weeks of drawing screens on paper before we open Figma. We start with wireframes and bad first drafts, then move into spacing, type and components. You finish with one full case study, not a folder of random screens. Bring a real idea you want to build.

Community post:

> been stuck on the pricing card all morning. everything looked off and i could not tell why. turned out the padding was 20 instead of 24. one number and the whole page fixed itself.

Reply:

> same thing happened to me last week. check the gap on the container too, mine was off by 8 and it made the columns look drunk.

Announcement:

> Module 4 is live. Two lessons on layout grids and one walkthrough where I rebuild a dashboard from scratch. Post your version in the community and I will review the first ten.

Notification title and body:

> New lesson unlocked
>
> Module 4 is live now. Two lessons on layout grids and one case study walkthrough.

---

## 5. Assets contract

You drop one folder. The seeder walks it recursively, so subfolders are fine.

```
apps/api/seed-assets/
  (any number of jpg, jpeg, png or webp files)
  audio/            one mp3 used for all episodes
```

| Asset use | Quantity needed | If the folder has fewer |
|---|---|---|
| Course covers and banners | 19 courses, 2 images each | Images are reused in rotation |
| Podcast covers | 18 | Reused |
| Episode covers | 44 | Reused |
| Community covers | 18 | Reused |
| User avatars | 158 | Reused |
| Org logo and banner | 2 | Reused |
| Audio | 1 mp3 | Episodes are seeded without audio and players stay empty |

If the folder is missing or empty the seeder **stops with a clear message**. It will not invent placeholders.

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

---

## 7. Sign off checklist

- [ ] New `demo` org is the target
- [ ] Only the flagship course has modules and lessons
- [ ] All four listings at 8 per page and 16 published items
- [ ] Podcasts moved from 12 to 8 per page
- [ ] Counts above are the counts to build
- [ ] Voice rules and sample copy are what you want
- [ ] You will drop images and one mp3 into `apps/api/seed-assets/`

Approve this and I start on [seed-plan.md](./seed-plan.md).
