> Status: as-built · Last verified: 2026-11-15

# Users

The Users area lists the people who belong to the organization. It has five sub-pages: Users, User Groups, Roles, Signups and Audit Logs.

## Users list

Open **Users → Users**. The page is desktop-only; on a narrow viewport it shows a message asking you to use a larger screen.

The toolbar contains a search field, a bulk **Remove** action, and a filter menu. Search is sent to the server, so it covers the whole member list. The filter menu holds four groups:

| Filter | Options |
|---|---|
| Role | All roles, or one role |
| Status | All, Verified, Unverified |
| Group | All groups, or one user group present in the list |
| Sort | Name A–Z, Name Z–A |

## Table columns

| Column | Notes |
|---|---|
| Name | Avatar and full name |
| Username | Displayed as `@username` |
| Email | Member email address |
| Role | Inline dropdown; choosing a role saves immediately |
| Status | Green dot for verified email, red for unverified |
| Joined | Date the member joined the organization |
| Actions | Opens the member detail card |

Changing a role from the dropdown calls the organization role update endpoint and refreshes the row. It does not require a separate save.

## Member detail card

The `…` action opens a floating card with:

- Avatar, full name, `@username` and email.
- Role and verification status.
- Every user group the member belongs to, with its user count.
- Joined date and last login date.

Press `Esc` or click the backdrop to close it.

## Removing members

Select one or more rows with the checkboxes, then press **Remove N**. The action removes the membership from this organization; it does not delete the user account from the platform. The row disappears after the request succeeds.

## Signups

**Users → Signups** controls how people can join the organization.

| Control | Effect |
|---|---|
| Mode toggle | Switches between open signup and invite-only |
| **Generate invite code** | Creates a new code |
| Copy code | Copies the raw code |
| Copy signup link | Copies the signup URL containing the code |
| Delete | Removes the code after confirmation |

Each code row also shows its type and an expiry date one year after creation. The mode toggle saves immediately; the rest of the page has no Save button.

## Related

- [User Groups](./user-groups.md) — group membership and resource visibility.
- [Roles](./roles.md) — permissions, including dashboard access.
- [Audit logs](./org-settings/audit-logs.md) — request-level audit trail.
- [Users API](../06-api-reference/users.md) and [Organizations API](../06-api-reference/orgs.md).
