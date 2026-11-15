> Status: as-built · Last verified: 2026-11-15

# General Settings

The General tab holds the course's public-facing text, media, catalogue details and instructor list. It edits one locale at a time: the dashboard language switcher decides whether the source row or a translation row is being edited.

## Action row

| Control | Behaviour |
|---|---|
| Preview | Opens the learner-facing course page in a new tab |
| Save | Flushes pending edits; disabled and labelled Saved when there is nothing to save |
| Publish / Unpublish | Toggles the course's published state for every locale |

In the source locale edits are held in the course editor after a short debounce and written when Save is pressed. In a translation locale the Save button writes the translation explicitly.

## Overview fields

| Field | Rules and effect |
|---|---|
| Name | Required, maximum 100 characters |
| Description | Required, maximum 1,000 characters; one-line input used on cards |
| About | Long description shown on the course page |
| What you will learn | Required list; at least one non-empty item |
| Requirements | Optional list of prerequisites |
| Audience — for | Optional list of who the course is for |
| Audience — not for | Optional list of who it is not for |

The list editors add and remove items. Only the learnings list has a minimum item rule.

## Media

| Field | Effect |
|---|---|
| Card cover | Thumbnail on course cards and search results |
| Banner | Hero image on the course detail page |

Both accept JPG, PNG or JPEG files up to 8 MB. An empty field offers an upload button; once an image is set, the same row offers a trash button to remove it. Media is shared by every locale.

## Details

| Field | Effect | Translation behaviour |
|---|---|---|
| Difficulty | Beginner, Intermediate or Advanced in the source locale | Free text in a translation |
| Duration | Free text such as `8 weeks` or `12 hours` | Translated |
| Video hours | Free-text figure shown in course details | Shared, read-only |
| Resources count | Free-text figure shown in course details | Shared, read-only |
| Offers certificate | Enables the certificate claim for the course | Shared, read-only |

## Instructors

Instructors are repeatable cards stored in `extra_metadata.instructors` as `{name, title, avatar}`. Each card has name and title side by side, a photo area and, in the source locale, a remove button.

- **Add instructor** appends an empty card.
- **Upload photo** accepts JPG, PNG or WebP and stores it with the card.
- In a translation locale only name and title are editable; the number of cards and the photos are inherited from the source row.
- Source-locale rows without a name are discarded on save.

## Translating the tab

When the dashboard language is not the course's source locale:

- Name, description, about, learnings, difficulty, duration, requirements and audience are written to the translation row.
- Video hours, resources count and the certificate toggle stay source-only and are shown disabled.
- Instructor names and titles are stored index-aligned with the source list; blank fields fall back to the source text and every locale reuses the source avatar.
- **Copy from source** fills the form with the source text without saving. Review and translate it, then press Save.
- A missing translation shows an inherited-text notice.

## Related

- [Translations](./translations.md)
- [Access control](./access.md)
- [SEO](./seo.md)
