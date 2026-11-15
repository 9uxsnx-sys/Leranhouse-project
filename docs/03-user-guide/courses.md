> Status: as-built · Last verified: 2026-11-15

# Courses

Courses are the main learning format: chapters contain activities, and progress is tracked per course.

## Course catalogue

Open **Courses** from the side menu.

| Control | Behaviour |
|---|---|
| Search | Matches course name, description and tags |
| Difficulty filter | All courses, or one difficulty level |
| User-group filter | Appears on personal and family plans; narrows the grid to one group's resources |
| Pagination | Eight courses per page |

Each card shows the cover image, name, description, lesson count, duration and difficulty. Empty catalogues and empty search results have separate states.

## Course product page

Selecting a card opens the course page when your access allows it. Published `public` and `paid` courses keep the full product page visible, including the curriculum, even when the activity bodies are locked.

| Section | Content |
|---|---|
| Banner | Course banner, falling back to the thumbnail |
| Header | Name, description, lesson count, duration, difficulty and a share action |
| What you'll learn | Learning items authored for the course |
| Who this is for | "For you" and "not for you" lists |
| About this course | Long description |
| Curriculum | Expandable chapters and their activities |
| Requirements | Prerequisites, when authored |
| Community | The linked course community, when one exists |

The language note above the title appears when the course has no translation for your interface language; the page then shows the source language.

## Sidebar

| Card | Content |
|---|---|
| Access / progress | Progress bar and **Continue learning** when enrolled; otherwise **Get access** |
| This course includes | Video hours, lessons, downloadable resources and certificate line |
| Instructors | Each instructor's photo, name and title |
| Community | Short community description |
| Updates | Last update date |

Instructors come from the course's people metadata. A course can list several instructors, each with a name, a title and a photo; translated versions keep the same order and photo.

## Getting access

| Mode | Behaviour |
|---|---|
| `public` | **Add to progress** starts the course and adds it to your Progress page |
| `users_only` | The course is visible only to members of a linked user group; other learners cannot open it |
| `paid` | The price is shown in DZD; **Get access** opens Chargily checkout for the course |

After a successful payment, the entitlement is recorded and the access card switches to progress and **Continue learning**. Opening the course later resumes where you stopped.

## Taking a course

**Continue learning** opens the course player. The curriculum marks completed activities and the current activity; chapters can be collapsed. Each activity has its own completion and assignment actions — see [Activities](./activities.md).

When every activity is complete, the course-end screen shows the result and, for certified courses, the certificate and a PDF download.

## Related

- [Activities](./activities.md) — activity types and completion.
- [Collections](./collections.md) — bundles that contain courses.
- [Store](./store.md) — paid catalogue.
- [Courses API](../06-api-reference/courses.md) and [Developer guide](../05-developer-guide/README.md).
