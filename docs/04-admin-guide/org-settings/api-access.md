# API Access

> Manage API tokens for integrating your organization with external tools, building custom automations, and enabling programmatic access to your platform data.

## Overview

The API Access settings let you generate and manage API tokens that allow external applications, scripts, and services to interact with the platform programmatically. The API follows RESTful conventions and returns JSON responses.

Access this page at **Organization Settings → API Access**.

## Generating API Tokens

### Creating a New Token

1. Click **Create Token**.
2. Provide a **Token Name** — a human-readable label that helps you identify the token's purpose (e.g., "Zapier Integration", "Student Sync Script", "Mobile App Backend").
3. Select the **Permissions** for the token (see below).
4. Click **Generate**.
5. **Copy the token immediately** — it is shown only once. If you lose it, you must revoke it and generate a new one.

### Token Format

- Tokens are prefixed with `kdk_` (e.g., `kdk_live_xxxxxxxxxxxx...`).
- The prefix indicates the environment: `kdk_live_` for production, `kdk_test_` for test/sandbox mode.
- Tokens are **128 characters** long.
- Store tokens securely (e.g., environment variables, a secrets manager). Never commit them to version control.

## Token Permissions

When creating or editing a token, you assign permissions using one of three presets or a custom combination.

### Permission Presets

| Preset       | Description                                      |
|--------------|--------------------------------------------------|
| **Read Only**  | Read access to all resources                    |
| **Full Access** | Read and write access to all resources        |
| **Custom**     | Granular control over each resource and action |

### Custom Permissions

When **Custom** is selected, you can expand the container and configure permissions per resource using checkboxes:

| Resource      | Create | Read | Update | Delete |
|---------------|--------|------|--------|--------|
| Courses       | [ ]    | [ ]  | [ ]    | [ ]    |
| Users         | [ ]    | [ ]  | [ ]    | [ ]    |
| Enrollments   | [ ]    | [ ]  | [ ]    | [ ]    |
| Payments      | [ ]    | [ ]  | [ ]    | [ ]    |
| Content       | [ ]    | [ ]  | [ ]    | [ ]    |
| Analytics     | [ ]    | [ ]  | [ ]    | [ ]    |
| Organization  | [ ]    | [ ]  | [ ]    | [ ]    |
| Discussions   | [ ]    | [ ]  | [ ]    | [ ]    |
| Notifications | [ ]    | [ ]  | [ ]    | [ ]    |
| Webhooks      | [ ]    | [ ]  | [ ]    | [ ]    |

Custom mode activates automatically when at least one checkbox is checked.

### Best Practices for Permissions

- **Minimum necessary** — Only grant the permissions required for the task. A read-only integration does not need write permissions.
- **Separate tokens** — Use different tokens for different integrations. If one integration is compromised, revoke only that token.
- **Review regularly** — Audit your tokens and their permissions quarterly.

## Managing Tokens

### Viewing Tokens

The token list shows:
- **Token Name** and description
- **Permissions** — the assigned preset or custom permissions
- **Status** — Active or Inactive
- **Created** and **Last Used** timestamps

### Editing a Token

1. Click on a token in the list to open the details view.
2. Update the **Token Name** or **Description**.
3. Change the **Permissions** if needed.
4. Click **Save Changes**.

Editing a token does **not** change the token secret key — existing integrations continue working.

### Regenerating a Token

If the token secret is compromised or lost, click **Regenerate** to create a new secret key. This immediately invalidates the old key.

### Revoking a Token

1. Find the token in the list.
2. Click the **Revoke** button.
3. The token is immediately invalidated. Any API request using this token will receive a `401 Unauthorized` response.

Tokens are automatically revoked when the organization's API access feature flag is disabled or the organization is suspended/deleted.

## API Documentation

The API Access page includes a built-in documentation viewer. Switch between **API** and **Doc** modes using the toggle button:

- **API mode** — Shows the token management interface for creating and managing tokens.
- **Doc mode** — Displays a read-only API reference organized by resource group (Admin, Courses, Activities, etc.). Each group is shown in its own section card. Click any endpoint to expand its details, including parameters, request body schemas, and response schemas.

Use the search bar in the action row to filter endpoints by name.

## Rate Limits

The API enforces rate limits to ensure fair usage and platform stability.

### Limit Details

| Plan              | Requests per Minute | Requests per Hour | Burst Limit      |
|-------------------|---------------------|-------------------|------------------|
| Standard          | 60                  | 3,000             | 10 req/second    |
| Enterprise        | 300                 | 15,000            | 50 req/second    |

- Rate limits are applied **per API token**, not per IP address.
- Requests beyond the limit receive a `429 Too Many Requests` response with a `Retry-After` header indicating when to retry.
- Rate limits reset at the top of each minute/hour window.

### Best Practices for Rate Limits

- Implement **exponential backoff** when you receive a `429` response.
- Cache frequently accessed data (e.g., course lists) to reduce API calls.
- Use **conditional requests** with `If-Modified-Since` or `ETag` headers when polling for updates.

## Use Cases

### Integration Examples

| Use Case                        | Required Permissions                          | Description                                      |
|---------------------------------|-----------------------------------------------|--------------------------------------------------|
| Sync student roster from HR system | Courses: Write, Users: Write, Enrollments: Write | Automatically enroll new employees in courses |
| Build a mobile app              | Courses: Read, Content: Read, Users: Read      | Display course catalogue and user progress      |
| Export analytics to external BI tool | Analytics: Read                             | Pull enrollment and revenue data into your BI   |
| Automated course backup         | Courses: Read, Content: Read                   | Backup course content to external storage        |
| Webhook-driven Slack alerts     | Webhooks: Manage, Payments: Read               | Notify a Slack channel on new payments           |
| Custom registration flow        | Users: Write, Enrollments: Write               | Build a custom signup flow on your own website   |

## Related Sections

- [Feature Flags](./features.md) — The `api_access` feature flag must be enabled for API tokens to work
- [Audit Logs](./audit-logs.md) — Track API token creation, usage, and revocation
