# Podcasts

> Audio content on Koodook.

---

Podcasts are audio-based learning content. You can listen to them directly in the platform.

## Features

- Stream podcasts directly in the browser
- Browse podcast episodes
- Follow podcast series
- Listen while browsing other parts of the platform

## Episode Management (Admin)

Podcast episodes can be managed in the admin dashboard under **Podcasts > [Podcast] > Episodes**.

### Episode Cards

Each episode appears as a card with a drag handle on the left:

```
┌──────────────────────────────────────────────┐
│  ⠿  🎵  Episode Title  [Published/Draft] [⋮]│
└──────────────────────────────────────────────┘
```

- **Drag handle** — drag to reorder episodes
- **Music icon** — visual identifier
- **Episode title** — click to edit episode details (title, description, audio file)
- **Status badge** — shows Published (green) or Draft (yellow)
- **3-dot menu** — Duplicate and Delete options

### Drag-and-Drop Reordering

- Drag episodes up or down to set a custom order
- Order is persisted immediately via API
- In the public podcast page, episodes appear in the custom order (first dragged to the top shows first to users)

### Select Mode

Clicking **Select** in the toolbar replaces drag handles with checkboxes:

```
┌──────────────────────────────────────────────┐
│  ☑  🎵  Episode Title  [Published/Draft] [⋮]│
└──────────────────────────────────────────────┘
```

- Drag-and-drop is disabled in select mode
- Click a card to toggle its checkbox
- Selected cards show a blue ring and filled checkbox

### Episode Detail Form

Clicking an episode opens the detail form with:

- **Preview button** — opens the public podcast page in a new tab
- **Save button** — saves episode changes
- **Title field** — edit the episode title
- **Description field** — edit the episode description
- **Audio upload** — upload or replace the audio file
