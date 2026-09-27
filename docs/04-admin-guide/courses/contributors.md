# Course Contributors

> Managing co-authors and instructors who collaborate on course creation.

---

## Overview

The **Contributors** tab lets you add users as co-authors or instructors on your course. Unlike the old modal-based flow, the new design uses a **table-driven approach** — search results appear directly in the table, and you add contributors by assigning them a role.

---

## Toolbar

At the top of the tab:

```
[Search by users...]                    [Open to Contributors] [Remove N] [⇅]
```

| Element | Description |
|---------|-------------|
| **Search bar** | Type a name or email to find users from your organization. Results appear in the table below. |
| **Open / Closed toggle** | Toggles whether the course is open to new contributor applications. Shows a green (open) or red (closed) square indicator. |
| **Remove button** | Appears only when one or more contributors are selected via checkboxes. Removes them from the course. |
| **Sort button** | Opens a dropdown to sort contributors by Name A-Z, Name Z-A, Newest first, or Oldest first. |

---

## Adding a Contributor

1. Type a name or email in the **search bar**
2. Matching users from your organization appear in the table
3. Find the user you want — if they are not already a contributor, their role column shows **"User"**
4. Click the **role text** and select a role from the dropdown (Contributor, Maintainer, or Reporter)
5. The user is instantly added as a contributor with that role and **Active** status

```
┌──────────────────────────────────────────────────────────────┐
│  [Search by users... Sara]          [Open to Contributors] [⇅] │
├──────────────────────────────────────────────────────────────┤
│  ☐  Name           Username      Email               Role   │
│  ☐  Sara Meftah   @sara        sara@...            User ▼  │
│  ☐  Ali Khelil    @ali         ali@...        Maintainer   │
└──────────────────────────────────────────────────────────────┘
```

> **Note:** If the searched user is already a contributor, their current role and status are shown and can be changed directly.

---

## Roles

Each contributor has one of these roles:

| Role | Description |
|------|-------------|
| **Creator** | The course owner. Locked — cannot be changed or removed. Always shown at the top of the table. |
| **Maintainer** | Full control over course content and settings (access, pricing, certification, SEO). Cannot add/remove contributors. |
| **Contributor** | Can create, edit, and delete modules and lessons. Cannot change course settings. |
| **Reporter** | Read-only access to course content and analytics. Cannot make changes. |

### Permission Matrix

| Action | Creator | Maintainer | Contributor | Reporter |
|--------|---------|------------|-------------|----------|
| Edit modules & lessons | ✅ | ✅ | ✅ | ❌ |
| Change General settings | ✅ | ✅ | ❌ | ❌ |
| Configure Access & pricing | ✅ | ✅ | ❌ | ❌ |
| Configure Certification | ✅ | ✅ | ❌ | ❌ |
| Edit SEO settings | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ |
| Add/remove contributors | ✅ | ❌ | ❌ | ❌ |
| Publish/unpublish course | ✅ | ✅ | ❌ | ❌ |
| Delete course | ✅ | ❌ | ❌ | ❌ |

---

## Managing Contributors

### Changing a Role

1. Click the **role text** in the table (e.g., "Contributor", "Maintainer")
2. Select the new role from the dropdown
3. The change is saved immediately

> The **Creator** role is locked and cannot be changed.

### Toggling Status

- **Active** — the contributor has full access based on their role
- **Inactive** — the contributor's access is revoked

Click the status text (green "Active" or red "Inactive") to toggle between the two. Creator status is locked.

### Removing Contributors

1. Select one or more contributors using the checkboxes on the left
2. Click the **Remove N** button that appears in the toolbar
3. The selected users are removed from the course and become learners again

> Removing a contributor does **not** delete their content. All modules and lessons they created remain in the course.

---

## Table Columns

| Column | Description |
|--------|-------------|
| **Name** | Avatar + full name. Long names are truncated with "...". |
| **Username** | @username handle. |
| **Email** | User's email address. |
| **Role** | Clickable text with dropdown to change role. |
| **Status** | Clickable Active/Inactive toggle with green/red square indicator. |
| **Added on** | Date the user was added as a contributor (or platform join date for new users). |

---

## Search Behavior

- Search results appear **directly in the table**, replacing the contributor list
- Users who are already contributors show their current role and status
- Users who are **not** contributors show "User" as their role — click it to add them
- Clearing the search bar returns the table to showing all contributors

---

## Collaboration Workflow

```
Course Creator (You)
    │
    ├── Creates the course, sets access & pricing
    │
    ├── Adds Sara as Contributor
    │     └── Sara builds lessons, adds knowledge checks
    │
    ├── Adds Ali as Maintainer
    │     └── Ali reviews content, adjusts SEO settings
    │
    └── Creator reviews final course, publishes it
```

### Best Practices

- **Use Contributor role** for content creators who only need to build lessons
- **Use Maintainer role** for trusted team members who need to configure settings
- **Use Reporter role** for stakeholders who only need read-only access
- **Keep the Creator role** to a single person to avoid ownership conflicts
- **Remove inactive contributors** to keep the list clean

### Concurrent Editing

Multiple contributors can edit the same course simultaneously. Each editor works on their own session. The auto-save feature (600ms debounce) ensures changes are persisted. If two people edit the same lesson at the same time, the last save wins.

---

## UI Pattern

```
┌──────────────────────────────────────────────────────┐
│  [Search...]            [Open] [Remove] [⇅]          │
├──────────────────────────────────────────────────────┤
│  ┌─────────────── Table ──────────────────────────┐  │
│  │  ☐  Name    Username   Email      Role  Status  │  │
│  │  ☐  ...     ...        ...        ...   ...     │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- Table has rounded corners, gray header row, white rows
- Fixed column widths prevent layout shifts
- Checkboxes for bulk selection (hidden during search)
- Creator always pinned at the top
