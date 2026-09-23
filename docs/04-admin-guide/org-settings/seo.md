# SEO Settings

> Configure organization-level search engine optimization settings to control how your Koodook platform appears in search results and on social media.

## Overview

The SEO Settings page lets you manage global metadata, search engine verification, and social media presence for your entire Koodook organization. These settings apply to all public pages — landing page, course catalogue, and individual course pages — unless overridden by page-specific SEO settings.

## Global Meta Tags

### Meta Title

- A default title suffix appended to every page's `<title>` tag.
- Format: `Page Name — Organization Name`.
- Example: "Full-Stack Web Development — Koodook Academy".
- Maximum length: **60 characters** for the full title (including the separator and organization name).
- If a page has its own SEO title set, it replaces the page name portion but still appends the organization name.

### Meta Description

- A default description used when a page does not have its own meta description.
- Appears in search engine result snippets below the title.
- Recommended length: **150–160 characters**.
- Should summarize what your organization offers (e.g., "Learn web development, data science, and design with expert-led courses. Join 10,000+ students learning online.").
- This description is also used as the default Open Graph description when sharing links on social media.

### Meta Keywords

- A comma-separated list of keywords relevant to your organization.
- While modern search engines give less weight to keyword meta tags, they are still used by some internal search tools and alternative search engines.
- Example: `online learning, programming courses, algeria, e-learning, professional development`.

## Organization Description for Search Engines

- A longer, more detailed description of your organization (up to **500 characters**).
- This is used in:
  - **Schema.org `description`** property for rich search results.
  - **Open Graph `og:description`** fallback (when a page-specific description is not set).
  - **Twitter Card** description fallback.
- Write this as a compelling paragraph that clearly states who you are, what you offer, and who it is for.

## Social Media Presence Links

Add links to your organization's social media profiles. These are used in two ways:

1. **Schema.org markup** — Social profile links are added to your site's structured data, helping search engines associate your website with your social presence.
2. **Landing page footer** — If the [Landing Page Builder](./landing.md) footer is configured to show social links, they appear as icon buttons.

Supported platforms:

- Facebook (URL)
- X / Twitter (URL)
- LinkedIn (URL)
- YouTube (URL or channel ID)
- Instagram (URL)
- TikTok (URL)

Each link is optional. Only filled-in links are rendered in the structured data and footer.

## Google Search Console Verification

To verify ownership of your domain with Google Search Console:

### Method 1: HTML Meta Tag (Recommended)

1. Go to [Google Search Console](https://search.google.com/search-console/).
2. Add your domain as a new property.
3. Select the **HTML tag** verification method.
4. Copy the meta tag content value (a long string of characters).
5. In Koodook, go to **SEO Settings → Google Search Console** and paste the verification string.
6. Click **Save**.
7. Back in Google Search Console, click **Verify**.

### Method 2: DNS TXT Record

Alternatively, you can verify by adding a DNS TXT record (see [Domains](./domains.md) for DNS configuration instructions). This method is managed outside of Koodook but is equally valid.

### What Google Search Console Provides

Once verified, Google Search Console gives you:

- Search query performance data (impressions, clicks, CTR, average position).
- Index coverage reports (which pages are indexed and any errors).
- Core Web Vitals and usability reports.
- Sitemap submission and monitoring.

## Sitemap Generation

Koodook automatically generates and maintains an XML sitemap for your organization.

### Sitemap URL

- Your sitemap is available at: `https://<your-domain>/sitemap.xml`
- Replace `<your-domain>` with your organization's domain or default Learnhouse subdomain.

### What Is Included

The sitemap includes the following pages (when they are public):

- **Landing page** — The homepage built with the Landing Page Builder.
- **Course catalogue** — The main course listing page.
- **Individual course pages** — Each published course with a public URL.
- **Category/collection pages** — If enabled.
- **Instructor profile pages** — If enabled.
- **Blog posts** — If the blog feature is enabled.

### What Is Excluded

The sitemap excludes:

- Admin dashboard pages (require authentication).
- User profile and account pages.
- Pages behind paywall/access restrictions.
- Pages marked as `noindex` via page-level SEO settings.

### Sitemap Frequency

- The sitemap is regenerated **daily**.
- Search engines are notified of updates via the sitemap URL in `robots.txt`.
- You can manually trigger a sitemap regeneration by clicking **Regenerate Sitemap** on the SEO settings page.

### robots.txt

Koodook automatically generates a `robots.txt` file available at `https://<your-domain>/robots.txt`. It includes:

- The sitemap URL.
- Disallow rules for admin and authenticated-only paths.
- You cannot manually edit `robots.txt`, but you can add custom disallow rules via the SEO settings page under **Custom Robots Rules**.

## Canonical URLs

- Every public page includes a `<link rel="canonical">` tag pointing to the primary domain version of the URL.
- If you have [multiple domains](./domains.md) configured, the canonical URL uses the **primary domain**.
- This prevents duplicate content issues when the same page is accessible from multiple domains or URL variations.

## Best Practices

- **Write for humans first** — Meta descriptions and titles should be compelling to readers, not just keyword-stuffed.
- **Consistent naming** — Use the same organization name across SEO title, description, and social profiles.
- **Monitor performance** — After setting up Google Search Console, check your search performance weekly to identify trends.
- **Page-level overrides** — For best results, also set SEO titles and descriptions on individual course pages and landing page sections.
- **Avoid duplication** — Do not use the exact same meta description on every page. The global description is a fallback; set unique descriptions for important pages.

## Related Sections

- [Domains](./domains.md) — Primary domain configuration for canonical URLs
- [Landing Page Builder](./landing.md) — SEO settings for individual landing page sections
- [General Settings](./general.md) — Organization name used in meta titles
