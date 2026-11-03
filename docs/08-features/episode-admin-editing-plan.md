# Episode Admin Editing Plan

> **Status:** Phase 5 (frontend form) implemented. Backend + migration complete (Phases 1-4).
> **Goal:** match the lesson admin editing experience 1:1 for podcast episodes.
> **Current gap:** the episode form only edits `title` + `description` + audio. The API response model (`PodcastEpisodeRead`) omits `extra_metadata`, so the frontend cannot read or write learning objectives or takeaways for episodes.
> **Translation gap:** `podcast_episode_translation` only carries `title` and `description`. Fields in `extra_metadata` are always served in the source locale.
> **Status note:** All backend models, locale overlay functions, migration, frontend interfaces, and the `EpisodeDetailForm` have been updated. The admin form now shows What You'll Learn and Key Takeaways sections using the same `LearningItemsList` and `TakeawayItemsList` components as the lesson form. Saving includes `extra_metadata` for both source and non-source locales.

## Goal

Match the lesson admin editing experience 1:1 for podcast episodes. Currently the episode form only edits title + description + audio. We need to add:

- What You'll Learn (learning objectives list)
- Key Takeaways (grouped sections with sub-items)
- Resources (optional)
- Full translation support for all fields

---

## Architecture Comparison: Lessons vs. Episodes

| Aspect | Lessons (Activities) | Episodes (Current) |
|--------|---------------------|-------------------|
| Extra metadata storage | `extra_metadata` JSONB column | `extra_metadata` JSONB column (exists but unused) |
| Translation storage | `extra_metadata.translations[locale]` (embedded in JSONB) | Separate `podcast_episode_translation` table |
| Translation fields | name, description, learning_objectives, takeaways, resources, knowledge_checks | title, description only |
| Admin form | LessonDetailForm with 5 sections | EpisodeDetailForm with 2 fields |
| Locale resolution | `apply_activity_locale()` reads from `extra_metadata.translations` | `apply_episode_overlay()` reads from translation table |
| API for translation | No dedicated endpoint — PUT to activity with `extra_metadata` | Dedicated `PUT /episodes/{uuid}/translations/{locale}` |
| List editors used | LearningItemsList, TakeawayItemsList, ResourceItemsList, KnowledgeCheckItemsList | None |

---

## Approach: Two Options

### Option A: Extend Translation Table (Recommended)

Keep the existing separate translation table pattern (cleaner, more queryable) and extend it to support the new fields.

**Backend changes:**

1. **`PodcastEpisodeRead`** — Add `extra_metadata: Optional[dict]` to the response model
2. **`PodcastEpisodeTranslation`** — Add `extra_metadata: Optional[dict]` column (JSONB)
3. **`PodcastEpisodeTranslationUpsert`** — Add `extra_metadata: Optional[dict]`
4. **`apply_episode_overlay()`** — Apply `extra_metadata` from translation row onto the episode read model
5. **`apply_episode_overlay_bulk()`** — Same for bulk reads

No changes needed to the episode PUT endpoint — it already handles `extra_metadata` via `vars()` iteration.

**Frontend changes:**

1. **`PodcastEpisode` interface** (episodes.ts) — Add `extra_metadata: any`
2. **`EpisodeDetailForm`** — Add 3 new sections using existing components:
   - Import `LearningItemsList`, `TakeawayItemsList` from `@components/Dashboard/Pages/Course/EditCourseGeneral/`
   - What You'll Learn section → `<LearningItemsList>`
   - Key Takeaways section → `<TakeawayItemsList>`
   - Resources section → `<ResourceItemsList>` (optional, can skip)
3. **Save logic** — Follow lesson pattern:
   - Source locale: `updateEpisode()` with `{ extra_metadata: { learning_objectives, takeaways } }`
   - Non-source locale: `upsertEpisodeTranslation()` with `{ extra_metadata: { learning_objectives, takeaways } }` (needs API extension)
4. **Translation overlay on read** — When fetching episode for non-source locale, the API already applies overlay from translation table. We need the overlay to also include `extra_metadata` fields.

### Option B: Switch to Lesson Pattern (More Work)

Abandon the separate translation table for episodes and switch to `extra_metadata.translations[locale]` like lessons do.

This would require:
- Deprecating the `podcast_episode_translation` table for new data
- Migrating existing translation data into `extra_metadata.translations`
- Changing `apply_episode_overlay()` to read from `extra_metadata.translations`
- Changing the frontend translation hook to read/write `extra_metadata.translations`

**Not recommended** — it's a breaking change, requires migration, and the separate table is a newer/better pattern.

