# Platform Analytics

> Track platform growth, user engagement, course performance, and revenue through interactive dashboards and exportable reports.

## Dashboard Overview

The analytics dashboard provides a high-level snapshot of platform health and activity. Access it from **Admin Dashboard → Analytics**.

The overview section displays four key metric cards at the top:

| Metric | Description |
|---|---|
| **Total Users** | Count of all registered accounts (active + suspended). |
| **Total Courses** | Count of all published courses. |
| **Total Enrollments** | Cumulative number of course enrollments (a user enrolled in 3 courses counts as 3). |
| **Total Revenue** | Sum of all completed payments (in DZD), excluding refunds. |

Each card shows the **percentage change** compared to the previous period (e.g., last 30 days vs. the 30 days before that). Green indicates growth; red indicates a decline.

Below the metric cards, a **trend chart** plots all four metrics over time for quick visual correlation.

## User Growth Trends

The **Users** tab provides detailed user analytics:

**User Growth Chart** — A line chart showing new user registrations per day, week, or month (configurable). Hover over any data point to see the exact count.

**Total Users Over Time** — A cumulative line chart showing the total user base growth.

**Breakdown by Role** — A pie or bar chart showing the distribution of users across roles (Learner, Instructor, Course Creator, Admin).

**Breakdown by Status** — Active vs. suspended user counts.

**Registration Source** — If configured, shows how users discovered the platform (direct, referral, invite, social).

**Key insights:**
- **Daily active users (DAU)** — Number of unique users who logged in or performed an action each day.
- **Weekly active users (WAU)** — Rolling 7-day active user count.
- **Monthly active users (MAU)** — Rolling 30-day active user count.
- **Stickiness ratio** — DAU/MAU, a measure of user engagement.

## Course Enrollment Statistics

The **Courses** tab focuses on course-level engagement:

**Enrollment Chart** — A bar chart showing enrollments per course. Sort by most enrolled or least enrolled.

**Completion Rate** — For each course, the percentage of enrolled users who completed all required content. Courses with low completion rates may need content improvements.

**Popular Categories** — Which course categories/subjects attract the most enrollments.

**Average Time to Complete** — For each course, the average duration between enrollment and completion.

**Top Courses Table** — A sortable table listing:
- Course title and category.
- Total enrollments.
- Active learners (currently in progress).
- Completion rate (%).
- Average rating (if course reviews are enabled).
- Total revenue generated.

Click any course row to drill into its individual analytics page with lesson-by-lesson engagement data.

## Revenue Analytics

The **Revenue** tab gives you full visibility into platform income.

### Total Revenue
The top section shows:
- **Gross Revenue** — Total payments before refunds.
- **Net Revenue** — Gross revenue minus refunds.
- **Refunded Amount** — Total value of processed refunds.
- **Pending Payouts** — Amounts awaiting settlement (if applicable).

### Per-Course Breakdown
A table lists every paid course with:
- Course title.
- Price (DZD).
- Number of purchases.
- Gross revenue.
- Refunds (count and amount).
- Net revenue.

Sort by any column to identify your top-performing courses.

### Monthly Trends
A line chart displays revenue across months. Use it to:
- Spot seasonal trends (e.g., enrollment spikes in September, dips during holidays).
- Measure the impact of promotions or price changes.
- Compare current month against the same month last year.

### Payment Method Split
A pie chart showing revenue by payment method (EDAHABIA vs. CIB) — useful for understanding your users' payment preferences.

## Export Reports

All analytics data can be exported for offline analysis or record-keeping.

### Exporting a report
1. Navigate to the analytics tab containing the data you want (Users, Courses, or Revenue).
2. Apply any desired filters (date range, course, etc.).
3. Click the **Export** button in the top-right corner.
4. Choose format:
   - **CSV** — Machine-readable, suitable for Excel, Google Sheets, or programmatic analysis.
   - **PDF** — Formatted report with charts, suitable for sharing with stakeholders.
5. The file downloads immediately. For large datasets, the system processes the export in the background and notifies you when it's ready.

### Scheduled exports
Configure automatic recurring exports:
1. Go to **Admin Dashboard → Settings → Analytics → Scheduled Exports**.
2. Click **Add Schedule**.
3. Configure:
   - **Report type** — Users, Courses, Revenue, or All.
   - **Format** — CSV or PDF.
   - **Frequency** — Daily, Weekly, or Monthly.
   - **Recipients** — Email addresses to receive the report.
4. Click **Save**.

Scheduled exports are sent automatically at the configured interval.

## Date Range Filtering

Every analytics view includes a date range filter in the top-right corner:

**Preset ranges:**
- **Today** — Current day's data.
- **Last 7 Days** — Rolling 7-day window.
- **Last 30 Days** — Rolling 30-day window.
- **This Month** — From the 1st of the current month to today.
- **Last Month** — Previous calendar month.
- **This Year** — From January 1st to today.
- **All Time** — Full history.

**Custom range** — Select a specific start and end date using the date picker. The maximum selectable range is 2 years.

When a date range is active, all charts, tables, and metrics on the page update to reflect only data within that period. The active range is displayed as a badge next to the filter button.
