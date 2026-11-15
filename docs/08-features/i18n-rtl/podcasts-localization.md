> Status: as-built · Last verified: 2026-11-15

# Podcasts Content Localisation

A podcast and its episodes can be translated into French and Arabic, edited from the podcast dashboard, and served to learners in their selected language.

## Model

The base `podcast` row holds the **source locale** (`podcast.source_locale`, default `en`). A `podcast_translation` row overrides the display fields for another locale. Episodes inherit the podcast's source locale and have their own translation table.

| Storage | Fields |
|---|---|
| `podcast_translation` | `name`, `description`, `about`, `tags`, `seo`, `extra_metadata`, `state`, `source_updated_at`, `translated_by` |
| `podcast_episode_translation` | `title`, `description`, `extra_metadata` (learning objectives, key points), `state`, timestamps |

**Never localized:** cover, banner, audio files, total duration, price, access type, publish state, episode order. Host entries are split: the list, order and avatars come from the base row, while each host's `name` and `title` are translated index-aligned through `services/people_locale.py`.

## API

| Behaviour | Endpoint |
|---|---|
| Read a podcast in a locale | `GET /podcasts/{uuid}?locale=xx` returns `source_locale`, `content_locale`, `is_fallback` |
| Podcast with episodes | `GET /podcasts/{uuid}/meta?locale=xx` |
| List a page | `GET /podcasts/org_slug/{slug}/page/{p}/limit/{l}?locale=xx` |
| Episode list | `GET /podcasts/{uuid}/episodes?locale=xx` |
| Single episode | `GET /podcasts/episodes/{uuid}?locale=xx` |
| Podcast translations | `GET/PUT/DELETE /podcasts/{uuid}/translations[/{locale}]` |
| Episode translations | `GET/PUT/DELETE /podcasts/episodes/{uuid}/translations[/{locale}]` |

`PUT` rejects the source locale with `422`. Implementation lives in `services/podcasts/translations.py`; overlays are applied **after** publication and access checks, so a translation can never reveal a locked episode. List endpoints localize one page with a single bulk query. Search matches podcast translation rows.

## Dashboard

The platform language switcher is the only content-locale control.

| Surface | Behaviour |
|---|---|
| Podcast list (`/dash/podcasts`) | SWR key carries `locale` |
| General tab | Source locale writes the base row; other locales write `podcast_translation` (name, description, about). Chip, **Copy from source** and an inherited hint |
| Details card | Host names and titles are editable per locale; photos and the total duration stay shared |
| Episodes tab | Episode list refetches with `locale`; the editor writes `title`, `description` and the structured objectives/key points per locale |
| Translations tab | Coverage matrix per language, copy-from-source, delete, CSV export/import |

Dashboard context fetches `/meta` without `locale`, because the editor needs the source row as its baseline.

## Learner surfaces

| Surface | Behaviour |
|---|---|
| `/podcasts` | Server-rendered in the visitor's locale from the `i18next` cookie |
| `/podcast/{id}` | Server fetch and the client SWR key carry the locale, so a language switch re-fetches |
| Episode page | Fetches the episode and its list with the content locale; renders translated objectives and key takeaways |
| Metadata / JSON-LD | `generateMetadata` uses the localized name and description |
| Fallback hint | `is_fallback: true` shows "This podcast is only available in {{language}}." above the title |

Durations keep the English short form (`7h 32min`, `45min`) in every locale, matching the course cards.

## Player

The episode player is part of the learning surface, not the translation pipeline. It supports playback speed (`0.75x`–`2x`), loop, a hover-revealed volume track and keyboard shortcuts; its labels follow the interface language. Media controls and the seek bar stay LTR by design.

## Not built

- RSS feeds, trail lists and receipts keep source-locale names.
- Machine translation, review workflow and stale detection are out of scope.
- Per-locale audio is not supported; only text is translated.

## Related

- [RTL and content localisation](./rtl-plan.md)
- [Course content localisation](./content-localization.md)
- [Collections localisation](./collections-localization.md)
- [Podcasts API](../../06-api-reference/podcasts.md)
