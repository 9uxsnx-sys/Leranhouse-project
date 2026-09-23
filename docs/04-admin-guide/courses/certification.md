# Course Certification

> Designing certificates and setting passing criteria for course completion.

---

## Overview

The **Certification** tab lets you configure how learners earn certificates upon completing your course. This tab is only active when **Offers Certificate** is toggled on in the **General** tab.

Certificates serve as proof of completion and can be a strong motivator for learners, especially in paid courses.

---

## Enabling Certification

Before configuring certification settings, ensure the toggle is enabled:

1. Go to the **General** tab
2. Find the **Offers Certificate** toggle
3. Switch it to **On**
4. Save the course

Once enabled, the **Certification** tab becomes fully editable. If the toggle is off, the Certification tab will show a message indicating certificates are disabled.

---

## Certificate Design Settings

```
┌─── Certificate Design ───────────────────────────┐
│                                                    │
│  Certificate Title                                 │
│  ┌──────────────────────────────────────────────┐  │
│  │ Certificate of Completion                    │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Description                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ This certifies that [learner name] has       │  │
│  │ successfully completed [course name].        │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Background Color                                  │
│  ┌──────────────────────────────────────────────┐  │
│  │ #1a365d  │  [Color Picker]                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Logo                                              │
│  ┌──────────────────────────────────────────────┐  │
│  │  [Upload Logo]   Recommended: PNG, 400x400   │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Design Fields

| Field | Description |
|-------|-------------|
| **Certificate Title** | The heading displayed on the certificate (e.g., "Certificate of Completion") |
| **Description** | Body text that appears on the certificate. Use `[learner name]` and `[course name]` as placeholders that will be filled automatically |
| **Background Color** | The background color of the certificate, set via a color picker or hex input |
| **Logo** | Upload your organization's logo to appear on the certificate (PNG recommended, 400x400px) |

### Template Preview

A live preview of the certificate is shown on the right side of the settings panel, updating in real time as you adjust the fields:

```
┌───────────────────────────────────────────────┐
│                                               │
│           🏆  Certificate of Completion       │
│                                               │
│    This certifies that                        │
│    [Learner Name]                             │
│    has successfully completed                 │
│    [Course Name]                              │
│                                               │
│    ─────────────────────────────              │
│    Issued on: [Date]                          │
│                                               │
│    [Organization Logo]                        │
│                                               │
└───────────────────────────────────────────────┘
```

---

## Passing Criteria

Configure the requirements a learner must meet to earn the certificate.

```
┌─── Passing Criteria ───────────────────────────┐
│                                                  │
│  Minimum Score (%)                               │
│  ┌────────────────────────────────────────────┐  │
│  │  70                                        │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ☑ Require all lessons to be completed           │
│  ☑ Require passing all knowledge checks          │
│                                                  │
│  Current course average: N/A (no data yet)       │
└──────────────────────────────────────────────────┘
```

| Criteria | Description |
|----------|-------------|
| **Minimum Score (%)** | The overall score a learner must achieve across all graded activities (quizzes, knowledge checks) to pass. Range: 0–100. A common default is 70. |
| **Require all lessons to be completed** | When checked, every lesson in the course must be marked complete, regardless of score. Prevents skipping. |
| **Require passing all knowledge checks** | When checked, each individual knowledge check must be passed. If unchecked, only the overall average matters. |

### How Scoring Works

- **Knowledge checks** embedded in lessons contribute to the learner's score
- The overall score is calculated as: `(correct answers / total questions) × 100`
- The minimum score threshold applies to this overall calculation
- A learner must meet **all** enabled criteria to earn the certificate

---

## How Learners Earn and View Certificates

### Earning a Certificate

The learner's journey to earning a certificate:

```
Learner completes all lessons
              │
    ┌─────────┴─────────┐
    ▼                   ▼
Score ≥ minimum?    Score < minimum?
    │                   │
    ▼                   ▼
Certificate is     Certificate is NOT
automatically      issued. Learner sees
issued.            "Retake to improve score"
```

1. The learner completes all required lessons and activities
2. The system checks all passing criteria
3. If all criteria are met, the certificate is **automatically issued**
4. No manual approval is needed from the admin

### Viewing Certificates

Learners can access their certificates from:

- **My Courses** page — each completed course shows a certificate icon
- **Certificates** page — a dedicated page listing all earned certificates (`/orgs/[orgslug]/dashboard/certificates`)
- **Course page** — after completion, a "View Certificate" button appears

The certificate is rendered as a downloadable image that learners can save or share.

---

## Re-issuing Certificates

If you modify the certificate design after learners have already earned it:

- **Existing certificates** remain as they were when issued — they are not automatically updated
- If you need to re-issue certificates to existing graduates, this is done manually via the **Certificates** management section

---

## UI Pattern

```
┌────────────────────────────────────────────────────┐
│  Page background: #f8f8f8                          │
│                                                     │
│  ┌─── White Card: Certificate Design ────────────┐ │
│  │  Title: [_________]                           │ │
│  │  Description: [_________]                     │ │
│  │  Background: [color picker]                   │ │
│  │  Logo: [Upload]                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Certificate Preview ───────────┐ │
│  │  ┌─────────────────────────────────────────┐  │ │
│  │  │         Live preview of certificate     │  │ │
│  │  └─────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─── White Card: Passing Criteria ─────────────┐ │
│  │  Minimum Score: [70]                         │ │
│  │  ☑ Require all lessons                       │ │
│  │  ☑ Require passing knowledge checks          │ │
│  └───────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```
