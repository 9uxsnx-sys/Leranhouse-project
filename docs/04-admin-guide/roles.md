> Status: as-built · Last verified: 2026-11-15

# Roles

Roles are sets of permissions assigned to organization members. A member's effective permissions are the union of the roles assigned in the Users list.

## Opening the Roles tab

Open **Users → Roles**. Roles are a **Pro** feature. On lower plans the role list stays readable but the **Create** action is locked behind a plan badge. Creating roles additionally requires the organization's `roles` feature to be resolved as enabled.

## Roles list

The toolbar contains a search field, a role count, a **Create** button and a filter menu.

| Element | Behaviour |
|---|---|
| Search | Filters by role name or description |
| Filter | All, System, Custom |
| **Create** | Creates a role named "New Role" with every permission off, then opens it for editing |
| Plan badge | Replaces **Create** when the feature is disabled |

Each role is a card with a shield icon and its name. System roles are dimmed and do not open the editor. System roles are recognised by `role_type = TYPE_GLOBAL`, a `role_global_` UUID prefix, the built-in ids, or the names Admin, Maintainer, Instructor and User.

The card menu offers:

- **View rights** — a read-only modal listing every resource and action, with granted actions highlighted.
- **Delete** — custom roles only; asks for confirmation.

## Editing a role

Selecting a custom role opens the edit view. The action row has a three-state **Save** control (saves, then shows Saved until the form changes again).

| Field | Rule |
|---|---|
| Role name | Required, at least 2 characters |
| Description | Required, at least 10 characters |

## Permissions

Permissions are grouped into collapsible sections. Each section shows a granted/total counter, a select-all/deselect-all control, and one checkbox per action.

| Section | Actions |
|---|---|
| Courses | Create, Read, Read own, Update, Update own, Delete, Delete own |
| Course chapters | Create, Read, Update, Delete |
| Activities | Create, Read, Update, Delete |
| Users | Create, Read, Update, Delete |
| User groups | Create, Read, Update, Delete |
| Roles | Create, Read, Update, Delete |
| Communities | Create, Read, Update, Delete |
| Discussions | Create, Read, Read own, Update, Update own, Delete, Delete own |
| Podcasts | Create, Read, Read own, Update, Update own, Delete, Delete own |
| Dashboard | Access |
| Organizations | Create, Read, Update, Delete |

**Dashboard → Access** is what allows a member to enter the admin dashboard; without it they are redirected to the organization home.

## Assigning roles

Roles are assigned per member from **Users → Users**: open the Role dropdown in the row and pick a role. The change saves immediately and the table refreshes.

## Related

- [Users](./users.md) — role assignment and member removal.
- [User Groups](./user-groups.md) — group-based visibility.
- [Roles API](../06-api-reference/roles.md) and [Developer guide](../05-developer-guide/README.md).
