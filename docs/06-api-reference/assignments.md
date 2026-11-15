# Assignments API

> Status: as-built · Last verified: 2026-11-15

Course assignments: an assignment is attached to one activity and owns tasks, per-task submissions and one assignment-level submission per user. Mounted at `/api/v1/assignments`; the router rejects anonymous callers **and** API tokens — every route needs an authenticated session.

Every handler resolves the parent course and runs RBAC against it (`src/services/courses/activities/assignments.py`). Assignment `POST /` uses `create`; updates use `update`; deletes use `delete`; grading and instructor listings use `update`; student-facing reads use `read`, and the submission-write paths also verify enrollment.

---

## Models and enums

| Model | Fields |
|---|---|
| `AssignmentRead` | `id`, `assignment_uuid`, `title`, `description`, `due_date`, `published`, `grading_type`, `auto_grading`, `anti_copy_paste`, `show_correct_answers`, `allow_retries`, `max_retries`, `org_id`, `course_id`, `chapter_id`, `activity_id`, `course_uuid`, `activity_uuid`, `creation_date`, `update_date` |
| `AssignmentTaskRead` | `id`, `assignment_task_uuid`, `title`, `description`, `hint`, `reference_file`, `assignment_type`, `contents`, `max_grade_value`, `creation_date`, `update_date` |
| `AssignmentTaskSubmissionRead` | `id`, `assignment_task_submission_uuid`, `task_submission`, `grade`, `task_submission_grade_feedback`, `assignment_type`, `manually_graded`, `user_id`, `activity_id`, `course_id`, `chapter_id`, `assignment_task_id`, `creation_date`, `update_date` |
| `AssignmentUserSubmissionRead` | `id`, `submission_status`, `grade`, `overall_feedback`, `attempt_number`, `user_id`, `assignment_id`, `creation_date`, `update_date` |

**Task types** (`AssignmentTaskTypeEnum`): `FILE_SUBMISSION`, `QUIZ`, `FORM`, `CODE`, `SHORT_ANSWER`, `NUMBER_ANSWER`, `OTHER`.

**Grading types** (`GradingTypeEnum`): `ALPHABET`, `NUMERIC`, `PERCENTAGE`, `PASS_FAIL`, `GPA_SCALE`.

**Submission statuses** (`AssignmentUserSubmissionStatus`): `PENDING`, `SUBMITTED`, `GRADED`, `LATE`, `NOT_SUBMITTED`. These routes create `SUBMITTED` and move rows to `GRADED` (or back to `PENDING` on retry); `LATE`/`NOT_SUBMITTED` are defined but not produced here.

Auto-grading (when `auto_grading=true`) only runs if **every** task type is in `QUIZ`, `FORM`, `CODE`, `SHORT_ANSWER`, `NUMBER_ANSWER`. `FILE_SUBMISSION` and `OTHER` force human review. Passing threshold is 50% for `NUMERIC` / `PERCENTAGE` / `PASS_FAIL`, 60% for `ALPHABET` / `GPA_SCALE`.

> Path caveat: inside the nested task routes, most handlers accept `{assignment_uuid}` but resolve the task/submission by its own UUID — the `{assignment_uuid}` segment is not cross-checked. Only `GET`/`POST /{assignment_uuid}/tasks` and the batch task-submission read (`/tasks/submissions/me`) use it there; assignment-level submission routes use it normally.

---

## Assignments (CRUD)

### Create assignment

```
POST /api/v1/assignments/
```

Auth: `create` on the parent course. The body `org_id` is overwritten with the course's org; the assignments usage counter is incremented.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | |
| `description` | string | yes | |
| `due_date` | string | yes | Stored as string |
| `grading_type` | enum | yes | `ALPHABET` \| `NUMERIC` \| `PERCENTAGE` \| `PASS_FAIL` \| `GPA_SCALE` |
| `published` | boolean | no | Default `false` |
| `auto_grading` | boolean | no | Default `false` |
| `anti_copy_paste` | boolean | no | Default `false` |
| `show_correct_answers` | boolean | no | Default `false` |
| `allow_retries` | boolean | no | Default `false` |
| `max_retries` | integer | no | Default `0` = unlimited; first submission is attempt 1 |
| `org_id`, `course_id`, `chapter_id`, `activity_id` | integer | yes | Parent ids |

