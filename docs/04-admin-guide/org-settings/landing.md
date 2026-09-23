# Landing Page Builder

> Build and customize your organization's public-facing landing page using a drag-and-drop block editor with pre-built templates, custom content blocks, and a full preview-and-publish workflow.

## Overview

The Landing Page Builder lets you create a professional homepage for your Koodook platform without writing any code. The landing page is the first thing visitors see when they arrive at your domain — it can showcase your courses, pricing, testimonials, and more.

Access the builder at **Admin Panel → Organization Settings → Landing Page**.

## Landing Page Sections

The builder organizes content into **sections**, each representing a horizontal block on the page. You can add, remove, and reorder sections freely.

### Hero Section

The hero is the topmost section of your landing page. It typically includes:

- **Headline** — A large, bold title (e.g., "Learn In-Demand Skills Online").
- **Subheadline** — Supporting text below the headline (e.g., "Access expert-led courses on your schedule").
- **Call-to-Action (CTA) button** — Primary button text and URL (e.g., "Get Started →" linking to your course catalogue).
- **Background** — Choose between a solid color, gradient, or background image/video.
- **Layout** — Options include centered text, split text + image, or full-screen background.

### Features Section

Highlight key selling points of your platform:

- Add **feature cards** with an icon, title, and description.
- Common features to highlight: "Self-Paced Learning", "Expert Instructors", "Certificates", "Mobile Access", "Community Support".
- Each feature card can link to a specific page.
- Configure the grid layout (2, 3, or 4 columns).

### Pricing Section

Display your pricing plans for Koodook's pay-to-access model:

- Add **pricing cards** for each plan (e.g., Monthly, Annual, Lifetime).
- Each card shows: plan name, price, billing period, feature list, and a CTA button.
- Highlight a **recommended/best value** plan with a distinct visual style.
- Currency is displayed based on your organization's locale settings. For Algerian customers, prices display in **DZD (Algerian Dinar)** by default.

### Testimonials Section

Build social proof with student testimonials:

- Each testimonial includes: student name, photo, course name, and quote text.
- Display options: carousel slider, grid, or single featured testimonial.
- Testimonials can be imported from course reviews automatically or written manually.

### Courses Section

Showcase your course catalogue directly on the landing page:

- Automatically pulls course data from your Koodook library.
- Filter options: show featured courses only, or courses from a specific category.
- Display mode: grid or list.
- Each course card shows the thumbnail, title, instructor, price, and rating.

### Call-to-Action Section

A dedicated section for driving conversions:

- Configurable headline, description, and button.
- Often used at the bottom of the page as a final nudge (e.g., "Start Learning Today — Join 10,000+ Students").

### Footer Section

- Configure footer columns: logo, description, navigation links, social media icons, and copyright text.
- Supports up to 4 columns of content.
- Social media links (Facebook, Twitter/X, LinkedIn, YouTube, Instagram) display as icon buttons.

## Pre-Built Templates

If you don't want to build your landing page from scratch, start with a **pre-built template**:

1. Click **Templates** in the builder toolbar.
2. Browse available templates categorized by industry (Education, Technology, Creative, Coaching, etc.).
3. Click **Apply Template** to load it into the builder. This **replaces** your current landing page content.
4. Customize the template sections to match your brand and content.

Templates are designed to be conversion-optimized with best practices for layout, spacing, and CTA placement.

## Custom Content Blocks

For maximum flexibility, use **Custom Blocks**:

- **Rich Text Block** — A WYSIWYG editor for adding arbitrary text, images, and embedded content (YouTube videos, maps, etc.).
- **HTML Block** — Insert raw HTML/CSS for complete control over a section's appearance. JavaScript is **not** executed for security reasons.
- **Image Block** — Full-width or contained image with optional caption.
- **Divider Block** — A visual separator between sections.
- **Spacer Block** — Add vertical space between sections.

### Custom Block Settings

Every block shares these common settings:

- **Visibility** — Show on desktop, tablet, mobile, or any combination.
- **Padding & Margin** — Adjust spacing (top, bottom, left, right) in pixels or rem.
- **Background** — Color, gradient, or image.
- **Animation** — Scroll-triggered animations (fade-in, slide-up, zoom-in).
- **ID & CSS Class** — For advanced custom styling via the [Branding Custom CSS](./branding.md) feature.

## Preview and Publish Workflow

### Previewing

1. Click the **Preview** button at any time while editing.
2. A new tab opens showing the landing page as it will appear to visitors.
3. Preview renders all sections, images, and styles in real-time.
4. Use the **device toolbar** in the preview to switch between desktop, tablet, and mobile views.

### Publishing

1. When you are satisfied with the landing page, click **Publish**.
2. A confirmation dialog shows the list of changes since the last publish.
3. Click **Confirm** to make the landing page live.
4. The published landing page is immediately visible to visitors at your organization's domain.

### Drafts vs. Published

- The builder maintains a **draft** and a **published** version of the landing page.
- You can make changes to the draft without affecting the live site.
- Unpublished changes are preserved even if you close the builder and return later.
- Use the **Compare** button to see a diff between your draft and the published version before publishing.

### Version History

- Every publish creates a **version snapshot**.
- Access version history from the **Versions** tab in the builder.
- You can **restore** any previous version, which replaces the current draft.
- Version history is retained for **90 days**.

## Best Practices

- **Mobile-first** — Preview on mobile frequently. Many visitors will access your landing page from their phone.
- **Above the fold** — Keep your hero section concise and compelling. The CTA button should be visible without scrolling.
- **Social proof** — Place testimonials or student count near the top of the page.
- **One primary CTA** — Avoid multiple competing calls-to-action. Guide visitors toward a single desired action (e.g., "Browse Courses" or "Start Free Trial").
- **Load time** — Optimize images before uploading. Large background images can slow down page load.

## Related Sections

- [Branding](./branding.md) — Colors, fonts, and logo used on the landing page
- [Domains](./domains.md) — Serve the landing page from your custom domain
- [General Settings](./general.md) — Organization name and contact info displayed on the landing page
- [SEO](./seo.md) — Meta tags and search engine visibility for the landing page
