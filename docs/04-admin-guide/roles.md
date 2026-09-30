# Roles and Permissions

> Configure role-based access control (RBAC) to define who can view, create, edit, or manage resources across the platform.

## Overview

Koodook uses a **role-based access control (RBAC)** system. Every user is assigned one or more roles, and each role carries a set of permissions. A user's effective permissions are the union of all permissions from all their assigned roles.

## Roles Management UI

Roles are managed in **Admin Dashboard → Users → Roles** tab. The interface follows the same card-based listing pattern used for user groups and modules.

### List View

The Roles list displays all roles in the organization as individual cards. Each card shows:

- **Shield icon** — Visual identifier for the role.
- **Role name** — The display name of the role.

**System roles** (e.g., Super Admin, Org Admin) are rendered with reduced opacity and are read-only — clicking them does nothing. They are distinguished by their `role_type` in the backend.

#### Action Row

At the top of the list, a toolbar provides:

| Element | Description |
|---|---|
| **Search** | Filters roles by name in real time. |
| **Role count** | Shows the total number of matching roles. |
| **Create button** | Creates a new custom role and immediately opens the edit view. |
| **Filter dropdown** | Filters by All roles, System roles only, or Custom roles only. |

#### Dropdown Menu

Each role card has a `...` (More Vertical) menu with:

- **View Rights** — Opens a modal showing all permissions for that role with green checkmarks for granted permissions and red crosses for denied ones.
- **Delete** (custom roles only) — Opens a confirmation modal. Deletion is permanent and cannot be undone.

### Creating a Role

1. Click the **Create** button in the action row.
2. A new role named "New Role" is created via the API with all permissions set to disabled.
3. The edit view opens immediately so you can configure it.

### Edit View

Clicking a **custom role** card opens the inline edit view. The edit view follows the same layout as the Course General tab, with an action row at the top and form sections in separate cards.

#### Action Row

- **Back to roles** (left) — Returns to the list view.
- **Cancel** (right) — Returns to the list view without saving.
- **Save Role** (right) — Submits the form and saves all changes.

#### Card: Basic Information

| Field | Type | Description |
|---|---|---|
| **Role Name** | Text input | A unique, descriptive name (e.g., "Content Reviewer"). Minimum 2 characters. |
| **Description** | Textarea | Explanation of the role's purpose. Minimum 10 characters. |

#### Card: Predefined Rights

Clickable preset buttons that populate the permissions automatically:

| Preset | Description |
|---|---|
| **Admin** | Full access to all resources. |
| **Course Manager** | Full course management (create, read, update, delete). |
| **Instructor** | Manage courses and users. |
| **Viewer** | Read-only access to courses and users. |
| **Content Creator** | Create and manage courses and chapters. |
| **User Manager** | Manage users and user groups. |
| **Moderator** | Manage courses, activities, and discussions. |
| **Analyst** | Read access to courses, users, and dashboard analytics. |
| **Guest** | Read-only access to courses only. |

Clicking a preset updates all permission checkboxes immediately. You can then fine-tune individual permissions.

#### Card: Permissions

Permissions are organized into categories. Each category has a **Select All / Deselect All** toggle and individual checkboxes for each action.

| Category | Available Actions |
|---|---|
| **Courses** | Create, Read, Read Own, Update, Update Own, Delete, Delete Own |
| **Users** | Create, Read, Update, Delete |
| **User Groups** | Create, Read, Update, Delete |
| **Collections** | Create, Read, Update, Delete |
| **Organizations** | Create, Read, Update, Delete |
| **Course Chapters** | Create, Read, Update, Delete |
| **Activities** | Create, Read, Update, Delete |
| **Roles** | Create, Read, Update, Delete |
| **Dashboard** | Access |

## Built-in Roles

The platform ships with default roles. These roles cannot be deleted, though their permissions can be customized (except Super Admin).

### Super Admin