Response `200`:

```json
{
  "id": 12,
  "assignment_uuid": "assignment_4c2e...",
  "title": "Week 1 — Variables",
  "description": "Submit the exercises below.",
  "due_date": "2026-11-30",
  "published": true,
  "grading_type": "ALPHABET",
  "auto_grading": false,
  "anti_copy_paste": false,
  "show_correct_answers": false,
  "allow_retries": true,
  "max_retries": 3,
  "org_id": 1,
  "course_id": 7,
  "chapter_id": 3,
  "activity_id": 88,
  "course_uuid": null,
  "activity_uuid": null,
  "creation_date": "2026-11-15 09:00:00.000000",
  "update_date": "2026-11-15 09:00:00.000000"
}
```

Errors: `403` (no create permission), `404` (course not found), `422`.

### Get assignment

```
GET /api/v1/assignments/{assignment_uuid}
```

Auth: `read` on the parent course. Returns `AssignmentRead` with `course_uuid` and `activity_uuid` populated from the joined course/activity.

Errors: `404` (`"Assignment not found"`), `403`.

### Get assignment by activity

```
GET /api/v1/assignments/activity/{activity_uuid}
```

Auth: `read` on the parent course. Returns the assignment attached to the activity, with `course_uuid` / `activity_uuid` populated.

Errors: `404` (`"Assignment not found"` when the activity has no assignment).

### Update assignment

```
PUT /api/v1/assignments/{assignment_uuid}
```

Auth: `update` on the parent course.

Body (`AssignmentUpdate`): any subset of `title`, `description`, `due_date`, `published`, `grading_type`, `auto_grading`, `anti_copy_paste`, `show_correct_answers`, `allow_retries`, `max_retries`, `org_id`, `course_id`, `chapter_id`, `activity_id`, `update_date`. Only non-null fields are written.

Response `200`: updated `AssignmentRead`.

Errors: `403`, `404`.

### Delete assignment

```
DELETE /api/v1/assignments/{assignment_uuid}
DELETE /api/v1/assignments/activity/{activity_uuid}
```

Auth: `delete` on the parent course.

```json
{ "message": "Assignment deleted" }
```

The activity-level variant returns `404` if the activity or its assignment does not exist.

### List assignments for a course

```
GET /api/v1/assignments/course/{course_uuid}
```

Auth: `read` on the course. Returns a **bare array** of `AssignmentRead` (no pagination).

Errors: `404` (`"Course not found"`).

---

## Tasks

### Create task

```
POST /api/v1/assignments/{assignment_uuid}/tasks
```

Auth: `create` on the parent course.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | |
| `description` | string | yes | |
| `hint` | string | yes | |
| `assignment_type` | enum | yes | See task types above |
| `contents` | object | no | Default `{}` — quiz options / form fields / code config |
| `reference_file` | string | no | Normally set through the ref-file upload |
| `max_grade_value` | integer | no | Default `100` |

Response `200`: `AssignmentTaskRead`.

Errors: `403`, `404` (assignment/course not found).

