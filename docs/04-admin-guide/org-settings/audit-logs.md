# Audit Logs

> Track all administrative actions and significant events in your Koodook organization with a searchable, filterable, and exportable audit trail for security and compliance.

## Overview

The Audit Logs page provides a chronological record of actions taken within your organization. Every configuration change, user management action, and security event is logged with details about who performed the action, what changed, and when.

Access audit logs at **Admin Panel → Organization Settings → Audit Logs**.

## What Events Are Logged

Audit logs capture events across the following categories:

### Authentication Events

| Event                    | Description                                      |
|--------------------------|--------------------------------------------------|
| `user.login`             | User successfully logged in                      |
| `user.login.failed`      | Failed login attempt (with reason)               |
| `user.logout`            | User logged out                                  |
| `user.sso_login`         | User authenticated via SSO provider              |
| `user.sso_login.failed`  | Failed SSO login attempt                         |
| `user.password_reset`    | Password reset requested or completed            |
| `user.two_factor_enabled`| Two-factor authentication was enabled            |

### User Management Events

| Event                      | Description                                      |
|----------------------------|--------------------------------------------------|
| `user.created`             | New user account created                         |
| `user.updated`             | User profile or role updated                     |
| `user.deleted`             | User account deleted                             |
| `user.suspended`           | User account suspended                           |
| `user.unsuspended`         | User account reinstated                          |
| `user.role_changed`        | User role changed (e.g., student → instructor)   |

### Course Events

| Event                      | Description                                      |
|----------------------------|--------------------------------------------------|
| `course.created`           | New course created                               |
| `course.updated`           | Course details or content updated                |
| `course.deleted`           | Course deleted                                   |
| `course.published`         | Course published to students                     |
| `course.unpublished`       | Course taken offline                             |
| `course.enrollment_added`  | Student enrolled in a course                     |
| `course.enrollment_removed`| Student removed from a course                    |

### Payment Events

| Event                      | Description                                      |
|----------------------------|--------------------------------------------------|
| `payment.completed`        | Payment successfully processed via Chargily Pay  |
| `payment.failed`           | Payment failed (with reason)                     |
| `payment.refunded`         | Payment refunded                                 |
| `payment.method_added`     | New payment method added by user                 |
| `payment.method_removed`   | Payment method removed                           |
| `invoice.generated`        | Invoice created for a transaction                |

### Organization Settings Events

| Event                          | Description                                      |
|--------------------------------|--------------------------------------------------|
| `org.settings_updated`         | General settings changed (name, locale, etc.)    |
| `org.branding_updated`         | Branding/theme settings changed                  |
| `org.domain_added`             | Custom domain added                              |
| `org.domain_removed`           | Custom domain removed                            |
| `org.domain_verified`          | Domain ownership verified                        |
| `org.ssl_provisioned`          | SSL certificate provisioned or renewed           |
| `org.landing_published`        | Landing page published                           |
| `org.feature_flag_toggled`     | Feature flag enabled or disabled                 |
| `org.sso_provider_added`       | New SSO provider configured                      |
| `org.sso_provider_removed`     | SSO provider removed                             |
| `org.api_token_created`        | API token generated                              |
| `org.api_token_revoked`        | API token revoked                                |
| `org.seo_settings_updated`     | SEO settings modified                            |

### Security Events

| Event                          | Description                                      |
|--------------------------------|--------------------------------------------------|
| `security.rate_limit_hit`      | API rate limit exceeded                          |
| `security.suspicious_request`  | Suspicious request detected (e.g., SQL injection attempt) |
| `security.ip_blocked`          | IP address automatically blocked                 |
| `security.admin_login_new_ip`  | Admin logged in from an unrecognized IP address  |

## Log Retention Policy

| Plan        | Retention Period | Storage Limit          |
|-------------|------------------|------------------------|
| Standard    | 90 days          | 100,000 log entries    |
| Enterprise  | 365 days         | 1,000,000 log entries  |

- Once the retention period is exceeded, log entries are **permanently deleted**.
- Once the storage limit is reached, the **oldest entries** are automatically purged to make room for new ones.
- Retention and storage limits apply **per organization**, not per Learnhouse instance.

