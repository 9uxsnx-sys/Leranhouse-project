> Status: partly as-built · Last verified: 2026-11-15

# i18n and RTL — Progress

English, French and Arabic interface text is complete, Arabic renders right-to-left, and course, collection, podcast and community content is localised per locale.

## Scope decisions

| Decision | Value |
|---|---|
| Shipped languages | `en`, `fr`, `ar` |
| Source of truth | English; new keys are added to `en.json` first, then mirrored |
| Direction source | `lib/direction.ts` (`localeCode`, `getDirection`, `isRTL`) |
| Content locale control | The platform language switcher; no second selector |
| Content storage | Base row holds the source locale, translation tables hold other locales |
| RTL strategy | Logical CSS properties plus targeted icon mirroring, not a global CSS flip |
| Deliberate LTR surfaces | Media controls, code blocks, certificate preview, platform admin, playgrounds and boards |

## Interface translation

- Three locale files are shipped (`apps/web/locales/{en,fr,ar}.json`); the other files on disk are unreachable because `supportedLngs` and `AVAILABLE_LANGUAGES` list three.
- English is bundled; French and Arabic load lazily through `LOCALE_LOADERS`.
- Plural forms are written per CLDR: `en` one/other, `fr` one/many/other, `ar` zero/one/two/few/many/other.
- Interface text in the reachable learner and dashboard UI is translated; boards and playgrounds are out of scope because no shipped menu links to them.

## Direction

| Piece | State |
|---|---|
| SSR `<html lang dir>` from the `i18next` cookie | Done |
| `DirectionProvider` and runtime `lang`/`dir` sync | Done |
| Organisation default language with user override | Done |
| Noto Sans Arabic font and RTL typography overrides | Done |
| Logical-property pass over reachable screens | Done |
| `dir="auto"` on user-generated content | Done |
| Locale-aware `Intl.*` number and date formatting | Done |
| Search modal and command palette centring in RTL | Done |
| Lint guard banning physical utilities | Not built — the lint pipeline cannot run repo-wide |
| Chart handling | Not built — Recharts is not direction-aware |

Physical utilities that remain are intentional: symmetric centring, Radix animation sides, media controls, code blocks and the certificate preview frame.

## Content localisation

| Entity | Storage | State |
|---|---|---|
| Course metadata | `course_translation` | Done |
| Chapters and lessons | `extra_metadata.translations[locale]` | Done |
| Collections | `collection_translation` | Done |
| Podcasts | `podcast_translation` | Done |
| Episodes | `podcast_episode_translation` | Done |
| Communities | `community_translation` | Done |
| Trail / progress cards | `?locale=` on trail reads | Done |
| Home sections, search palette, user profile | locale-aware list requests | Done |
| Certificates, emails, payment receipts | — | Not localized |

Dashboard editors write the base row for the source locale and a translation row for every other locale. Learners receive the requested locale through the `i18next` cookie; missing rows fall back to the source text with an `is_fallback` hint.

## Not built

- Machine translation, review workflow, stale detection and bulk translation.
- Translating tags through a dedicated tags editor for courses.
- Per-locale slugs, `hreflang` and URL-prefixed routing.
- Direction-aware charts.
- A lint rule that prevents new physical utilities.

## Verification

```powershell
# Locale files must parse
foreach ($f in @('en','fr','ar')) { Get-Content "apps/web/locales/$f.json" -Raw | ConvertFrom-Json | Out-Null }

# Migrations: one head, then upgrade
cd apps/api; .\.venv\Scripts\alembic.exe heads; .\.venv\Scripts\alembic.exe upgrade head

# Typecheck: compare against the pre-existing error set, not zero
cd apps/web; .\node_modules\.bin\tsc.cmd --noEmit --ignoreDeprecations 6.0
```

## Gotchas

- Editing anything under `apps/api/` stops the dev CLI; restart it after each backend step.
- Schema changes go through `alembic upgrade head`, not `SQLModel.metadata.create_all`.
- `en.json` uses a different formatting style from `fr`/`ar`; edit in place instead of reformatting.
- Dashboard fetches of a resource omit `locale` on purpose: the editor needs the source row as its baseline.

## Related

- [RTL and content localisation](./rtl-plan.md)
- [Course content localisation](./content-localization.md)
- [Collections localisation](./collections-localization.md)
- [Podcasts localisation](./podcasts-localization.md)
