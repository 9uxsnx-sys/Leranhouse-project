# Collections

> Course bundles on Koodook.

---

Collections group multiple courses and podcasts together into a bundle that can be free, private, or sold as a single purchase. This is useful for:

- Learning paths (e.g., "Web Development Fundamentals")
- Course series (e.g., "Python 101, 102, 103")
- Thematic bundles (e.g., "Data Science Toolkit")

A collection has the same editorial surface as a course: cover image, banner, title, description, "what you'll learn" items, and tags.

## Browsing Collections

The **Collections** page lists every bundle the learner can see, with search and pagination. Each card shows the bundle's own cover when set, otherwise the cover of its first course. Bundles the learner already claimed or bought carry an **Owned** badge, and the filter menu gains a **My bundles** option that narrows the grid to their library.

Selecting a card opens the collection page:

- Banner, title, description, and tags
- `N items · M lessons · K episodes` plus an ownership badge when the learner owns the bundle
- **What you'll learn** section
- **Who This Is For** section with check (for you) and cross (not for you) indicators
- **About this collection** section
- **Requirements** section (prerequisites and what you need to get started)
- **What is included**: every member course and podcast as a standard card (podcasts show their episode count). Courses display numbered step badges (1, 2, 3...) as a learning path, with the first card showing a **Start Here** badge
- Sidebar (in order): bundle price and **Get access** button, **This bundle includes** stats card, **Community** card with link to the collection's community, **Updates** card with recent announcements. On a public bundle, pressing **Get access** claims the bundle: the learner is added to the dashboard Access roster and the bundle enters their inventory, with a confirmation toast and the sidebar switching to **Your bundle**. On a paid bundle it starts checkout.

## Buying a Bundle

For a paid bundle, **Get access** starts a normal Chargily checkout for the collection. After payment is confirmed:

- Every course in the bundle is added to the learner's **Progress** page, exactly as if each course had been bought individually.
- Every podcast in the bundle is unlocked in place; podcasts do not appear on the Progress page.
- The bundle records a single order; content is owned per resource.
- Courses that were already owned are not duplicated.
- Courses and podcasts added to the bundle later are **not** granted retroactively; members removed later remain owned.

There are no refunds on the platform; access is revoked manually from the dashboard when needed. In Public mode, removing a learner from the Access roster drops the bundle from their inventory.

## Managing Collections (Dashboard)

Open **Dashboard → Collections**. The listing supports search, creation, editing and deletion.

Selecting a collection opens an editor with five tabs.

### General

Name, description, about, "what you'll learn" items, cover image, banner, and tags. Changes are saved with the action row at the top of the page.

### Content

A table of the bundle's items. By default it lists what is already inside; typing in the search field switches the same table to the organization's courses and podcasts that are **not** in the bundle yet.

- Columns: Resource (type icon + name + Draft tag), Type, Price, Added.
- Select rows, then use **Add N items** while searching or **Remove N items** while browsing. The row menu also removes a single item.
- The filter button narrows by **Type** (Course / Podcast) and **Status** (Published / Draft). Filtering is server-side, so the totals stay correct.
- Footer: `Showing X–Y of Z` with prev/page/next, 10 items per page.

Rules enforced here:

- Private (`users_only`) courses and podcasts can never be added to a bundle.
- A **published** bundle only accepts published items.
- A paid bundle must keep at least one item.

### Access

Identical to the course Access tab.

The toolbar is search → bulk action → mode button → publish toggle.

- The mode button cycles **Public → Private → Paid**. Paid is skipped while the bundle has no price, with a toast pointing to **Payments → Offers**.
- The price is set **only** in Payments → Offers. The Access tab never edits it.
- Bulk actions appear only with a selection: **Add N** while searching, **Remove N** while browsing.
- The row menu offers **Details** (profile, role, status, added/joined/last login) and **Delete**.
- The publish toggle hides the bundle from learners while keeping it editable.

| Mode | Table | Actions |
|---|---|---|
| **Public** | Learners who claimed the bundle (inventory) | Select + add/remove. A learner is added when they press **Get access** on the public bundle page. |
| **Private** | UserGroups linked to the bundle | Select + link/unlink |
| **Paid** | Buyers / granted users (entitlement roster) | Select + grant/revoke |

Removing a learner in Public mode drops the bundle from their inventory; removing access in Paid mode revokes the bundle and every item that purchase granted, while items bought separately stay owned. It is access-only — no refund is issued.

Unpublishing a course that belongs to a published bundle is blocked, and a member course cannot be switched to private, so a live bundle always matches what it advertises.

### SEO

The same fields as a course: meta title, description and keywords, Open Graph, Twitter Card, robots directives, and structured data. Validation mirrors the course SEO tab, and the action row only enables **Save** when something changed.

### Translations

A per-language coverage table (Name, Description, About, Learnings, Tags, SEO) with a status per row: **Source**, **Not started**, **Partial**, **Complete**.

- **Copy from source** seeds a language in one click.
- **Delete** removes a language (two-step confirm); reads fall back to the source.
- **Export/import CSV** hands the text to an external translator (`<collection>.<locale>.csv`, UTF-8 with BOM so Excel opens Arabic correctly).
- Editing itself happens in the General and SEO tabs: the platform language switcher decides which language you write, and the action row shows the language chip plus **Copy from source** when you are in a translation.

Learners see the collection in the language of the interface they chose. Untranslated collections show the source text with an amber note: *"This collection is only available in English."*

Deleting a bundle removes its uploaded media. Learners who already bought it keep access to the courses they were granted.
