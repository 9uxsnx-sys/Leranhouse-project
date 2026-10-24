# Changelog

> Track all releases, version history, and updates for the Koodook platform.

---

## Versioning Scheme

Koodook follows the **Learnhouse versioning scheme** with Koodook-specific patch identifiers.

```
MAJOR.MINOR.PATCH-koodook.N
```

| Component | Description |
|-----------|-------------|
| `MAJOR` | Incompatible API or breaking changes |
| `MINOR` | New features, backward-compatible |
| `PATCH` | Bug fixes and minor improvements |
| `koodook.N` | Koodook-specific patch number (e.g., `koodook.1`, `koodook.2`) |

**Example:** `1.2.0-koodook.3` means the third Koodook patch on top of Learnhouse v1.2.0.

---

## Latest Release

[![View on GitHub](https://img.shields.io/badge/View%20Releases-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/learnhouse/learnhouse/releases)

All releases are published on the [Learnhouse GitHub Releases page](https://github.com/learnhouse/learnhouse/releases).

---

## How to Read Version Numbers

- **`1.2.0`** — The base Learnhouse version that Koodook is forked from.
- **`koodook.1`** — The first Koodook-specific patch. Increments with each set of Koodook changes.
- A full version like **`1.2.0-koodook.3`** tells you: "This is the base Learnhouse v1.2.0, with 3 rounds of Koodook-specific updates applied."

---

## What Each Release Includes

Each release provides a summary of changes organized by category:

| Category | Description |
|----------|-------------|
| 🚀 **New Features** | New functionality added to the platform |
| 🐛 **Bug Fixes** | Resolved issues and stability improvements |
| ⚠️ **Breaking Changes** | Changes that may require manual migration or configuration updates |
| 🔧 **Improvements** | Performance enhancements, refactors, and UX polish |

---

## Where to Find Release Notes

1. **GitHub Releases** — The primary source. Every release includes a detailed changelog with all changes listed.
2. **Release tags** — Each release is tagged in the repository (e.g., `v1.2.0-koodook.1`).
3. **Commit history** — For the full granular history, browse the `feat/learnhouse-1.2.0-custom` branch.

---

## v1.2.0-koodook.N (Unreleased)

### New Features

- **In-app notifications** — every platform event can now produce a per-user notification. 39 events across 10 categories, each with its own audience rule, plus per-organization template overrides and a per-event kill switch. Default copy ships in English, French and Arabic (`DEFAULT_TEMPLATES_EN/FR/AR`) with a fallback chain of org override → platform default → built-in language → English; the rendered title/body are snapshotted onto the row so template edits never rewrite history. Adds the `notification`, `notification_recipient` and `notification_template` tables, nine `/api/v1/notifications/*` endpoints, and a `Notifications` dashboard tab with an **Events** table (toggle, category, audience, edit template) and an **Announcements** composer/history. Both headers now show a monochrome bell dropdown that opens a centered reading window with the notification title and body. `notify()` calls were wired into every relevant service across courses, users, groups, communities, boards, podcasts, packs and organization settings.
- **Multilingual content — courses, collections and podcasts** — Content can now be authored in English, French and Arabic while keeping one record per entity. A `source_locale` column names the base row; every other language lives in a translation table (`course_translation`, `collection_translation`, `podcast_translation`, `podcast_episode_translation`; chapters and lessons use `extra_metadata.translations`). Every read endpoint accepts `?locale=` and returns `content_locale` / `is_fallback`, so untranslated content falls back to the source with an amber notice on the learner page. The dashboard follows the platform language switcher: the editor writes the base row in the source language and the translation row everywhere else, with a language chip, "Copy from source", and a per-entity **Translations** tab (coverage matrix, delete, CSV export/import). Search payloads and learner listings are localized as well.
- **Drag-and-drop reordering for podcast episodes** — Episodes can now be reordered by dragging the grip handle. The custom order persists via API and is reflected in the public podcast page.
- **Drag-and-drop reordering for course modules and lessons** — Modules and lessons in the course content editor can now be reordered with the same drag-and-drop pattern as episodes.
- **Select mode with checkboxes** — Clicking "Select" in the toolbar replaces drag handles with checkboxes on episodes, modules, and lessons. Drag-and-drop is disabled in select mode. Selected items show a blue ring and filled checkbox.
- **Episode detail preview button** — The "Back to Episodes" button was replaced with a "Preview" button that opens the public podcast page in a new tab, matching the lesson preview pattern.
- **Banner image for courses** — A new `banner_image` field was added to courses for the hero banner on the course detail page. Includes full CRUD support via API (PUT/DELETE `/courses/{uuid}/banner`) and a `CourseMediaSection` UI component in the General tab with two image fields: Card Cover (`thumbnail_image`) and Banner Image (`banner_image`).
- **Redesigned authentication experience** — Sign in, Sign up, Forgot password, Reset password, and Verify email now share a unified split layout (image panel + card-styled form). Adds inline success/error alerts, a reusable "Check your email" state with a mail-provider shortcut (e.g. "Open Gmail" when the address is a known webmail domain), and a dev-only preview route at `/test-dev/auth`.
- **Organization branding — Auth page branding** — Organizations can brand their sign-in page with a welcome message, a background (gradient / uploaded image / Unsplash), and a light/dark text color, with a live preview panel next to the settings.

### Improvements

- **Unified card surface** — Curriculum modules and lessons, lesson-page sections, podcast episode rows and learner episode cards now use the same surface as dashboard section cards (`bg-white rounded-xl border border-gray-100 shadow-sm`) instead of the black hairline (`shadow-borders-base`, `border-black/10`). The "MODULE N" label was removed from the curriculum header.
- **Organization branding tab redesign** — The Branding settings tab now uses unified section cards (Logo & Favicon, Theme, Auth) with a row-based upload-container pattern for Logo, Favicon, Logomark, and Thumbnail. The Primary Color field is hex-only (the native OS color picker was removed) and saves through a single top Action Row button.
- **Community discussions redesign** — Discussion cards now use an inline create card and inline replies with smoother animations.

- **Field size consistency** — Podcast episode title and description fields now use the same shadcn Input/Textarea components and fieldClassName as all other dashboard edit pages (Course, Community, Podcast General, etc.), ensuring consistent sizing and styling across the admin dashboard.
- **Course detail page hero** — The course detail page hero banner now uses `banner_image` as the primary image source, with `thumbnail_image` as fallback. The old image/video toggle UI was removed.
- **Course thumbnail delete endpoint** — Added `DELETE /courses/{uuid}/thumbnail` endpoint (previously missing), enabling removal of card cover images from the course media section.
- **Scrollbar hidden globally** — Scrollbars are now hidden entirely across the platform to prevent layout shifts when dropdowns or menus open (the disappearing scrollbar was causing content to jump right). Scrolling still works via mouse wheel, keyboard, and touch. Previous custom scrollbar styling (`scrollbar-gutter: stable`, WebKit styling, Firefox `scrollbar-width: thin`) replaced with `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`.
- **Searchbar consistency** — The API Documentation searchbar (Org Edit API Access tab) was updated to use the same raw `<input>` styling as the modules/lessons listing searchbar, replacing the previous `<Input>` component for visual consistency.
- **Dashboard consistency sweep (desktop)** — unified the UI primitives across every desktop-reachable dashboard area:
  - All 6 settings tab bars plus Payments and Analytics now use the shared `PageTabs` (`pill` / `underline`); zero bespoke `layoutId="tab-indicator"` bars remain.
  - One icon per meaning: `SectionIcon` for sections/tabs and `ConceptIcon` for actions. Phosphor is removed from the dashboard (the `MarkdownLogo` brand mark is the only exception).
  - All filter triggers are the same icon-only `IconButton` with `ConceptIcon.filter` and a check marker on the active option.
  - Native `<select>`s and bespoke dropdowns replaced by the shared `Select` (`DropdownMenu` for action pickers).
  - Section headings renamed to fit their content (`Basic Information` → `Overview`, `Course Details` / `Podcast Details` → `Details`) and keyed via `common.sections.*`.
- **Translation-ready dashboard (en / fr / ar)** — every visible string in the desktop dashboard (Org, Users, Course, Account, Analytics, Podcast, Community, Payments, navigation and onboarding) now goes through `t()`, with ~850 new keys added to **all three** shipped locales. Backend data, enum values and brand names stay untranslated by design.
- **Breadcrumb language fix** — dashboard breadcrumbs now resolve through `dashboard.breadcrumb.*` instead of hardcoded English `SECTION_LABELS` / `SUBPAGE_LABELS` maps, so labels such as "Distribution" correctly become "التوزيع" in Arabic.
- **Learner breadcrumbs** — the user-side top bar now resolves the full trail instead of only the first URL segment. Course pages show `Home > Courses > {Course}`, lessons add the module (desktop) and lesson name, discussions add the community and title, and account/podcast/store/playground/profile pages register their own names. Community feeds and podcast episodes are inline, so they intentionally add no crumb. Labels are translated in en / fr / ar, middle crumbs collapse to `…` on mobile, and the in-page breadcrumb duplicates were removed. Also fixed the profile menu's account link to use the org-scoped URL.
- **Repository cleanup** — removed the untracked, gitignored `medusa/` reference folder (~238 MB) and its stale mention in the project-structure docs; synced `apps/web/bun.lock` with the already-declared `react-easy-crop` dependency.

---

## Staying Updated

- **Watch the repository** on GitHub to receive notifications for new releases.
- **Check the Releases page** periodically for the latest version.
- Follow the `feat/learnhouse-1.2.0-custom` branch for development-stage changes before they are tagged.

---

## Related

- [Getting Started](../01-getting-started/README.md) — Set up and run the platform
- [Contributing](../09-contributing/README.md) — How to contribute to Koodook
