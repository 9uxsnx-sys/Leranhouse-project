> Status: as-built · Last verified: 2026-11-15

# Collections Content Localisation

A collection authored in one language can be translated into French and Arabic, edited from the collection dashboard, and served to learners in their selected language.

## Model

The base `collection` row holds the **source locale** (`collection.source_locale`, default `en`). A `collection_translation` row overrides the display fields for another locale. Resolution is `requested locale → base row`.

| Storage | Fields |
|---|---|
| `collection_translation` | `name`, `description`, `about`, `learnings`, `tags`, `seo`, display `extra_metadata`, `state`, `source_updated_at`, `translated_by` |

Uniqueness is `(collection_id, locale)`, and the row cascades when the collection is deleted. **Never localized:** thumbnail, banner, price, access type, publish state and membership.

### Display metadata

`collection.extra_metadata` mixes display text with derived values. Only display-text keys are written into a translation row; everything else stays on the base row and is merged over.

| Translated | Stays on the base row |
|---|---|
| `difficulty`, `duration`, `requirements`, `target_audience.for`, `target_audience.not_for` | `lessons_count`, `video_hours`, `resources_count`, `has_certificate` |

The overlay merges `{**base, **translation}`, so a locale can translate a few keys and still inherit every count. Requirements are stored as a JSON string; the editor parses them and assigns ids to older rows that only carry `{text}`. `difficulty` is a fixed `Beginner | Intermediate | Advanced` select in the source locale and free text in a translation.

## API

| Behaviour | Endpoint |
|---|---|
| Read a collection in a locale | `GET /collections/{uuid}?locale=xx` returns `source_locale`, `content_locale`, `is_fallback` |
| List a page | `GET /collections/org/{id}/page/{p}/limit/{l}?locale=xx` |
| Member courses | `GET /collections/{uuid}/courses?locale=xx` |
| Dashboard members | `GET /collections/{uuid}/members?…&locale=xx` |
| My bundles | `GET /collections/org/{id}/mine?locale=xx` |
| List translations | `GET /collections/{uuid}/translations` |
| Upsert one locale | `PUT /collections/{uuid}/translations/{locale}` — `422` for the source locale |
| Delete one locale | `DELETE /collections/{uuid}/translations/{locale}` |

Implementation lives in `services/courses/collection_translations.py`. The overlay is applied **after** every access and lock check, so a translation cannot reveal a locked collection. Listing pages use one bulk query (`apply_collection_overlay_bulk`). Search matches collection translation rows.

## Dashboard

The platform language switcher is the only content-locale control.

| Surface | Behaviour |
|---|---|
| Collections list (`/dash/collections`) | SWR key carries `locale` |
| General tab | Source locale writes the base row; other locales write the translation row. Requirements, audience, difficulty and duration are editable in every locale; the certificate toggle is read-only outside the source locale because the flag is shared |
| SEO tab | Same rule for `seo`; read-only until the locale has a translation row, with an inherited hint |
| Content tab | Member course names come back localized through `?locale=` |
| Translations tab | Coverage matrix per language (name, description, about, learnings, tags, SEO, metadata), copy-from-source, delete, CSV export/import |

Dashboard fetches of the collection itself deliberately omit `locale`, so the editor always has the source row as its baseline. `useCollectionTranslation` resolves the editable row for the active locale.

## Learner surfaces

| Surface | Behaviour |
|---|---|
| `/collections` | Server-rendered in the visitor's locale from the `i18next` cookie |
| `/collection/{id}` | SWR keys carry the locale, so a language switch re-fetches |
| Metadata | `generateMetadata` reads the same cookie, so the localized name and `seo` reach `<head>` |
| Fallback hint | `is_fallback: true` shows "This collection is only available in {{language}}." above the title |

## Not built

- Payments, entitlements and receipts keep the collection name in the source locale; money documents do not change language mid-transaction.
- New collections default to `en`; there is no per-org content default.
- Machine translation, review workflow and stale detection are out of scope.

## Related

- [RTL and content localisation](./rtl-plan.md)
- [Course content localisation](./content-localization.md)
- [Podcasts localisation](./podcasts-localization.md)
- [Collections API](../../06-api-reference/collections.md)
