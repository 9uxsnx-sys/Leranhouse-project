> Status: as-built · Last verified: 2026-11-15

# Changelog

Entries below are derived from the commit history of the current branch (`feat/learnhouse-1.2.0-custom`); dates are commit dates. Work that is uncommitted at the time of writing is listed separately at the end.

## 2026-11-16

- Added the brand token layer (`--brand`, `--brand-fg`, hover / pressed / soft / ring) and drove the primary button, progress fills and tab underline from it on all four shells.
- Moved every chart series onto the brand ramp; fixed the ramp turning saturated oranges brown by mixing toward white only, and read the colour from the org context rather than `--brand` on the root.
- Added Branding → Theme → **Text & Icons**, which pins the foreground used on brand fills (`customization.general.brand_fg`) with a live WCAG read-out.
- Fixed every paginated dashboard table: they requested `limit=10000` while the API caps at 100, so the endpoints answered 422 and the tables rendered empty. They now walk the real pages through `swrFetchAllPages`.
- Fixed the course media cache key that targeted the non-existent `courses/org/{id}` route.

## 2026-11-14

- Localized the learner home page and recorded the change in the docs.
- Localized the podcast module, the progress tab and the search palette.
- Localized communities to French and Arabic and polished the discussion UI.
- Wired the collection metadata editor and translated collection `extra_metadata` per locale.
- Matched the bottom spacing of learner listings to the dashboard shell.

## 2026-11-11

- Re-fetched content on locale switch, added activity translation seed data and updated docs.
- Added `ACTIVITY_TRANSLATIONS` with French keys for all 20 lessons.
- Landed the i18n infrastructure for activity translations, locale UI and module editing.

## 2026-11-10

- Moved target audience to the Overview tab with `LearningItemsList` and removed the "(one per line)" labels.
- Seeded French and Arabic translations for courses, podcasts and collections.
- Added pagination to announcement history, collection content and organization user-group tables.
- Removed broken pagination from access tables and cleaned up the table components.

## 2026-11-09

- Integrated the image cropper for profile picture and banner upload, fixed reply avatars and unified course card borders.
- Added the Instagram-style cropper test page, restructured the account area and updated breadcrumb icons.

## 2026-11-08

- Replaced the "Home" breadcrumb text with an icon and adjusted the profile page layout.
- Restructured account settings with Security and Privacy tabs, including account deletion.
- Redesigned the settings General tab with avatar and banner upload, username check and a three-state save button.

## 2026-11-04

- Fixed z-index layering for the user sidebar hover cards and the three-dots position.
- Shipped the learner home page with four content sections, removed dead code and fixed the build.

## 2026-11-03

- Added `extra_metadata` support for podcast episodes with admin editing and tests.
- Documented the remaining episode `extra_metadata` gaps.

## 2026-11-02

- Restructured the podcast page with an episode list matching the course module style.
- Redesigned the podcast player with the Design A layout and an interactive timeline.

## 2026-10-28

- Prevented auto-play on episode select and removed the episode name from the minimized player.
- Suppressed `AbortError` in the dev overlay and removed the error boundary.
- Fixed the missing slash in the podcast audio stream URL.
- Added the community member count endpoint, redesigned the sidebar cards and updated docs.

## 2026-10-27

- Set the flagship collection to paid with a 12,000 DZD price and updated the seed manifest.
- Added the "Who This Is For" section, learning path badges and the community sidebar.
- Removed footer text, replaced bullets with dots and fixed lesson preview spacing.
- Fixed trail `notify()` calls to receive a database session.

## 2026-10-26

- Serialized the course object to a dict before storing it in `step.data` in the trail service.

## 2026-10-25

- Seeded a backend flagship course with its own artwork.
- Locked the demo seed manifest and build plan.

## 2026-10-24

- Added in-app notifications with three-language templates.
- Switched the notification bell to live data and removed the mockup leftovers.

## 2026-10-21

- Localized collections end to end, then podcasts and episodes, and unified the episode cards.
- Documented collections and podcasts localization.
- Localized chapter and activity content, module and lesson names, and made lesson content editable per language.
- Rendered rich-text lesson bodies as designed sections on the lesson preview page and mounted the renderer with the full activity payload.
- Added a gradient video fallback above rich-text lessons and dropped the uneditable lesson body from the lesson page.
- Hid the duplicate in-content table of contents on lesson preview.
- Aligned lesson page cards and content-tab module and lesson rows with the dashboard card surfaces.
- Dropped the module number label from the curriculum header.
- Completed breadcrumbs for module and lesson views, made the Content breadcrumb return to the module list, and collapsed admin breadcrumbs on mobile.
- Removed the analytics and certification tabs from the course editor and fixed the select triggers.
- Fixed the field select to show a single chevron without a blue ring.
- Documented the course editor cleanup, the field select and the localization API.

## Current development line (uncommitted)

- **Access and payments** — the offer form, offer resources panel, payment wall and offers service were removed from the store and payments surfaces. Resource access checks moved into a shared RBAC layer (`apps/api/src/security/rbac/catalog.py`, `media.py`, `resource_access.py`), and a migration links communities to resources.
- **Localization** — new `apps/api/src/services/people_locale.py` resolves instructor and host names per locale across courses, chapters, collections, podcasts and communities. The `en`, `fr` and `ar` locale files were updated.
- **Podcasts** — podcast and episode services, seed generators and translation handling were updated on both the API and the web app.
- **Docs** — the documentation tree was re-audited against the code: superseded plans moved to `docs/_archive/docs/`, live pages no longer link to them, and the documentation home, features index and this changelog were rebuilt.

---

See the [documentation home](../README.md) for the full section index.
