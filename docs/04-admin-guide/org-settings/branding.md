# Branding

> Customize the visual identity of your Koodook organization — logo assets, favicon, logomark, card thumbnail, the platform's primary brand color, and the sign-in page background.

## Overview

The Branding settings page controls the look and feel of your organization across the platform. Every setting here is scoped to your organization and does not affect other tenants on the same instance.

The page is built from a top **Action Row** followed by three stacked section cards:

| Card | Controls |
|------|----------|
| **Logo & Favicon** | Logo, Favicon, Logomark, Thumbnail uploads |
| **Theme** | The organization's Primary Color, its hover fill, and the text/icon colour used on it |
| **Auth** | The image shown behind the sign-in / sign-up form |

> **Note:** Every media upload (Logo, Favicon, Logomark, Thumbnail, Auth image) saves **immediately** on upload. Only the Theme card uses the **Save** button in the Action Row.

---

## Action Row (Save)

At the top-right of the page is a single Save button that tracks whether the Theme card has unsaved changes.

| State | Icon | Meaning |
|-------|------|---------|
| **Saved** | ✓ Check | No pending changes — button is inactive |
| **Save** | 💾 Save | You have unsaved Primary Color or Text & Icons changes — click to save |
| **Saving...** | Spinner | Request in progress |

Only the two **Theme** rows are tracked by this button. Uploads are persisted the moment you pick a file.

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

## Theme

The Theme card is the brand accent system. One hex becomes the colour of filled primary buttons, progress fills, chart series and the active tab underline. It has three rows.

### Primary Color

The Theme card defines the organization's **Primary Color** — the brand accent used for primary buttons, progress and charts across the platform.

The row contains:

- A **color preview square** on the left (shows the current color, or white if none is set).
- The **hex input** on the right — type a 6-digit hex value (e.g. `#D97757`). Input is uppercase and capped at 7 characters (`#RRGGBB`).
- A **clear (×)** button that appears once a color is set, resetting it to the platform default (ink).

> **Note:** There is no native OS color-picker dialog. Enter the hex value directly in the field. The preview square reflects the value live.

### Hover Color

The row directly below Primary Color sets the fill brand-connected buttons switch to when hovered or pressed.

- **Empty (Auto)** — the primary colour is darkened automatically. The step depends on the label: 14% then 26% toward black when the label is white, a gentler 6% / 12% when it is dark, so the label keeps its contrast.
- **Any hex** — used verbatim as the hover fill. The pressed state then takes one further 12% step in the same direction, so a lighter hover produces a lighter pressed state rather than jumping to an unrelated dark shade.
- The **`Aa` preview square** shows the hover fill with the resolved label colour on top.
- The row prints the hover **WCAG contrast ratio** against the label and turns amber below 4.5:1. Informational only — it never blocks saving.
- The **clear (×)** button returns the row to Auto.

### Text & Icons

The third row controls the foreground painted on top of the brand colour — the labels **and** icons inside every brand-connected button.

- **Empty (Auto)** — the platform chooses black or white from the primary colour. This is the default.
- **Any hex** — used verbatim. `#ffffff`, `ffffff` and `fff` are all accepted.
- The **`Aa` preview square** shows the resolved foreground on the resolved brand colour.
- The row prints the live **WCAG contrast ratio** (e.g. `Contrast 5.7:1`) and turns amber below 4.5:1. The warning is informational — it never blocks saving.
- The **clear (×)** button returns the row to Auto.

Because icons inherit `currentColor`, one value covers both the text and the icons.

Where the brand foreground applies today: primary buttons across the dashboard and learner pages, the submit button on the sign-in, sign-up, forgot-password, reset-password and email-verification pages, progress fills, chart series and the active-tab underline. On the auth pages the **Continue with Google** and **SSO** buttons and the text links stay neutral on purpose, so each screen keeps exactly one filled action.

### Brand the active sidebar tab

A switch below the Text & Icons row controls the floating pill behind the selected tab in the dashboard, learner and account sidebars.

| State | Result |
|-------|--------|
| **Off** (default) | The tab stays a neutral white surface with ink text — the original look |
| **On** | The pill fills with the primary colour and its label and icon switch to the Text & Icons foreground |

It is off by default so no existing organization changes appearance. Turning it on makes the sidebar the largest brand surface in the product, so check it against your charts before committing to it.

Changing any of the Theme rows marks the Action Row as having unsaved changes — click **Save** to apply.

---

## Auth Page Branding

The Auth card holds a single upload row for the image shown beside the sign-in and sign-up form. It follows the same pattern as the Logo and Favicon rows above it:

- **No image** → an **Upload** (cloud) icon opens the file picker.
- **Image present** → a thumbnail replaces the icon, and the **Trash** icon opens the picker to replace it.
- Accepted formats: `.png`, `.jpg`, `.webp`, up to **8 MB**. A wrong format or an oversized file is rejected with a toast and nothing is uploaded.
- While uploading, a spinner replaces the action and a toast reports progress, then success or failure. If the upload fails, the previous state is restored and the error is reported.

**The upload saves immediately — there is no Save button on this card.** The backend writes `background_type: "custom"` and the stored file name into the organization config, so the change is live on the next render.

When no image is set, the auth page keeps its default dark gradient. Once an image is set, it replaces that gradient on the left panel of the login and signup pages: the image is rendered **as an image** in its own column, next to the white form card — no background-image trick and **no dark overlay or tint**, so the artwork keeps its real colours. On small screens the same image becomes a banner above the form.

The panel is filled edge to edge (`object-fit: cover`), so use a landscape image with the subject near the centre — anything near the edges may be cropped on tall or narrow viewports.

---

## Best Practices

- **Use SVG where possible** — logos and logomarks stay crisp on high-DPI displays.
- **Keep the primary color brand-consistent** — the same accent should flow through your logo, buttons, and progress.
- **Prefer Auto for Text & Icons** — only pin a colour when the automatic choice is not what you want (for example a mid-tone brand that reads better with white). Keep the ratio at or above 4.5:1 when you do.
- **Preview on mobile** — the auth layout stacks vertically on small screens; check that the image still reads well as a banner above the form.

## Related Sections

- [General Settings](./general.md) — Organization name, slug, and locale
