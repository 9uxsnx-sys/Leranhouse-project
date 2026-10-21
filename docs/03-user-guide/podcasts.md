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
- **Language chip** — shows which language you are editing (Source / Translation / Missing)
- **Copy from source** — appears in French/Arabic to seed the fields from the English episode
- **Save button** — saves the episode in the language currently selected in the platform switcher
- **Title field** — edit the episode title
- **Description field** — edit the episode description
- **Audio upload** — upload or replace the audio file

## Languages

Podcasts follow the same language model as courses and collections.

- The **language switcher in the platform menu** decides which language you are editing. There is no separate selector inside the podcast editor.
- Editing in English writes the podcast itself. Editing in French or Arabic writes (or updates) that language's translation; the English row is never touched.
- **Podcast → Translations** lists every language with a coverage check per field (`Name`, `Description`, `About`, `Tags`, `SEO`), lets you copy from the source, delete a language, and export/import a CSV for an external translator.
- Episode titles and descriptions are translated from **Podcast → Episodes**: switch the language, open the episode, and edit it — the list itself also shows translated titles.
- Fields that are shared across languages and never translated: cover, banner, hosts, total duration, audio files, price, access type, publish state and episode order.

Learners see the podcast in the language of the interface they chose. If a podcast has not been translated into that language yet, the source text is shown with a small amber note: *"This podcast is only available in English."*
