# Data Model

> Status: as-built · Last verified: 2026-11-15

Core entities and their relationships.

---

## Entity Relationship Diagram

```
Organization
     |
     +-- User
     |     +-- UserGroup (many-to-many via UserGroupUser)
     |
     +-- Course
     |     +-- CourseChapter -> Chapter (Module)
     |     |     +-- ChapterActivity -> Activity (Lesson)
     |     +-- ResourceAuthor (CREATOR / MAINTAINER / CONTRIBUTOR / REPORTER)
     |     +-- Certifications -> CertificateUser
     |     +-- Community (resource_type = "course")
     |
     +-- UserGroup
     |     +-- UserGroupResource (links a group to a resource_uuid)
     |
     +-- Community
     |     +-- Discussion
     |     +-- CommunityTranslation (per locale)
     |
     +-- Board (collaborative Yjs whiteboard, ydoc_state)
     |     +-- BoardMember
     |
     +-- Collection (course / podcast bundle)
     |     +-- CollectionCourse (resource_type + resource_uuid)
     |     +-- CollectionTranslation (per locale)
     |     +-- CollectionUser
     |
     +-- Podcast
           +-- PodcastEpisode
           +-- PodcastTranslation (per locale)
           +-- PodcastEpisodeTranslation (per locale)

Course
  +-- CourseTranslation (per locale)
  +-- extra_metadata.translations[locale] (chapters / activities)
```

---

## Core Entities

### Organization

- **Represents**: A tenant in the multi-org system
- **Key fields**: name, slug, email, logo_image, logo_icon, thumbnail_image, explore, label
- **Relationships**: has many Users, Courses, Communities; custom domains live in `customdomain`
- **Settings**: branding and feature config live in `OrganizationConfig`

### User

- **Represents**: A person using the platform
- **Key fields**: username, first_name, last_name, email, password (Argon2 hash), user_uuid, is_superadmin
- **Relationships**: belongs to Organizations through `UserOrganization` (each membership carries a `role_id`); can be in multiple UserGroups
- **Auth**: supports password, Google OAuth, SSO, API tokens

### Course

- **Represents**: A learning course
- **Key fields**: name, description, about, learnings, tags, thumbnail_type, thumbnail_image, banner_image, thumbnail_video, public, published, access_type, price_amount, price_currency, source_locale
- **Access types**: `public`, `users_only`, `paid`
- **Relationships**: belongs to Organization, has many Chapters (through `coursechapter`), has many `ResourceAuthor` rows
- **Metadata**: extra_metadata JSONB stores flexible attributes including:
  - `difficulty`, `duration`, `requirements`: display-text keys for the course page
  - `video_hours`, `resources_count`, `has_certificate`: course stats
  - `instructors`: `[{ name, title, avatar, bio? }]` — the "Taught By" sidebar card. `avatar` is a data URL, because instructors are metadata and have no user row to build a media path from. Older rows may still carry a single `instructor` object, which the page and the editor fold into the first entry
  - `target_audience`: `{ for: string[], not_for: string[] }` — drives the "Who This Is For" section
  - `translations[locale]`: chapter/activity content per locale

### People Lists (Instructors and Hosts)

`course.extra_metadata.instructors` and `podcast.extra_metadata.hosts` are **structural** lists. The base row owns the entries, their order and their avatars (and other non-text fields). Only `name` and `title` are translated: `course_translation.extra_metadata.instructors` / `podcast_translation.extra_metadata.hosts` hold index-aligned `[{ name, title }]` entries. `src/services/people_locale.py` merges them position by position; blank or missing translations keep the source text, and avatars always come from the base row.

### Chapter (Module)

- **Represents**: A module within a course
- **Key fields**: name, description, thumbnail_image, lock_type, chapter_uuid, extra_metadata
- **Relationships**: belongs to Course; linked through `CourseChapter` (which carries `order`) and has many Activities through `ChapterActivity`
- **Supports**: drag-and-drop reordering (order lives on `coursechapter`)

### Activity (Lesson)

- **Represents**: A lesson within a module
- **Key fields**: name, activity_type, activity_sub_type, content, details, published, lock_type, current_version, activity_uuid
- **Types**: `TYPE_VIDEO`, `TYPE_DOCUMENT`, `TYPE_DYNAMIC`, `TYPE_ASSIGNMENT`, `TYPE_CUSTOM`, `TYPE_SCORM`
- **Relationships**: belongs to Course and to Chapters through `ChapterActivity` (which carries `order`)
- **Metadata**: extra_metadata JSONB stores:
  - `learning_objectives`: string[]
  - `takeaways`: { title: string, items: string[] }[]
  - `resources`: { name: string, url: string, file?: any }[]
  - `knowledge_checks`: { question: string, answer: string }[]
- **Supports**: drag-and-drop reordering (order lives on `chapteractivity`), published/unpublished toggle

### UserGroup

- **Represents**: A group of users for access control
- **Key fields**: name, description
- **Relationships**: many-to-many with User (`usergroupuser`); linked to resources through `UserGroupResource.resource_uuid`

### Community

- **Represents**: A community attached to exactly one course or podcast (`resource_type` + `resource_uuid`)
- **Key fields**: name, description, public, published, thumbnail_image, banner_image, source_locale, moderation_words, moderation_settings
- **Relationships**: belongs to Organization, has many Discussions and `CommunityTranslation` rows
- **Access**: inherited from the linked course/podcast; free parents also require the learner to have claimed/followed the parent

