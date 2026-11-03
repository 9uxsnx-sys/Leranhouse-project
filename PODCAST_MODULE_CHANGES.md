# Podcast Module — All Changes

## 1. Backend — DB Model
**File:** `apps/api/src/db/podcasts/episodes.py`
- Added `extra_metadata` (JSONB) column to `PodcastEpisode` model
- Added to `PodcastEpisodeBase`, `PodcastEpisode` (table), `PodcastEpisodeUpdate`
- **Read** and **Create** inherit from Base (auto-included)

## 2. Backend — Seed Generator
**File:** `apps/api/src/services/seed/generators/podcasts.py`
- **Podcasts** now generate `extra_metadata` with: `learnings` (bullets), `target_audience` (for/not_for), `requirements` (bullets)
- **Episodes** now generate `extra_metadata` with: `key_points` (title + items[] per point group)
- Custom data for 5 specific named podcasts

## 3. Frontend — Podcast Main Page → Mirrors Course Page
**File:** `apps/web/app/orgs/[orgslug]/(withmenu)/podcast/[podcastuuid]/podcast.tsx`
- **Removed:** Episode list with search/sort/filter
- **Added course-style sections** using same components:
  - `CourseLearnings` — bullet points from `extra_metadata.learnings`
  - `CourseAudience` — check/X lists from `extra_metadata.target_audience`
  - `CourseCurriculum` — single chapter with episodes as activities
  - `CourseRequirements` — bullet list from `extra_metadata.requirements`
- Right sidebar kept identical (5 cards)

## 4. Frontend — Episode Page (New Route)
**New route:** `/podcast/[uuid]/episode/[id]`
**Files:**
- `apps/web/app/orgs/[orgslug]/(withmenu)/podcast/[podcastuuid]/episode/[episodeid]/page.tsx` — Server component (SEO, data fetch)
- `apps/web/app/orgs/[orgslug]/(withmenu)/podcast/[podcastuuid]/episode/[episodeid]/episode.tsx` — Client component (full layout)

**Layout mirrors course activity page:**
- Hero banner, two-column layout (flex-1 + w-72 sidebar)
- **Left column:** Header → Audio Player → Show Notes → Key Points → Transcript → What's Next → Prev/Next nav
- **Right sidebar:** `EpisodeOutlineSidebar` (episode list) + `OnThisPageSidebar` (scroll-spy)

## 5. Frontend — New Components
- **`EpisodePlayer.tsx`** — Full-width audio player using shared `PodcastPlayerContext`
- **`EpisodeOutlineSidebar.tsx`** — Episode list with play/complete status icons
- **`OnThisPageSidebar`** — Inline scroll-spy navigation (same as course page)

## 6. Frontend — EpisodeCard Modified
**File:** `apps/web/components/Objects/Podcasts/EpisodeCard.tsx`
- Changed click handler from `playEpisode()` (bottom bar) → `router.push()` to episode page

## 7. Frontend — Admin: EditPodcastGeneral
**File:** `apps/web/components/Dashboard/Pages/Podcast/EditPodcastGeneral/EditPodcastGeneral.tsx`
- Added **What You'll Learn** editor (reuses `LearningItemsList` from courses)
- Added **Target Audience** editor (For / Not For lists)
- Added **Requirements** editor (reuses `LearningItemsList` from courses)
- All persisted in `extra_metadata`

## 8. Frontend — Admin: EditPodcastEpisodes
**File:** `apps/web/components/Dashboard/Pages/Podcast/EditPodcastEpisodes/EditPodcastEpisodes.tsx`
- Added **Key Points** editor (reuses `TakeawayItemsList` from courses)
- Saved into `extra_metadata.key_points` on episode update

## 9. Frontend — Type Update
**File:** `apps/web/services/podcasts/podcasts.ts`
- Added `extra_metadata?: Record<string, any> | null` to `PodcastEpisode` interface
