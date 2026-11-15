> Status: as-built · Last verified: 2026-11-15

# Collections

A collection is a bundle of courses and podcasts sold or published as one unit. Collections are managed from **Dashboard → Collections**. The editor is administrator-only: users who are not an admin of the organisation see a forbidden state.

## Collection list

| Control | Behaviour |
|---|---|
| Search | Filters by name and description |
| Filter | All, Public, Private or Paid |
| New Collection | Prompts for a name, then creates the collection and opens its General tab |
| Select collections | Switches cards to checkboxes |
| Bulk action | Deletes the selected collections |
| Three-dot menu | Edit or Delete |
| Pagination | Eight collections per page |

A new collection is created unpublished in Public mode with an empty description. Cards show the cover, name, description, member count and creation date.

The editor has five tabs: General, Content, Access, SEO and Translations.

## General tab

| Field | Rules |
|---|---|
| Name | Required by the create dialog; maximum 100 characters |
| Description | One-line description, maximum 1,000 characters |
| About | Long description |
| Requirements, audience for, audience not for | List editors |
| Learnings | List editor |
| Card cover, banner | JPG, PNG or JPEG up to 8 MB each |
| Difficulty, duration | Translatable catalogue details |
| Offers certificate | Shared flag, editable in the source locale only |
| Tags | Free-text tag line |

The action row has **Preview**, **Save** and **Publish/Unpublish**. In a translation locale, text and difficulty are written to the translation row; the certificate flag and media remain shared.

## Content tab

The tab has two states driven by the search box.

- **Empty search** lists the collection's current members.
- **Typing** lists organisation resources that can still be added.

| Control | Behaviour |
|---|---|
| Type filter | All types, Course or Podcast |
| Status filter | All statuses, Published or Draft |
| Bulk button | Adds the selected candidates or removes the selected members |
| Row menu | Removes that member from the collection |

The table shows item name, type, price for paid members, and the resource creation date. The following rules are enforced when members change or the collection is published:

| Rule | Effect |
|---|---|
| Private member | A `users_only` course or podcast cannot join a collection |
| Published bundle | Every member of a published collection must itself be published |
| Paid bundle | A paid collection must keep at least one member |
| Paid price | A paid collection requires a positive price |

## Access tab

The mode button cycles Public → Private → Paid and saves immediately. Paid is skipped while the collection has no positive price; prices are set on the **Payments → Offers** page.

| Mode | Roster |
|---|---|
| Public | Users linked to the collection, with add and remove actions |
| Private | User groups linked to the collection |
| Paid | Users with an active entitlement, granted or purchased |

Searching switches the roster to candidates. Bulk actions add or remove the selected users or groups. Revoking a paid entitlement keeps the audit row. Unlike course and podcast editors, collections have no per-tab rights; access to the editor itself is admin-only.

## SEO and translations

The SEO tab mirrors the course SEO form: title and description limits, keywords, canonical URL, Open Graph fields, Twitter card fields, robots toggles and JSON-LD. It requires the Standard plan and is disabled in a translation locale until that locale's General row exists.

The Translations tab lists every supported locale with coverage for name, description, about, learnings, tags, metadata and SEO. Actions are CSV export, CSV import, copy from source when the locale has no row, and delete. Import merges into the existing row and requires a name.

## Checkout snapshot

A paid collection records its members into the order at checkout. Changing the bundle afterwards does not grant buyers access to content added later; it only affects future purchases.

## Related

- [Podcasts](./podcasts.md)
- [Course access control](./courses/access.md)
- HTTP contracts: [Collections API](../06-api-reference/collections.md), [Payments API](../06-api-reference/payments.md)
