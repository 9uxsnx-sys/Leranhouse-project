# Content Structure

> Managing modules and lessons in the Content tab.

---

## Overview

The Content tab is where you build the course structure. It has three levels of navigation:

```
Course
  └── Module (Chapter)
        └── Lesson (Activity)
              └── Lesson Detail (edit form)
```

---

## Module List

The top-level view shows all modules in the course.

### Toolbar

```
[Search...]    [N modules]              [+ New]  [Select]  [⇅]
```

| Element | Description |
|---------|-------------|
| Search | Filter modules by name |
| Count | Shows total module count |
| New | Creates a module immediately (with loading spinner) |
| Select | Toggle select mode for bulk actions |
| Sort | Toggle ascending/descending order |

### Module Cards

Each module is displayed as a card:

```
┌──────────────────────────────────────────────┐
│  ⠿  📁  Module Name                   [⋮]   │
└──────────────────────────────────────────────┘
```

- **Drag handle** (⠿) on the left — drag to reorder modules
- **Folder icon** next to the drag handle
- **Module name** centered
- **3-dot menu** on the right with Duplicate and Delete options

### Module Actions

- **Click** a module to view its lessons
- **Duplicate** --- creates a copy of the module
- **Delete** --- removes the module (with confirmation)
- **Drag** the drag handle to reorder modules — order persists via API

### Select Mode

Clicking **Select** in the toolbar toggles select mode:

```
┌──────────────────────────────────────────────┐
│  ☑  📁  Module Name                   [⋮]   │
└──────────────────────────────────────────────┘
```

- Drag handles are replaced with **checkboxes**
- Drag-and-drop is disabled
- Clicking a card toggles its checkbox
- Selected cards show a **blue ring** and filled checkbox
- Click **Cancel** to exit select mode and restore drag handles

---

## Lesson List

Clicking a module shows its lessons, using the **exact same layout** as the module list:

### Toolbar

```
[Search...]    [N lessons]              [+ New]  [Select]  [⇅]
```

### Lesson Cards

```
┌──────────────────────────────────────────────┐
│  ⠿  📄  Lesson Name                   [⋮]   │
└──────────────────────────────────────────────┘
```

- **Drag handle** (⠿) on the left — drag to reorder lessons within the module
- **FileText icon** next to the drag handle
- **Lesson name** only (no type badges/icons)
- **3-dot menu** with Duplicate and Delete

### Select Mode

Same as modules — clicking **Select** replaces drag handles with checkboxes:

```
┌──────────────────────────────────────────────┐
│  ☑  📄  Lesson Name                   [⋮]   │
└──────────────────────────────────────────────┘
```

- Drag handles are replaced with **checkboxes**
- Drag-and-drop is disabled
- Clicking a card toggles its checkbox
- Selected cards show a **blue ring** and filled checkbox

### Lesson Creation

Clicking **New** immediately creates a lesson with default name "New Lesson" and empty content. No modal or form --- matches module creation flow exactly.

---

## Lesson Detail Form

Clicking a lesson opens the detail form with sectioned white cards.

### Action Row

Above the sectioned cards, there is an inline **action row**:

```
[👁 Preview]        [Copy from source] [🌐 Language · Source/Translation] [Save] [Publish/Unpublish]
```

- **Copy from source** — translation locales only. Fills the form with the source-language text so the author rewrites what differs.
- **Language chip** — shows the dashboard's active language plus whether this lesson is the source (`Source`), has a translation (`Translation`), or inherits the source (`Missing`). The dot is teal when saved, amber when there are unsaved edits.
- **Preview** (left) — opens the lesson preview page in a new tab, showing how the lesson appears to learners: video slot, What You'll Learn, Key Takeaways, Resources, Knowledge Checks. Links to `/course/{uuid}/lesson-preview?activityid={id}`. The lesson's rich-text body is not rendered there — every block the learner reads is authored in this form.
- **Save** (right) — white background when saved, black background when unsaved. Clicking triggers an immediate save. Not clickable when already in saved state.
- **Publish/Unpublish** (right) — toggles the lesson's published state (shared across locales), saved via auto-save.

### Editing a translation

The Content tab follows the platform language switcher — there is no second selector. With a non-source language active:

- The module list and lesson list show the localized names.
- The form loads that language's `name`, `description`, objectives, takeaways, resources and knowledge checks; empty fields fall back to the source text.
- Saving writes only `extra_metadata.translations[locale]`. The base (source) lesson row is never modified, so a translator cannot rename or overwrite the source lesson.
- Auto-save is debounced (600 ms), flushes on unmount, and flushes into the language the text was typed in before you switch languages.

### Basic Information

```
┌──────────────────────────────────────────────┐
│  BASIC INFORMATION                            │
│                                               │
│  Lesson Name                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ Input field                              │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  Description                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ Input field                              │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### What You'll Learn

```
┌──────────────────────────────────────────────┐
│  WHAT YOU'LL LEARN                            │
│                                               │
│  ┌── Learning objective ───────────────────┐  │
│  │  ⠿  [text input]                    ✕   │  │
│  └─────────────────────────────────────────┘  │
│  ┌── Learning objective ───────────────────┐  │
│  │  ⠿  [text input]                    ✕   │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  + Add learning objective                     │
└──────────────────────────────────────────────┘
```

- Drag-and-drop to reorder
- Click + to add new item
- Click ✕ to remove

### Key Takeaways

Same pattern as What You'll Learn but hierarchical:

```
┌──────────────────────────────────────────────┐
│  KEY TAKEAWAYS                                │
│                                               │
│  ┌── Main point ──────────────────────────┐  │
│  │  ⠿  [title input]                  ✕   │  │
│  │  ┌── Sub-point ──────────────────────┐ │  │
│  │  │  ⠿  [text input]              ✕   │ │  │
│  │  └────────────────────────────────────┘ │  │
│  │  + Add sub-point                        │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  + Add main point                             │
└──────────────────────────────────────────────┘
```

### Resources

```
┌──────────────────────────────────────────────┐
│  RESOURCES                                    │
│                                               │
│  ┌── Resource ────────────────────────────┐  │
│  │  ⠿  [name input]  [url input]  🔗  📤 ✕ │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  + Add resource                               │
└──────────────────────────────────────────────┘
```

- **Link icon** (🔗) --- click to expand URL input field
- **Upload icon** (📤) --- file upload button
- **✕** --- delete resource

### Knowledge Checks

```
┌──────────────────────────────────────────────┐
│  KNOWLEDGE CHECKS                             │
│                                               │
│  ┌── Q&A pair ────────────────────────────┐  │
│  │  ⠿  [question input]               ✕   │  │
│  │     [answer input]                     │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  + Add question                               │
└──────────────────────────────────────────────┘
```

- One drag handle for the paired question + answer
- Both fields use transparent styling (no borders)

### Auto-Save

All lesson form fields auto-save with a **600ms debounce**. Changes are flushed on unmount so nothing is lost when navigating away.
