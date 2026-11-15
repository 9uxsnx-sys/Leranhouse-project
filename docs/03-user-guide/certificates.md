> Status: as-built · Last verified: 2026-11-15

# Certificates

Certificates are issued per course. An administrator configures the certificate on the course's Certification tab; learners receive it after completing the course.

## Earning a certificate

1. Open a course that offers a certificate.
2. Complete every activity in the course.
3. When the last activity is completed, the course-end screen opens.

The course-end screen checks whether you already hold a certificate for the course. If you do, it renders the certificate preview and a **Download** action that produces a PDF with a QR code. If the course has no certificate configured, the screen shows a "no certificate" message instead.

Certificates are only fetched for signed-in learners.

## Certificate types

The certificate records one certification type, shown on the certificate and on the verification page.

| Type | Meaning |
|---|---|
| Completion | Course finished |
| Achievement-based | Achievement unlocked |
| Assessment-based | Assessment passed |
| Participation | Attendance recorded |
| Skill mastery | Mastery of a skill |
| Professional development | Professional development activity |
| Continuing education | Continuing education credit |
| Workshop attendance | Workshop completed |
| Specialization | Specialization track completed |

## Finding your certificates

There is no standalone certificates catalogue page. Your certificates appear in two places:

| Place | What you see |
|---|---|
| Course-end screen | Full certificate preview and PDF download |
| Progress page | A **Verify** link on a completed course card when a certificate exists for that course |

The **Verify** link opens the public verification page in a new tab.

## Verification page

The verification page is public and does not require sign-in.

| Block | Content |
|---|---|
| Status | Valid, not found, or an error state |
| Certificate preview | The rendered certificate with the recipient, course and certificate ID |
| Course card | Course thumbnail, name, description, active authors and a link to the course |
| Certificate details | Certificate ID, course name, certification type, awarded date and instructor when set |
| Security panel | Explains that the record comes from the database and is identified by ID and QR code |

If the certificate ID is unknown, revoked, expired or belongs to another organization, the page explains the possible reasons and offers a link home.

## Related

- [Courses](./courses.md) — completion and the course-end screen.
- [Activities](./activities.md) — how completion is recorded.
- [Certifications API](../06-api-reference/certifications.md) and [Developer guide](../05-developer-guide/README.md).
