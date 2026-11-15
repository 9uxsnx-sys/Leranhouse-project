> Status: as-built · Last verified: 2026-11-15

# Collections

Collections are bundles of courses and podcasts sold or shared as one package.

## Collection catalogue

Open **Collections** from the side menu.

| Control | Behaviour |
|---|---|
| Search | Matches collection name or description |
| Filter | All collections, My bundles (when you own at least one), Public, Private, Paid |
| Pagination | Eight collections per page |

Each card shows the collection cover, name, description and member count. Collections you already claimed or bought carry an **Owned** badge.

## Collection page

| Section | Content |
|---|---|
| Banner | Collection banner, falling back to the thumbnail |
| Header | Name, description and badges for item count, duration, difficulty, lessons, episodes and ownership |
| What you'll learn | Learning items authored for the bundle |
| Who this is for | "For you" and "not for you" lists |
| About | Long description |
| What's included | Every member course and podcast as a numbered card |
| Requirements | Prerequisites, when authored |

The first item in **What's included** is labelled **Start here**. Podcast members show their episode count; course members link to the course page.

## Sidebar

| Card | Content |
|---|---|
| Access | Price and **Get access** when not owned; **Go to courses** or **Start learning** when owned |
| This bundle includes | Item count, lessons, episodes, total duration and a certificate line |
| Community | Short community description |
| Updates | Last update date |

When an owned bundle contains courses, the action sends you to your Progress page. A podcast-only bundle has no Progress entries, so its action scrolls to the included list instead.

## Getting a collection

| Mode | Behaviour |
|---|---|
| `public` | **Get access** claims the bundle. You must be signed in; a toast confirms the claim and the sidebar switches to the owned state |
| `users_only` | Visible only to members of a linked user group |
| `paid` | The price is shown in DZD; **Get access** opens Chargily checkout for the collection |

After a paid purchase, the bundle is owned and its course members appear in your Progress page. Podcast members unlock in place.

## Related

- [Courses](./courses.md) and [Podcasts](./podcasts.md) — the items inside a bundle.
- [Store](./store.md) — paid bundles alongside paid courses and podcasts.
- [Collections API](../06-api-reference/collections.md) and [Developer guide](../05-developer-guide/README.md).
