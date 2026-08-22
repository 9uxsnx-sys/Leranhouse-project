# Course Page Structure

## Layout Overview

```
┌──────────────────────────────────────────────────────────┐
│  Breadcrumb / Course Title                               │
├──────────────────────────────┬───────────────────────────┤
│                              │                           │
│  ┌─ LEFT CONTENT AREA ────┐  │  ┌─ RIGHT SIDEBAR ────┐  │
│  │                         │  │  │                      │  │
│  │  Lesson Title           │  │  │  COURSE OUTLINE      │  │
│  │                         │  │  │                      │  │
│  │  ┌─ What You'll Learn ─┐│  │  │  Module 1: Title    │  │
│  │  │  • Key point 1      ││  │  │  ├─ Lesson 1        │  │
│  │  │  • Key point 2      ││  │  │  ├─ Lesson 2  ◀     │  │
│  │  │  • Key point 3      ││  │  │  └─ Lesson 3        │  │
│  │  └─────────────────────┘│  │  │  Module 2: Title    │  │
│  │                         │  │  │  ├─ Lesson 4        │  │
│  │  ┌─ Video ────────────┐│  │  │  ├─ Lesson 5        │  │
│  │  │  [  VIDEO PLAYER ] ││  │  │  └─ Lesson 6        │  │
│  │  └─────────────────────┘│  │  │                      │  │
│  │                         │  │  │  ─── ─── ─── ───    │  │
│  │  ┌─ Exercise ──────────┐│  │  │                      │  │
│  │  │  Hands-on task      ││  │  │  ON THIS PAGE        │  │
│  │  └─────────────────────┘│  │  │                      │  │
│  │                         │  │  │  • What You'll Learn │  │
│  │  ┌─ Resources ─────────┐│  │  │  • Video             │  │
│  │  │  📎 file.zip        ││  │  │  • Exercise          │  │
│  │  │  📎 cheatsheet.pdf  ││  │  │  • Resources         │  │
│  │  └─────────────────────┘│  │  │  • Knowledge Check   │  │
│  │                         │  │  │  • What's Next       │  │
│  │  ┌─ Knowledge Check ───┐│  │  └──────────────────────┘  │
│  │  │  Q1: What is X?     ││  │                           │
│  │  │  Q2: How does Y?    ││  │                           │
│  │  └─────────────────────┘│  │                           │
│  │                         │  │                           │
│  │  ┌─ What's Next ───────┐│  │                           │
│  │  │  Up next: Lesson 4  ││  │                           │
│  │  └─────────────────────┘│  │                           │
│  │                         │  │                           │
│  │  ◀ Previous  │  Mark ✅ │  │                           │
│  │                         │  │                           │
│  └─────────────────────────┘  │                           │
│                              │                           │
├──────────────────────────────┴───────────────────────────┤
│  Footer                                                   │
└──────────────────────────────────────────────────────────┘
```

---

## Left Side: Lesson Content Blocks (Top to Bottom)

| # | Block | Purpose |
|---|-------|---------|
| 1 | **Lesson Title** | H1 heading — what this lesson is about |
| 2 | **What You'll Learn** | 3-5 bullet points priming the learner before the video |
| 3 | **Video** | Main teaching content (embedded player, 5-15 min) |
| 4 | **Practice / Exercise** | Hands-on task applying what was just learned |
| 5 | **Downloadable Resources** | Code files, PDFs, cheatsheets, templates |
| 6 | **Knowledge Check** | 2-3 quick quiz questions to verify understanding |
| 7 | **What's Next** | Preview card for the next lesson (title + description) |
| 8 | **Navigation** | ◀ Previous Lesson & Mark Complete ▶ buttons |

---

## Right Sidebar: Two Sections

### Section 1: Course Outline (Top)
- Full list of all modules/chapters with their lessons
- Current lesson highlighted with active indicator
- Completed lessons show checkmark (✅)
- Locked lessons show lock icon (🔒)
- Clicking a lesson navigates to that lesson's page

### Section 2: On This Page (Bottom)
- Anchor links to each section of the current lesson
- Clicking scrolls smoothly to that section
- Active section highlights as user scrolls (Intersection Observer)
- Sections: What You'll Learn, Video, Exercise, Resources, Knowledge Check, What's Next

---

## Design Principles

- **Medusa style** — clean, muted grays, subtle borders, no heavy shadows
- **Full lesson on one scrollable page** — no pagination within lesson
- **Sticky sidebar** — curriculum + anchor links stay visible while scrolling
- **Mobile** — sidebar collapses into a top drawer / accordion
- **Progression** — Mark Complete unlocks next lesson, updates progress bar
- **No focus rings on inputs** — just blinking cursor (Apple/Linear style)
