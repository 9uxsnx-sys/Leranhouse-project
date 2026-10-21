# Multilingual course authoring — research & proposal

> **Status:** plan agreed (see §7.1), implementation starting with Phase A.
> **Trigger:** a course authored in English shows English body text inside an Arabic (RTL) UI.
> Translation of the *interface* is done; this document is about translating *content*.

---

## 1. Verdict on the proposed approach

The instinct — *reuse the existing form, switch language, fields go empty, fill them again* — **is exactly what Strapi, Contentful and Sanity do**, and it is the right family of solution. Two corrections:

### 1.1 Content language must be separate from interface language

Do **not** reuse the sidebar language switcher. A French-speaking teacher may author English courses, or an Arabic admin may edit a French course while working in an English interface. Every mature CMS therefore has two independent settings:

| Setting | Scope | Stored on |
|---|---|---|
| **Interface language** | the chrome you navigate in | user / localStorage (already implemented) |
| **Content language** | the locale of the record being edited | per record + an editor-level selector |

In the editor the selector belongs in the **header of the course/activity being edited**, next to the title, labelled with the locale name and a completion indicator. The global switcher stays where it is.

### 1.2 "Empty fields, no warning" is the weak part

Your guard idea ("you have unsaved changes, save first") is right, but a blocking toast is the *least* professional option. Mature editors do one of:

- **Draft auto-save per locale** (Strapi, Notion, Linear): every keystroke is saved as a draft; switching locale is free; *publishing* is the explicit action. This project already has auto-save conventions, so it fits.
- **Unsaved-changes modal** (Contentful, WordPress): Save / Discard / Cancel on navigation and on `beforeunload`.

Recommendation: **auto-save the draft, guard the publish action**. Keeping the "save before switching" modal is acceptable but will annoy authors who just want to peek at the Arabic version.

---

## 2. How the industry models this

Two storage models, both legitimate:

| Model | How it works | Used by | Pros | Cons |
|---|---|---|---|---|
| **Field-level** | One row per record; each translatable field holds a map of `locale → value` | Contentful (localized field flag), DatoCMS, Payload | Atomic record, one join, publish everything at once | Wide JSON, per-locale validation lives in app code, "publish Arabic only" is hard |
| **Entry-level** | One row per record **per locale**, linked to a shared parent | Strapi i18n, Sanity (document per locale), Drupal | Clean per-locale validation, per-locale workflow/publish, trivial "missing translation" query | Extra join, fallback logic, structural drift between locales |

Contentful and Sanity support **both**; the practical rule of thumb from the industry literature is: *field-level when the layout must stay identical across markets, entry-level when the content itself changes shape*.

**For LearnHouse → entry-level (translation tables).** Reasons:

- Courses already have ~8 translatable fields plus a JSON `seo` blob; stuffing all of it into a JSON map makes validation and search indexing worse.
- Per-locale publish/draft state is a real requirement (you will want to publish English now, Arabic next week).
- "Which courses are missing Arabic?" becomes one `LEFT JOIN`, which you will want as a dashboard.
- It does not touch the existing `course` table, so the ~100 existing queries keep working.

---

## 3. Recommended data model

The **base row stays the source of truth**. A translation row overrides it for one locale. Resolution: `translation[locale] → base row`. That keeps the current table untouched and makes the source language irrelevant (English today, French tomorrow — no migration).

```sql
CREATE TABLE course_translation (
    id                SERIAL PRIMARY KEY,
    course_id         INTEGER NOT NULL REFERENCES course(id) ON DELETE CASCADE,
    locale            VARCHAR(10) NOT NULL,          -- 'en' | 'fr' | 'ar'
    name              TEXT NOT NULL,
    description       TEXT,
    about             TEXT,
    learnings         TEXT,
    tags              TEXT,                          -- display labels; filtering uses base tags
    seo               JSONB,                         -- mirrors CourseSEO
    -- workflow
    state             VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft|machine|reviewed|published
    source_updated_at VARCHAR(50),                   -- course.update_date when this was translated
    translated_by     INTEGER REFERENCES user(id),
    created_at        VARCHAR(50),
    updated_at        VARCHAR(50),
    UNIQUE (course_id, locale)
);
```

Same shape for the other translatable entities:

| Entity | Translatable fields | Notes |
|---|---|---|
| `chapter_translation` | `name`, `description` | |
| `activity_translation` | `name`, `content` (JSON) | rich text — see §6.4 |
| `collection_translation` | `name`, `description`, `about`, `learnings`, `tags`, `seo` | |
| `podcast_translation` | `name`, `description`, `about` | |
| `offer_translation` | `name`, `description` | payments; offers are visible in the store |
| `certification_translation` | `name`, `description`, `instructor_label` | certificates |

