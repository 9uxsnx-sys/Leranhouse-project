> Status: as-built · Last verified: 2026-11-15

# Getting Started as an Admin

This page covers signing in, reading the dashboard, and moving a resource from draft to live.

## Signing in

1. Open the organization's site and choose **Login**.
2. Enter the email and password issued for your account.
3. After authentication you land on the dashboard home at `/dash`.

The dashboard is admin-only. A user needs a role whose **Dashboard → Access** permission is enabled (or superadmin status); otherwise the request is redirected to the organization home.

## Reading the dashboard

The left menu contains Home, Courses, Collections, Communities, Podcasts, Users, Payments, Organization, Notifications and Analytics. Collections, Communities and Podcasts are hidden when the organization has the matching feature disabled.

The Users item expands to Users, User Groups, Roles, Signups and Audit Logs. On narrow screens the sidebar is replaced by a mobile menu.

The top bar shows breadcrumbs, a search button that opens the command palette, the notification bell and a help menu. The command palette searches dashboard destinations and organization content such as courses, users, collections, communities, discussions, playgrounds and podcasts.

## Dashboard home

The home page shows a welcome heading, a date-range selector (`7d`, `30d`, `90d`), and a course filter. Below them:

| Block | Content |
|---|---|
| Course enrollment trend | Full-width chart for the selected range and course |
| Recent payments | Latest orders with learner, resource, amount, status and date |
| Completion funnel | Course completion stages |
| Learner progress | Progress distribution for the selected course |

The same charts are available with more detail under **Analytics → Courses**.

## Creating and publishing a course

1. Open **Courses** and press **+ New Course**. The create flow asks for the course type before opening the editor.
2. Fill the **General** tab: name, description, about, learnings, requirements, audience, media and people.
3. Add modules and lessons in the **Content** tab.
4. On the **Access** tab choose `public`, `users_only` or `paid`. `users_only` links user groups; `paid` requires a price greater than zero, which is set in **Payments → Offers**.
5. Press the publish control in the editor header. The same control unpublishes the course.

New resources start unpublished. An unpublished resource is not shown to learners.

## The access model

| State | Effect |
|---|---|
| `published` | The resource is served according to its access mode |
| draft (unpublished) | Visible only in the dashboard |
| `public` | Anyone can open the resource and start it |
| `users_only` | Only members of a linked user group can open it |
| `paid` | The product page is public; the content requires a paid entitlement |

The same model applies to podcasts and collections.

## Where common tasks live

| Task | Location |
|---|---|
| Change prices | Payments → Offers |
| Review orders | Payments → Transactions |
| Configure Chargily | Payments → Configuration |
| Monthly teacher payouts | Payments → Payouts |
| Invite or remove members | Users → Users / Signups |
| Group-based visibility | Users → User Groups, then the resource Access tab |
| Custom permissions | Users → Roles |
| Organization identity and language | Organization → General |
| Search metadata | Organization → SEO |

## Related

- [Users](./users.md), [Roles](./roles.md), [User Groups](./user-groups.md)
- [Payments](./payments.md) and the [API reference](../06-api-reference/payments.md)
- [Developer guide](../05-developer-guide/README.md)
