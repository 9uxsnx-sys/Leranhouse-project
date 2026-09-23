# User Groups

> Organize users into groups for streamlined course access control, bulk enrollment, and group-based pricing or discounts.

## What User Groups Are and Why They're Useful

A **user group** is a named collection of platform users. Groups let you manage multiple users as a single unit rather than individually. Common use cases include:

- **Cohorts** — Group students by academic year, semester, or batch.
- **Departments** — Organize users by department (e.g., Engineering, Marketing, HR).
- **Corporate clients** — Treat all employees of a client company as one group for billing and access.
- **Discount segments** — Apply special pricing to specific user categories (e.g., alumni, early adopters).
- **Course access** — Grant or restrict course access to entire groups at once.

Groups are flexible — a user can belong to multiple groups simultaneously.

## Creating a New Group

1. Go to **Admin Dashboard → User Groups** from the sidebar.
2. Click **Create Group**.
3. Fill in the group details:
   - **Group Name** — A descriptive name (e.g., "2026 Spring Cohort", "Acme Corp Employees").
   - **Description** — Optional internal note about the group's purpose.
   - **Group Code** — An optional short code (e.g., "SPRING26") that can be shared with users for self-joining.
4. Click **Create**.

The group appears in the groups list with a count of current members. You can edit the name and description at any time.

## Adding/Removing Users from Groups

### Adding Users

**Method 1: From the group page**
1. Open the group from the User Groups list.
2. Click **Add Members**.
3. Search for users by name or email, or paste a list of email addresses.
4. Select the users and click **Add**.

**Method 2: From the Users page**
1. Go to **Admin Dashboard → Users**.
2. Select users using the checkboxes.
3. Choose **Add to Group** from the bulk actions dropdown.
4. Select the target group and confirm.

**Method 3: Self-join via group code**
1. Share the group code with users (e.g., via email or a link).
2. Users enter the code on their **Account → Join Group** page.
3. They are automatically added to the group.

### Removing Users

1. Open the group's detail page.
2. Find the user in the member list and click **Remove**.
3. Confirm the removal. The user's existing course enrollments are **not** affected — they lose access only to courses that are gated by this group.

### Bulk Import

For large groups (100+ users), use the **Import CSV** feature:

1. On the group page, click **Import CSV**.
2. Download the template CSV file.
3. Fill in one email address per row.
4. Upload the completed file. The system processes the import and shows a summary of added and skipped (e.g., unknown email) users.

## Using Groups for Course Access Control

Groups can gate access to courses in two ways:

### Enrollment-based access
1. Go to the course's **Settings → Access** tab.
2. Under **Enrollment Restrictions**, select **Allow only users from specific groups**.
3. Choose the groups that should have access.
4. Save changes.

Users who are not members of any selected group cannot enroll in the course — the enroll button is hidden and API enrollment requests are rejected.

### Automatic enrollment
1. On the same settings page, enable **Auto-enroll group members**.
2. Any user added to the selected group is automatically enrolled in the course.
3. When a user is removed from the group, they can be **optionally unenrolled** (configure this toggle).

This is especially useful for mandatory training or corporate onboarding programs.

## Group-Based Pricing or Discounts

Groups can override the standard course price for their members:

1. Go to **Admin Dashboard → User Groups** and open the group.
2. Click the **Pricing** tab.
3. Click **Add Discount**.
4. Configure:
   - **Discount Type** — Percentage (%) or Fixed amount (DZD).
   - **Value** — The discount value (e.g., 20 for 20%, or 500 for 500 DZD off).
   - **Valid Until** — Optional expiration date.
   - **Scope** — Apply to all courses or select specific courses.
5. Click **Save**.

When a group member views a course, the discounted price is displayed instead of the standard price. If the user belongs to multiple groups with different discounts, the **highest discount** applies.

**Important notes:**
- Group discounts do not stack. Only the best discount is applied.
- Discounts are applied at checkout automatically — no coupon code is needed.
- You can override group pricing for individual users via manual enrollment.

## Managing Group Membership

### Viewing membership
The group detail page shows a searchable, sortable table of all members with columns for name, email, role, and join date.

### Assigning a group manager
Group managers can add/remove members and view the group roster but cannot edit pricing or delete the group:
1. On the group detail page, click **Managers**.
2. Search for and select the user to promote.
3. Click **Assign Manager**.

### Transferring members
To move all members from one group to another:
1. Go to the source group's settings.
2. Click **Transfer Members**.
3. Select the destination group.
4. Choose whether to delete the source group after transfer.
5. Confirm.

### Deleting a group
1. Open the group's settings.
2. Click **Delete Group**.
3. Confirm deletion. Users are **not** deleted — they simply lose group membership. Course access controlled by this group is revoked.
