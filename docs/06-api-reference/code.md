# Code API

> Status: as-built · Last verified: 2026-11-15

This area owns code-playground execution (via Judge0) and persisted per-user submission history. Execution routes are mounted at `/api/v1/code`; submission routes at `/api/v1/code/submissions`.

Both routers are mounted with `require_authenticated_user`: anonymous callers get `401`, API tokens get `403`. The execution/upload handlers additionally reject API tokens with `403` ("API tokens cannot use code execution or playground uploads").

---

## Judge0 dependency

Execution is proxied to a Judge0 instance. It is only enabled when `LEARNHOUSE_JUDGE0_API_URL` is set (or `judge0_config.api_url` in `config.yaml`); when unconfigured, every execution route returns `503` ("Code execution is not configured. Set LEARNHOUSE_JUDGE0_API_URL.").

| Setting | Effect |
|---|---|
| `LEARNHOUSE_JUDGE0_API_URL` | Judge0 base URL; enables the feature |
| `LEARNHOUSE_JUDGE0_CLIENT_ID` | Sent as `X-Judge0-Client-ID` when present |
| `LEARNHOUSE_JUDGE0_CLIENT_SECRET` | Sent as `X-Judge0-Client-Secret` when present |

Requests are sent to `POST {api_url}/submissions?wait=true` with a 30-second timeout; the response is returned as-is for `/execute`.

---

## Execute a snippet

```
POST /api/v1/code/execute
```

Auth: authenticated non-API-token user. When SQL is executed against a course-owned SQLite file, the caller also needs `read` access to that course.

| Field | Type | Required | Notes |
|---|---|---|---|
| `language_id` | integer | Yes | Judge0 language id |
| `source_code` | string | Yes | |
| `stdin` | string | No | Default `""` |
| `sqlite_db_path` | string | No | Course-owned storage path |
| `additional_files` | array | No | `[{ "name": "...", "content": "..." }]` bundled into a zip |

SQL mode: `language_id` `82` (SQL) plus `sqlite_db_path` parses the course UUID from the path layout `orgs/{org_uuid}/courses/{course_uuid}/...`, enforces course `read` access, loads the DB from the configured storage backend, rewrites the request as Python `71`, and executes the SQL against `db.sqlite3`. A malformed path returns `400`; a missing DB returns `404`.

Response `200` is the raw Judge0 submission object:

```json
{
  "stdout": "42\n",
  "stderr": null,
  "compile_output": null,
  "status": { "id": 3, "description": "Accepted" },
  "time": "0.012",
  "memory": 3072
}
```

Errors: `400` (invalid path / course UUID), `401`, `403` (API token or no course access), `404` (SQLite file not found), `503` (Judge0 not configured).

---

## Execute against test cases

```
POST /api/v1/code/execute-batch
```

Auth: same as `/execute`. Request body:

| Field | Type | Required |
|---|---|---|
| `language_id` | integer | Yes |
| `source_code` | string | Yes |
| `test_cases` | array | Yes |
| `sqlite_db_path` | string | No |
| `additional_files` | array | No |

Each test case: `{ "id": string, "label": string, "stdin": string, "expected_stdout": string }`.

All test cases run in parallel. A test passes when Judge0 status id is `3` (`Accepted`) and the normalized stdout matches `expected_stdout`. Normalization right-strips each line, drops trailing empty lines, and preserves leading whitespace.

Response `200`:

```json
{
  "results": [
    {
      "id": "t1",
      "label": "Adds two numbers",
      "passed": true,
      "actual_stdout": "42\n",
      "expected_stdout": "42",
      "stderr": null,
      "compile_output": null,
      "status": { "id": 3, "description": "Accepted" },
      "time": "0.011",
      "memory": 3072
    }
  ]
}
```

Errors: `400`, `401`, `403`, `404`, `503` (same conditions as `/execute`).

---

## Upload a SQLite database

```
POST /api/v1/code/upload-sqlite
```

Auth: authenticated non-API-token user with `update` access to the target course. Request is `multipart/form-data`:

| Field | In | Type | Required | Notes |
|---|---|---|---|---|
| `file_object` | form | file | Yes | `.sqlite`, `.db` or `.sqlite3`; max 50 MB; SQLite header validated |
| `activity_uuid` | form | string | Yes | |
| `block_id` | form | string | Yes | |
| `org_uuid` | form | string | Yes | |
| `course_uuid` | form | string | Yes | Must start with `course_` |

Stored under `orgs/{org_uuid}/courses/{course_uuid}/activities/{activity_uuid}/dynamic/blocks/codePlayground/{block_id}/`.

Response `200`:

```json
{
  "file_path": "orgs/org_4c1e.../courses/course_4a7e.../activities/activity_31de.../dynamic/blocks/codePlayground/block_9a2f.../550e8400-e29b-41d4-a716-446655440000_sqlite_db.sqlite",
  "file_name": "school.db"
}
```

Errors: `400` (invalid course UUID or file path), `401`, `403` (API token or no course update access), `415` (file type or SQLite header rejected by the upload validator).

---

## Submission history

Routes are mounted at `/api/v1/code/submissions`. Both routes require an authenticated user: anonymous callers get `401`, API tokens get `403`.

### List submissions

```
GET /api/v1/code/submissions/history?activity_uuid=...&block_id=...&page=1&limit=20
```

| Param | In | Type | Required | Notes |
|---|---|---|---|---|
| `activity_uuid` | query | string | Yes | |
| `block_id` | query | string | Yes | |
| `page` | query | integer | No | Default `1` |
| `limit` | query | integer | No | Default `20` |

Only the caller's submissions for that activity block are returned, newest first.

```json
{
  "submissions": [
    {
      "id": 77,
      "submission_uuid": "sub_2f8a...",
      "language_id": 71,
      "source_code": "print('hello')",
      "results": { "results": [] },
      "passed": true,
      "total_tests": 1,
      "passed_tests": 1,
      "execution_time_ms": 12,
      "created_at": "2026-11-15T10:12:00"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### Save a submission

```
POST /api/v1/code/submissions/save
```

| Field | Type | Required |
|---|---|---|
| `activity_uuid` | string | Yes |
| `block_id` | string | Yes |
| `language_id` | integer | Yes |
| `source_code` | string | Yes |
| `results` | object | Yes |
| `passed` | boolean | Yes |
| `total_tests` | integer | Yes |
| `passed_tests` | integer | Yes |
| `execution_time_ms` | integer | No |

Response `200` (`CodeSubmissionRead`): the saved row, with `submission_uuid` (`sub_...`) generated server-side and `created_at` set by the model.

Errors: `401` (not authenticated), `422` (missing/invalid body fields).
