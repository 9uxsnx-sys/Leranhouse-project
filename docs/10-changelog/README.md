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

- **Drag-and-drop reordering for podcast episodes** — Episodes can now be reordered by dragging the grip handle. The custom order persists via API and is reflected in the public podcast page.
- **Drag-and-drop reordering for course modules and lessons** — Modules and lessons in the course content editor can now be reordered with the same drag-and-drop pattern as episodes.
- **Select mode with checkboxes** — Clicking "Select" in the toolbar replaces drag handles with checkboxes on episodes, modules, and lessons. Drag-and-drop is disabled in select mode. Selected items show a blue ring and filled checkbox.
- **Episode detail preview button** — The "Back to Episodes" button was replaced with a "Preview" button that opens the public podcast page in a new tab, matching the lesson preview pattern.
- **Banner image for courses** — A new `banner_image` field was added to courses for the hero banner on the course detail page. Includes full CRUD support via API (PUT/DELETE `/courses/{uuid}/banner`) and a `CourseMediaSection` UI component in the General tab with two image fields: Card Cover (`thumbnail_image`) and Banner Image (`banner_image`).

### Improvements

- **Field size consistency** — Podcast episode title and description fields now use the same shadcn Input/Textarea components and fieldClassName as all other dashboard edit pages (Course, Community, Podcast General, etc.), ensuring consistent sizing and styling across the admin dashboard.
- **Course detail page hero** — The course detail page hero banner now uses `banner_image` as the primary image source, with `thumbnail_image` as fallback. The old image/video toggle UI was removed.
- **Course thumbnail delete endpoint** — Added `DELETE /courses/{uuid}/thumbnail` endpoint (previously missing), enabling removal of card cover images from the course media section.
- **Scrollbar hidden globally** — Scrollbars are now hidden entirely across the platform to prevent layout shifts when dropdowns or menus open (the disappearing scrollbar was causing content to jump right). Scrolling still works via mouse wheel, keyboard, and touch. Previous custom scrollbar styling (`scrollbar-gutter: stable`, WebKit styling, Firefox `scrollbar-width: thin`) replaced with `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`.
- **Searchbar consistency** — The API Documentation searchbar (Org Edit API Access tab) was updated to use the same raw `<input>` styling as the modules/lessons listing searchbar, replacing the previous `<Input>` component for visual consistency.

---

## Staying Updated

- **Watch the repository** on GitHub to receive notifications for new releases.
- **Check the Releases page** periodically for the latest version.
- Follow the `feat/learnhouse-1.2.0-custom` branch for development-stage changes before they are tagged.

---

## Related

- [Getting Started](../01-getting-started/README.md) — Set up and run the platform
- [Contributing](../09-contributing/README.md) — How to contribute to Koodook
