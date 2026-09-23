# Course Analytics

> Tracking student engagement, completion, and revenue for your course.

---

## Overview

The **Analytics** view provides data-driven insights into how your course is performing. You can monitor enrollment, track learner progress, measure engagement, and — for paid courses — review revenue data.

Unlike the six editor tabs, Analytics is accessed from the **course list page** via the chart icon (📊) on each course row, not from within the course editor.

---

## Accessing Course Analytics

1. Go to **Courses** in the admin sidebar
2. Locate the course you want to analyze
3. Click the **chart icon** (📊) on the right side of the course row
4. The analytics dashboard opens in a new view

> **Note:** If you are an Editor-level contributor, you can view analytics but cannot access settings tabs like Access or Pricing.

---

## Analytics Dashboard Sections

```
┌─────────────────────────────────────────────────────┐
│  Course: Complete Guide to Algerian Web Development │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │  245     │  │  68%    │  │  4.5hr  │  │ DA     │ │
│  │ Students │  │  Compl. │  │ Avg.    │  │ 612.5K │ │
│  │          │  │  Rate   │  │ Time    │  │ Revenue│ │
│  └─────────┘  └─────────┘  └─────────┘  └────────┘ │
│                                                     │
│  ┌─── Chart: Enrollments Over Time ──────────────┐ │
│  │  ██                                           │ │
│  │  ██  ██                                       │ │
│  │  ██  ██  ██                                   │ │
│  │  ────────────────────                         │ │
│  │  Sep    Oct    Nov    Dec                     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── Chart: Revenue Over Time ─────────────────┐ │
│  │  (shown for Paid courses only)               │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Student Enrollment Numbers

The enrollment section shows who is taking your course and how the learner base is growing.

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Total Students** | The total number of enrolled learners across all time |
| **Active Students** | Learners who have accessed at least one lesson in the past 30 days |
| **New Enrollments (7d)** | Learners who enrolled in the last 7 days |
| **Enrollment Trend** | A line or bar chart showing enrollments over time (daily, weekly, or monthly) |

### Enrollment Chart

- X-axis: Time (daily / weekly / monthly — switchable via a toggle)
- Y-axis: Number of new enrollments
- Useful for identifying spikes after marketing campaigns or seasonal trends

### Enrollment Breakdown

A table listing all enrolled students:

```
│ Learner          │ Email            │ Enrolled    │ Progress │ Status       │
│ ─────────────── │ ──────────────── │ ─────────── │ ──────── │ ──────────── │
│ Ahmed Benali    │ ahmed@example    │ 20 Sep 2026 │  75%     │ Active       │
│ Fatima Zohra    │ fatima@example   │ 18 Sep 2026 │ 100%     │ Completed    │
│ Mohamed Khelif  │ mohamed@example  │ 15 Sep 2026 │  20%     │ Active       │
│ Amina Said      │ amina@example    │ 10 Sep 2026 │   0%     │ Inactive     │
```

---

## Completion Rates

Completion metrics show how many learners finish the course and how they perform.

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Completion Rate** | Percentage of enrolled learners who completed all lessons |
| **Average Score** | The mean score across all learners who took knowledge checks |
| **Average Time to Complete** | The average time (in hours/days) learners take to finish the course |

### Completion Funnel

```
All enrolled:       245  ┌─────────────────────────┐
Started first lesson: 210 │████████████████████░░░░░│
Halfway:              150 │████████████░░░░░░░░░░░░░│
Completed:            167 │██████████████░░░░░░░░░░░│
Certified:            120 │██████████░░░░░░░░░░░░░░░│
```

The funnel helps identify where learners drop off. If many learners start but few finish, consider:
- Making early lessons more engaging
- Reducing lesson length
- Adding more interactive activities

---

## Activity Engagement Metrics

Track how learners interact with specific course content.

| Metric | Description |
|--------|-------------|
| **Total Lesson Views** | Aggregate count of all lesson page views |
| **Average Time per Lesson** | Average duration learners spend on each lesson |
| **Knowledge Check Completion** | Percentage of knowledge checks attempted vs. completed |
| **Most Viewed Lesson** | The lesson with the highest number of views |
| **Least Viewed Lesson** | The lesson with the lowest number of views (potential content issue) |

### Per-Lesson Breakdown

```
│ Lesson            │ Views │ Avg. Time │ Knowledge Checks │
│ ──────────────── │ ───── │ ───────── │ ──────────────── │
│ 1. Introduction   │  210  │   8m 32s  │  85% pass rate   │
│ 2. HTML Basics    │  195  │  12m 15s  │  72% pass rate   │
│ 3. CSS Styling    │  180  │  15m 40s  │  68% pass rate   │
│ 4. JavaScript     │  140  │  20m 10s  │  55% pass rate   │
```

A significant drop in views or a low pass rate on knowledge checks may indicate that a lesson needs improvement.

---

## Revenue Data (Paid Courses Only)

For courses with **Paid** access type, revenue metrics are displayed.

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Total Revenue** | Gross revenue from all course purchases |
| **Net Revenue** | Revenue after Chargily transaction fees |
| **Number of Purchases** | Total completed purchases |
| **Average Order Value** | Average revenue per purchase (usually equals the course price) |
| **Refund Rate** | Percentage of purchases that were refunded |

### Revenue Chart

- X-axis: Time
- Y-axis: Revenue amount in DZD
- Shows daily/weekly/monthly revenue trends
- Useful for tracking the impact of promotions or price changes

### Recent Transactions

```
│ Learner          │ Amount  │ Date       │ Status │
│ ──────────────── │ ─────── │ ────────── │ ────── │
│ Ahmed Benali     │ 2,500   │ 23 Sep 26 │ Paid   │
│ Fatima Zohra     │ 2,500   │ 22 Sep 26 │ Paid   │
│ Mohamed Khelif   │ 2,500   │ 15 Sep 26 │ Refund │
```

---

## Export Options

You can export analytics data for offline analysis or reporting.

| Export Type | Format | Content |
|-------------|--------|---------|
| **Enrollments** | CSV | Learner name, email, enrollment date, progress, completion status |
| **Revenue** | CSV | Transaction date, learner, amount, currency, payment method, status |
| **Engagement** | CSV | Per-lesson view counts, average time, knowledge check pass rates |
| **Full Report** | PDF | A formatted report with charts and summary metrics |

### How to Export

1. Click the **Export** button in the top-right corner of the analytics view
2. Select the data type you want to export
3. Choose the format (CSV or PDF)
4. Optionally set a date range filter
5. Click **Download** — the file is generated and downloaded automatically

---

## UI Pattern

```
┌────────────────────────────────────────────────────┐
│  Page background: #f8f8f8                          │
│                                                     │
│  Course name header with back button                │
│                                                     │
│  ┌─── 4 Stat Cards in a row ─────────────────────┐ │
│  │  Students   Completion   Avg Time   Revenue   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Enrollment Chart ──────────────┐ │
│  │  [Interactive chart with time range selector]  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Revenue Chart (Paid only) ─────┐ │
│  │  [Interactive chart with time range selector]  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Student Table ─────────────────┐ │
│  │  Searchable, sortable table with pagination    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Export Button]                                    │
└────────────────────────────────────────────────────┘
```
