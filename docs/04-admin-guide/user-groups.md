> Status: as-built · Last verified: 2026-11-15

# User Groups

User groups are named sets of organization members. They are the mechanism behind `users_only` resources: a member of a linked group can see the resource, everyone else cannot.

## Opening User Groups

Open **Users → User Groups**. The page requires the **Standard** plan; otherwise the plan-restricted view is shown.

## Group list

The toolbar contains a search field, a group counter, **Create Group**, **Select** and a sort toggle.

| Control | Behaviour |
|---|---|
| Search | Matches group name or description |
| **Create Group** | Creates a group named "New User Group" with an empty description |
| **Select** | Switches cards to checkboxes for selecting several groups |
| Sort | Toggles ascending / descending by name |

Each group is a card with a people icon and the group name. Its `⋮` menu offers **Edit** and **Delete**; deletion asks for confirmation and removes the group, not its members.

## Editing a group

Selecting **Edit** opens the group form.

| Field | Notes |
|---|---|
| Name | Required |
| Description | Optional |

Press **Save** in the action row. The button shows a saved state until the form changes again.

## Managing members

Clicking a group card (outside Select mode) opens its member view.

| Element | Behaviour |
|---|---|
| Search field | Empty: the table lists current group members. Typing: the table lists matching members who are **not** in the group yet, so they can be added |
| Action button | **Remove N** while browsing members, **Add N** while searching |
| Filter | Status: all, verified, unverified |
| Sort | Name A–Z or Z–A |
| Pagination | 25 members per page |
| `…` action | Opens the member detail card (identity, status, joined, last login) |

Select rows with the checkboxes before pressing **Add** or **Remove**. Both actions refresh the member table.

## Gating resources with groups

On a course, podcast or collection, open the **Access** tab and switch the mode to `users_only`. The tab then lists the organization's user groups; link the ones that should see the resource and unlink the rest.

Members of a linked group see the `users_only` resource in catalogues and can open it. Members outside every linked group do not see it, and direct access is denied. Removing a member from a group removes that visibility on the member's next request.

## Related

- [Roles](./roles.md) — dashboard and API permissions.
- [Users](./users.md) — individual role assignment.
- [User groups API](../06-api-reference/usergroups.md) and [Courses API](../06-api-reference/courses.md).
