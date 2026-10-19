# Collections

> Course bundles on Koodook.

---

Collections group multiple courses and podcasts together into a bundle that can be free, private, or sold as a single purchase. This is useful for:

- Learning paths (e.g., "Web Development Fundamentals")
- Course series (e.g., "Python 101, 102, 103")
- Thematic bundles (e.g., "Data Science Toolkit")

A collection has the same editorial surface as a course: cover image, banner, title, description, "what you'll learn" items, and tags.

## Browsing Collections

The **Collections** page lists every bundle the learner can see, with search and pagination. Each card shows the bundle's own cover when set, otherwise the cover of its first course.

Selecting a card opens the collection page:

- Banner, title, description, and tags
- `N items · M lessons · K episodes` plus an ownership badge when the learner owns the bundle
- **What you'll learn** and **About this collection**
- **What is included**: every member course and podcast as a standard card (podcasts show their episode count)
- Sidebar with the bundle price and a **Get access** button

## Buying a Bundle

For a paid bundle, **Get access** starts a normal Chargily checkout for the collection. After payment is confirmed:

- Every course in the bundle is added to the learner's **Progress** page, exactly as if each course had been bought individually.
- Every podcast in the bundle is unlocked in place; podcasts do not appear on the Progress page.
- The bundle records a single order; content is owned per resource.
- Courses that were already owned are not duplicated.
- Courses and podcasts added to the bundle later are **not** granted retroactively; members removed later remain owned.

There are no refunds on the platform; access is revoked manually from the dashboard when needed.

## Managing Collections (Dashboard)

Open **Dashboard → Collections**. The listing supports search, creation, editing and deletion.

Selecting a collection opens an editor with four tabs.

### General

Name, description, about, "what you'll learn" items, cover image, banner, and tags. Changes are saved with the action row at the top of the page.

### Content

A table of the items in the bundle with access, price, lesson or episode count and date added. Use **Add item** to open the picker (courses and podcasts) and the row menu to remove an item.

Rules enforced here:

- Private (`users_only`) courses and podcasts can never be added to a bundle.
- A **published** bundle only accepts published items.
- A paid bundle must keep at least one item.

### Access

Choose the same three modes as a course:

| Mode | Meaning |
|---|---|
| **Public** | Anyone can browse the bundle and its courses |
| **Private** | Only members of linked UserGroups can see it |
| **Paid** | Anyone can browse the bundle; buying it unlocks every member course |

For **Paid**, set a positive DZD price and grant or revoke access per user in the roster below the price card. For **Private**, link and unlink UserGroups. The publish toggle in the toolbar hides the bundle from learners while keeping it editable.

Unpublishing a course that belongs to a published bundle is blocked, and a member course cannot be switched to private, so a live bundle always matches what it advertises.

### SEO

The same fields as a course: meta title, description and keywords, Open Graph, Twitter Card, robots directives, and structured data. Validation mirrors the course SEO tab, and the action row only enables **Save** when something changed.

Deleting a bundle removes its uploaded media. Learners who already bought it keep access to the courses they were granted.
