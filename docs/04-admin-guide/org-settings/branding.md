# Branding

> Customize the visual identity of your Koodook organization — logo assets, favicon, logomark, card thumbnail, the platform's primary brand color, and the sign-in page background.

## Overview

The Branding settings page controls the look and feel of your organization across the platform. Every setting here is scoped to your organization and does not affect other tenants on the same instance.

The page is built from a top **Action Row** followed by three stacked section cards:

| Card | Controls |
|------|----------|
| **Logo & Favicon** | Logo, Favicon, Logomark, Thumbnail uploads |
| **Theme** | The organization's Primary Color |
| **Auth** | The sign-in / sign-up page background and welcome message |

> **Note:** Image uploads (Logo, Favicon, Logomark, Thumbnail) save **immediately** on upload. The Theme and Auth cards are saved with the **Save** button in the Action Row.

---

## Action Row (Save)

At the top-right of the page is a single Save button that tracks whether the Theme card has unsaved changes.

| State | Icon | Meaning |
|-------|------|---------|
| **Saved** | ✓ Check | No pending changes — button is inactive |
| **Save** | 💾 Save | You have unsaved Primary Color changes — click to save |
| **Saving...** | Spinner | Request in progress |

Only the **Primary Color** (Theme card) is tracked by this button. Uploads are persisted the moment you pick a file.

---

## Logo & Favicon

This card holds four upload rows. Each row shows an image placeholder icon on the left, the field label, and a single action on the right:

- **No file yet** → an **Upload** (cloud) icon. Click it to open the file picker.
- **File present** → a **Remove** (trash) icon. Click it to replace the file.

Supported formats for all four fields: `.png`, `.jpg`, `.svg`.

### Logo

- The **primary organization logo**, shown in the public header, landing page, and (in its light-on-dark variant) branding surfaces.
- Use **SVG** for crisp rendering at any size; PNG/JPG work too.

### Favicon

- The small icon shown in browser tabs.
- Recommended: a square **32 × 32 px** `.png`.

### Logomark

- The compact **icon mark** shown in the collapsed sidebar state.
- Square icon works best (e.g. 100 × 100 px or larger, up to 512 × 512 px).
- If no logomark is set, the collapsed sidebar falls back to the organization's initial.

### Thumbnail

- The **card thumbnail** used when the organization is represented as a card (e.g. discovery/listing surfaces).
- Recommended aspect ratio: landscape (e.g. 16:9).

---

## Theme — Primary Color

The Theme card defines the organization's **Primary Color** — the brand accent used for primary buttons, links, interactive elements, and focus rings across the platform.

The card is a single row containing:

- A **color preview square** on the left (shows the current color, or white if none is set).
- The **hex input** on the right — type a 6-digit hex value (e.g. `#6366F1`). Input is uppercase and capped at 7 characters (`#RRGGBB`).
- A **clear (×)** button that appears once a color is set, resetting it to the platform default.

> **Note:** There is no native OS color-picker dialog. Enter the hex value directly in the field. The preview square reflects the value live.

Changing the color marks the Action Row as having unsaved changes — click **Save** to apply. The platform derives the full shade palette (50–900) and contrast pairings from your primary color so components stay accessible.

---

## Auth Page Branding

The Auth card customizes the **sign-in / sign-up experience**. It has a settings panel on the left and a live **preview** on the right (a 4:3 mock showing the branded panel beside a form mock).

### Welcome Message

- A short message shown on the auth page (max **200 characters**).
- Leave empty to hide it.

### Background Type

Choose one of three background modes:

| Option | Behavior |
|--------|----------|
| **Gradient** | The default dark gradient (`#202020 → #000000`). No image. |
| **Custom** | Upload your own background image (`.png`, `.jpg`, `.webp`). |
| **Unsplash** | Pick a photo from the built-in Unsplash picker. Photographer credit metadata is stored with the selection. |

All non-gradient backgrounds render behind a `black/30` overlay to keep text legible.

### Text Color

Controls the color of the text overlaid on the background:

- **Light** — white text (use for dark/photographic backgrounds).
- **Dark** — near-black text (use for light backgrounds).

### Preview Panel

The right-hand panel is a **live mock preview** — it reflects the selected background, text color, welcome message, and your current logo as you change them. It is a design aid only; it does not publish anything.

### Saving Auth Branding

Unlike the uploads, the Auth card is **not** auto-saved. Click **Save** below the settings panel to persist the welcome message, background, and text color. The background image upload itself is stored when selected, but the configuration is written on Save.

---

## Best Practices

- **Test contrast** — ensure the chosen Text Color is legible over your background (photos vary; the `black/30` overlay helps but is not a guarantee).
- **Use SVG where possible** — logos and logomarks stay crisp on high-DPI displays.
- **Keep the primary color brand-consistent** — the same accent should flow through your logo, buttons, and links.
- **Preview on mobile** — the auth layout stacks vertically on small screens; check that the background still reads well.

## Related Sections

- [General Settings](./general.md) — Organization name, slug, and locale
- [Landing Page Builder](./landing.md) — Build your public homepage
- [Feature Flags](./features.md) — Enable platform features for the organization
