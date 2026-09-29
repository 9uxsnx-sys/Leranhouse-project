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

### Improvements

- **Field size consistency** — Podcast episode title and description fields now use the same shadcn Input/Textarea components and fieldClassName as all other dashboard edit pages (Course, Community, Podcast General, etc.), ensuring consistent sizing and styling across the admin dashboard.

---

## Staying Updated

- **Watch the repository** on GitHub to receive notifications for new releases.
- **Check the Releases page** periodically for the latest version.
- Follow the `feat/learnhouse-1.2.0-custom` branch for development-stage changes before they are tagged.

---

## Related

- [Getting Started](../01-getting-started/README.md) — Set up and run the platform
- [Contributing](../09-contributing/README.md) — How to contribute to Koodook
