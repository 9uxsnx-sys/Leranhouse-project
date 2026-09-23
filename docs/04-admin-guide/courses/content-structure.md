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
│  📁  Module Name                       [⋮]   │
└──────────────────────────────────────────────┘
```

- **Folder icon** on the left
- **Module name** centered
- **3-dot menu** on the right with Duplicate and Delete options

### Module Actions

- **Click** a module to view its lessons
- **Duplicate** --- creates a copy of the module
- **Delete** --- removes the module (with confirmation)

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
│  📄  Lesson Name                       [⋮]   │
└──────────────────────────────────────────────┘
```

- **FileText icon** on the left
- **Lesson name** only (no type badges/icons)
- **3-dot menu** with Duplicate and Delete

### Lesson Creation

Clicking **New** immediately creates a lesson with default name "New Lesson" and empty content. No modal or form --- matches module creation flow exactly.

---

## Lesson Detail Form

Clicking a lesson opens the detail form with sectioned white cards:

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