---

## Detailed Implementation Plan (Option A)

### Phase 1: Backend — Extend Models

#### 1a. `PodcastEpisodeRead` — Add `extra_metadata`

File: `apps/api/src/db/podcasts/episodes.py`

```python
class PodcastEpisodeRead(PodcastEpisodeBase):
    id: int
    podcast_id: int
    org_id: int
    episode_uuid: str
    creation_date: str
    update_date: str
    thumbnail_image: Optional[str] = Field(default="")
    extra_metadata: Optional[dict] = None  # ADD THIS
```

#### 1b. `PodcastEpisodeTranslation` — Add `extra_metadata` column

File: `apps/api/src/db/podcast_translations.py`

```python
class PodcastEpisodeTranslation(SQLModel, table=True):
    # ... existing fields ...
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSONB))  # ADD
```

#### 1c. `PodcastEpisodeTranslationUpsert` — Add `extra_metadata`

```python
class PodcastEpisodeTranslationUpsert(SQLModel):
    title: str
    description: Optional[str] = None
    state: Optional[str] = None
    extra_metadata: Optional[dict] = None  # ADD
```

### Phase 2: Backend — Update Locale Resolution

#### 2a. Update `apply_episode_overlay()`

File: `apps/api/src/services/podcasts/translations.py`

Current code overlays only `title` and `description`. Extend to also overlay `extra_metadata`:

```python
def apply_episode_overlay(model, episode, source_locale, locale, db_session):
    # ... existing logic ...
    if not translation:
        return model
    
    update_dict = {
        "title": translation.title,
        "description": translation.description,
    }
    if translation.extra_metadata:
        # Merge translation's extra_metadata into the episode's extra_metadata
        source_meta = episode.extra_metadata or {}
        # The translation row holds only the locale-specific overrides
        update_dict["extra_metadata"] = {**source_meta, **translation.extra_metadata}
    
    return model.model_copy(update=update_dict)
```

Same pattern for `apply_episode_overlay_bulk()`.

### Phase 3: Frontend — Extend Episode Service

#### 3a. Add `extra_metadata` to `PodcastEpisode` interface

File: `apps/web/services/podcasts/episodes.ts`

```typescript
export interface PodcastEpisode {
  // ... existing fields ...
  extra_metadata?: any
}
```

#### 3b. Update `updateEpisode` to support partial extra_metadata

No change needed — `updateEpisode()` already passes any data as-is via PUT. The backend handles partial updates via `exclude_unset`.

#### 3c. Update translation payload type

File: `apps/web/services/podcasts/podcastTranslations.ts`

```typescript
export type PodcastEpisodeTranslationPayload = {
  title: string
  description?: string | null
  state?: string
  extra_metadata?: Record<string, any> | null  // ADD
}
```

### Phase 4: Frontend — Extend EpisodeDetailForm

#### 4a. Import list editor components

```typescript
import LearningItemsList from '../../Course/EditCourseGeneral/LearningItemsList'
import TakeawayItemsList from '../../Course/EditCourseGeneral/TakeawayItemsList'
```

#### 4b. Add state for new fields

Following the lesson pattern in `LessonDetailForm.tsx`:

```typescript
// Helper functions (same as LessonDetailForm)
const toObjectivesStr = (items: string[]) => JSON.stringify(items.map((text, i) => ({ id: `obj_${i}`, text, emoji: '📝' })))
const readObjectives = (jsonStr: string): string[] => { /* same */ }
const readArray = (jsonStr: string): any[] => { /* same */ }

// State
const [extraMeta, setExtraMeta] = useState<Record<string, any>>(episode.extra_metadata || {})
const extraMetaRef = useRef(extraMeta)

const [learningObjectives, setLearningObjectives] = useState(
  toObjectivesStr(extraMeta.learning_objectives || [])
)
const [takeaways, setTakeaways] = useState(
  JSON.stringify(extraMeta.takeaways || [])
)
```

#### 4c. Save logic (source locale)

```typescript
if (isSourceLocale) {
  await updateEpisode(episode.episode_uuid, {
    title,
    description,
    extra_metadata: {
      ...extraMeta,
      learning_objectives: readObjectives(learningObjectives),
      takeaways: readArray(takeaways),
    },
  }, accessToken)
}
```

#### 4d. Save logic (non-source locale / translation)

```typescript
if (!isSourceLocale) {
  await upsertEpisodeTranslation(
    episode.episode_uuid,
    contentLocale,
    {
      title,
      description,
      extra_metadata: {
        learning_objectives: readObjectives(learningObjectives),
        takeaways: readArray(takeaways),
      },
    },
    accessToken
  )
}
```

