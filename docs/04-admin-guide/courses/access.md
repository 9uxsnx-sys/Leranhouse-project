> Status: as-built · Last verified: 2026-11-15

# Course Access Control

The Access tab decides who may open a course once it is published. It is visible only to users with the `manage_access` right; other editors do not see the tab.

## Two independent flags

| Flag | Meaning |
|---|---|
| `published` | Whether the course is live at all |
| `access_type` | Who is entitled once it is live: `public`, `users_only` or `paid` |

An unpublished course is hidden from every catalogue and reachable only by its author, an admin or a maintainer, whatever its access mode. The legacy `public` boolean is kept in sync with `access_type`.

## Access modes

| Mode | Who can open the course |
|---|---|
| Public (`public`) | Anyone, signed in or not, once the course is published |
| Private (`users_only`) | Only members of the user groups linked to the course |
| Paid (`paid`) | Anyone can see the course page and curriculum; lesson content requires an active entitlement or a linked group |

The mode button in the toolbar cycles Public → Private → Paid. Paid is skipped with a toast while the course has no positive price. Set the price on the **Payments → Offers** page; the Access tab never edits prices.

## Toolbar

| Control | Behaviour |
|---|---|
| Search | Filters the current roster, or searches candidates when text is entered |
| Mode button | Cycles the access mode and saves it immediately |
| Publish / Unpublish | Toggles the published flag and saves immediately |
| Bulk button | Adds the selected candidates or removes the selected roster rows |

Changing the mode clears the search and the selection; changing the search also clears the selection.

## Public mode roster

Public mode lists the users who currently have the course in their inventory (enrolments), not everyone who can open it.

- With an empty search the table shows linked users, their account status and the enrolment date.
- Typing searches organisation members who are not linked yet.
- The bulk button reads **Remove N** while browsing the roster and **Add N** while searching.
- Each row's three-dot menu offers **Details** (a user card) and **Delete** (removes the enrolment).

## Private mode roster

Private mode lists the user groups linked to the course.

- With an empty search the table shows linked groups with member count and link date.
- Typing searches groups that are not linked yet; already-linked groups are excluded.
- The bulk button adds or removes the selected groups.
- Each row's three-dot menu unlinks the group.
- If the organisation has no user groups, the empty state links to the user-group settings page.

## Paid mode roster

Paid mode lists users with an active entitlement, whether purchased or granted manually.

| Action | Effect |
|---|---|
| Empty search | Shows entitled users and the date access was granted |
| Typing | Shows organisation members without an entitlement |
| Add N | Grants an entitlement to the selected users |
| Remove N | Revokes the selected entitlements |
| Row menu — Details | Shows role, verification, granted date, join date and last login |
| Row menu — Delete | Revokes that user's entitlement |

Revoking marks the entitlement revoked and keeps the row for audit; the learner loses access immediately. The roster pages through results because the API limits each request to 100 rows.

## Enforcement

| Layer | Check |
|---|---|
| Dashboard | Tabs require the permission returned by the course rights endpoint |
| Database | `published`, `access_type` and `price_amount` on the course |
| API | Read checks evaluate draft state, then access type, then linked groups or entitlement; anonymous reads are limited to published public courses |
| Frontend | Hides inaccessible courses and shows a locked state for paid courses without entitlement |

For the entitlement and checkout contracts, see [Payments API](../../06-api-reference/payments.md) and [Courses API](../../06-api-reference/courses.md).

## Related

- [Course overview](./overview.md)
- [General settings](./general.md)
- [Collections](../collections.md)