### List / get tasks

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/v1/assignments/{assignment_uuid}/tasks` | course read | Bare array of `AssignmentTaskRead`, newest first |
| `GET` | `/api/v1/assignments/task/{assignment_task_uuid}` | course read | `AssignmentTaskRead` |

Errors: `404` (`"Assignment Task not found"` / `"Assignment not found"` / `"Course not found"`).

### Update task

```
PUT /api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}
```

Auth: `update` on the parent course. Body: any subset of `title`, `description`, `hint`, `assignment_type`, `contents`, `max_grade_value`. Returns `AssignmentTaskRead`.

### Upload task reference file

```
POST /api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}/ref_file
Content-Type: multipart/form-data
```

Auth: `update` on the parent course. Form field: `reference_file` (file).

Stores the file and writes its filename to `reference_file`. If no file is sent the task is still saved and returned unchanged. Response `200`: `AssignmentTaskRead`.

### Upload task submission file

```
POST /api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}/sub_file
Content-Type: multipart/form-data
```

Auth: course `read` + enrolled (role `read`). Form field: `sub_file` (file).

```json
{ "file_uuid": "1731680000_my-answer.pdf" }
```

The handler returns `null` when no file is provided or the activity/org cannot be resolved.

### Delete task

```
DELETE /api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}
```

Auth: `delete` on the parent course.

```json
{ "message": "Assignment Task deleted" }
```

---

## Task submissions

### Upsert current user's task submission

```
PUT /api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}/submissions
```

Auth: students need `read` + enrollment; instructors need `update`. The row is upserted by `(assignment_task_id, user_id)`.

Body (`AssignmentTaskSubmissionUpdate`, all optional): `assignment_task_id`, `assignment_task_submission_uuid`, `task_submission` (object), `grade`, `task_submission_grade_feedback`, `assignment_type`. Non-instructors cannot set a non-zero `grade` or feedback (`403 "You do not have permission to update grades"`). New rows always start with `grade=0` and empty feedback.

Response `200`: `AssignmentTaskSubmissionRead`.

Errors: `403`, `404` (task/assignment/course not found).

### Read task submissions

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/v1/assignments/{assignment_uuid}/tasks/submissions/me` | course read | Object keyed by `assignment_task_uuid`; value is `AssignmentTaskSubmissionRead` or `null` |
| `GET` | `/api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}/submissions/me` | course read | `AssignmentTaskSubmissionRead`; `404` when the user has no submission |
| `GET` | `/api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}/submissions/user/{user_id}` | course read; non-instructors only themselves (`403`) | Single `AssignmentTaskSubmissionRead`; `404` when none |
| `GET` | `/api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}/submissions` | course `update` (instructor) | Bare array of `AssignmentTaskSubmissionRead` |

Batch map example (`/tasks/submissions/me`):

```json
{
  "assignmenttask_1a2b...": {
    "id": 41,
    "assignment_task_submission_uuid": "assignmenttasksubmission_9f3d...",
    "task_submission": { "answers": { "q1": "B" } },
    "grade": 0,
    "task_submission_grade_feedback": "",
    "assignment_type": "QUIZ",
    "manually_graded": false,
    "user_id": 5,
    "activity_id": 88,
    "course_id": 7,
    "chapter_id": 3,
    "assignment_task_id": 21,
    "creation_date": "2026-11-15 10:00:00.000000",
    "update_date": "2026-11-15 10:00:00.000000"
  },
  "assignmenttask_7c8d...": null
}
```

The instructor list accepts `limit` (default `50`, `1–500`) and `offset` (default `0`).

### Delete task submission

```
DELETE /api/v1/assignments/{assignment_uuid}/tasks/{assignment_task_uuid}/submissions/{assignment_task_submission_uuid}
```

Auth: `delete` on the parent course.

```json
{ "message": "Assignment Task Submission deleted" }
```

---

## Assignment submissions

### Submit assignment

```
POST /api/v1/assignments/{assignment_uuid}/submissions
```

Auth: `read` on the course. Creates the current user's `AssignmentUserSubmission`, or reuses an existing row only when it is `PENDING` / `NOT_SUBMITTED` (the retry path). Marks the activity's `TrailStep` complete and, when `auto_grading` is on and every task is auto-gradable, grades immediately.

Errors: `400 "Assignment User Submission already exists"` when the row is already `SUBMITTED` or `GRADED`; `404`.

Response `200`: `AssignmentUserSubmissionRead`.

```json
{
  "id": 63,
  "submission_status": "SUBMITTED",
  "grade": 0,
  "overall_feedback": null,
  "attempt_number": 1,
  "user_id": 5,
  "assignment_id": 12,
  "creation_date": "2026-11-15 10:00:00.000000",
  "update_date": "2026-11-15 10:00:00.000000"
}
```

