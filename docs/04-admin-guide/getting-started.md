# Getting Started as an Admin

> Your first steps managing courses and learners on Koodook.

---

## First Login

1. Navigate to your organization's Koodook login page
2. Enter the admin credentials provided during setup (email and password)
3. Click **Sign In**

> **Tip:** If you don't have admin credentials yet, ask your organization owner or super admin to create your account with the appropriate role.

After signing in, you land on the **Admin Dashboard**.

---

## Navigating the Admin Dashboard

The dashboard is the central hub for all administrative tasks. Its layout is:

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR                     │  MAIN CONTENT AREA    │
│                              │                       │
│  Dashboard  ☰               │  Welcome back, Admin  │
│  Courses    📚               │                       │
│  Users      👥               │  ┌── Stats Cards ──┐  │
│  Groups     🏷️               │  │ Courses  Users  │  │
│  Payments   💳               │  │ Revenue  Active │  │
│  Analytics  📊               │  └─────────────────┘  │
│  Settings   ⚙️               │                       │
│                              │  ┌── Recent Activity┐ │
│                              │  │ ...               │ │
│                              │  └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Sidebar Sections

| Menu Item | Description |
|-----------|-------------|
| **Dashboard** | Main overview with stats and recent activity |
| **Courses** | List and manage all courses |
| **Users** | Manage learner accounts and roles |
| **Groups** | Create and manage user groups for access control |
| **Payments** | View transaction history, refunds, and payment settings |
| **Analytics** | Platform-wide usage and revenue reports |
| **Settings** | Organization configuration (branding, domains, SSO, features) |

### Top Bar

The top bar provides quick access to:
- **Search** — search across courses and users
- **Notifications** — alerts for new enrollments, payments, and system events
- **Profile menu** — your account settings and logout option
- **Language switcher** — toggle between available languages

---

## Creating Your First Course

1. Click **Courses** in the sidebar
2. Click the **New Course** button
3. Fill in the **General** tab:
   - **Course Name** — a clear, descriptive title
   - **Description** — a short summary of what learners will gain
   - **Difficulty** — Beginner, Intermediate, or Advanced
   - **Thumbnail** — upload a cover image (PNG, JPG, or WEBP)
   - **Offers Certificate** — toggle on if you want to issue completion certificates
   - **Categories** — optional, for organizing courses
4. Click **Save** — the course is created in **draft mode**

Your course is now created and ready for content. Next, add modules and lessons in the **Content** tab.

---

## The 6 Course Editor Tabs

Once a course is created, clicking on it opens the course editor with six tabs:

| # | Tab | Purpose |
|---|-----|---------|
| 1 | **General** | Name, description, difficulty, thumbnail, certificate toggle |
| 2 | **Content** | Build the module and lesson structure |
| 3 | **Access** | Control who can view the course (Public, Users Only, Paid) |
| 4 | **Certification** | Design certificates and set passing criteria |
| 5 | **Contributors** | Add co-authors and instructors |
| 6 | **SEO** | Configure SEO metadata and social previews |

Each tab is a separate sectioned card layout on a light grey background. Changes auto-save when applicable.

> **Note:** There is also an **Analytics** view available from the course list, accessible via the chart icon on each course row. This shows enrollment, completion, and revenue data for that course.

---

## Publishing a Course

After setting up content and access:

1. Ensure the course has at least one module with one lesson
2. Configure the **Access** tab with your desired access type
3. Click the **Publish** toggle in the course editor header
4. The course is now visible to learners according to its access settings

You can unpublish a course at any time — learners who already have access will retain it, but new learners won't be able to enroll.

---

## Key Differences from the Learner View

| Aspect | Admin View | Learner View |
|--------|------------|--------------|
| **Dashboard** | Management tools, stats, payments, users | Course list, progress, trail, purchases |
| **Course Page** | Editor with 6 tabs + settings | Course overview, lessons, activities |
| **Content** | Full CRUD on modules/lessons | Read-only consumption of published content |
| **Access** | Can configure pricing and access rules | Sees purchase buttons or locked banners |
| **Users** | Can view/manage all accounts | Sees only their own profile |
| **Payments** | Sees transaction history and refund tools | Sees only their own purchase history |

---

## Next Steps

- Read the [Course Management Overview](./courses/overview.md) for a deeper look at the course editor
- Configure [Access Control](./courses/access.md) to set up your pay-to-access model
- Explore [Organization Settings](../README.md) for branding and domain configuration