- **Inherits from:** None (top-level role).
- **Scope:** Full, unrestricted access across the entire platform — all organizations, all courses, all settings.
- **Cannot:** Be modified or have its permissions reduced.
- **Typical use:** Platform owner, technical administrator.

### Org Admin

- **Inherits from:** None.
- **Scope:** Full access within a single organization (tenant).
- **Permissions include:** Manage users, manage courses, view analytics, configure organization settings, manage payments and refunds.
- **Cannot:** Access other organizations, modify platform-level settings (e.g., Chargily credentials, global features), delete the organization.
- **Typical use:** Client organization administrator.

### Course Creator

- **Inherits from:** Instructor permissions.
- **Scope:** Course creation and management.
- **Permissions include:** Create new courses, publish/unpublish courses, manage course content (lessons, quizzes, assignments), manage course contributors, view course analytics.
- **Cannot:** Access other creators' courses unless added as a contributor, manage platform users, access payment settings.
- **Typical use:** Curriculum designer, content author.

### Instructor

- **Inherits from:** Learner permissions.
- **Scope:** Teaching and grading within assigned courses.
- **Permissions include:** View enrolled students, grade assignments and quizzes, post course announcements, manage discussions, view course-level analytics.
- **Cannot:** Create courses, publish content, modify course structure, access payment or user management.
- **Typical use:** Teacher, teaching assistant.

### Learner

- **Inherits from:** None (base role).
- **Scope:** Personal learning within enrolled courses.
- **Permissions include:** Enroll in courses (where allowed), view and complete lessons, submit assignments and quizzes, view own grades, manage own profile.
- **Cannot:** Access admin panels, view other users' data, create or modify content.
- **Typical use:** Student, trainee.

## Role Hierarchy

Roles follow a permission hierarchy where higher-level roles inherit the permissions of lower-level roles:

```
Super Admin
  └── Org Admin
        └── Course Creator
              └── Instructor
                    └── Learner
```

This means a **Course Creator** automatically has all the permissions of an **Instructor** and a **Learner**. An **Org Admin** has everything a Course Creator has, plus organization-wide permissions.

> **Important:** Permission inheritance is additive. Assigning a higher-level role does not remove any permissions. It only adds more.

## Assigning Roles to Users

### Single user
1. Go to the user's detail page (**Admin Dashboard → Users → select user**).
2. In the **Roles** section, click **Assign Role**.
3. Select one or more roles from the dropdown.
4. Click **Save**.

### Bulk assignment
1. Go to **Admin Dashboard → Users**.
2. Select multiple users using checkboxes.
3. Choose **Assign Role** from the bulk actions dropdown.
4. Select the role to assign.
5. Check **Override existing roles** if you want to remove all other roles and keep only the selected one. Leave unchecked to add the role alongside existing ones.
6. Confirm.

### Default role on registration
New users who sign up via public registration are automatically assigned the **Learner** role. You can change this default in **Settings → Registration → Default Role**.

## Permission Inheritance and Override Rules

### How permissions are evaluated

When a user performs an action, the system checks:

1. Does the user have **Super Admin** role? → Always allowed.
2. Collect all permissions from all roles assigned to the user.
3. If **any** role grants the required permission → Allowed.
4. If **no** role grants the required permission → Denied.

### Deny overrides

Custom roles support **deny permissions** for fine-grained restriction:

1. Edit a custom role in the permission editor.
2. Instead of toggling a permission off, toggle the **Deny** switch.
3. A deny permission **always wins** — even if another role grants the permission, the deny takes precedence.

Example: A user has both "Instructor" (which grants grade assignments) and "Content Reviewer" (which denies grade assignments). The deny wins — the user cannot grade assignments.

### Effective permissions viewer

To see exactly what permissions a user has:
1. Go to the user's detail page.
2. Click **View Effective Permissions**.
3. The system displays the full list of permissions with a source annotation showing which role grants (or denies) each one.

This tool is invaluable for troubleshooting access issues.
