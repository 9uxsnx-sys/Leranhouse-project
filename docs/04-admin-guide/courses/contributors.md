> Status: as-built · Last verified: 2026-11-15

# Course Contributors

The Contributors tab manages the people who share the course editor. It is visible only with the `manage_contributors` right. The creator is always listed first and everyone else is kept in the order they were added.

## Toolbar

| Control | Behaviour |
|---|---|
| Search | Searches organisation users by name or email; results replace the contributor table |
| Open / Closed to Contributors | Toggles the course flag `open_to_contributors`; save the course to persist it |
| Remove N | Appears when rows are selected; removes those contributors in one request |

## Adding a contributor

1. Type at least one character in the search box. Up to five matching organisation users are returned.
2. A user who is not yet a contributor shows the role **User**.
3. Open the role menu and choose **Contributor**, **Maintainer** or **Reporter**.
4. The user is added and activated immediately; the table refreshes.
5. Clear the search to return to the full contributor list.

A user who is already a contributor keeps their current role and status in the search results and can be edited in place.

## Roles

| Role | Effect in the editor |
|---|---|
| Creator | Course owner. Pinned first; cannot be changed, deactivated or removed |
| Maintainer | Full course editing, including access, contributors and SEO |
| Contributor | Can edit the course and its content, but cannot open the Access tab |
| Reporter | Read-only access to the course; editing tabs are unavailable |

The UI enforces these through the course rights endpoint. The Creator row is excluded from selection, so bulk removal can never delete the owner.

## Status

Each contributor is **Active** or **Inactive**. Clicking the status text toggles it, except for the Creator. Inactive contributors keep their role assignment but lose the editor rights that role grants.

## Managing rows

| Column | Content |
|---|---|
| Name | Avatar and full name |
| Username | `@handle` |
| Email | Account email |
| Role | Role text; click to change |
| Status | Active or inactive indicator; click to toggle |
| Added on | Date the user was added, or their platform join date while searching |

Select one or more non-creator rows and use **Remove N** to detach them from the course. Removing a contributor never deletes modules, lessons or other content they created.

## Notes

- The search only covers users in the same organisation.
- Role changes and status changes are saved immediately; there is no separate Save button on this tab.
- The open/closed flag belongs to the course record and is committed with the course save.

## Related

- [Course overview](./overview.md)
- [Access control](./access.md)
- HTTP contracts: [Courses API](../../06-api-reference/courses.md)
