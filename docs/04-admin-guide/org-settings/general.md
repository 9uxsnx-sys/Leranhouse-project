# General Settings

> Configure the foundational organization settings that define your Koodook instance, including identity, locale, timezone, and contact details.

## Organization Identity

The **General Settings** page is the first stop when setting up your Koodook organization. It controls the basic identity and regional preferences of your platform.

### Organization Name

- Set the public-facing name of your organization. This name appears in the browser title bar, email notifications, landing pages, and the admin dashboard header.
- The name should be concise but descriptive — it is used as the default `<title>` element across public pages.
- Changing the organization name does **not** affect the platform URL or subdomain.

### Logo

- Upload your organization's logo in **PNG** or **SVG** format.
- Recommended dimensions: **200 × 60 px** for the header logo. Larger images are automatically scaled down.
- The logo is displayed in the top navigation bar of both the public site and the admin dashboard.
- Supported formats: `.png`, `.svg`, `.jpg`, `.webp`. Maximum file size: **2 MB**.

### Favicon

- Upload a favicon that appears in browser tabs and bookmarks.
- Recommended format: **ICO** or **PNG**, **32 × 32 px** or **48 × 48 px**.
- If no favicon is uploaded, Koodook uses a default Learnhouse-branded favicon.

## Locale & Language

### Default Locale

- Select the default language for your organization from the available locale options.
- This setting determines the language used for:
  - Public landing pages and course catalogues
  - System-generated email notifications
  - Admin dashboard UI
  - Default locale for new user accounts
- Users can override their personal language preference in their account settings.
- Koodook supports **right-to-left (RTL)** locales. When an RTL locale is selected, the entire UI adjusts accordingly.

### Available Locales

- Enable or disable specific languages for your organization. Users will only see enabled locales in their language selector.
- If only one locale is enabled, the language selector is hidden from users.

## Timezone

- Set the default timezone for your organization. This affects:
  - Course start/end date display
  - Schedule and event times
  - Audit log timestamps
  - Email notification send times
  - Reporting and analytics data
- The timezone selector lists all IANA timezone identifiers (e.g., `Africa/Algiers`, `Europe/Paris`, `America/New_York`).
- Users with a personal timezone set in their profile will see times converted to their local timezone. The organization timezone serves as the fallback.

## Contact Information

Provide contact details that appear in system-generated communications and on the public site:

- **Email address** — Used as the default sender for system notifications and as a contact point on the landing page.
- **Phone number** — Optional. Displayed on the contact page if the landing page builder includes a contact section.
- **Physical address** — Optional. Useful for organizations that operate from a physical location and need to display it for compliance or trust.
- **Support URL** — Optional. A link to your help desk or support portal, used in email footers and error pages.

## Save Behavior

- All changes on the General Settings page are saved by clicking the **Save** button at the top or bottom of the form.
- Unsaved changes are **not** preserved when navigating away from the page — a confirmation dialog warns you before leaving.
- Some fields (logo, favicon) are uploaded immediately upon file selection. Other text fields require an explicit save.
- Changes take effect **immediately** after saving. There is no deployment or approval step for general settings.

## Related Sections

- [Branding Settings](./branding.md) — Custom fonts, colors, and CSS
- [Domains](./domains.md) — Custom domain configuration
- [Landing Page Builder](./landing.md) — Build your public-facing homepage
