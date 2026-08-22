# Course Main Page Structure

The page users land on when clicking a course card — before entering a specific lesson.

---

## Layout: Two-Column

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────┬──────────────────┐  │
│  │                                  │                  │  │
│  │  HERO IMAGE (16:9, full width)   │     SIDEBAR      │  │
│  │                                  │                  │  │
│  ├──────────────────────────────────┤  75% Complete    │  │
│  │                                  │  ─────────────   │  │
│  │  COURSE TITLE (bold H1)          │                  │  │
│  │                                  │  Continue ▶      │  │
│  │  Short description               │                  │  │
│  │                                  │  ─── ─── ───     │  │
│  │  Stats: 24 lessons · 6h ·        │                  │  │
│  │  Beginner                        │  This course     │  │
│  │                                  │  includes:       │  │
│  ├─ What You'll Learn ──────────────┤  📹 6h video     │  │
│  │  ☐ Understand the fundamentals   │  📝 24 lessons   │  │
│  │  ☐ Build real-world projects     │  📄 3 resources  │  │
│  │  ☐ Master advanced techniques    │  🏆 Certificate  │  │
│  │  ☐ Apply best practices          │                  │  │
│  │  ☐ Deploy to production          │  ─── ─── ───     │  │
│  │                                  │                  │  │
│  ├─ Course Curriculum ──────────────┤  Instructor      │  │
│  │                                  │  [Avatar]        │  │
│  │  ▶ Module 1: Getting Started     │  John Doe        │  │
│  │     └─ 3 lessons · 45min         │  Professor at X  │  │
│  │  ▶ Module 2: Core Concepts       │                  │  │
│  │     └─ 5 lessons · 1h 30min      │  ─── ─── ───     │  │
│  │  ▶ Module 3: Advanced Topics     │                  │  │
│  │     └─ 4 lessons · 2h            │  Last updated:   │  │
│  │                                  │  March 2026      │  │
│  ├─ Requirements ───────────────────┤                  │  │
│  │  • Basic knowledge of X          │                  │  │
│  │  • Software Y installed          │                  │  │
│  │  • No prior experience needed    │                  │  │
│  │                                  │                  │  │
│  ├─ Description ────────────────────┤                  │  │
│  │  Full "about this course" text   │                  │  │
│  │  Goes into detail about what     │                  │  │
│  │  students will learn and why     │                  │  │
│  │  this course is valuable...      │                  │  │
│  │                                  │                  │  │
│  └──────────────────────────────────┴──────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Left Column (Content) — Top to Bottom

| # | Block | Description |
|---|-------|-------------|
| 1 | **Hero Image** | 16:9 aspect ratio, spans from sidebar to right edge |
| 2 | **Course Title** | Bold H1 heading — main course name |
| 3 | **Short Description** | 1-2 sentence summary of the course |
| 4 | **Course Stats** | Compact row: lessons count, total duration, difficulty level |
| 5 | **What You'll Learn** | Box with 4-6 bullet points of key learning outcomes |
| 6 | **Course Curriculum** | Accordion-style modules with expandable lesson lists, shows lesson count & duration per module |
| 7 | **Requirements** | Short list of prerequisites (if any) |
| 8 | **Full Description** | Detailed "about this course" section |

---

## Right Sidebar — Top to Bottom

| # | Block | Description |
|---|-------|-------------|
| 1 | **Progress Bar** | Shows completion percentage + Continue button |
| 2 | **Course Includes** | Stats card: video hours, lessons, resources, certificate |
| 3 | **Instructor Card** | Avatar, name, title/credentials — builds trust |
| 4 | **Last Updated** | Date of last course update |

---

## Design Principles

- **Medusa style** — clean, muted grays, subtle borders, no heavy shadows
- **Hero image** spans full content width (16:9), no rounded corners on edges
- **Sticky sidebar** — progress + instructor stay visible while scrolling curriculum
- **Curriculum accordion** — click to expand module, shows lesson titles + duration
- **Mobile** — sidebar collapses below hero image, curriculum becomes full width
- **No focus rings on inputs** — just blinking cursor (Apple/Linear style)
