# Course SEO

> Optimizing your course for search engines and social media sharing.

---

## Overview

The **SEO** tab lets you control how your course appears in search engine results (Google, Bing, etc.) and when shared on social media platforms (Facebook, Twitter, LinkedIn). Proper SEO configuration helps learners discover your course organically.

---

## SEO Metadata Fields

```
┌─── Search Engine Listing ───────────────────────┐
│                                                   │
│  Meta Title                                       │
│  ┌──────────────────────────────────────────────┐ │
│  │ Complete Guide to Algerian Web Development   │ │
│  └──────────────────────────────────────────────┘ │
│  60 / 60 characters  ✓                            │
│                                                   │
│  Meta Description                                 │
│  ┌──────────────────────────────────────────────┐ │
│  │ Learn modern web development with practical  │ │
│  │ examples tailored for the Algerian market.   │ │
│  │ Covers HTML, CSS, JavaScript, and more.      │ │
│  └──────────────────────────────────────────────┘ │
│  158 / 160 characters  ✓                          │
│                                                   │
│  Meta Keywords                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ web development, algeria, html, css, js      │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌─── Google Preview ──────────────────────────┐ │
│  │                                              │ │
│  │  🔗 koodook.dz/course/web-dev-101            │ │
│  │  Complete Guide to Algerian Web Development   │ │
│  │  Learn modern web development with practical  │ │
│  │  examples tailored for the Algerian market... │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### Meta Title

- The title displayed in search engine results and browser tabs
- **Recommended length:** 50–60 characters
- Include primary keywords near the beginning
- Make it descriptive and compelling — users decide whether to click based on this
- Should be unique per course

### Meta Description

- The short description that appears below the title in search results
- **Recommended length:** 120–160 characters
- Summarize what the course covers and what learners will gain
- Include a call to action where natural (e.g., "Learn", "Discover", "Master")
- Should be unique per course

### Meta Keywords

- Comma-separated list of keywords related to the course content
- These are less important for modern search engines but can help with internal search
- Focus on terms learners would actually search for
- Examples: `web development, algeria, html, css, javascript, beginner`

---

## Social Preview Settings (Open Graph)

```
┌─── Social Media Sharing ────────────────────────┐
│                                                   │
│  og:title                                        │
│  ┌──────────────────────────────────────────────┐ │
│  │ Complete Guide to Algerian Web Development   │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  og:description                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ Master web development with hands-on projects │ │
│  │ designed for the Algerian tech ecosystem.    │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  og:image                                         │
│  ┌──────────────────────────────────────────────┐ │
│  │ [Upload Image]    1200×630px recommended     │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌─── Social Preview ──────────────────────────┐ │
│  │                                              │ │
│  │  ┌──────────────────────────────────────┐    │ │
│  │  │                                      │    │ │
│  │  │      [Og:Image Preview]              │    │ │
│  │  │                                      │    │ │
│  │  ├──────────────────────────────────────┤    │ │
│  │  │ Complete Guide to Algerian Web...    │    │ │
│  │  │ koodook.dz                           │    │ │
│  │  └──────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

| Field | Description | Recommended Size |
|-------|-------------|-----------------|
| **og:title** | Title used when the course is shared on social media. Falls back to Meta Title if empty. | 40–60 characters |
| **og:description** | Description shown in social media cards. Falls back to Meta Description if empty. | 80–200 characters |
| **og:image** | The image displayed in social media cards. A visually appealing course image increases click-through rates. | 1200×630px, PNG or JPG |

Social previews are used by:
- **Facebook** — link sharing cards
- **Twitter** — summary cards with large image
- **LinkedIn** — article/course sharing
- **WhatsApp** — link previews
- **Discord** — link embeds

---

## URL Slug Configuration

```
┌─── Course URL ──────────────────────────────────┐
│                                                   │
│  Current URL:                                     │
│  https://koodook.dz/course/[slug]                 │
│                                                   │
│  Slug                                             │
│  ┌──────────────────────────────────────────────┐ │
│  │ web-dev-101                                  │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  Full URL: https://koodook.dz/course/web-dev-101  │
│                                                   │
│  ⚠ Changing the slug will break existing links.   │
│    Old URLs will redirect automatically.           │
└────────────────────────────────────────────────────┘
```

The slug is the URL-friendly identifier for your course. It is auto-generated from the course name but can be customized.

| Rule | Description |
|------|-------------|
| **Format** | Lowercase letters, numbers, and hyphens only |
| **Example** | `introduction-to-python` |
| **Length** | Keep under 80 characters |
| **Uniqueness** | Must be unique across all courses in your organization |
| **Redirects** | Changing the slug creates automatic redirects from the old URL |

### Slug Best Practices

- Use keywords that describe the course content
- Keep it short and readable
- Avoid dates or version numbers unless necessary (e.g., prefer `python-basics` over `python-basics-2026`)
- Use hyphens, not underscores

---

## Best Practices for Course Discoverability

### 1. Write for Humans First, Search Engines Second

Search engines are good at understanding natural language. Write your meta title and description as if you're describing the course to a potential learner.

### 2. Include Primary Keywords Early

Place your most important keywords at the beginning of the meta title and description. Example:
- ❌ "Learn Everything You Need — Web Development Course Algeria"
- ✅ "Web Development Course Algeria — Learn from Scratch"

### 3. Use a Unique Meta Description Per Course

Avoid generic descriptions like "This is a great course." Each course should have a description that highlights its unique value.

### 4. Optimize Social Images

The Open Graph image is often the first thing people see when a course is shared. Use:
- Clear, readable text overlay
- Your organization logo
- Consistent brand colors
- 1200×630px resolution

### 5. Set a Clean URL Slug

A clean slug helps both search engines and users understand what the page is about:
- ✅ `/course/react-fundamentals`
- ❌ `/course/course-123-abc`

### 6. Keep SEO Fields in Sync with Course Content

If you update the course name or description, update the SEO fields to match. Mismatched SEO metadata and course content can hurt search rankings.

---

## UI Pattern

```
┌────────────────────────────────────────────────────┐
│  Page background: #f8f8f8                          │
│                                                     │
│  ┌─── White Card: Search Engine Listing ─────────┐ │
│  │  Meta Title: [_________]  (character count)   │ │
│  │  Meta Description: [_________] (char count)   │ │
│  │  Meta Keywords: [_________]                   │ │
│  │  ┌── Google Preview ───────────────────────┐  │ │
│  │  │  Simulated search result snippet         │  │ │
│  │  └──────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Social Media Sharing ──────────┐ │
│  │  og:title: [_________]                        │ │
│  │  og:description: [_________]                  │ │
│  │  og:image: [Upload]                           │ │
│  │  ┌── Social Preview ───────────────────────┐  │ │
│  │  │  Simulated social card                  │  │ │
│  │  └──────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Course URL ────────────────────┐ │
│  │  Slug: [_________]  Full URL preview          │ │
│  │  ⚠ Warning about changing slug                │ │
│  └───────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```