**Not translated:** discussions, comments, usernames, org name (org-level setting), SCORM packages.

### Resolution helper

One function on the API, used everywhere:

```python
def resolve(obj, translation, locale, fallback_chain=("en",)):
    # returns a dict with the same keys as the base model
```

Rules, in order: exact locale → org default → `en` → base row. The response also carries `content_locale` and `is_fallback: true` so the frontend can show a subtle "not available in Arabic" note instead of silently mixing languages.

---

## 4. The editing experience

### 4.1 Editor header

```
Course: Introduction to Python        [ English ▾ ]  ● 33% translated
```

Switching shows, per locale:

| Badge | Meaning |
|---|---|
| ● empty | no row for that locale |
| ◐ machine | produced by MT, unchecked |
| ✓ translated | human-authored, up to date |
| ⚠ stale | source was edited after this translation |

### 4.2 Field behaviour

- Switching to a locale with no translation: fields are **pre-filled with the source text, visually dimmed**, marked "inherited". Typing in one turns it into a real translation. (Better than empty fields: the author sees what they are translating, and the fallback is obvious.)
- A "Copy from source" button seeds the locale in one click.
- Structural fields (thumbnail, price, access type, publish state, chapters order) are **never** localized — one course, one structure.

### 4.3 Publish

- Draft is per locale. "Publish" publishes the locale you are in.
- Course-level publish stays as it is; a locale with `state != published` is simply not served (falls back).
- Show a pre-publish warning: *"Publishing in English only. Arabic and French are still drafts."*

---

## 5. Feature checklist — what professionals ship

Ranked by value/effort for LearnHouse.

### Must have (the feature is incomplete without these)

1. **Content-language selector in the editor**, independent of the UI language.
2. **Fallback chain** (`ar → org default → en → base`) with an `is_fallback` flag surfaced in the UI.
3. **Unsaved-changes protection** (auto-save or modal) — never lose text on locale switch.
4. **Translation status per locale** + a coverage percentage on the course card and in the dashboard listing.
5. **Per-locale SEO** (title, description, keywords, OG) — the `seo` JSON already exists, it just needs a per-locale row.
6. **Localized names everywhere the course appears outside its page**: emails, certificates, search results, breadcrumbs, notifications, payment receipts.
7. **Language-aware search** (Postgres FTS per locale, or at minimum search the resolved text).

### Should have (what makes it feel professional)

8. **"Copy from source"** seed — one click, then edit.
9. **Machine translation as a draft**, clearly badged and never auto-published (DeepL or Google). This is the single biggest time-saver for a 3-language catalog.
10. **Stale detection** — compare `course.update_date` with `source_updated_at` of the translation row; badge ⚠ and list "3 courses need re-translation".
11. **Translation dashboard** — a grid of courses × locales with the four states above, filterable by "missing Arabic".
12. **Bulk actions** — "translate all missing into Arabic (machine)".
13. **Export/import** — CSV or XLIFF per course so a human translator can work offline; re-import fills the rows. This is how agencies actually deliver.
14. **Per-locale review step** — `draft → reviewed → published`, with the reviewer's name stored.

### Later / nice to have

15. Side-by-side source-vs-target editor.
16. Glossary and do-not-translate list (brand names, product names).
17. Translation memory (reuse identical strings across courses).
18. Per-locale media (different thumbnail/banner with Arabic text on the image).
19. Per-locale analytics (completion rates by content language).
20. Localized slugs + `hreflang` + `/{locale}/` URL prefix — needed only if organic search in Arabic matters.
21. Per-locale comments between author and translator.

### 5.1 What each feature actually looks like

Running example: a course **“Introduction to Python”** that exists in English, with French and Arabic translations at different stages.

