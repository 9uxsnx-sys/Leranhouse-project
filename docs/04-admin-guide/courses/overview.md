> Status: as-built · Last verified: 2026-11-15

# Course Management Overview

Courses are created and edited from **Dashboard → Courses**. The list and the editor share the same dashboard shell: a title, a pill tab bar and white cards on a light grey background.

## Course list

| Control | Behaviour |
|---|---|
| Search | Filters by name, description and tags as you type |
| Filter | All courses, or one difficulty: Beginner, Intermediate, Advanced |
| New Course | Opens the creation-type chooser |
| Select courses | Switches the cards to checkboxes |
| Bulk actions | Clone, export (ZIP) and delete the selected courses |
| Three-dot menu | Edit content, Settings, Clone, Export, Delete |
| Pagination | Eight courses per page |

The card meta row shows the lesson count when the payload provides it, then duration and difficulty. Duration and difficulty come from the course metadata and follow the dashboard language. On personal and family plans an additional user-group filter limits the list to the resources linked to one group.

## Creating a course

**New Course** opens a chooser with three options:

| Option | Result |
|---|---|
| From scratch | Opens the basic course form |
| With AI | Opens the AI course builder; disabled when the AI feature is off |
| From existing content | Opens the migration wizard described below |

The course-limit banner appears when the organisation has reached its plan's course allowance; the button is disabled in that state.

## Migration wizard

The wizard at **Dashboard → Courses → Migrate** turns existing files into a course.

1. Drop or pick files. Accepted formats are MP4, WebM, MOV, PDF, PNG, JPG, JPEG, WebP, MP3 and WAV; a single file is capped at 5 GB and the batch at 20 GB.
2. Enter a course name (required) and an optional description.
3. Choose **Organise manually** or **Organise with AI**. The AI option only appears when the AI feature is enabled.
4. Review the suggested module and lesson tree, then choose **Create course**.
5. On success, **Go to course** opens the new course's Content tab.

Skipped files are reported in a toast. If AI organisation fails, the wizard falls back to a single empty module.

## Editor tabs

| Tab | Purpose | Access |
|---|---|---|
| General | Name, description, media, details, instructors | `update` right |
| Content | Modules and lessons | `update_content` right |
| Access | Access mode and the roster | `manage_access` right |
| Contributors | Co-authors, maintainers, reporters | `manage_contributors` right |
| SEO | Search and social metadata | `update` right and Standard plan |
| Translations | Per-language coverage and CSV exchange | `update` right |

Tabs the user cannot use are shown disabled with a lock tooltip. If the current tab is not permitted, the editor redirects to the first available tab. Users with no course permissions see an access-denied panel.

## Editor layout

The page title is the course name. Below the pill tabs, each tab renders its own inline action row with **Preview**, **Save** and **Publish/Unpublish** where relevant. There is no right-hand sidebar.

Publishing and access are independent: a published course can still be private or paid, and an unpublished course stays hidden regardless of its access mode.

## Related

- [General settings](./general.md)
- [Content structure](./content-structure.md)
- [Access control](./access.md)
- [Contributors](./contributors.md)
- [SEO](./seo.md)
- [Translations](./translations.md)
- HTTP contracts: [Courses API](../../06-api-reference/courses.md)