### Board

- **Represents**: A collaborative whiteboard
- **Key fields**: name, description, thumbnail_image, public, ydoc_state (binary Yjs document state)
- **Relationships**: belongs to Organization, has many `BoardMember` rows (owner / editor / viewer)
- **Technology**: Yjs state is persisted via internal endpoints used by the Hocuspocus collab server

### Certifications and CertificateUser

- **Certifications**: per-course certificate configuration (`certification_uuid`, `course_id`, `config` JSON)
- **CertificateUser**: one issued certificate (`user_certification_uuid`, `user_id`, `certification_id`)
- **Relationships**: `Certifications` belongs to Course; `CertificateUser` links a User to a `Certifications` row

### Collection

- **Represents**: A sellable bundle of courses and podcasts, with the same editorial surface as a course
- **Key fields**: name, description, about, learnings, tags, `thumbnail_type`, `thumbnail_image`, `thumbnail_video`, `banner_image`, `public`, `published`, `access_type` (`public` / `users_only` / `paid`), `price_amount`, `price_currency`, `seo` (JSONB), `extra_metadata` (JSONB), `collection_uuid`
- **Relationships**: belongs to Organization, has many members (through `collectioncourse`, cascade on delete) via polymorphic `resource_type` (`course` / `podcast`) + `resource_uuid`; the legacy nullable `course_id` is kept in sync for course members. Learner inventory claims live in `collectionuser` (`collection_id`, `user_id`, `org_id`, cascade on delete), mirroring the course `TrailRun` inventory without progress tracking.
- **Constraints**: no `users_only` member resources; published bundles only contain published resources; paid bundles require a positive price and at least one member
- **Purchase**: checkout snapshots every member UUID in `price_snapshot.resources` (and course-only members in `price_snapshot.courses`); the Chargily webhook grants one entitlement per member, plus one `TrailRun` per course member (podcasts are entitlement-only)

### Podcast

- **Represents**: An audio series owned by an organization, with the same editorial surface as a course
- **Key fields**: name, description, about, tags, `thumbnail_image`, `banner_image`, `public`, `published`, `access_type`, `price_amount`, `price_currency`, `seo` (JSONB), `extra_metadata` (hosts, total duration), `source_locale`
- **Relationships**: belongs to Organization, has many `PodcastEpisode` rows (cascade on delete), has many `PodcastTranslation` rows
- **Access**: public / users_only (user-group linked) / paid; unpublished content is only readable by authors, admins and maintainers

### PodcastEpisode

- **Represents**: One episode of a podcast
- **Key fields**: `title`, `description`, `audio_file`, `duration_seconds`, `episode_number`, `thumbnail_image`, `published`, `order`, `episode_uuid`
- **Relationships**: belongs to Podcast (cascade on delete), has many `PodcastEpisodeTranslation` rows
- **Notes**: episodes inherit the podcast's `source_locale`; audio, thumbnail and order are never localized

---

## Content Localization

Every translatable entity keeps **one base row in its source language** plus optional translation rows. Reads resolve `requested locale → base row`; a missing translation returns the source text with `is_fallback: true` (podcasts/collections also return `content_locale`).

| Base table | Source marker | Translation table | Translatable fields |
|---|---|---|---|
| `course` | `source_locale` | `course_translation` | name, description, about, learnings, tags, seo, extra_metadata |
| `chapter` / `activity` | parent course locale | — (inside `extra_metadata.translations[locale]`) | name, description, learning objectives, takeaways, resources, knowledge checks |
| `collection` | `source_locale` | `collection_translation` | name, description, about, learnings, tags, seo |
| `podcast` | `source_locale` | `podcast_translation` | name, description, about, tags, seo |
| `podcastepisode` | parent podcast locale | `podcast_episode_translation` | title, description |
| `community` | `source_locale` | `community_translation` | name, description |

Rules shared by these tables:

- Translation tables carry `locale`, `state` (`draft` / `machine` / `reviewed` / `published`), `source_updated_at`, `translated_by`, `creation_date`, `update_date`, and a unique constraint on `(parent_id, locale)`.
- Structural fields (media, price, access type, publish state, audio, ordering) are **never** localized.
- People lists (`course.extra_metadata.instructors`, `podcast.extra_metadata.hosts`) are structural: the entries, their order and avatars live on the base row. Only `name` and `title` are translated, index-aligned (`extra_metadata.instructors` / `extra_metadata.hosts` on the translation row) and merged by `src/services/people_locale.py`.
- Overlays are applied **after** access/lock checks, so a translation can never reveal locked content.
- List endpoints localize with **one** translation query per page (`apply_*_overlay_bulk`), never one per row.

Migration files: `w6b7c8d9e0f1_add_course_translations.py`, `y0f1a2b3c4d5_add_collection_translations.py`, `z1a2b3c4d5e6_add_podcast_translations.py`, `d5e6f7a8b9c0_add_community_translations.py`.

---

## Database

- **PostgreSQL** with `pgvector` extension (for AI embeddings)
- **SQLModel** ORM (Python) --- combines SQLAlchemy + Pydantic
- **Alembic** for database migrations
- Migrations stored in `apps/api/migrations/versions/`
- Dev database accessible via `docker exec -it learnhouse-db-dev psql -U learnhouse -d learnhouse`
