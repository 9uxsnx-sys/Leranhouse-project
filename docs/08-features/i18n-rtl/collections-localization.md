# Collections content localization

> **Status:** done. Same contract as courses — see [content-localization.md](./content-localization.md).
> A collection authored in English can be fully translated into French and Arabic, edited from the same dashboard, and served to learners in their language.

---

## 1. Model

The base `collection` row always holds the **source locale**. A `collection_translation` row overrides the display fields for one other locale. Resolution is `requested locale → base row`.

```
collection
├── source_locale        VARCHAR(10) NOT NULL DEFAULT 'en'
└── collection_translation
    ├── collection_id    FK collection(id) ON DELETE CASCADE
    ├── locale           VARCHAR(10)
    ├── name             TEXT NOT NULL
    ├── description, about, learnings, tags
    ├── seo              JSONB
    ├── state            draft | machine | reviewed | published
    ├── source_updated_at, translated_by, creation_date, update_date
    └── UNIQUE (collection_id, locale)
```

Migration: `apps/api/migrations/versions/y0f1a2b3c4d5_add_collection_translations.py`.

**Never localized:** thumbnail, banner, price, access type, publish state, membership. A bundle is one record with one structure.

## 2. API

| Endpoint | Behaviour |
|---|---|
| `GET /collections/{uuid}?locale=xx` | Overlays the translation; returns `source_locale`, `content_locale`, `is_fallback` |
| `GET /collections/org/{id}/page/{p}/limit/{l}?locale=xx` | Same, one translation query per page (`apply_collection_overlay_bulk`) |
| `GET /collections/{uuid}/courses?locale=xx` | Localizes member course names/descriptions |
| `GET /collections/{uuid}/members?…&locale=xx` | Localizes the dashboard Content table (linked + available/search) |
| `GET /collections/org/{id}/mine?locale=xx` | "My bundles" listing |
| `GET /collections/{uuid}/translations` | List translation rows (requires update permission) |
| `PUT /collections/{uuid}/translations/{locale}` | Upsert one row; **422** when `locale == source_locale` |
| `DELETE /collections/{uuid}/translations/{locale}` | Delete one row |

Implementation: `apps/api/src/services/courses/collection_translations.py`. The overlay is applied **after** every access/lock check, so a translation can never reveal a locked collection.

Search results (`/search`) localize collection names through the same bulk helper.

## 3. Dashboard

The platform language switcher is the only content-locale control — there is no second selector.

| Surface | Behaviour |
|---|---|
| Collections list (`/dash/collections`) | SWR key carries `locale`, so cards/search follow the UI language |
| General tab | Reads/writes the translation row for non-source locales; source locale keeps writing the base row. Action row shows the language chip (Source / Translation / Missing), **Copy from source** and the Save state |
| SEO tab | Same rule for the `seo` object. Read-only until the locale has a translation row (the API needs a `name`), with an "inherited" hint |
| Content tab | Member course names come back localized through `?locale=` |
| Translations tab | Coverage matrix per language (name, description, about, learnings, tags, SEO), copy-from-source, delete, CSV export/import |

Dashboard fetches of the collection itself deliberately omit `locale`: the editor needs the **source row** as its baseline, exactly like the course editor.

## 4. Learner surfaces

| Surface | Behaviour |
|---|---|
| `/orgs/{org}/collections` | Server-rendered in the visitor's locale (reads the `i18next` cookie before fetching) |
| `/orgs/{org}/collection/{id}` | SWR keys carry the locale; a client-side language switch re-fetches |
| Metadata | `generateMetadata` reads the same cookie, so the localized `seo`/name reach `<head>` |
| Fallback hint | `is_fallback: true` shows "This collection is only available in {{language}}." above the title |

## 5. Verification

Run against the live API (dev CLI, `admin@school.dev`):

```
PUT fr      → name=Phase 5 QA FR, seo=SEO FR
GET ?fr     → Phase 5 QA FR | content_locale=fr | is_fallback=false | seo=SEO FR
GET ?ar     → Phase 5 QA   | content_locale=en | is_fallback=true
DELETE fr   → Translation deleted
GET ?fr     → Phase 5 QA   | is_fallback=true
```

`tsc --noEmit` stays at the 25-line baseline; `en`/`fr`/`ar` locales parse.

## 6. Known limits

- Payments, entitlements and receipts keep the collection name in the source locale — money documents should not change language mid-transaction.
- New collections default to `en`; there is no per-org default locale for content yet (same as courses).
- Machine translation, review workflow and stale detection remain out of scope, as for courses.
