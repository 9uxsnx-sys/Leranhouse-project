> Status: as-built · Last verified: 2026-11-15

# Admin Guide

The admin dashboard is the management surface of an organization: content, people, payments, analytics and settings.

## Dashboard navigation

The left menu is filtered by the signed-in role. Communities and Podcasts appear when the organization enables them; Collections stays visible unless it is explicitly disabled.

| Menu item | Purpose |
|---|---|
| **Home** | Welcome, course activity charts, recent payments |
| **Courses** | Course listing and editors |
| **Collections** | Bundle listing and editor (when collections are enabled) |
| **Communities** | Community listing (when enabled) |
| **Podcasts** | Podcast listing (when enabled) |
| **Users** | Members, groups, roles, signups, audit logs |
| **Payments** | Revenue, orders, prices, payouts, gateway settings |
| **Organization** | Organization-level settings |
| **Notifications** | Notification management |
| **Analytics** | Learning and audience analytics |

Selecting **Users** expands a sub-navigation: Users, User Groups, Roles, Signups and Audit Logs. The top bar holds breadcrumbs, the dashboard search (command palette), the notification bell and a help menu.

## Access model

Every course, podcast and collection has an `access_type` (`public`, `users_only`, `paid`) and a separate `published` flag.

| Mode | Who can see the resource |
|---|---|
| `public` | Everyone, signed in or not |
| `users_only` | Members of a user group linked to the resource |
| `paid` | The full product page is public; content access requires a paid entitlement |

An unpublished resource is a draft: it stays editable in the dashboard but is not served to learners. Prices are edited only in **Payments → Offers**; the Access tab refuses `paid` while the price is empty or zero.

## Organization settings tabs

| Tab | What it covers |
|---|---|
| **General** | Name, short description, about, default language |
| **Branding** | Logo, favicon, logomark, thumbnail, theme colour, auth screens |
| **SEO** | Sitemap and robots links, default meta tags, Open Graph image, verification, indexing |
| **Domains** | Custom domains, verification and SSL status |
| **Automations** | Webhook endpoints and event subscriptions |
| **API Access** | Organization API tokens, rights and expiry |

## Payments tabs

Overview, Transactions, Offers, Payouts, Configuration — in that order. See [Payments](./payments.md).

## People and localization

Courses keep their people in `extra_metadata.instructors`; podcasts keep theirs in `extra_metadata.hosts`. Both are edited as repeatable cards with a name, a title and a photo. Translation rows only override the name and title, aligned by position, so the photo and order stay the same in every language.

## Guides

| Guide | Description |
|---|---|
| [Getting started](./getting-started.md) | First login, navigation and publishing |
| [Courses](./courses/overview.md) | Course listing, editor tabs and translations |
| [Podcasts](./podcasts.md) | Podcast listing, episodes, access and distribution |
| [Collections](./collections.md) | Bundles of courses and podcasts |
| [Users](./users.md) | Member list, roles and removal |
| [User Groups](./user-groups.md) | Groups and resource visibility |
| [Roles](./roles.md) | Custom roles and permissions |
| [Analytics](./analytics.md) | Learning, audience and community analytics |
| [Assignments](./assignments.md) | Assignment editor, submissions and analytics |
| [Payments](./payments.md) | Chargily, orders, prices and payouts |
| [General settings](./org-settings/general.md) | Organization identity and language |
| [SEO settings](./org-settings/seo.md) | Search and social metadata |
| [Audit logs](./org-settings/audit-logs.md) | Request audit trail and CSV export |

## Related

- [Developer guide](../05-developer-guide/README.md) — architecture and implementation details.
- [API reference](../06-api-reference/README.md) — HTTP contracts.
