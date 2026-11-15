> Status: as-built · Last verified: 2026-11-15

# Podcasts

Podcasts live under **Dashboard → Podcasts**. The feature is plan-gated at Standard and can be disabled by the organisation's feature flags. Each podcast has a five-tab editor: General, Episodes, Access, Translations and Distribution.

## Podcast list

| Control | Behaviour |
|---|---|
| Search | Filters by name, description and tags |
| Filter | All podcasts, Published or Unpublished |
| New Podcast | Opens the create-podcast dialog |
| Select podcasts | Switches cards to checkboxes |
| Bulk action | Deletes the selected podcasts |
| Three-dot menu | Edit content, Settings, Delete |
| Pagination | Eight podcasts per page |

Cards show the cover, name, description, episode count, total duration and a published/unpublished badge.

## General tab

| Field | Rules |
|---|---|
| Name | Required, 3–100 characters |
| Description | Optional, maximum 500 characters |
| About | Optional long text, maximum 2,000 characters |
| Total duration | Numeric value in the source locale only |
| Hosts | Repeatable cards with name, title and photo |
| Card cover | JPG or PNG up to 8 MB |
| Banner | JPG or PNG up to 8 MB |

The action row has **Preview**, **Save** and **Publish/Unpublish**. Save stays disabled until the form is valid and dirty. Hosts are stored in `extra_metadata.hosts` as `{name, title, avatar}`; host rows and photos are managed in the source locale.

## Episodes tab

| Control | Behaviour |
|---|---|
| Search | Filters episodes by title |
| New | Creates a draft titled `New Episode` immediately |
| Select | Switches rows to checkboxes; there is no bulk action |
| Sort | Toggles title order |
| Drag handle | Reorders episodes; the order is saved immediately |
| Row menu | Duplicate is a placeholder; Delete removes the episode |

Each row shows a Draft or Published badge. Opening an episode reveals title, description, learning objectives, key takeaways, audio upload and the preview, save and publish controls. Audio accepts any `audio/*` file.

In a non-source locale the episode form edits the translation row's title, description, objectives and takeaways. Audio and publish state stay shared.

## Access tab

The Access tab appears only with the `manage_access` right. Modes are `public`, `users_only` and `paid`; the mode button cycles through them and skips Paid while the podcast has no positive price. Set the price on the **Payments → Offers** page.

| Mode | Roster |
|---|---|
| Public | No roster; the tab explains that everyone has access |
| Private | User groups linked to the podcast, with member count and link date |
| Paid | Users with an active entitlement, granted or purchased |

In Private and Paid modes, searching switches the table to candidates that can be added. Bulk actions add or remove the selected users or groups; revoking a paid entitlement keeps the audit row. Only the Paid mode uses the entitlement endpoints; Private mode links user groups.

## Translations tab

The table lists every supported locale and the source row.

| Column | Meaning |
|---|---|
| Name, Description, About, Tags, SEO | Whether that field has a value in the row |
| Status | Source, Not started, Partial or Complete |
| Actions | Export CSV, import CSV, copy from source, delete |

Copy from source only appears when a locale has no row. Import requires a name and merges into the existing row. The CSV keys are `name`, `description`, `about`, `tags` and the `seo.*` fields. Translating a podcast in the General tab also writes host names and titles, index-aligned with the source list; photos remain shared. There is no separate podcast SEO tab.

## Distribution tab

Distribution is read-only. It shows the podcast's public RSS feed URL with **Copy** and **Preview** actions, and warns when the podcast is unpublished. Below the feed it provides submission steps for Apple Podcasts, Spotify, YouTube Music and Amazon Music / Audible, plus a short distribution checklist. It does not store distribution settings.

## Related

- [Collections](./collections.md)
- [Course access control](./courses/access.md)
- HTTP contracts: [Podcasts API](../06-api-reference/podcasts.md), [Payments API](../06-api-reference/payments.md)
