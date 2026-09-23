# Course Contributors

> Adding co-authors and instructors to collaborate on course creation.

---

## Overview

The **Contributors** tab allows you to add other users as co-authors or instructors on your course. This is useful for team-based course creation, where multiple people need to build content, manage lessons, or oversee the course.

Each contributor can have different permission levels, giving you fine-grained control over who can do what.

---

## Adding a Contributor

1. Open the course editor and navigate to the **Contributors** tab
2. Click the **Add Contributor** button
3. In the search field that appears, start typing the user's name or email
4. Select the user from the search results
5. Choose a **permission level** from the dropdown
6. Click **Add** to confirm

```
┌─── Contributors ─────────────────────────────────┐
│                                                    │
│  ┌─── Add Contributor ──────────────────────────┐ │
│  │                                               │ │
│  │  Search user...                    [🔍]      │ │
│  │                                               │ │
│  │  Suggested:                                   │ │
│  │  ○ Sara Meftah  — sara@example.com           │ │
│  │  ○ Ali Khelil   — ali@example.com            │ │
│  │                                               │ │
│  │  Permission: [Editor ▼]                      │ │
│  │                                               │ │
│  │  [Cancel]              [Add Contributor]      │ │
│  └───────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

---

## Permission Levels

Each contributor is assigned one of the following roles:

| Permission | Description |
|------------|-------------|
| **Editor** | Can create, edit, and delete modules and lessons. Cannot change course settings (access, pricing, certification, SEO, contributors). |
| **Manager** | Full control over course content and settings, including access configuration, pricing, certification, and SEO. Cannot add or remove other contributors. |
| **Owner** | Full control over everything, including the ability to add and remove contributors. Transfers primary ownership of the course. |

### Permission Matrix

| Action | Editor | Manager | Owner |
|--------|--------|---------|-------|
| Edit modules & lessons | ✅ | ✅ | ✅ |
| Change General settings | ❌ | ✅ | ✅ |
| Configure Access & pricing | ❌ | ✅ | ✅ |
| Configure Certification | ❌ | ✅ | ✅ |
| Edit SEO settings | ❌ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ |
| Add/remove contributors | ❌ | ❌ | ✅ |
| Publish/unpublish course | ❌ | ✅ | ✅ |
| Delete course | ❌ | ❌ | ✅ |

---

## Managing Contributors

Once contributors are added, they appear in a list:

```
┌─── Current Contributors ────────────────────────┐
│                                                   │
│  User             │ Role      │ Added      │      │
│  ──────────────── │ ───────── │ ────────── │ ──── │
│  You (you@org)    │ Owner     │ —          │      │
│  Sara Meftah      │ Editor    │ 20 Sep 26  │ [⋮] │
│  Ali Khelil       │ Manager   │ 18 Sep 26  │ [⋮] │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Changing a Contributor's Role

1. Click the **⋮ (3-dot menu)** next to the contributor
2. Select **Change Role**
3. Pick the new permission level from the dropdown
4. Confirm the change

### Removing a Contributor

1. Click the **⋮ (3-dot menu)** next to the contributor
2. Select **Remove**
3. Confirm the removal in the dialog that appears

> **Note:** Removing a contributor does not delete their content. All modules and lessons they created remain in the course.

---

## Collaboration Workflow

Here is how a typical team collaboration works:

```
Course Owner (You)
    │
    ├── Creates the course, sets access & pricing
    │
    ├── Adds Sara as Editor
    │     └── Sara builds lessons, adds knowledge checks
    │
    ├── Adds Ali as Manager
    │     └── Ali reviews content, adjusts SEO settings
    │
    └── Owner reviews final course, publishes it
```

### Best Practices

- **Start with one Editor** for content creation, then add more as needed
- **Use the Manager role** for trusted team members who need to configure settings but shouldn't manage the contributor list
- **Keep the Owner role** to a single person to avoid ownership conflicts
- **Communicate with contributors** about which modules or lessons they are responsible for to avoid overlapping work
- **Remove inactive contributors** to keep the contributor list clean

### Concurrent Editing

Multiple contributors can edit the same course simultaneously. Each editor works on their own session. The auto-save feature (600ms debounce) ensures changes are persisted, but be aware that:
- If two people edit the same lesson at the same time, the last save wins
- For larger teams, assign distinct modules to different editors to avoid conflicts

---

## UI Pattern

```
┌────────────────────────────────────────────────────┐
│  Page background: #f8f8f8                          │
│                                                     │
│  ┌─── White Card: Add Contributor ───────────────┐ │
│  │  Search input + permission dropdown + Add btn  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Current Contributors ──────────┐ │
│  │  Table: Name / Role / Added / Actions (⋮)     │ │
│  └───────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```
