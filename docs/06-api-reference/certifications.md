# Certifications API

> Status: as-built · Last verified: 2026-11-15

This router owns certification templates (per course) and the awarded-certificate read models. Mounted at `/api/v1/certifications`.

There is **no router-level auth dependency**: every handler uses `get_current_user`, which yields `AnonymousUser` for unauthenticated requests. Access therefore depends on (a) the Pro plan gate and (b) course RBAC in the service. The plan dependency `require_plan_for_certifications("pro", "Certifications")` resolves the org from the path (`certification_uuid` → course, `course_uuid` → course, `user_certification_uuid` → certificate → course) and returns `403` on a lower plan in SaaS (EE/OSS bypass it). Routes with no resolvable org (`POST /`, `GET /user/all`) skip the plan check unless the caller passes `?org_id=…`.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/certifications/` | Create a certification template |
| `GET` | `/api/v1/certifications/{certification_uuid}` | Get a template |
| `GET` | `/api/v1/certifications/course/{course_uuid}` | List a course's templates |
| `PUT` | `/api/v1/certifications/{certification_uuid}` | Update a template |
| `DELETE` | `/api/v1/certifications/{certification_uuid}` | Delete a template |
| `GET` | `/api/v1/certifications/user/course/{course_uuid}` | Caller's certificates for a course |
| `GET` | `/api/v1/certifications/certificate/{user_certification_uuid}` | Read one awarded certificate |
| `GET` | `/api/v1/certifications/user/all` | Caller's certificates across all courses |

`CertificationCreate` = `{ "course_id": 4, "config": {} }` (numeric course **id**, not the UUID). `CertificationUpdate` = `{ "config"?: {} }`. `CertificationRead` = `{ id, certification_uuid, course_id, config, creation_date, update_date }`.

```json
{
  "id": 2,
  "certification_uuid": "certification_5a9c…",
  "course_id": 4,
  "config": { "title": "Certificate of completion" },
  "creation_date": "2026-11-12 14:00:00.000000",
  "update_date": "2026-11-12 14:00:00.000000"
}
```

---

## Template routes (CRUD)

All template routes resolve the course and enforce course RBAC via `check_resource_access`:

| Method | RBAC action | 404s (in order) |
|---|---|---|
| `POST /` | `CREATE` on the body `course_id`'s course | Course not found |
| `GET /{certification_uuid}` | `READ` on the owning course | Certification, then Course |
| `GET /course/{course_uuid}` | `READ` on the course | Course |
| `PUT /{certification_uuid}` | `UPDATE` on the owning course | Certification, then Course |
| `DELETE /{certification_uuid}` | `DELETE` on the owning course | Certification, then Course |

- RBAC denial returns `403` with the access decision's reason.
- `PUT` writes only non-`null` fields of `config` and refreshes `update_date`.
- `POST` generates `certification_uuid = "certification_<uuid4>"`; `config` defaults to `{}`.
- `DELETE` returns `{ "detail": "Certification deleted successfully" }`.
- `GET /course/{course_uuid}` returns a bare array of `CertificationRead`.

> **Delete caveat:** the route description says awarded certificates are kept, but `certificateuser.certification_id` is declared `ON DELETE CASCADE` (`src/db/courses/certifications.py`), so with enforced FKs deleting the template also deletes awarded certificate rows. Do not rely on retention.

---

## GET /api/v1/certifications/user/course/{course_uuid}

Returns the certificates **awarded to the caller** for one course. Course `404` first, then `READ` access on the course.

```json
[
  {
    "certificate_user": {
      "id": 9,
      "user_id": 7,
      "certification_id": 2,
      "user_certification_uuid": "QX-20261112-1c9a-3f7b21de",
      "created_at": "2026-11-12 14:05:00.000000",
      "updated_at": "2026-11-12 14:05:00.000000"
    },
    "certification": {
      "id": 2,
      "certification_uuid": "certification_5a9c…",
      "course_id": 4,
      "config": { "title": "Certificate of completion" },
      "creation_date": "2026-11-12 14:00:00.000000",
      "update_date": "2026-11-12 14:00:00.000000"
    }
  }
]
```

Returns `[]` when the course has no templates or the caller holds none. The lookup uses `current_user.id`; an anonymous caller (`id = 0`) gets `[]`.

---

## Awarded-certificate read model

Every awarded certificate is a `CertificateUser` row: `{ id, user_id, certification_id, user_certification_uuid, created_at, updated_at }`.

- One row per `(user_id, certification_id)` — the creation path raises `400` `"User already has a certificate for this course"` on duplicates.
- `user_certification_uuid` is the public, shareable identifier. Format: `XX-YYYYMMDD-<last 4 chars of user_uuid>-<8 hex>`, e.g. `QX-20261112-1c9a-3f7b21de`.
- Certificates are issued automatically when a learner completes every activity of a course that has a certification template configured (the trail completion path in `src/services/trail/trail.py`).

---

## GET /api/v1/certifications/certificate/{user_certification_uuid}

The public verification lookup: fetch an awarded certificate by its opaque `user_certification_uuid`. **No RBAC check is performed** ("allow anyone to access certificates by UUID"), which is what makes the link shareable.

```json
{
  "certificate_user": {
    "id": 9,
    "user_id": 7,
    "certification_id": 2,
    "user_certification_uuid": "QX-20261112-1c9a-3f7b21de",
    "created_at": "2026-11-12 14:05:00.000000",
    "updated_at": "2026-11-12 14:05:00.000000"
  },
  "certification": {
    "id": 2,
    "certification_uuid": "certification_5a9c…",
    "course_id": 4,
    "config": { "title": "Certificate of completion" },
    "creation_date": "2026-11-12 14:00:00.000000",
    "update_date": "2026-11-12 14:00:00.000000"
  },
  "course": {
    "id": 4,
    "course_uuid": "course_9f2c…",
    "name": "Algebra",
    "description": "A beginner-friendly course.",
    "thumbnail_image": "course_9f2c…/thumbnail.png"
  }
}
```

`404` when the certificate, its certification, or the course is missing.

**Verification flow / where it lives**

- This is the only certificate-by-UUID read in the API; there is no separate `/verify` route elsewhere.
- It is not auth-gated in code, but the router's Pro plan gate still runs: the org is resolved through the certificate → certification → course chain, so on a Free/Standard org the request returns `403` before the handler.
- Award, revoke and per-user listing for admins live in the **Admin API** (`/api/v1/admin`), not here: `GET /api/v1/admin/{org_slug}/certifications/{user_id}`, `POST /api/v1/admin/{org_slug}/certifications/{user_id}/{course_uuid}/award`, `DELETE /api/v1/admin/{org_slug}/certifications/{user_id}/{user_certification_uuid}`.

---

## GET /api/v1/certifications/user/all

Returns every certificate awarded to the caller, with the certification, course and user block. No RBAC and no org resolution from the path (so no plan gate unless `?org_id=…` is supplied).

Each item is the same object as above plus a `user` block (`null` if the user row is gone):

```json
[
  {
    "certificate_user": { "id": 9, "user_id": 7, "certification_id": 2, "user_certification_uuid": "QX-20261112-1c9a-3f7b21de", "created_at": "2026-11-12 14:05:00.000000", "updated_at": "2026-11-12 14:05:00.000000" },
    "certification": { "id": 2, "certification_uuid": "certification_5a9c…", "course_id": 4, "config": {}, "creation_date": "2026-11-12 14:00:00.000000", "update_date": "2026-11-12 14:00:00.000000" },
    "course": { "id": 4, "course_uuid": "course_9f2c…", "name": "Algebra", "description": "A beginner-friendly course.", "thumbnail_image": "" },
    "user": { "id": 7, "user_uuid": "user_1c9a…", "username": "jdoe", "email": "jdoe@example.com", "first_name": "John", "last_name": "Doe" }
  }
]
```

Items whose certification or course can no longer be loaded are skipped. Anonymous callers (`id = 0`) get `[]`.

---

## Notes that are easy to miss

- Plan-gate coverage is uneven: `POST /` and `GET /user/all` never resolve an org from the path, so they skip the plan check unless `?org_id=…` is supplied; all other routes hit it once the org can be resolved.
- `POST /` takes the numeric `course_id`; every other route is UUID-based.
- Template reads are RBAC-checked against the course, so anonymous access works only for courses the course access rules allow publicly.
