> Status: as-built · Last verified: 2026-11-15

# Course Translations

The Translations tab is the overview of every available locale for a course. It shows coverage, exposes CSV export and import, and lets you create or delete translation rows. It does not edit the text inline: per-locale text is edited through the normal tabs while the dashboard language is set to that locale.

## How the rows work

- The base course row holds the source locale.
- Each other locale can have a `course_translation` row with its own name, description, about, learnings, tags, SEO object and metadata.
- The tab always lists every language the platform supports, whether or not a translation row exists.

## Coverage table

| Column | Meaning |
|---|---|
| Language | Native language name and locale code |
| Name | Translation row has a non-empty name |
| Description | Non-empty description |
| About | Non-empty long description |
| Learnings | Non-empty learnings list |
| SEO | At least one SEO value set |
| Meta | At least one translated metadata value set |
| Status | Source, Not started, Partial or Complete |

A check mark means the field has a value in that row; a dash means it does not. A locale counts as Complete when all six content fields are filled.

## Row actions

| Action | Behaviour |
|---|---|
| Export | Downloads a CSV for that locale; available for the source row too |
| Import | Uploads a CSV into that locale, creating or merging the translation row |
| Copy from source | Shown only when a non-source locale has no row; copies the source text, SEO and metadata into a new translation |
| Delete | Two-step inline confirmation; deletes the translation row, never the base course |

## CSV format

The file is a two-column `field,value` CSV with a UTF-8 BOM. Recognised keys:

```
name, description, about, learnings, tags,
seo.title, seo.description, seo.keywords, seo.canonical_url,
seo.og_title, seo.og_description, seo.og_image,
seo.twitter_title, seo.twitter_description,
meta.difficulty, meta.duration, meta.requirements,
meta.target_audience.for, meta.target_audience.not_for
```

`learnings` keeps its JSON list shape. Audience lists use one item per line inside the quoted cell. Import requires a name; missing values fall back to the existing translation or the source text. SEO and metadata are merged into the existing objects rather than replacing them.

## Editing the text

Switch the dashboard language to the target locale, then use the normal tabs:

| Tab | What it writes |
|---|---|
| General | Name, description, about, learnings, difficulty, duration, requirements, audience, instructor names and titles |
| Content | Module and lesson names plus lesson objectives, takeaways, resources and knowledge checks |
| SEO | The locale's SEO object |

Saving in a non-source locale never modifies the base course row. Instructor lists stay index-aligned with the source list and reuse the source photos.

## Related

- [General settings](./general.md)
- [Content structure](./content-structure.md)
- [SEO](./seo.md)
- [Course overview](./overview.md)
