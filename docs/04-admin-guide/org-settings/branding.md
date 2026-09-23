# Branding

> Customize the visual identity of your Koodook platform with custom fonts, color schemes, logo assets, and advanced CSS to match your organization's brand.

## Overview

The Branding settings page gives you control over the look and feel of both the public-facing site and the admin dashboard. All branding changes are scoped to your organization and do not affect other tenants on the same Learnhouse instance.

## Custom Fonts & Typography

### Font Selection

- Choose from a curated library of **Google Fonts** or upload your own custom web font files.
- Three font families can be configured:
  - **Heading font** — Applied to all `<h1>` through `<h6>` elements.
  - **Body font** — Applied to paragraphs, lists, and general text content.
  - **Mono font** — Applied to code blocks, inline code, and technical content.

### Font Loading

- When a Google Font is selected, Koodook automatically loads the font files via the Google Fonts CDN.
- Custom font files (`.woff2`, `.woff`, `.ttf`) can be uploaded with a maximum file size of **5 MB** per file.
- You can specify **font weights** to load (e.g., 400, 500, 600, 700). Lighter weights improve performance by reducing the amount of CSS downloaded.

### Typography Settings

- **Base font size** — Sets the root `font-size` in pixels (default: 16 px). All other text sizes are derived from this value using relative units.
- **Line height** — Controls overall readability. Default: 1.5 for body text.
- **Letter spacing** — Adjust tracking for headings (default: normal).

## Color Scheme Customization

Koodook exposes a full color palette system with the following categories:

### Primary Color

- The dominant brand color used for buttons, links, navigation bars, and interactive elements.
- Input as a hex value (e.g., `#2563EB`) or use the built-in color picker.
- Koodook automatically generates a full shade palette (50–900) from your primary color, ensuring sufficient contrast for accessible UI components.

### Secondary Color

- Used for secondary buttons, badges, and accent elements that should not compete with the primary color.
- A muted shade that complements the primary color.

### Accent Color

- Used for highlights, alerts, success states, and decorative elements.
- Typically a contrasting color to the primary (e.g., a warm accent against a cool primary).

### Neutral / Surface Colors

- **Background** — The page background color (default: white).
- **Surface** — Card, modal, and dropdown background color.
- **Text** — Primary text color (default: near-black for light themes).
- **Border** — Default border color for input fields, cards, and dividers.

### Dark Mode

- If dark mode is enabled for your organization (via Feature Flags), you can configure a separate set of colors for dark mode.
- Use the **Dark Mode** toggle in the branding panel to switch between light and dark palette editors.

## Logo & Favicon Upload

### Logo

- Upload a **primary logo** for light backgrounds and an optional **inverted logo** for dark backgrounds.
- Supported formats: `.png`, `.svg`, `.jpg`, `.webp`.
- Recommended dimensions: **200 × 60 px** (header) and **400 × 120 px** (footer/landing page).
- Maximum file size: **2 MB** per logo.
- Use **SVG** format for crisp rendering at any screen size.

### Favicon

- Upload a favicon that appears in browser tabs.
- Recommended: **32 × 32 px** `.png` or `.ico` file.
- An **Apple touch icon** (180 × 180 px) can also be uploaded for iOS home screen bookmarks.

## Custom CSS

For advanced customization beyond the color and font pickers, Koodook supports custom CSS injection.

### How It Works

- Enter raw CSS in the **Custom CSS** editor. The CSS is injected into the `<head>` of every page, scoped to your organization's domain.
- The editor includes basic syntax highlighting and a character count.

### What You Can Do with Custom CSS

- Adjust spacing, padding, and margins of specific components.
- Hide or restructure UI elements (e.g., hide the footer, reposition the sidebar).
- Apply custom animations or transitions.
- Override any default style — your CSS loads after the theme stylesheet, so specificity is in your favor.

### Limitations

- JavaScript is **not** supported in custom CSS blocks.
- Maximum custom CSS length: **50 KB**.
- Very complex overrides may break when Koodook updates its UI components. Test after each platform update.

## Preview Before Publishing

Before saving your branding changes, you can preview how they will look:

1. Click the **Preview** button at the top of the branding page.
2. A new browser tab opens showing your organization's public landing page and a sample course page with the new branding applied.
3. The preview uses **live data** — it shows your actual courses and content with the new theme.
4. Preview mode is **not visible to end users**. Only admins with the preview link can see it.
5. If the preview looks correct, return to the branding page and click **Save & Publish**.

### Publishing Changes

- Clicking **Save & Publish** applies the branding to all pages immediately.
- There is a **5-minute cache** on some static assets (fonts, CSS files). A hard refresh (Ctrl+Shift+R / Cmd+Shift+R) may be needed to see the latest changes.
- You can revert to the **last published branding** using the **Revert** button in the top toolbar, which restores the previously saved theme.

## Best Practices

- **Test on mobile** — Always preview your branding on a mobile viewport. Custom CSS can behave differently on small screens.
- **Contrast compliance** — Ensure your primary text/background combination meets WCAG AA contrast ratios. Koodook's auto-generated shade palette is designed to be accessible, but custom colors may not be.
- **Keep it lean** — Limit custom CSS to only what is necessary. Heavy CSS can slow down page load times.
- **Brand consistency** — Use the same primary color across your logo, typography, and UI elements for a cohesive experience.

## Related Sections

- [General Settings](./general.md) — Organization name, logo, and favicon basics
- [Landing Page Builder](./landing.md) — Build your public-facing homepage with branded content blocks
- [Feature Flags](./features.md) — Enable dark mode and other branding-related features
