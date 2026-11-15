> Status: as-built · Last verified: 2026-11-15

# SEO Settings

The SEO tab controls organization-level metadata, social previews, search-engine verification and community indexing.

## Opening SEO

Open **Organization → SEO**. The page is built as cards with a single three-state save control in the action row.

## Quick links

| Link | Purpose |
|---|---|
| Sitemap | Opens `sitemap.xml` for the organization |
| Robots | Opens `robots.txt` for the organization |

Both rows offer copy and open-in-new-tab actions. The URLs are derived from the organization's canonical host.

## Default meta tags

| Field | Effect |
|---|---|
| Title suffix | Default suffix appended to page titles |
| Default description | Fallback description when a page has no specific one |

## Social and Open Graph

| Control | Behaviour |
|---|---|
| Open Graph image | Upload `.jpg`, `.jpeg` or `.png`; the image is previewed in a 16:9 frame |
| Remove image | Deletes the stored Open Graph image |
| Twitter handle | Handle used for Twitter card metadata |

Uploading an image saves the filename with the form; the previous image stays until **Save** succeeds.

## Search-engine verification

The Google Search Console field stores the verification string used in the site's meta tag. Paste the value from the HTML-tag verification method; no separate verify button exists in the dashboard.

## Indexing controls

| Control | Effect |
|---|---|
| Hide communities | Adds a `noindex` directive to community pages |

The toggle is part of the same form and is persisted with **Save**.

## Where the values are used

| Value | Used by |
|---|---|
| Title suffix | Suffix appended to default page titles |
| Default description | Pages without a specific description, including course and podcast fallbacks |
| Open Graph image | Social previews for pages without their own image |
| Twitter handle | Twitter card site attribution |
| Verification string | The Google site-verification meta tag |
| Hide communities | The `robots` metadata of community pages |

## Saving

The action row shows **Save**, **Saving** and **Saved**. The button is inert until a field, the toggle or the image changes.

## What this tab does not contain

There are no per-page SEO overrides, keyword field, custom robots rules, canonical-domain selector or sitemap regeneration button here. Course, collection and podcast SEO is edited in each resource's own editor; domain and canonical-host settings live under [Domains](./domains.md).

## Related

- [General](./general.md) — organization name used in titles.
- [Domains](./domains.md) — custom hosts and SSL.
- [Organizations API](../../06-api-reference/orgs.md) and [Developer guide](../../05-developer-guide/README.md).
