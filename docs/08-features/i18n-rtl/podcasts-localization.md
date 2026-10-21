# Podcasts content localization

> **Status:** done. Same contract as courses and collections — see [content-localization.md](./content-localization.md) and [collections-localization.md](./collections-localization.md).
> Podcast settings **and** episode titles/descriptions follow the platform language switcher.

---

## 1. Model

The base `podcast` row always holds the **source locale**; a `podcast_translation` row overrides the display fields for one other locale. Episodes are content, so they get their own table — they inherit the source locale from their podcast and store no `source_locale` column.

```
podcast
├── source_locale          VARCHAR(10) NOT NULL DEFAULT 'en'
├── podcast_translation
│   ├── podcast_id         FK podcast(id) ON DELETE CASCADE
│   ├── locale, name, description, about, tags, seo
│   └── state, source_updated_at, translated_by, creation_date, update_date
└── podcastepisode
    └── podcast_episode_translation
        ├── episode_id     FK podcastepisode(id) ON DELETE CASCADE
        ├── locale, title, description
        └── state, source_updated_at, translated_by, creation_date, update_date
```

Migration: `apps/api/migrations/versions/z1a2b3c4d5e6_add_podcast_translations.py`.

**Never localized:** cover, banner, hosts, total duration, audio files, price, access type, publish state, episode order. Those are structural and shared.

## 2. API

| Endpoint | Behaviour |
|---|---|
| `GET /podcasts/{uuid}?locale=xx` | Overlays the translation; returns `source_locale`, `content_locale`, `is_fallback` |
| `GET /podcasts/{uuid}/meta?locale=xx` | Localizes the podcast **and** its episode titles/descriptions |
| `GET /podcasts/org_slug/{slug}/page/{p}/limit/{l}?locale=xx` | One translation query per page (`apply_podcast_overlay_bulk`) |
| `GET /podcasts/{uuid}/episodes?locale=xx` | Localized episode list |
| `GET /podcasts/episodes/{uuid}?locale=xx` | Localized single episode |
| `GET/PUT/DELETE /podcasts/{uuid}/translations[/{locale}]` | Podcast translation rows; PUT rejects the source locale with 422 |
| `GET/PUT/DELETE /podcasts/episodes/{uuid}/translations[/{locale}]` | Episode translation rows; same 422 rule |

Implementation: `apps/api/src/services/podcasts/translations.py`. The overlay is applied **after** the publication and RBAC checks, so a translation can never reveal a locked episode.

Search (`/search`) localizes podcast names through the same bulk helper.

## 3. Dashboard

The platform language switcher is the only content-locale control.

| Surface | Behaviour |
|---|---|
| Podcasts list (`/dash/podcasts`) | SWR key carries `locale`, so cards and search follow the UI language |
| General tab | Source locale writes the base row; other locales write `podcast_translation` (name, description, about). Chip, **Copy from source** and an "inherited" hint. The **Details** card (hosts, duration) is source-only because it is shared |
| Episodes tab | List refetches with `locale`; the episode editor edits `title`/`description` per locale, with the same chip and Copy from source. Publish stays structural |
| Translations tab | Coverage matrix per language (name, description, about, tags, SEO), copy-from-source, delete, CSV export/import |

The dashboard context still fetches `/meta` **without** `locale`: the General tab needs the source row as its baseline, exactly like the course and collection editors.

## 4. Learner surfaces

| Surface | Behaviour |
|---|---|
| `/orgs/{org}/podcasts` | Server-rendered in the visitor's locale (reads the `i18next` cookie before fetching) |
| `/orgs/{org}/podcast/{id}` | Server fetch and the client SWR key both carry the locale, so a language switch re-fetches |
| Metadata + JSON-LD | `generateMetadata` uses the localized name/description; episode `name` in JSON-LD now reads `title` (it was undefined) |
| Fallback hint | `is_fallback: true` shows "This podcast is only available in {{language}}." above the title |

## 5. Card surface

Episode containers were brought onto the platform card surface (`bg-white rounded-xl border border-gray-100 shadow-sm`):

- Dashboard episode rows: `shadow-borders-base` → `border border-gray-100 shadow-sm`.
- Learner `EpisodeCard`: `border-black/10` → `border-gray-100` (+ `shadow-sm`, hover `border-gray-200`).

## 6. Verification

Run against the live API (dev CLI, `admin@school.dev`):

```
PUT podcast fr          → Podcast FR
GET /meta?fr            → Podcast FR | content_locale=fr | is_fallback=false | 4 episodes
PUT episode fr          → Titre FR
GET /meta?fr            → episodes[0].title = Titre FR
GET /meta?ar            → test podcast | is_fallback=true | source episode title
GET /meta               → test podcast | source episode title (unchanged)
DELETE episode + podcast fr → both rows removed, reads fall back
```

`tsc --noEmit` stays at the pre-existing error set (no new errors); `en`/`fr`/`ar` locales parse.

## 7. Known limits

- Trail/progress, RSS feeds and receipts keep the source-locale names — same deliberate boundary as courses.
- Podcast search matches the source text only in v1.
- Machine translation, review workflow and stale detection remain out of scope.
