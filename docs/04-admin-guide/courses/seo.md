> Status: as-built · Last verified: 2026-11-15

# Course SEO

The SEO tab controls the search-engine and social-sharing metadata for one locale at a time. It requires the Standard plan; lower plans see a plan-restriction panel instead of the form.

## Basic SEO

| Field | Validation | Effect |
|---|---|---|
| Title | Maximum 70 characters | Browser title and search-result title |
| Description | Maximum 160 characters | Search-result snippet |
| Keywords | Free text | Optional keyword list |
| Canonical URL | Must be a valid URL | Canonical link for the page |

Empty values are stored as null so the course name and description can be used as fallbacks.

## Open Graph

| Field | Validation | Effect |
|---|---|---|
| `og:title` | Maximum 70 characters | Title on social cards |
| `og:description` | Maximum 200 characters | Description on social cards |
| `og:image` | Must be a valid URL | Image on social cards |

All three fields are plain inputs; the image is a URL, not an upload control.

## Twitter card

| Field | Options or limit |
|---|---|
| Card type | `summary` or `summary_large_image`; defaults to `summary_large_image` |
| Title | Maximum 70 characters |
| Description | Maximum 200 characters |

## Robots and structured data

| Toggle | Effect when enabled |
|---|---|
| `robots_noindex` | Adds a noindex directive |
| `robots_nofollow` | Adds a nofollow directive |
| Enable JSON-LD | Emits structured data for the course; on by default |

## Saving and locales

- In the source locale, edits are merged into the course editor after a short debounce and are written to the course when it is saved from the General tab. The source view has no Save button of its own.
- In a translation locale, the form edits that locale's SEO object and shows its own Save button, which writes the translation row explicitly.
- SEO is disabled in a translation locale until the General tab has created that translation, because a translation row cannot exist without its general fields.
- The translation action row shows the locale chip and saved/unsaved dot used by the other tabs.

## Related

- [General settings](./general.md)
- [Translations](./translations.md)
- [Course overview](./overview.md)