### Export Before Deletion

If you need to keep logs beyond the retention period, export them before they expire. See the [Export Options](#export-options) section below.

## Searching and Filtering Logs

The audit log viewer provides powerful search and filter capabilities.

### Filters

| Filter        | Description                                           |
|---------------|-------------------------------------------------------|
| **Date Range**| Filter logs by a specific date/time range             |
| **Event Type**| Filter by event category (authentication, payment, etc.) |
| **User**      | Show actions performed by a specific user             |
| **IP Address**| Filter by the IP address from which the action originated |
| **Status**    | Filter by success/failure status                     |
| **Severity**  | Filter by severity level (info, warning, critical)    |

### Search

- Free-text search across all log fields: event name, user name, email, IP address, and details.
- Supports partial matching. For example, searching `domain` returns all domain-related events.
- Search results are limited to **1,000 entries** at a time. Use date range filters to narrow results.

### Viewing Log Details

Click on any log entry to expand it and view:

- **Timestamp** — Exact date and time (in the organization's configured timezone).
- **Actor** — Who performed the action (user name, email, and user ID).
- **Action** — The event type and a human-readable description.
- **Target** — The resource affected (e.g., course name, user ID, domain name).
- **Changes** — For update events, a before/after diff of the changed fields.
- **Metadata** — IP address, user agent, session ID, and request ID.

## Export Options

### Export Format

Logs can be exported in the following formats:

- **CSV** — Comma-separated values, compatible with Excel, Google Sheets, and most data analysis tools.
- **JSON** — Structured data format for programmatic processing or importing into external systems (SIEM, log analysis tools).

### How to Export

1. Apply the desired filters to narrow down the log entries you want to export.
2. Click the **Export** button in the top toolbar.
3. Choose the export format (CSV or JSON).
4. Select the date range for the export (required).
5. Click **Export**.
6. The file is generated and downloaded automatically. For large exports, this may take a few seconds.

### Export Limits

| Format | Maximum Rows per Export |
|--------|-------------------------|
| CSV    | 10,000                  |
| JSON   | 5,000                   |

- For larger data volumes, split the export into multiple date ranges.
- Exports are limited to **one per 5 minutes** to prevent abuse.

## Compliance Considerations

### GDPR Compliance

- Audit logs contain personal data (user names, email addresses, IP addresses). Treat them as personal data under GDPR.
- If a user requests **right to erasure** (data deletion), their personal data in audit logs is **anonymized** — the user's name and email are replaced with a generic identifier, but the log entry is preserved for security auditing.
- Audit logs are retained for the minimum period necessary (see retention policy above).

### PCI DSS Compliance

- Payment-related audit logs (transactions, refunds, payment method changes) are retained for **12 months** regardless of plan, in compliance with PCI DSS requirements.
- **Credit card numbers** and **CVV codes** are **never** logged. Chargily Pay handles all sensitive payment data and returns only tokenized references.

### SOC 2 / Internal Audits

- All administrative actions are logged with a **non-repudiable** timestamp.
- Log entries are **immutable** — they cannot be edited or deleted by administrators.
- Only users with the **Super Admin** role can access audit logs.
- Audit logs can be used as evidence for SOC 2 audits and internal security reviews.

## Best Practices

- **Monitor regularly** — Review audit logs weekly for suspicious activity, such as failed login spikes or unexpected configuration changes.
- **Set up alerts** — Configure webhook notifications for critical events (e.g., domain removal, API token creation) using the [API webhooks](../../06-api-reference/webhooks.md) system.
- **Export periodically** — If your compliance requirements demand longer retention than Koodook provides, schedule regular exports.
- **Investigate anomalies** — If a user reports an unexpected change, the audit log is the first place to check for who made the change and when.
- **Train your team** — Ensure all admins understand that their actions are logged and auditable.

## Related Sections

- [API Access](./api-access.md) — API token usage is tracked in audit logs
- [SSO](./sso.md) — SSO login attempts and failures are logged
- [Feature Flags](./features.md) — Feature flag changes are recorded in audit logs
