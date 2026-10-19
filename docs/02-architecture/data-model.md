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
- **Relationships**: belongs to Organization, has many members (through `collectioncourse`, cascade on delete) via polymorphic `resource_type` (`course` / `podcast`) + `resource_uuid`; the legacy nullable `course_id` is kept in sync for course members
- **Constraints**: no `users_only` member resources; published bundles only contain published resources; paid bundles require a positive price and at least one member
- **Purchase**: checkout snapshots every member UUID in `price_snapshot.resources` (and course-only members in `price_snapshot.courses`); the Chargily webhook grants one entitlement per member, plus one `TrailRun` per course member (podcasts are entitlement-only)

---

## Database

- **PostgreSQL** with `pgvector` extension (for AI embeddings)
- **SQLModel** ORM (Python) --- combines SQLAlchemy + Pydantic
- **Alembic** for database migrations
- Migrations stored in `apps/api/src/db/migrations/`
- Dev database accessible via `docker exec -it learnhouse-db-dev psql -U learnhouse -d learnhouse`
