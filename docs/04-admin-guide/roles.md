# Roles and Permissions

> Configure role-based access control (RBAC) to define who can view, create, edit, or manage resources across the platform.

## Overview

Koodook uses a **role-based access control (RBAC)** system. Every user is assigned one or more roles, and each role carries a set of permissions. A user's effective permissions are the union of all permissions from all their assigned roles.

## Built-in Roles

The platform ships with five default roles. These roles cannot be deleted, though their permissions can be customized (except Super Admin).

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

## Creating Custom Roles

When the built-in roles don't match your needs, create custom roles with a tailored set of permissions.

1. Go to **Admin Dashboard → Settings → Roles**.
2. Click **Create Custom Role**.
3. Enter:
   - **Role Name** — A unique, descriptive name (e.g., "Content Reviewer", "Sales Manager").
   - **Description** — Optional explanation of the role's purpose.
   - **Base Permissions** — Optionally start from an existing role's permission set (use the "Clone from" dropdown).
4. Click **Create**.

You are then taken to the permission editor to fine-tune what this role can do.

## Configuring Granular Permissions

Permissions are organized into categories. Each category contains individual permissions that can be toggled on or off.

### Permission categories

| Category | Example permissions |
|---|---|
| **Users** | View users, create users, edit users, suspend users, delete users, invite users |
| **Roles** | View roles, create roles, edit roles, assign roles, delete roles |
| **Courses** | Create courses, publish courses, delete courses, view any course, manage enrollment |
| **Content** | Create lessons, edit lessons, delete lessons, upload media, manage quizzes, manage assignments |
| **Groups** | View groups, create groups, edit groups, delete groups, manage members |
| **Analytics** | View dashboard, view user analytics, view revenue analytics, export reports |
| **Payments** | View transactions, process refunds, configure pricing, manage payment gateways |
| **Settings** | View organization settings, edit organization settings, manage branding, manage domains |
| **Certificates** | Issue certificates, revoke certificates, design templates |

Each permission is a simple on/off toggle. Changes take effect immediately for all users with that role.

### Setting permission scopes

Some permissions have a **scope** that controls how broadly they apply:

- **Own** — The user can only act on resources they created or own (e.g., edit only their own courses).
- **Assigned** — The user can act on resources they are explicitly assigned to (e.g., grade students in courses they teach).
- **All** — The user can act on all resources within their organization (e.g., edit any course).

Example: The "Edit courses" permission can be set to:
- **Own** — Course Creator edits only their own courses.
- **All** — Org Admin edits any course in the organization.

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