| Feature | What it does | Concrete example |
|---|---|---|
| Content-language selector | Chooses which locale you are editing | Header reads `Introduction to Python · [العربية ▾]`; clicking shows the Arabic fields instead of the English ones |
| Fallback chain | Decides what to show when a locale is incomplete | Arabic `about` is empty → learner sees the English paragraph, and the page shows “Not available in Arabic” |
| Unsaved-changes protection | Stops losing typed text when leaving | You type an Arabic title and click Dashboard → *“You have unsaved changes. Stay / Discard”* |
| Local auto-save | Saves a draft as you type | The Arabic title is stored 2 s after you stop typing; the badge changes `draft` → `saved`, no button press |
| Status badges | Tells you how complete each locale is | `EN ✓ · FR ✓ · AR ◐` → Arabic exists but is machine-generated |
| Coverage % | How much of the record is translated | Course card shows `AR 33%` because 3 of 9 fields are filled |
| Per-locale SEO | Different meta for each language | `EN: Learn Python from scratch` / `AR: تعلم بايثون من الصفر` |
| Localized names outside the page | Same name everywhere the course appears | The enrollment email to an Arabic learner says the Arabic title, not the English one |
| Language-aware search | Search matches the locale being used | Searching `بايثون` finds the course only if the Arabic title exists |
| Copy from source | Seeds a locale in one click | Click → Arabic fields fill with the English text, dimmed; you overwrite what you translate |
| Machine translation draft | Auto-drafts a locale, clearly marked | “Translate to Arabic” → 8 s later fields are filled, badge `◐ machine`, publish blocked until reviewed |
| Stale detection | Warns when the source changed after translating | You edit the English `about` → Arabic row flips to `⚠ stale`, dashboard counts it as “needs re-translation” |
| Translation dashboard | One screen for the whole catalog | Grid: 24 courses × 3 locales, filter “missing Arabic” → 7 rows |
| Bulk actions | Act on many records at once | “Machine-translate all 7 missing Arabic courses” → queue, then review each |
| Export / import | Hands work to a human translator | Download `python-course.ar.xlsx`, translator fills it, upload → rows updated, `state=reviewed` |
| Review workflow | Separates writing from approving | Translator saves `draft` → owner opens it, reads, clicks **Approve** → `published`; only then learners see it |

---

## 6. LearnHouse-specific edge cases (the part that bites)

### 6.1 Do **not** duplicate the course per language

Tempting and wrong. A second course row breaks:

- enrollments and trails (`trail` points at `course_id`)
- payments/offers (`offer` → `course_id`)
- certificates
- analytics and completion rates
- authorship and revenue split (40/60 split is per course)

One course, N translations. Always.

### 6.2 Course import / export

`LearnHouseCourseImport` and the export format must round-trip translations, or imported multilingual courses silently lose them. Add `translations: [...]` to the export envelope and bump the format version.

### 6.3 AI course generation

The generator must produce content in the **selected content locale**, not always English. Otherwise Arabic catalogs are machine-translated English.

### 6.4 Activity rich text (`content` JSON)

Two options:

- **Document per locale** (recommended): `activity_translation.content` holds a full TipTap doc. Correct for RTL, where list/paragraph structure legitimately changes.
- **Text-node overlay**: keep one doc, translate only `text` nodes by path. Smaller storage, but any structural edit invalidates every translation.

With the first option, add a **"structure changed"** warning when the source doc gains/removes blocks after translations exist — pros call this *content drift*.

### 6.5 SCORM and embeds

SCORM packages are authored outside the platform and are single-language by nature. Do not attempt to translate them; document it and keep the activity name translated only.

### 6.6 Tags

Keep tags canonical (untranslated) for filtering, and show a translated label if one exists. Translating tags directly breaks filters when a learner switches language.

### 6.7 User-generated content

Discussions and comments must **not** go through this pipeline. That is what the `dir="auto"` work already covers. Mixing translations into UGC is a moderation nightmare.

### 6.8 Certificates

