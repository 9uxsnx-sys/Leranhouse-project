# Trail API

> Status: as-built · Last verified: 2026-11-15

This router owns the learner's trail: one trail per user per organization, plus trail runs (course or podcast enrollments) and trail steps (activity/episode completions and playback progress). Mounted at `/api/v1/trail`.

Mounted with `require_authenticated_user` (anonymous → `401`, API token → `403`) and `require_courses_feature`, which resolves `course_uuid` / `activity_uuid` / `org_id` from the path and returns `403` when the org's `courses` feature is disabled (or `404` when the referenced course/activity, or the org config, is missing).

All routes derive the acting user from the session. `POST /start` is the exception: it also accepts a `user_id` in its body (see below).

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/trail/start` | Create a trail |
| `GET` | `/api/v1/trail/` | Get the caller's trail |
| `GET` | `/api/v1/trail/org/{org_id}/trail` | Get (and auto-create) the trail for an org |
| `POST` | `/api/v1/trail/add_course/{course_uuid}` | Enroll in a course |
| `DELETE` | `/api/v1/trail/remove_course/{course_uuid}` | Unenroll from a course |
| `POST` | `/api/v1/trail/add_activity/{activity_uuid}` | Mark an activity complete |
| `DELETE` | `/api/v1/trail/remove_activity/{activity_uuid}` | Un-complete an activity |
| `POST` | `/api/v1/trail/add_podcast/{podcast_uuid}` | Enroll in a podcast |
| `DELETE` | `/api/v1/trail/remove_podcast/{podcast_uuid}` | Unenroll from a podcast |
| `POST` | `/api/v1/trail/add_episode/{episode_uuid}` | Mark an episode complete |
| `DELETE` | `/api/v1/trail/remove_episode/{episode_uuid}` | Un-complete an episode |
| `PUT` | `/api/v1/trail/progress/{episode_uuid}` | Save playback progress |
| `GET` | `/api/v1/trail/progress/{episode_uuid}` | Read playback progress |

All mutations below return `TrailRead` (the whole trail, re-read after the change), except `POST /start` which returns the bare `Trail` row and `GET /progress/…` which returns a small object.

---

## `TrailRead` shape

```json
{
  "id": 3,
  "trail_uuid": "trail_8c1d…",
  "org_id": 1,
  "user_id": 7,
  "creation_date": "2026-11-10 08:01:00.120000",
  "update_date": "2026-11-15 09:40:12.500000",
  "runs": [
    {
      "id": 11,
      "data": {},
      "status": "STATUS_IN_PROGRESS",
      "run_type": "RUN_TYPE_COURSE",
      "trail_id": 3,
      "course_id": 4,
      "podcast_id": null,
      "org_id": 1,
      "user_id": 7,
      "course": { "id": 4, "course_uuid": "course_9f2c…", "name": "Algebra" },
      "podcast": {},
      "creation_date": "2026-11-10 08:04:00.000000",
      "update_date": "2026-11-10 08:04:00.000000",
      "course_total_steps": 12,
      "podcast_total_episodes": 0,
      "steps": [
        {
          "id": 31,
          "complete": true,
          "teacher_verified": false,
          "grade": "",
          "data": { "course": { "id": 4, "course_uuid": "course_9f2c…", "name": "Algebra" } },
          "trailrun_id": 11,
          "trail_id": 3,
          "activity_id": 19,
          "course_id": 4,
          "episode_id": null,
          "podcast_id": null,
          "org_id": 1,
          "user_id": 7,
          "creation_date": "2026-11-11 18:22:03.000000",
          "update_date": "2026-11-11 18:22:03.000000"
        }
      ]
    }
  ]
}
```

`course` and `podcast` are the full serialized objects (abbreviated above), or `{}` when absent. `TrailRunRead.course` is localized when `locale` is supplied to `GET /org/{org_id}/trail`. In trail responses the builder **overwrites `step.data` with `{ "course": … }`**, so episode playback positions are not visible here — use `GET /progress/{episode_uuid}`.

---

## POST /api/v1/trail/start

Body: `TrailCreate` = `{ "org_id": 1, "user_id": 7 }`. Returns the created `Trail` row (`id`, `trail_uuid`, `org_id`, `user_id`, `creation_date`, `update_date`).

- The existence check is `(Trail.org_id = body.org_id, Trail.user_id = caller.id)`; if found → `400` `"Trail already exists"`.
- The row itself is created from the **body** (`org_id`, `user_id`); only the duplicate check uses the caller. The body `user_id` is not compared against the session user.

```json
{
  "org_id": 1,
  "user_id": 7,
  "id": 3,
  "trail_uuid": "trail_8c1d…",
  "creation_date": "2026-11-10 08:01:00.120000",
  "update_date": "2026-11-10 08:01:00.120000"
}
```

---

## GET /api/v1/trail/

Returns `TrailRead` for `select(Trail).where(Trail.user_id == caller.id).first()` — **no org filter and no ordering**. A user with trails in several orgs gets whichever row the database returns first; use the org-scoped route below. `404` `"Trail not found"` if the user has none.

---

## GET /api/v1/trail/org/{org_id}/trail

Returns the caller's `TrailRead` for the org, **creating the trail automatically** if it does not exist (`check_trail_presence`). Query params: `locale` (optional) — overlays translated course metadata in each run's `course`.

The org is not membership-checked: any authenticated caller can obtain/create their own trail for any `org_id` that has an organization config. A missing config returns `404` `"Organization has no config"` from the feature dependency.

---

## POST /api/v1/trail/add_course/{course_uuid}

| Status | When |
|---|---|
| `200` | `TrailRead` after the run is created |
| `400` | Any `TrailRun` already exists for this course **and this user** (`"TrailRun already exists"`) |
| `404` | Course not found, or the user has no trail for that course's org (`"Trail not found"`) |

Unlike `add_activity`/`add_episode`, this route does **not** auto-create a trail. It tracks `course_enrolled` (analytics webhook + notification) on every successful call.

---

## DELETE /api/v1/trail/remove_course/{course_uuid}

Requires an existing trail for the course's org (`404` otherwise) and an existing course (`404`). Deletes the course run **and every trail step for that course/user**, then returns the updated `TrailRead`. Missing run/step is not an error.

---

## POST /api/v1/trail/add_activity/{activity_uuid}

Marks an activity complete. Steps:

1. Feature dependency resolves the activity → course (unknown activity/course → `404` before the handler).
2. Auto-creates the trail for the course's org if needed, and the course run if missing.
3. Creates a `TrailStep` with `complete=true` if none exists (re-visiting is idempotent).
4. On the first completion only: tracks `activity_completed`; if this completion made the course fully complete, it also creates the certificate (when configured) and tracks `course_completed`.

Returns `TrailRead`.

---

## DELETE /api/v1/trail/remove_activity/{activity_uuid}

Requires activity → course → existing trail (`404` at each step). Deletes the matching `TrailStep` only; the run and other steps stay. Returns `TrailRead`.

---

## POST /api/v1/trail/add_podcast/{podcast_uuid}

| Status | When |
|---|---|
| `200` | `TrailRead` after the podcast run is created |
| `400` | A podcast run already exists for this podcast and user (`"TrailRun already exists"`) |
| `404` | Podcast not found, or no trail for the podcast's org |

Like `add_course`, it does not auto-create the trail.

---

## DELETE /api/v1/trail/remove_podcast/{podcast_uuid}

Requires podcast and trail (`404` otherwise). Deletes the podcast run and all trail steps for that podcast/user. Returns `TrailRead`.

---

## POST /api/v1/trail/add_episode/{episode_uuid}

Marks an episode as listened. Auto-creates the trail/run for the episode's podcast org, then creates a `TrailStep` with `complete=true` if missing. `404` for unknown episode or podcast. Returns `TrailRead`.

---

## DELETE /api/v1/trail/remove_episode/{episode_uuid}

Requires episode, podcast and trail (`404` otherwise). Deletes the episode's `TrailStep`; the podcast run is kept. Returns `TrailRead`.

---

## PUT /api/v1/trail/progress/{episode_uuid}

Body: `{ "playback_position": 312.5, "duration": 600.0 }` (both floats).

- Resolves episode → podcast, auto-creates the trail and podcast run if needed.
- Upserts a `TrailStep` and stores `{ playback_position, duration }` in `step.data`.
- Auto-marks the step complete when `duration > 0` and `playback_position / duration >= 0.95`. Completion is only ever turned **on**, never off.
- `404` if the episode or its podcast is missing.

Returns `TrailRead` (note: its `step.data` is replaced by `{ "course": … }` in this response — see above).

---

## GET /api/v1/trail/progress/{episode_uuid}

Returns the saved values, or zeros when no step exists:

```json
{ "playback_position": 312.5, "duration": 600.0, "complete": false }
```

`404` `"Episode not found"` for an unknown episode. No trail/org check is performed.

---

## Notes that are easy to miss

- Trail creation is inconsistent: `add_course` and `add_podcast` require a pre-existing trail (`404`), while `add_activity`, `add_episode`, `PUT /progress` and `GET /org/{org_id}/trail` auto-create it.
- `GET /trail/` is not org-scoped and has no deterministic ordering; prefer `GET /trail/org/{org_id}/trail`.
- `POST /start` trusts the body's `user_id`; the router does not overwrite it with the session user.
- Course/podcast paths re-run the `courses` feature check before the handler, so an unknown UUID can `404` before the service runs.
