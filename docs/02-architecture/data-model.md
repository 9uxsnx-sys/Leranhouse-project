# Data Model

> Core entities and their relationships.

---

## Entity Relationship Diagram

```
Organization
     |
     +-- User
     |     +-- UserGroup (many-to-many)
     |
     +-- Course
     |     +-- Chapter (Module)
     |     |     +-- Activity (Lesson)
     |     |           +-- extra_metadata (JSONB)
     |     +-- CourseContributor
     |
     +-- UserGroup
     |     +-- CourseAccess (linking)
     |
     +-- Community
     |     +-- Discussion
     |
     +-- Board (collaborative whiteboard)
     |
     +-- Certificate
     |
     +-- Collection (course bundle)
     |     +-- CollectionTranslation (per locale)
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
- **Key fields**: name, slug, logo, branding config, domain
- **Relationships**: has many Users, Courses, Communities
- **Settings**: custom branding, SSO, SEO, feature flags

### User

- **Represents**: A person using the platform
- **Key fields**: email, password_hash, name, role
- **Relationships**: belongs to Organization, can be in multiple UserGroups
- **Auth**: supports password, OAuth, SSO, API tokens

### Course

- **Represents**: A learning course
- **Key fields**: name, description, difficulty, thumbnail_image, banner_image, thumbnail_video, price, access_type
- **Access types**: `public`, `users_only`, `paid` (future)
- **Relationships**: belongs to Organization, has many Chapters, Contributors
- **Metadata**: extra_metadata JSONB for flexible attributes

### Chapter (Module)

- **Represents**: A module within a course
- **Key fields**: title, description, sort_order
- **Relationships**: belongs to Course, has many Activities
- **Supports**: drag-and-drop reordering

### Activity (Lesson)

- **Represents**: A lesson within a module
- **Key fields**: name, content, type, activity_uuid, sort_order, published
- **Types**: `TYPE_VIDEO`, `TYPE_DOCUMENT`, `TYPE_DYNAMIC`, `TYPE_ASSIGNMENT`, `TYPE_CUSTOM`, `TYPE_SCORM`
- **Relationships**: belongs to Chapter
- **Metadata**: extra_metadata JSONB stores:
  - `learning_objectives`: string[]
  - `takeaways`: { title: string, items: string[] }[]
  - `resources`: { name: string, url: string, file?: any }[]
  - `knowledge_checks`: { question: string, answer: string }[]
- **Supports**: drag-and-drop reordering, published/unpublished toggle

### UserGroup

- **Represents**: A group of users for access control
- **Key fields**: name, description
- **Relationships**: many-to-many with User, many-to-many with Course (access links)

### Community

- **Represents**: A discussion community
- **Key fields**: name, description, icon
- **Relationships**: belongs to Organization, has many Discussions

### Board

- **Represents**: A collaborative whiteboard
- **Key fields**: name, content (Yjs document)
- **Relationships**: belongs to Organization
- **Technology**: powered by Yjs/Hocuspocus realtime sync

### Certificate

- **Represents**: A course completion certificate
- **Key fields**: name, design, passing_criteria
- **Relationships**: belongs to Organization, linked to Course

### Collection

- **Represents**: A sellable bundle of courses and podcasts, with the same editorial surface as a course
- **Key fields**: name, description, about, learnings, tags, `thumbnail_type`, `thumbnail_image`, `thumbnail_video`, `banner_image`, `public`, `published`, `access_type` (`public` / `users_only` / `paid`), `price_amount`, `price_currency`, `seo` (JSONB), `collection_uuid`
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

Rules shared by these tables:

- Translation tables carry `locale`, `state` (`draft` / `machine` / `reviewed` / `published`), `source_updated_at`, `translated_by`, `creation_date`, `update_date`, and a unique constraint on `(parent_id, locale)`.
- Structural fields (media, price, access type, publish state, hosts, audio, ordering) are **never** localized.
- Overlays are applied **after** access/lock checks, so a translation can never reveal locked content.
- List endpoints localize with **one** translation query per page (`apply_*_overlay_bulk`), never one per row.

Migration files: `w6b7c8d9e0f1_add_course_translations.py`, `y0f1a2b3c4d5_add_collection_translations.py`, `z1a2b3c4d5e6_add_podcast_translations.py`.

---

## Database

- **PostgreSQL** with `pgvector` extension (for AI embeddings)
- **SQLModel** ORM (Python) --- combines SQLAlchemy + Pydantic
- **Alembic** for database migrations
- Migrations stored in `apps/api/migrations/versions/`
- Dev database accessible via `docker exec -it learnhouse-db-dev psql -U learnhouse -d learnhouse`
