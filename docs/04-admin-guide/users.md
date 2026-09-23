# User Management

> Manage all platform users — view, search, invite, suspend, and track activity from a single interface.

## Viewing All Platform Users

The **Users** section in the admin dashboard displays a complete list of every registered user on the Koodook platform.

1. Navigate to **Admin Dashboard → Users** from the sidebar.
2. The default view shows a paginated table with the following columns:
   - **Name** — Full name of the user.
   - **Email** — Email address used to register.
   - **Role** — Assigned platform role (e.g., Learner, Instructor, Admin).
   - **Status** — Active, Suspended, or Pending.
   - **Joined** — Date the user registered.
   - **Last Active** — Date of last login or activity.
3. Click any column header to sort ascending or descending.
4. Adjust the page size using the dropdown at the bottom of the table (default: 25, up to 100).

## Searching and Filtering Users

The platform provides several tools to quickly find specific users:

**Search bar** — Type a name or email address to perform a real-time search across all users. Results narrow as you type.

**Filters** — Use the filter panel to refine the list:
- **Role** — Filter by one or more roles (Learner, Instructor, Course Creator, Org Admin, Super Admin).
- **Status** — Show only Active, Suspended, or Pending users.
- **Group** — Filter users who belong to a specific user group.
- **Registration Date** — Select a date range to show users who joined within that period.
- **Last Active** — Find users who have (or haven't) been active since a certain date.

Combine multiple filters for precise queries (e.g., "all active Learners who joined in the last 30 days").

## User Details and Profiles

Click any user's name or the **View** action to open their detail page, which contains:

**Profile Information**
- Name, email, avatar, timezone, and preferred language.
- Registration date and last active timestamp.
- Account status badge.

**Assigned Roles** — A list of all roles currently assigned to the user, with the option to modify them directly from this page.

**Group Memberships** — Shows all user groups the user belongs to, with quick links to each group's management page.

**Enrolled Courses** — A list of courses the user is enrolled in, including progress percentage, start date, and completion status.

**Order History** — For paid courses, a record of all transactions associated with the user (amount, payment method, date, status).

**Assignment Submissions** — An overview of submitted assignments with grades (if graded).

## Inviting New Users

Invite users to the platform via email so they can create an account without going through public registration.

1. Go to **Admin Dashboard → Users** and click the **Invite User** button.
2. Fill in the form:
   - **Email** — The user's email address (required).
   - **First Name** and **Last Name** — Optional, pre-fills their profile on first login.
   - **Role** — Select an initial role (defaults to Learner).
   - **Groups** — Optionally add the user to one or more groups at invitation time.
   - **Course Enrollments** — Optionally pre-enroll the user in specific courses.
3. Click **Send Invitation**.

The user receives an email with a secure sign-up link. The link expires after 48 hours. You can resend the invitation from the user's detail page if needed.

## Disabling/Suspending Users

Suspending a user prevents them from logging into the platform. Their data (enrollments, submissions, orders) is preserved but inaccessible until the account is reactivated.

**To suspend a user:**
1. Navigate to the user's detail page.
2. Click **Suspend User** in the top-right actions menu.
3. Optionally provide a reason (visible only to admins).
4. Confirm the action.

**Effects of suspension:**
- The user cannot log in. They see a "Your account has been suspended" message.
- Active sessions are terminated immediately.
- The user does not receive notifications.
- Enrolled courses remain assigned but are inaccessible.
- No refunds are automatically issued (process refunds manually via the Payments section if needed).

**To reactivate a user:** Follow the same steps and click **Reactivate User**. The user regains full access.

## User Activity History

The **Activity Log** tab on a user's detail page shows a chronological record of all significant actions:

- **Login/Logout** — Timestamps of authentication events.
- **Course Enrollment/Unenrollment** — When the user joined or left a course.
- **Assignment Submissions** — Each submission with a link to the assignment.
- **Content Access** — Key content pages visited within courses.
- **Order Events** — Purchases, refunds, and payment failures.
- **Profile Changes** — Modifications to name, email, or password.
- **Role Changes** — When an admin assigns or removes a role.

Use the date range filter at the top of the log to narrow down the activity window. Export the activity log as CSV for offline review.

## Bulk Operations

For managing users at scale, the platform supports the following bulk actions:

**Selecting users** — Check the box next to each user in the table, or use the **Select All** checkbox at the top of the column to select all users on the current page.

**Available bulk actions:**

| Action | Description |
|---|---|
| **Assign Role** | Add a role to all selected users (replaces existing roles if "Override" is checked). |
| **Add to Group** | Add all selected users to a chosen user group. |
| **Remove from Group** | Remove all selected users from a chosen group. |
| **Suspend Users** | Suspend all selected accounts at once. |
| **Reactivate Users** | Reactivate all selected suspended accounts. |
| **Send Email** | Send a platform notification email to all selected users. |
| **Export CSV** | Download a CSV file containing selected user data (name, email, role, status, joined date, last active). |

**Confirming bulk actions** — A confirmation dialog displays the number of affected users and a summary of the action. For sensitive actions (suspend, role change), a reason field is required.
