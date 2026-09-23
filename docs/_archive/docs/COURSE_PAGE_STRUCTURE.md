# Course Page Structure

## Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Page Title (Lesson Title)                                   │
├─────────────────────────────┬────────────────────────────────┤
│                             │                                │
│  ┌─ LEFT CONTENT AREA ───┐ │  ┌─ RIGHT SIDEBAR ──────────┐  │
│  │                        │ │  │                           │  │
│  │  What You'll Learn     │ │  │  COURSE OUTLINE          │  │
│  │  • Key point 1         │ │  │  (accordion block)       │  │
│  │  • Key point 2         │ │  │                           │  │
│  │  • Key point 3         │ │  │  Current Lesson Title     │  │
│  │                        │ │  │  Module X · Lesson Y of Z│  │
│  │  Main Lesson Video     │ │  │  ▼ (expand)              │  │
│  │  [  VIDEO PLAYER ]     │ │  │                           │  │
│  │                        │ │  │  When expanded:           │  │
│  │  Key Takeaways         │ │  │  Module 1                │  │
│  │  • Main point          │ │  │    ● Lesson 1  ◀         │  │
│  │    • Sub point         │ │  │    ○ Lesson 2            │  │
│  │    • Sub point         │ │  │    ○ Lesson 3            │  │
│  │  • Main point          │ │  │  Module 2                │  │
│  │    • Sub point         │ │  │    ○ Lesson 4            │  │
│  │                        │ │  │    ○ Lesson 5            │  │
│  │  Resources             │ │  │                           │  │
│  │  • File description    │ │  │  ON THIS PAGE            │  │
│  │    [download icon]     │ │  │  (Inline Tip style)      │  │
│  │  • File description    │ │  │                           │  │
│  │    [download icon]     │ │  │  │ Key Takeaways         │  │
│  │                        │ │  │  │ Resources             │  │
│  │  Quick Check           │ │  │  │ Quick Check           │  │
│  │  Q1: What is X?        │ │  │  │ Up Next              │  │
│  │  Q2: How does Y?       │ │  │  │                       │  │
│  │                        │ │  │  (active ▎ slides        │  │
│  │  Up Next               │ │  │   smoothly on scroll)    │  │
│  │  Preview card          │ │  │                           │  │
│  │                        │ │  │                           │  │
│  │  ◀ Previous            │ │  │                           │  │
│  │  Mark as Complete      │ │  │                           │  │
│  │  Next ▶                │ │  │                           │  │
│  │                        │ │  │                           │  │
│  └────────────────────────┘ │  └───────────────────────────┘  │
│                             │                                │
└─────────────────────────────┴────────────────────────────────┘
```

---

## Left Side: Lesson Content Blocks (Top to Bottom)

| # | Block | Purpose |
|---|-------|---------|
| 1 | **Lesson Title** | H1 heading — `text-3xl md:text-4xl font-semibold text-ui-fg-base` |
| 2 | **What You'll Learn** | Bullet points priming the learner before the video, in a white card with subtle border |
| 3 | **Main Lesson Video** | Main teaching content (embedded player, aspect-video container) |
| 4 | **Key Takeaways** | Summary of the lesson with main points and sub-points using bullet dots |
| 5 | **Resources** | Downloadable files listed with descriptions and download icon buttons |
| 6 | **Quick Check** | Q&A accordion cards (same style as curriculum module cards) |
| 7 | **Up Next** | Preview card for the next lesson (book icon + title + description) |
| 8 | **Navigation** | Previous (ghost) | Mark as Complete (primary) | Next (ghost) |

---

## Right Sidebar: Two Sections

### Section 1: Course Outline (Accordion Block)
- **Collapsed state**: Shows current lesson title prominently + "Module X · Lesson Y of Z" underneath
- **Expanded state**: Lists all modules with their lessons/quizzes underneath each module name
- **Active indicator**: Filled black circle with white dot (●) for current lesson, outlined circle (○) for others
- Quizzes show `FileQuestion` icon instead of circle
- Smooth expand/collapse animation (grid rows 0fr → 1fr)
- Clicking a lesson navigates to that lesson's page

### Section 2: On This Page (Inline Tip Style)
- Plain text links (no block/container)
- Each link shows a small vertical bar (4px wide, rounded pill) on the left when active
- Single indicator bar slides smoothly between shortcuts on scroll (CSS transition)
- Sections: What You'll Learn, Main Lesson Video, Key Takeaways, Resources, Quick Check, Up Next

---

## Design Principles

- **Medusa style** — clean, muted grays, subtle borders (`shadow-[0_0_0_1px_rgba(0,0,0,0.08)]`), no heavy shadows
- **Full lesson on one scrollable page** — no pagination within lesson
- **Two-column layout** — left content (`flex-1 min-w-0 max-w-3xl`) + right sidebar (`w-72 xl:w-80 shrink-0`)
- **Section spacing** — `space-y-12` between sections, `mb-5` between title and content
- **Sticky sidebar** — curriculum + anchor links stay visible while scrolling (`sticky top-8`)
- **Mobile** — sidebar collapses into two-column flex column layout
- **Section titles** — `!text-2xl` heading, no subtitles
- **Navigation** — Previous/Next as ghost buttons, Mark as Complete as primary button
- **No subtitles** under section titles for cleaner design