Recipient name and course name must resolve in the locale the certificate was issued in (store `issued_locale` on the certificate, not the viewer's current language).

### 6.9 Caching and existing queries

The current "slim" course queries select an explicit column list (including `extra_metadata`). A locale-joined read means touching several of those queries at once — do it behind the resolver helper, not by editing each route.

---

## 7. Phased delivery

| Phase | Scope | Risk |
|---|---|---|
| **0** | `course_translation` table + resolver + `?locale=` on read endpoints, no UI | low — additive |
| **1** | Course editor: content-language selector, status badges, save guard, copy-from-source. Courses only | medium |
| **2** | Chapters + activities (name, rich text) | medium-high (rich text) |
| **3** | Collections, podcasts, offers, certificates | low |
| **4** | Coverage dashboard, stale detection, bulk machine translation | low |
| **5** | Per-locale SEO, `hreflang`, localized slugs, localized search | medium (SEO) |

Ship phase 0 + 1 and the reported problem is solved for course pages. Everything after that is catalog management.

---

## 7.1 Agreed implementation plan (v1)

Scope confirmed with the product owner. **No badges on the courses listing and no catalog-wide page** — the workflow is: open a course, check its locales there. Badges on listing cards and the `/dash/translations` catalog grid are explicitly deferred.

### Locked decisions

1. **Content locale is driven by the existing global language switcher.** No second selector. The data model does not depend on this choice, so it can be split later without a migration.
2. **Auto-save the draft**, with an unsaved-changes guard on navigation only.
3. **The base `course` row holds the source locale.** `course.source_locale` (new column, defaulted from the org default at creation) names it. Editing in that locale writes the existing columns; every other locale writes a `course_translation` row. No backfill, existing queries unaffected.
4. **`state` column ships in v1** (`draft` default) but v1 serves every saved row. Approval workflow later becomes a UI change, not a migration.
5. **Translations tab** holds coverage, copy-from-source, delete-locale and export/import. It does **not** hold editing.

### Phase A — vertical slice (title only, end to end)

Proves the whole path before repeating it for every field.

| Step | Work |
|---|---|
| A1 | Alembic migration: `course.source_locale` + `course_translation` (unique `course_id, locale`) |
| A2 | `GET /courses/{uuid}?locale=xx` resolves translation → falls back to base row; returns `content_locale` and `is_fallback` |
| A3 | `PUT /courses/{uuid}/translations/{locale}` upserts one row (same permission as the General tab) |
| A4 | General form: title input reads/writes the locale selected in the switcher; untranslated values render dimmed as "inherited" |
| A5 | Action row: locale name, status dot, `Saving… / Saved` |

Done when: switch to Arabic → type an Arabic title → save → reload → the learner page shows the Arabic title, and English is unchanged.

### Phase B — remaining fields

`description`, `about`, `learnings`, `tags`, `seo`. One commit per field group. Adds **Copy from source** (seed a locale in one click).

### Phase C — Translations tab

Coverage table (locales × fields, ✓ / ◐ / ⚠ / —), copy-from-source, delete-locale, per-locale `.xlsx` export and import.

### Phase D — learner side and beyond

Course page fallback hint; emails, certificates and search resolving through the same helper. Chapters/activities (document per locale), then collections/podcasts/offers, are separate phases.

### Out of scope for v1

Listing badges, catalog page, machine translation, review workflow, stale detection, bulk actions, per-locale slugs/hreflang.

### Operational notes

- Editing anything under `apps/api/` stops the dev CLI → restart after each API step.
- Schema changes go through `alembic upgrade head`, not `SQLModel.metadata.create_all`.
- Verification before each commit: locales parse, `tsc --noEmit` stays at 25 lines, `alembic upgrade head` runs clean.

---

## 8. Decisions needed before code

Resolved in §7.1: source language (base row + `source_locale`), auto-save vs modal (auto-save), and catalog UI scope (no listing badges, no catalog page).

Still open, needed before Phase B/C:

1. **Machine translation allowed at all?** If yes, DeepL vs Google, and is the API key per-org or platform?
2. **Who may publish a locale** — any course editor, or an owner/reviewer role?
3. **Should the frontend visibly say "shown in English"** when falling back, or stay silent?
4. **URL strategy**: keep cookie-based locale, or move to `/{locale}/` paths for SEO?
5. **Export format**: `.xlsx` (translator-friendly) or plain `.csv`.

---

## Sources

- [Contentful localization strategies (field-level, localized: true)](https://www.weglot.com/sv/blog/contentful-localization)
- [How to choose a multilingual CMS — storage models and fallback chains](https://cn.smartling.com/questions/choosing-multilingual-cms)
- [Headless CMS localization guide — structured vs field-level, which CMS uses which](https://demo.crowdin.com/blog/headless-cms-localization)
- [Contentful DXP scorecard — per-locale validation and publishing](https://www.dxpscorecard.com/platform/contentful)
- [Contentful + Next.js multi-locale architecture — fallback governance](https://dcrayons.app/insights/enterprise-contentful-nextjs-multi-locale-composable-dxp-reference-architecture)
- [Strapi 5 i18n guide](https://strapi.io/blog/strapi-5-i18n-complete-guide)
- [Strapi i18n plugin docs](https://docs-vercel-v4.strapi.io/dev-docs/plugins/i18n)
- [Strapi multilingual site — locale dropdown, "fill in from another locale"](https://strapi.io/blog/multilanguage-strapi-website)
- [Translation coverage board — translated / missing / stale states](https://www.generalinput.com/prompts/translation-coverage-board-for-your-contentful-locales)
- [Keeping translated content in sync with source changes](https://www.linguise.com/es/blog/guia/como-mantener-sincronizado-el-contenido-traducido-de-tu-sitio-web-cuando-cambia-el-texto-original/)
- [AI CMS multilingual — trigger on source publish, MT as draft](https://hashmeta.com/blog/ai-cms-multilingual-translate-once-publish-everywhere/)