### Read submissions

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/v1/assignments/{assignment_uuid}/submissions?limit=50&offset=0` | course read; instructors (`update`) see all rows, students only their own | Bare array; each row also carries `grade_display` (string when `GRADED`, otherwise `null`) |
| `GET` | `/api/v1/assignments/{assignment_uuid}/submissions/me` | course read | Bare array of the current user's rows |
| `GET` | `/api/v1/assignments/{assignment_uuid}/submissions/{user_id}` | course read; non-instructors only themselves (`403`) | Bare array for that user |

`grade_display` is derived from the configured grading type (e.g. `"B"`, `"85.00%"`, `"Pass"`, `"3.0"`, `"85/100"`).

### Update a user's submission

```
PUT /api/v1/assignments/{assignment_uuid}/submissions/{user_id}
```

Auth: instructors (`update`) may update anyone; students need `read` and may only update their own row.

Body (`AssignmentUserSubmissionCreate`): only `assignment_id` (integer, required). The path `user_id` selects the row; non-null body fields are applied.

Response `200`: `AssignmentUserSubmissionRead`.

### Delete a user's submission

```
DELETE /api/v1/assignments/{assignment_uuid}/submissions/{user_id}
```

Auth: `delete` on the course. Deletes the submission, flips the matching `TrailStep` back to incomplete, and removes any issued course certificate. Per-task submissions are kept.

```json
{ "message": "Assignment User Submission deleted" }
```

### Grade

```
GET  /api/v1/assignments/{assignment_uuid}/submissions/{user_id}/grade
POST /api/v1/assignments/{assignment_uuid}/submissions/{user_id}/grade
```

- `GET` auth: course `read`; self or instructor (`403` otherwise). Recomputes from stored per-task grades and current task configuration.
- `POST` auth: course `update` (instructor). Computes, stores the grade, sets status `GRADED`, dispatches `assignment_graded` webhook/notification, and accepts an optional body `{ "overall_feedback": "…" }`. Passing no body leaves feedback unchanged.

Response shape (both):

```json
{
  "grade": 85,
  "max_grade": 100,
  "percentage": 85.0,
  "display_grade": "B",
  "letter_grade": "B",
  "points_summary": "85/100 pts",
  "percentage_display": "85.00%",
  "passed": true,
  "passing_threshold": 60.0,
  "grading_type": "ALPHABET",
  "overall_feedback": null,
  "tasks": [
    {
      "index": 1,
      "assignment_task_uuid": "assignmenttask_1a2b...",
      "title": "Multiple choice",
      "description": "Pick the right answer.",
      "assignment_type": "QUIZ",
      "submitted": true,
      "grade": 85,
      "max_grade": 100,
      "percentage": 85.0,
      "percentage_display": "85%",
      "points_summary": "85/100",
      "passed": true,
      "feedback": ""
    }
  ]
}
```

`POST` adds `"message"` (e.g. `"Assignment User Submission graded: B"`). Errors: `404` when the submission does not exist.

### Retry assignment

```
POST /api/v1/assignments/{assignment_uuid}/submissions/me/retry
```

Auth: course `read` — strictly self-service.

Requires `allow_retries=true`, an existing **`GRADED`** submission, and `attempt_number < max_retries` (unless `max_retries=0`, unlimited). Wipes per-task submissions, resets the `TrailStep`, revokes a course certificate, and resets the row to `PENDING` with `grade=0` and `attempt_number + 1`.

```json
{
  "message": "Assignment User Submission reset for retry",
  "attempt_number": 2,
  "max_retries": 3,
  "submission": {
    "id": 63,
    "submission_status": "PENDING",
    "grade": 0,
    "overall_feedback": null,
    "attempt_number": 2,
    "user_id": 5,
    "assignment_id": 12,
    "creation_date": "2026-11-15 10:00:00.000000",
    "update_date": "2026-11-15 11:00:00.000000"
  }
}
```

Errors: `403 "Retries are not enabled for this assignment"`, `403 "No retry attempts remaining"`, `400 "Only graded submissions can be retried"`, `404`.

### Mark assignment activity as done

```
POST /api/v1/assignments/{assignment_uuid}/submissions/{user_id}/done
```

Auth: course `update` (instructor). The target user must already have a `TrailStep` for the activity (`404 "User not enrolled in the course"`). Sets the step complete and may issue a course certificate.

```json
{ "message": "Activity marked as done for user" }
```
