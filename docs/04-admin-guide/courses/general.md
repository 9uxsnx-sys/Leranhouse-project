# General Settings

> Configuring the basic information of your course.

---

## Fields

### Course Name

The title displayed to learners. Required.

### Description

A short description of the course. Displayed on the course detail page.

### Difficulty

Three levels available:
- **Beginner** --- No prior knowledge required
- **Intermediate** --- Some prior knowledge helpful
- **Advanced** --- In-depth, expert-level content

Selected via a dropdown with clean menu styling.

### Thumbnail

The course cover image. Supported formats: PNG, JPG, WEBP.

### Offers Certificate

A toggle switch to enable/disable certificate issuance for course completion.

### Categories

Optional categories for organizing courses on the platform.

---

## UI Pattern

The General tab uses **sectioned white cards** on a light grey background:

```
┌─────────────────────────────────────┐
│  Page background: #f8f8f8           │
│                                     │
│  ┌─── White Card ─────────────────┐ │
│  │  SECTION TITLE                 │ │
│  │                                │ │
│  │  Field label                   │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │ Input field (bg-ui-bg)   │  │ │
│  │  └──────────────────────────┘  │ │
│  │                                │ │
│  │  Field label                   │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │ Input field (bg-ui-bg)   │  │ │
│  │  └──────────────────────────┘  │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─── White Card ─────────────────┐ │
│  │  NEXT SECTION                  │ │
│  │  ...                           │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Field Styling

Fields use a consistent class pattern:
```css
bg-ui-bg-field !shadow-none border border-ui-border-base
focus:border-ui-border-strong focus-visible:!shadow-none transition-none
```
