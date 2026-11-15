> Status: as-built · Last verified: 2026-11-15

# RTL and Content Localisation

The platform ships English, French and Arabic, renders Arabic right-to-left, and serves course, collection, podcast and community content in the visitor's locale.

## Interface languages

| Locale | Code | Direction | Shipped |
|---|---|---|---|
| English | `en` | LTR | Yes (bundled) |
| French | `fr` | LTR | Yes (lazy-loaded) |
| Arabic | `ar` | RTL | Yes (lazy-loaded) |

`lib/languages.ts` exposes exactly these three in `AVAILABLE_LANGUAGES`, and `lib/i18n.ts` restricts `supportedLngs` to the same set. Other locale files remain on disk but are unreachable. English is the fallback language.

## Direction plumbing

| Piece | Implementation |
|---|---|
| Direction helpers | `apps/web/lib/direction.ts`: `localeCode()` strips the region, `getDirection()` and `isRTL()` resolve against `RTL_LANGUAGES` |
| First paint | `app/layout.tsx` reads the `i18next` cookie server-side and renders `<html lang dir>` before paint, so Arabic never flashes LTR |
| Runtime switch | `components/Contexts/I18nContext.tsx` updates `document.documentElement.lang` / `dir` and wraps the tree in Radix `DirectionProvider` |
| Org default | `OrgLanguageSync` applies the organization's `default_language` unless the user has deliberately picked a language (`i18nextLng_userPicked`) |
| Cookie | `i18next-browser-languagedetector` persists the active language in the `i18next` cookie and `i18nextLng` localStorage |
| Typography | `app/layout.tsx` loads Inter plus Noto Sans Arabic; `styles/globals.css` switches Arabic to the Arabic font and removes letter-spacing |
| Overlays | Radix dropdowns, selects, popovers and tooltips inherit direction from `DirectionProvider` |

## RTL layout conventions

- Reachable screens use logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`) so one `dir` attribute mirrors the layout.
- Direction-following icons mirror (`rtl:rotate-180` on chevrons and progress arrows); media playback glyphs, seek bars, clocks and checkmarks do not.
- User-generated content (titles, descriptions, discussion bodies, profile bios, lesson names) carries `dir="auto"` so a French title stays LTR inside an Arabic UI.
- Numbers and dates are formatted with `Intl.*` and the active locale; Western digits are used for Arabic, matching the DZD market.
- Physical utilities remain only where they describe physical geometry: symmetric centring, Radix animation sides, media controls and code blocks.

## Content localisation

Interface language and content language are the same switch: the platform language switcher decides which locale the dashboard edits and which locale learners receive.

| Entity | Storage | Fields |
|---|---|---|
| Course | `course.source_locale` + `course_translation` | name, description, about, learnings, tags, SEO, display metadata, instructor names/titles |
| Chapter / activity | `extra_metadata.translations[locale]` | chapter name/description; activity name, content, objectives, takeaways, resources, knowledge checks |
| Collection | `collection.source_locale` + `collection_translation` | name, description, about, learnings, tags, SEO, display metadata |
| Podcast | `podcast.source_locale` + `podcast_translation` | name, description, about, tags, SEO, hosts, learnings |
| Episode | `podcast_episode_translation` | title, description, objectives and key points |
| Community | `community.source_locale` + `community_translation` | name, description |

The base row always holds the source locale. Resolution is `requested locale → base row`; a missing row returns the source text with `content_locale = source_locale` and `is_fallback = true`. Translation overlays run after publication, RBAC and paywall checks, so a translation can never reveal locked content. List endpoints localize one page with a single bulk query, and server caches store the source payload only.

## Dashboard and learner UI

- Dashboard editors edit the active locale: the source locale writes the base row, any other locale writes the translation row. A language chip shows Source, Translation or Missing.
- **Copy from source** seeds a locale; missing translations show an inherited hint.
- Each course, collection and podcast editor has a **Translations** tab with per-language coverage, copy, delete, and CSV export/import (UTF-8 BOM).
- Learner listing pages read the `i18next` cookie server-side and pass `locale` to the API.
- Detail pages pass `locale` in the server fetch and the client SWR key, so a language switch re-fetches without a reload.
- `generateMetadata` and JSON-LD use the same locale; `is_fallback` renders a "only available in …" hint above the title.
- The progress/trail page, search palette, home sections and user profile have localized lists.

## Not built

| Area | State |
|---|---|
| Lint guard banning physical utilities | Not implemented; the lint pipeline cannot run repo-wide |
| Chart mirroring | Not built; Recharts renders physical coordinates and charts are not direction-aware |
| Machine translation, review workflow, stale detection, bulk actions | Not built; every saved translation row is served |
| Localized slugs, `hreflang`, per-locale URL prefixes | Not built; locale is cookie-driven |
| Certificates, emails and payment receipts | Deliberately source-locale |
| Platform admin, playgrounds, boards and certificate preview | Deliberately English/LTR |

## Related

- [Content localisation](./content-localization.md)
- [Collections localisation](./collections-localization.md)
- [Podcasts localisation](./podcasts-localization.md)
- [i18n progress log](./progress.md)
