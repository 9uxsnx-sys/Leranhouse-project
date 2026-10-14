# Dashboard Vocabulary & Glossary

> **Status:** ✅ **Locked** — all decisions confirmed. This file is now the authority for dashboard wording.
> **Why this exists:** the dashboard grew area-by-area, so the same thing is worded differently in different places (`+ New` vs `Create` vs `Add`; Module vs Chapter; User vs Member; SEO translated here but not there). This file decides the words **once**, so every later phase — and the Arabic translation — is mechanical instead of another debate.
> **Companion:** [consistency-plan.md](./consistency-plan.md).

---

## 1. Call-to-action rule

| Situation | Use | Examples |
|---|---|---|
| Primary action on a **list page** | **`New <Entity>`** | New Course · New Podcast · New Community · New Board |
| Adding a row **inside** an existing thing (forms, settings) | **`Add <Thing>`** | Add Domain · Add Endpoint · Add Script · Add Module |
| **Submit** button inside a modal | **`Create`** | Create Offer · Create Group · Create Token |

**Banned:** the literal string `+ New`; using `Create` as a list-page button; using `Add` and `Create` for the same action in the same area.

Rationale: this maps cleanly onto Arabic (`جديد` / `إضافة` / `إنشاء`), so the translators get one rule instead of case-by-case guesses.

---

## 2. Concept glossary — one word per concept

| Concept | **Use this** | Never use | Status |
|---|---|---|---|
| A group of lessons inside a course | **Module** | Chapter · Section · Unit | ✅ confirmed |
| One item inside a module | **Lesson** | Activity | ✅ confirmed |
| A person — always, everywhere | **User** | Member · Student | ✅ confirmed |
| What a user is allowed to do | **Role** | — | ✅ confirmed |

**The model:** *everyone is a **User***. What differs between people is their **Role**.

| Role | What it means |
|---|---|
| **Learner** | **the default** — every person gets this the moment they join |
| **Teacher** | granted by an admin — access to their own course/content, **no** dashboard, no admin |
| **Admin** | the highest authority — the **only** role that can change roles and administer the org |
| *custom* | an admin can create and name further roles |

- A person who joins is a **user with the Learner role** by default.
- An **admin** can then change that user's role — to Teacher, or to any custom role they've created.
- A teacher is *still a user* who holds the Teacher role; so is an admin. We never invent a second noun for a person.
- **Only admins** can change roles or administer the org.

**One deliberate exception:** the Analytics tab keeps the label **"Learners"**. Renaming it to "Users" would collide with the admin **Users** section (two different things both called "Users"), and that tab is a learning-progress view — which is exactly what the Learner role describes.

**Rework this creates:**
- **Module / Lesson** — rename the sidebar tabs ("Chapters" → "Modules", "Activities" → "Lessons"), the structure-editor hints, and the i18n keys that say `chapter`.
- **Members → Users** — communities, boards, search, dashboard home.
- **Students → Users** — assignments.

> **Important:** this is a *UI wording* decision only. The database and service layer keep their existing names (`chapter`, `activity`) — renaming those is a separate, riskier job and buys nothing for the user.

**⚠️ This is the decision with the most rework attached** — the sidebar says "Chapters"/"Activities", the editor says "Module"/"Lesson". Picking one touches tabs, headings and hints.

---

## 3. Technical terms

**Decision: keep every technical term Latin, in every language.** No translations, ever — so there is one form to search for and no drift between org and course settings.

`SEO` · `Favicon` · `Logomark` · `Sitemap` · `Robots.txt` · `Open Graph` · `API` · `Webhook` · `RSS` · `JSON-LD` · `Domains` · `SSO` · `Apple Podcasts` / `Spotify` / `YouTube Music`

**Consequence to fix when we implement:** Arabic currently translates some of these — `ar.json` has `تحسين محركات البحث` for org SEO while course SEO stays `"SEO"`. Under this rule, both become **SEO**.

---

## 4. Section heading style

**Sentence case** — `Basic information`, `Course details`, `Media`. Capitalise only the first word. ✅ confirmed

(Does not affect Arabic or any RTL language — they have no capital letters. This is English/French polish only.)

---

## 5. Rules that follow from the above

1. **Every visible string goes through `t()`** — no hardcoded English in the dashboard.
2. **No `+ New` literals**, no bare `Create` on list pages.
3. **One icon per concept, one library** (lucide) — see the consistency plan.
4. **Never invent a second word for an existing concept** — check §2 first.
5. New strings get their key added to `en.json`; `fr` / `ar` are filled from this glossary.

---

## 6. Decisions (all confirmed)

| # | Decision | Outcome |
|---|---|---|
| 1 | Course words | ✅ **Module + Lesson** |
| 2 | People words | ✅ **Users everywhere** |
| 3 | Technical terms | ✅ **Keep all Latin** |
| 4 | Heading case | ✅ **Sentence case** |
| 5 | CTA rule (§1) | ✅ as written |