#### 4e. Render sections in the form

Add after the Overview section and before the Media section:

```tsx
{/* What You'll Learn */}
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
    What You'll Learn
  </h3>
  <LearningItemsList
    value={learningObjectives}
    onChange={setLearningObjectives}
  />
</div>

{/* Key Takeaways */}
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
  <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
    Key Takeaways
  </h3>
  <TakeawayItemsList
    value={takeaways}
    onChange={setTakeaways}
  />
</div>
```

#### 4f. Handle locale switching (same pattern as LessonDetailForm)

- Flush pending edits before switching locale
- Load the translation's `extra_metadata` when switching to a non-source locale
- Use `useEpisodeTranslation()` hook (already exists)

### Phase 5: Database Migration

Alembic migration to add `extra_metadata` column to `podcast_episode_translation` table:

```python
"""Add extra_metadata to podcast_episode_translation

Revision ID: xxxx
Revises: yyyy
"""
def upgrade():
    op.add_column('podcast_episode_translation', 
        sa.Column('extra_metadata', sa.dialects.postgresql.JSONB(), nullable=True))
```

---

## Files to Modify (Summary)

### Backend (4 files)
| File | Change |
|------|--------|
| `apps/api/src/db/podcasts/episodes.py` | Add `extra_metadata` to `PodcastEpisodeRead` |
| `apps/api/src/db/podcast_translations.py` | Add `extra_metadata` column to table model + upsert model |
| `apps/api/src/services/podcasts/translations.py` | Update `apply_episode_overlay()` and `apply_episode_overlay_bulk()` to apply `extra_metadata` |
| Alembic migration file | Add column to `podcast_episode_translation` table |

### Frontend (3 files)
| File | Change |
|------|-------|
| `apps/web/services/podcasts/episodes.ts` | Add `extra_metadata` to `PodcastEpisode` interface |
| `apps/web/services/podcasts/podcastTranslations.ts` | Add `extra_metadata` to `PodcastEpisodeTranslationPayload` |
| `apps/web/components/Dashboard/Pages/Podcast/EditPodcastEpisodes/EditPodcastEpisodes.tsx` | Extend `EpisodeDetailForm` with Learning Items + Takeaway Items sections, update save/translation logic |

---

## Translation Flow (How Language Switching Will Work)

1. **User edits in source locale** (e.g., English):
   - Changes go to `PUT /episodes/{uuid}` with `{ extra_metadata: { learning_objectives: [...], takeaways: [...] } }`
   - Data is stored in the episode row's `extra_metadata` JSONB column

2. **User switches to a non-source locale** (e.g., French):
   - `useEpisodeTranslation()` fetches `GET /episodes/{uuid}/translations`
   - If a translation row exists for French with `extra_metadata`, those values are loaded
   - If no translation exists, the form shows the source values (fallback)
   - A "missing translation" banner is shown (like lessons do)

3. **User saves in non-source locale**:
   - Changes go to `PUT /episodes/{uuid}/translations/{locale}` with `{ extra_metadata: { learning_objectives: [...], takeaways: [...] } }`
   - Data is stored in the `podcast_episode_translation` row
   - The source episode row is NEVER modified

4. **On the public episode page**:
   - `apply_episode_overlay()` checks if a translation row exists for the requested locale
   - If yes, it overlays `title`, `description`, and `extra_metadata` onto the read model
   - The episode page reads `episode.extra_metadata.learning_objectives` and `episode.extra_metadata.takeaways` — already localized

---

## Why This Matches the Lesson Pattern

| Lesson Behavior | Episode Equivalent |
|----------------|-------------------|
| LessonDetailForm with 5 sections | EpisodeDetailForm with same sections |
| `LearningItemsList` for objectives | Same component, reused |
| `TakeawayItemsList` for takeaways | Same component, reused |
| Source locale → `PUT /activity` with `extra_metadata` | Source locale → `PUT /episode` with `extra_metadata` |
| Non-source → `extra_metadata.translations[locale]` | Non-source → translation table with `extra_metadata` |
| Auto-save with debounce (600ms) | Same pattern, opt-in |
| Copy from source button | Same button, works as-is |
| Locale indicator (green/amber dot) | Same indicator, works as-is |
| `isSourceLocale` detection | Same `useEpisodeTranslation()` hook, works as-is |

The only structural difference is where translations are stored (separate table vs. embedded JSONB), which is actually cleaner and doesn't affect the user experience at all.
