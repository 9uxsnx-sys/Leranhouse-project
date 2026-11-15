# Feature Flags

> Control which features are available in your Koodook organization by toggling feature flags on or off, enabling gradual rollouts, and managing beta features.

## Overview

Feature flags allow you to enable or disable specific functionality per organization without deploying code changes. This gives you fine-grained control over the user experience and lets you test new features before rolling them out broadly.

Access feature flags at **Admin Panel → Organization Settings → Features**.

## Toggle Features On/Off Per Organization

Each feature flag has a simple **On/Off** toggle. When a feature is:

- **Enabled (On)** — The feature is visible and usable by all users in your organization (subject to any rollout percentage settings).
- **Disabled (Off)** — The feature is completely hidden from all users. Its UI elements, routes, and API endpoints are not accessible.

### How Toggling Works

- Changes take effect **immediately** — no deployment or restart is required.
- When you disable a feature that was previously enabled:
  - Users currently using the feature may see an error or a "feature unavailable" message on their next action.
  - Data associated with the feature (e.g., quiz results if quizzes are disabled) is **not deleted**. Re-enabling the feature restores access to the data.
- Disabling a feature hides it from the UI but does not necessarily remove API access. API tokens with appropriate scopes may still be able to access the feature programmatically.

## Available Feature Flags

| Flag                      | Default | Description                                                      |
|---------------------------|---------|------------------------------------------------------------------|
| `course_reviews`          | On      | Allow students to leave reviews and ratings on courses           |
| `discussions`             | On      | Course-level discussion forums                                   |
| `quizzes`                 | On      | Built-in quiz and assessment engine                              |
| `certificates`            | On      | Generate and issue completion certificates                       |
| `payment_system`          | On      | Payment processing via Chargily Pay (EDAHABIA/CIB)               |
| `dark_mode`               | Off     | Allow users to switch to a dark theme                            |
| `blog`                    | Off     | Built-in blog/content publishing module                          |
| `live_classes`            | Off     | Real-time video conferencing integration                         |
| `analytics_dashboard`     | On      | Advanced analytics and reporting dashboard                       |
| `api_access`              | On      | Public API access for integrations and automation                |
| `sso`                     | Off     | Single Sign-On providers (Google, GitHub, etc.)                  |
| `landing_page_builder`    | On      | Drag-and-drop landing page builder                               |
| `waitlist`                | Off     | Pre-launch waitlist and email capture                            |
| `coupons`                 | On      | Discount coupon and promotion system                             |
| `bulk_enrollment`         | Off     | CSV-based bulk user enrollment                                   |

## Gradual Rollouts

For certain features, you can perform a **gradual rollout** by specifying a percentage of users who should see the feature.

### How Gradual Rollouts Work

1. Enable the feature flag.
2. Set the **Rollout Percentage** (0–100%).
3. Users are deterministically assigned based on a hash of their user ID — a user who sees the feature will consistently see it across sessions.

### Use Cases

- **Beta testing** — Roll out a new feature to 10% of users first to gather feedback.
- **Performance testing** — Gradually increase load on new infrastructure.
- **A/B testing** — Compare engagement metrics between enabled and disabled groups.

### Limitations

- Not all features support gradual rollouts. Features that affect core platform functionality (e.g., payment system, SSO) are always either fully on or fully off.
- The rollout percentage applies **per organization**, not globally across the Learnhouse instance.

## Beta Features

Beta features are experimental capabilities that are still in active development. They are marked with a **Beta** badge in the feature flags list.

### How Beta Features Work

- Beta features are **opt-in** — they are disabled by default even if the feature flag exists.
- When you enable a beta feature, you acknowledge that:
  - The feature may have **bugs or incomplete functionality**.
  - The UI and API may **change without notice**.
  - The feature may be **removed** if it does not meet quality standards.
- Beta features do **not** have the same performance or reliability guarantees as stable features.

### Current Beta Features

Check the feature flags page for the most up-to-date list of beta features. As of the current release:

- `live_classes` — Real-time video conferencing (Beta)
- `waitlist` — Pre-launch waitlist (Beta)

### Providing Feedback

If you encounter issues with a beta feature, submit feedback via **Admin Panel → Help → Report a Problem** or contact Koodook support directly.

## Impact on User Experience

### Visibility

- When a feature is disabled, all UI elements related to that feature are hidden from all users (students, instructors, and admins).
- Navigation items, buttons, menu entries, and settings pages for disabled features do not appear.

### Data Access

- Disabling a feature does **not** delete any associated data.
- If you disable `discussions`, existing forum posts are preserved in the database but hidden from the UI.
- Re-enabling the feature restores full access to the data.

### Permissions

- Feature flags are **organization-wide** — they apply to all roles (admin, instructor, student) equally.
- Role-based access control (e.g., "instructors can manage quizzes") is handled separately via the **Roles & Permissions** settings, not via feature flags.

### Caching

- Feature flag status is cached for **5 minutes**. After toggling a flag, it may take up to 5 minutes for the change to be reflected for all users.
- You can force a cache clear by clicking **Refresh Status** on the feature flags page.

## Best Practices

- **Enable what you use** — Only enable features that are relevant to your organization. A leaner feature set means less UI clutter and faster page loads.
- **Test before enabling** — For beta features, enable them on a staging/test organization first if available.
- **Communicate changes** — If you disable a feature that users rely on, notify them in advance.
- **Monitor impact** — After enabling or disabling a feature, check the [Audit Logs](./audit-logs.md) and user feedback for any unexpected effects.
- **Review periodically** — Revisit your feature flags every quarter to clean up unused features or adopt newly stable features.

## Related Sections

- [API Access](./api-access.md) — API token scopes for programmatic access to features
- [SSO](./sso.md) — Requires the `sso` feature flag to be enabled
- [Audit Logs](./audit-logs.md) — Track feature flag changes
- [Branding](./branding.md) — Dark mode requires the `dark_mode` feature flag
