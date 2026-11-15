> Status: as-built · Last verified: 2026-11-15

# Audit Logs

Audit Logs records API requests made in the organization: who called what, from which address, and with which response status.

> The page is reached from **Users → Audit Logs**, not from the Organization settings tab bar. The file keeps its path in this guide for historical links.

## Access

The Audit Logs tab requires the **Enterprise** plan and the organization's `audit_logs` feature. On other plans the page renders the plan-restricted view.

## Toolbar

| Control | Behaviour |
|---|---|
| Refresh | Reloads the current query |
| Export | Downloads the current result set as CSV |
| Search field selector | Choose which column the text search targets |
| Search input | Free-text value for the selected column |
| Resource filter | All, User, Course, Organization |
| Status filter | All, 200, 403, 404, 500 |
| Date range | All time, Today, Last 7 days, Last 30 days, Custom |
| Custom range | Start and end date inputs when Custom is selected |

Searchable columns are action/path, resource, username, name, user id and IP address. Changing any filter updates the query immediately.

## Table

| Column | Content |
|---|---|
| Timestamp | Date and time of the request |
| User | Avatar, `@username`, system fallback and user id |
| Resource | Resource type and resource id |
| Path / method | Request path and HTTP method |
| IP address | Source address, or a dash |
| Status | Colored status code: 2xx green, 4xx orange, 5xx red |
| Payload | Eye action when the request has a payload |

The payload action opens a modal with the payload pretty-printed as JSON. Requests without a payload show a dash instead of an action.

## Export

**Export** downloads a CSV named with the current timestamp. Before exporting, the action checks that the `audit_logs` feature is resolved as enabled; otherwise it reports that the feature is enterprise-only. The export uses the same filters as the table.

## Behaviour notes

- Filters combine: the search value, resource, status and date range are all applied together.
- The table requests up to 10,000 rows per query; narrow the range for very active organizations.
- The export calls the export endpoint with the same filters and downloads the returned CSV.
- Rows are read-only. There is no delete, edit or retention control in this page.

## Related

- [Users](./../users.md) — member and signup management.
- [Roles](./../roles.md) — dashboard access permission.
- [Developer guide](../../05-developer-guide/README.md).
