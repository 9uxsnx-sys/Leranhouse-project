# Communities Feature

> Communities are course-linked social spaces where students and instructors interact through discussions, comments, and reactions. Each community has a three-dimensional access control model that determines who can see and interact with it.

---

## Access Control Model

Every community has three independent access dimensions:

| Dimension | Values | What it controls |
|-----------|--------|-----------------|
| **Public / Restricted** | `public: bool` | Who can *find* the community. Public = discoverable by anyone. Restricted = only visible to linked UserGroups (typically course enrollees). |
| **Published / Unpublished** | `published: bool` | Whether the community is *live*. Unpublished = invisible to everyone except admins. Used to prepare content before going live. |
| **UserGroup links** | `course_id: uuid` | Which specific users get access when the community is restricted. Communities can be linked to a course -- users enrolled in that course (via the course's UserGroup) get automatic access. |

These three dimensions combine to produce the full access matrix:

### Access Matrix

| State | Anonymous | Signed-in (no UserGroup) | UserGroup members | Admins |
|-------|-----------|--------------------------|-------------------|--------|
| **Public + Published** | Can read | Can read | Can read | Full |
| **Public + Unpublished** | Blocked | Blocked | Blocked | Full |
| **Restricted + Published** | Blocked | Blocked | Can read | Full |
| **Restricted + Unpublished** | Blocked | Blocked | Blocked | Full |

**The rule:** `published` is the master on/off switch. If a community is unpublished, nobody except admins can see it -- regardless of public/restricted status or UserGroup membership. Once published, the `public`/`restricted` setting determines visibility scope.

### User Scenarios

| Scenario | What happens |
|----------|-------------|
| **Free user browsing** | Sees only communities that are `public + published`. Restricted or unpublished communities are completely invisible. |
| **Paid user (course enrollee)** | Sees communities linked to their course (via UserGroup) -- but only if `published`. Also sees `public + published` communities. |
| **Admin preparing a community** | Sets it to `unpublished`. Nobody sees it. Prepares content, discussions, moderation settings. When ready, clicks Publish. |
| **Admin taking a community offline** | Sets it to `unpublished`. Community becomes invisible to all users. Existing discussions are preserved. Can re-publish later. |
| **Public community going live** | Admin sets `published=True`. Community becomes visible to everyone immediately. |
| **Restricted community going live** | Admin sets `published=True`. Only users linked via the course UserGroup can see it. |

---

## Architecture

### Data Model

The `published` field lives on the `Community` table alongside `public`:

```python
class CommunityBase(SQLModel):
    name: str
    description: Optional[str]
    public: bool = True
    published: bool = Field(default=False)  # Master on/off switch
    thumbnail_image: Optional[str] = ""
```

A composite index optimizes the common listing query:

```python
Index("ix_community_org_public_published_created",
      "org_id", "public", "published", "creation_date")
```

### RBAC Integration

The RBAC system enforces the published check automatically when `has_published_field=True` is set in the resource config. This affects:

- **Anonymous read access** -- `_check_anonymous_read_access()` denies access to unpublished communities
- **Public view read access** -- `_check_public_view_read_access()` denies access to unpublished communities  
- **UserGroup access** -- even users in linked UserGroups cannot access unpublished communities
- **Individual resource access** -- `get_community_user_rights()` checks `published` before granting any access

Only admins (org admin role or superadmin) bypass the published check.

### Listing Filter

The `get_communities_by_org()` service function filters at the query level:

| User type | Filter applied |
|-----------|---------------|
| Anonymous | `public == True AND published == True` |
| Regular user | `published == True` AND (`public == True` OR in linked UserGroup) |
| Admin | No filter (sees all) |
| Superadmin | No filter (sees all) |

---

## Community Edit Tabs

Each community is edited via a tabbed interface in the dashboard. The tabs map to the following components:

| Tab | Component | Purpose |
|-----|-----------|---------|
| **General** | `CommunityEditGeneral` | Community name, description, **Media section** (thumbnail upload), **Publish/Unpublish button** |
| **Access** | `CommunityEditAccess` | Public/restricted toggle with confirmation, course linking |
| **Moderation** | `CommunityEditModeration` | Word filtering, moderation settings, banned words list |
| **Course** | `CommunityEditCourse` | Link/unlink community to a course |

### Publish/Unpublish Flow (General tab)

1. Admin clicks Publish/Unpublish button in the action row
2. Button shows loading state while API call is in progress
3. API updates `published` field on the community
4. Community context dispatches optimistic update (rolls back on error)
5. SWR cache revalidates
6. Toast notification shows success/error

### Media Section (General tab)

The thumbnail upload is a compact row inside the General tab (not a separate tab):

```
┌───────────────────────────────────────────────────────────────┐
│ [ImageIcon]  Community Cover Image              [UploadCloud] │
│                                                     or        │
│                                              [Trash2] (delete) │
└───────────────────────────────────────────────────────────────┘
```

**States:**

- **No image:** Shows an UploadCloud icon button. Clicking it opens a file picker (JPG/PNG only, max 8MB).
- **Has image:** Shows a Trash2 icon button. Clicking it deletes the thumbnail image.
- **Loading:** The action icon is replaced by a small spinning circle (same 18px size).

**Flow:**

1. Click the upload icon to pick a file from device
2. File is validated client-side (type + size)
3. Uploaded via `FormData` to `PUT /communities/{uuid}/thumbnail`
4. On success, CommunityContext dispatches the updated community, SWR cache revalidates (both single community and list), and `router.refresh()` triggers server re-render
5. Click the trash icon to delete — sends `DELETE /communities/{uuid}/thumbnail`, same revalidation flow
6. On error, toast shows the failure reason

### Public/Restricted Flow (Access tab)

1. Admin toggles the public/restricted switch
2. Confirmation modal appears explaining the impact
3. On confirm, API updates `public` field
4. Community context updates
5. If restricted, admin can link the community to a specific course (which controls UserGroup access)

---

## Related Services

| Service | File | Purpose |
|---------|------|---------|
| Community CRUD | `src/services/communities/communities.py` | Create, read, update, delete communities |
| Discussions | `src/services/communities/discussions.py` | Discussion threads within communities |
| Comments | `src/services/communities/comments.py` | Comments on discussions and activities |
| Moderation | `src/services/communities/moderation.py` | Content moderation, word filtering |
| Reactions | `src/services/communities/reactions.py` | Emoji reactions on content |
| Votes | `src/services/communities/votes.py` | Upvote/downvote on discussions |

---

## Frontend Context

Community state is managed through `CommunityContext` (`@components/Contexts/CommunityContext`), which provides:

- `community` -- Current community data object
- `dispatch` -- Dispatch function for state updates
- Community membership information

See [CommunityContext documentation](../../05-developer-guide/frontend/contexts.md) for details.

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/communities/` | List communities (filtered by access) |
| GET | `/api/v1/communities/{uuid}` | Get single community |
| GET | `/api/v1/communities/by-course/{course_uuid}` | Get community linked to a course |
| POST | `/api/v1/communities/` | Create community |
| PUT | `/api/v1/communities/{uuid}` | Update community (including publish/unpublish) |
| DELETE | `/api/v1/communities/{uuid}` | Delete community |
| GET | `/api/v1/communities/{uuid}/rights` | Get user's rights for a community |
| POST | `/api/v1/communities/{uuid}/link-course` | Link community to a course |
| POST | `/api/v1/communities/{uuid}/unlink-course` | Unlink community from a course |
| PUT | `/api/v1/communities/{uuid}/thumbnail` | Upload community thumbnail |
| DELETE | `/api/v1/communities/{uuid}/thumbnail` | Remove community thumbnail |

---

## Testing

See the [Testing Guide](../../05-developer-guide/testing/README.md) for community-specific testing patterns:

- [Boolean toggle template](../../05-developer-guide/testing/api/07-template-boolean.md) -- testing publish/unpublish
- [Authz template](../../05-developer-guide/testing/api/10-template-authz.md) -- testing access control
- [Upload template](../../05-developer-guide/testing/api/08-template-upload.md) -- testing thumbnail upload
- [Live validation example](../../05-developer-guide/testing/api/18-live-validation.md) -- curl-based community testing
