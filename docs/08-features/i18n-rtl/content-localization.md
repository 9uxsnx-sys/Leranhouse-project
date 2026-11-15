> Status: as-built · Last verified: 2026-11-15

# Course Content Localisation

A course authored in one language can be translated into French and Arabic, edited from the same dashboard, and served to learners in their selected language.

## Model

The base `course` row always holds the **source locale** (`course.source_locale`, default `en`). Every other locale is a `course_translation` row. Resolution is always `requested locale → base row`.

| Storage | Fields |
|---|---|
| `course_translation` | `name`, `description`, `about`, `learnings`, `tags`, `seo`, display `extra_metadata`, `state`, `source_updated_at`, `translated_by` |
| `course.extra_metadata.translations[locale]` (chapters) | `name`, `description` |
| `course.extra_metadata.translations[locale]` (activities) | `name`, `content`, `description`, `learning_objectives`, `takeaways`, `resources`, `knowledge_checks` |

Structural fields are never localized: thumbnail, banner, price, access type, publication state, chapter order and media.

### Display metadata

Only display-text keys move into a translation row; counts, flags and derived values stay on the base row:

| Translated | Stays on the base row |
|---|---|
| `difficulty`, `duration`, `requirements`, `target_audience` | `lessons_count`, `video_hours`, `resources_count`, `has_certificate` |

Instructor entries sit in between: the list order and avatars come from the base row, while each entry's `name` and `title` are translated index-aligned by `services/people_locale.py`.

## API

| Behaviour | Endpoint |
|---|---|
| Read a course in a locale | `GET /courses/{uuid}?locale=xx` returns `source_locale`, `content_locale`, `is_fallback` |
| Read course meta | `GET /courses/{uuid}/meta?locale=xx` |
| List a page | `GET /courses/org_slug/{slug}/page/{p}/limit/{l}?locale=xx` |
| List translations | `GET /courses/{uuid}/translations` (requires update permission) |
| Upsert one locale | `PUT /courses/{uuid}/translations/{locale}` |
| Delete one locale | `DELETE /courses/{uuid}/translations/{locale}` |
| Localized search | Search matches base rows and every translation row |

`PUT` rejects the source locale with `422`; the source row is only written through the normal course update endpoint. Chapter and activity translations are stored inside each row's `extra_metadata`, so no separate content API exists.

## How overlays are applied

- The resolution helper is `services/courses/translations.py` (`build_translation_overlay`, `apply_overlay`, `apply_overlay_bulk`).
- Chapter/activity overlays live in `services/courses/content_locale.py` and run in `get_course_meta` **after** the source-locale cache read.
- Overlays run after publication, RBAC and paywall checks; a locked lesson stays empty even when a translation exists (`apply_course_content_locale` clears locked content again).
- List endpoints localize one page with a single translation query; the Redis cache stores the source payload only, so a translation edit never poisons it.

## Dashboard

The platform language switcher is the only content-locale control; there is no second selector.

| Surface | Behaviour |
|---|---|
| Course list | SWR key carries `locale`, so cards and search follow the UI language |
| General tab | Source locale writes the base row; other locales write the translation row (name, description, about, learnings) |
| SEO tab | Reads/writes the translation's `seo`; read-only until the locale has a translation row (the API requires a `name`) |
| Content tab | Edits chapter and lesson names plus the structured lesson sections per locale; missing rows open on inherited source text |
| Action row | Language chip, saved state, **Copy from source** in non-source locales |
| Translations tab | Coverage per field, copy-from-source, two-step delete, CSV export/import (UTF-8 BOM) |

Dashboard fetches of the course itself deliberately omit `locale`: the editor needs the source row as its baseline. `useCourseTranslation` resolves the editable translation row for the active locale.

## Learner surfaces

| Surface | Behaviour |
|---|---|
| `/courses` | Server-rendered in the visitor's locale from the `i18next` cookie |
| Course page | Server fetch and the client SWR key both carry the locale, so a language switch re-fetches |
| Lesson page | The activity endpoint accepts `?locale=` and renders translated lesson sections |
| Metadata / JSON-LD | `generateMetadata` uses the overlaid `seo`, so translated titles reach `<head>` |
| Fallback hint | `is_fallback: true` shows "This course is only available in {{language}}." above the title |
| Progress / trail | Trail reads accept `?locale=`, so enrolled course cards follow the language |
| Search, home sections, user profile | Localized list requests |

## Not built

- Tags have no dashboard editor, so the course `tags` field is not edited in v1 even though it is part of the translation row.
- Certificates, emails and payment receipts stay in the source locale; certificate PDFs need Arabic font support.
- Machine translation, review workflow, stale detection, bulk actions and per-locale slugs are out of scope.

## Related

- [RTL and content localisation](./rtl-plan.md)
- [Collections localisation](./collections-localization.md)
- [Podcasts localisation](./podcasts-localization.md)
- [Courses API](../../06-api-reference/courses.md)
