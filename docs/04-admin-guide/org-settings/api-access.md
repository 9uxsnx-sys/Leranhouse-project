# API Access

> Manage API tokens for integrating your Koodook organization with external tools, building custom automations, and enabling programmatic access to your platform data.

## Overview

The API Access settings let you generate and manage API tokens that allow external applications, scripts, and services to interact with the Koodook platform programmatically. The Koodook API follows RESTful conventions and returns JSON responses.

Access this page at **Admin Panel → Organization Settings → API Access**.

## Generating API Tokens

### Creating a New Token

1. Click **Generate New Token**.
2. Provide a **Token Name** — a human-readable label that helps you identify the token's purpose (e.g., "Zapier Integration", "Student Sync Script", "Mobile App Backend").
3. Select the **Permissions (Scopes)** for the token (see below).
4. Optionally, set an **Expiration Date**.
5. Click **Generate**.
6. **Copy the token immediately** — it is shown only once. If you lose it, you must revoke it and generate a new one.

### Token Format

- Tokens are prefixed with `kdk_` (e.g., `kdk_live_xxxxxxxxxxxx...`).
- The prefix indicates the environment: `kdk_live_` for production, `kdk_test_` for test/sandbox mode.
- Tokens are **128 characters** long.
- Store tokens securely (e.g., environment variables, a secrets manager). Never commit them to version control.

## Token Permissions / Scopes

When generating a token, you assign one or more **scopes** that define what the token can do. Scopes follow a granular, least-privilege model.

### Available Scopes

| Scope                     | Access Level | Description                                      |
|---------------------------|--------------|--------------------------------------------------|
| `courses:read`            | Read         | List and view courses and their content          |
| `courses:write`           | Read/Write   | Create, update, and delete courses               |
| `users:read`              | Read         | List and view user profiles and enrollments      |
| `users:write`             | Read/Write   | Create, update, and manage user accounts         |
| `enrollments:read`        | Read         | View enrollment records                          |
| `enrollments:write`       | Read/Write   | Enroll and unenroll users                        |
| `payments:read`           | Read         | View payment transactions and invoices           |
| `payments:write`          | Read/Write   | Process refunds, manage payment plans            |
| `content:read`            | Read         | Read course content, files, and media            |
| `content:write`           | Read/Write   | Upload and manage content and media files        |
| `analytics:read`          | Read         | Access analytics and reporting data              |
| `organization:read`       | Read         | View organization settings                       |
| `organization:write`      | Read/Write   | Update organization settings                     |
| `discussions:read`        | Read         | Read forum posts and comments                    |
| `discussions:write`       | Read/Write   | Create and moderate forum posts                  |
| `notifications:send`      | Write        | Send system notifications to users               |
| `webhooks:manage`         | Read/Write   | Manage webhook subscriptions                     |

### Best Practices for Scopes

- **Minimum necessary** — Only grant the scopes required for the task. A read-only integration does not need write scopes.
- **Separate tokens** — Use different tokens for different integrations. If one integration is compromised, revoke only that token.
- **Review regularly** — Audit your tokens and their scopes quarterly.

## Token Expiration and Rotation

### Expiration

- Tokens can be set with a **custom expiration date** (maximum: 1 year from creation).
- If no expiration is set, the token does **not expire** but can be manually revoked.
- Tokens that are about to expire (within 30 days) are highlighted in the token list with a warning badge.
- Expired tokens are automatically **revoked** and cannot be used. You must generate a new token.

### Rotation Policy

For security best practices, rotate tokens regularly:

1. Generate a new token with the same scopes.
2. Update your integration to use the new token.
3. Verify the integration works with the new token.
4. Revoke the old token.

A **30-day rotation cycle** is recommended for production integrations.

## Revoking Tokens

### Manual Revocation

1. On the API Access page, find the token in the list.
2. Click the **Revoke** button next to the token.
3. Confirm the revocation in the dialog.
4. The token is immediately invalidated. Any API request using this token will receive a `401 Unauthorized` response.

### Automatic Revocation

Tokens are automatically revoked when:

- The token's expiration date is reached.
- The organization's API access feature flag is disabled (see [Feature Flags](./features.md)).
- The organization is suspended or deleted.

### What Happens After Revocation

- The token is removed from the list and cannot be re-enabled.
- Active integrations using the token will stop working immediately.
- Affected users/applications receive `401 Unauthorized` errors until they update their credentials.

## Rate Limits

The Koodook API enforces rate limits to ensure fair usage and platform stability.

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

| Use Case                        | Required Scopes                          | Description                                      |
|---------------------------------|------------------------------------------|--------------------------------------------------|
| Sync student roster from HR system | `users:read`, `users:write`, `enrollments:write` | Automatically enroll new employees in courses |
| Build a mobile app              | `courses:read`, `content:read`, `users:read` | Display course catalogue and user progress      |
| Export analytics to external BI tool | `analytics:read`                     | Pull enrollment and revenue data into your BI   |
| Automated course backup         | `courses:read`, `content:read`           | Backup course content to external storage        |
| Webhook-driven Slack alerts     | `webhooks:manage`, `payments:read`       | Notify a Slack channel on new payments           |
| Custom registration flow        | `users:write`, `enrollments:write`       | Build a custom signup flow on your own website   |

## API Documentation

For complete API reference documentation, including endpoints, request/response formats, and examples, see the [Koodook API Reference](../../06-api-reference/README.md).

### Quick Start

```bash
# List all courses
curl -H "Authorization: Bearer kdk_live_xxxxxxxxxxxx..." \
     https://api.learnhouse.app/v1/courses

# Create a new user
curl -X POST \
     -H "Authorization: Bearer kdk_live_xxxxxxxxxxxx..." \
     -H "Content-Type: application/json" \
     -d '{"email": "student@example.com", "name": "John Doe"}' \
     https://api.learnhouse.app/v1/users
```

## Related Sections

- [Feature Flags](./features.md) — The `api_access` feature flag must be enabled for API tokens to work
- [Audit Logs](./audit-logs.md) — Track API token creation, usage, and revocation
- [SSO](./sso.md) — API tokens for SSO integration setup
