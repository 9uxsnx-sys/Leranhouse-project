# Assignments

> Create, distribute, and grade assignments with flexible submission types and a structured grading workflow.

## How Assignments Work in the Platform

Assignments are graded tasks within a course that require students to submit work by a specified deadline. Unlike quizzes (which are auto-graded multiple-choice questions), assignments involve human evaluation — an instructor or course creator reviews each submission and assigns a score.

The assignment workflow follows these steps:

1. **Creation** — An instructor or course creator creates an assignment within a course lesson.
2. **Submission** — Students submit their work (file upload or text entry) before the due date.
3. **Grading** — The instructor reviews submissions, provides feedback, and assigns a grade.
4. **Release** — Grades and feedback are published to the student.

## Creating Assignments

1. Navigate to the course where the assignment should live.
2. Go to **Content → Lessons** and select the lesson you want to add the assignment to, or create a new lesson.
3. Click **Add Activity** and select **Assignment**.
4. Configure the assignment:

### Title
A clear, concise name for the assignment (e.g., "Week 4 Essay: The Algerian Economy").

### Instructions
Provide detailed instructions for students. The editor supports:
- Rich text formatting (bold, italic, lists, headings).
- Embedded images and videos.
- Links to external resources.
- Code blocks (useful for programming assignments).

Write instructions that cover:
- What the student needs to do.
- Format requirements (e.g., "PDF only, 1000–1500 words").
- Grading criteria (e.g., "Content: 60%, Structure: 20%, Sources: 20%").
- Any resources or reference materials.

### Due Date
- **Due Date** — The deadline for submission. Students cannot submit after this date unless you enable late submissions.
- **Cutoff Date** — Optional hard deadline after which submissions are never accepted (even with late submission enabled).
- **Allow Late Submission** — Toggle this on to let students submit after the due date, optionally with a **late penalty** (e.g., 10% deduction per day).

### Additional Settings
- **Points/Max Grade** — The maximum score (e.g., 100).
- **Passing Grade** — The minimum score required to pass (e.g., 60).
- **Allow Resubmission** — If enabled, students can submit multiple versions before the due date. Only the latest submission is graded.
- **Group Assignment** — If enabled, students submit as a group (all group members receive the same grade).

## Submission Types

### File Upload
Students upload one or more files as their submission.

**Supported file types:**
- Documents: PDF, DOC, DOCX, ODT, TXT, RTF.
- Spreadsheets: XLS, XLSX, CSV.
- Presentations: PPT, PPTX.
- Images: PNG, JPG, GIF, SVG.
- Archives: ZIP, RAR (for multiple files).
- Code: HTML, CSS, JS, PY, JAVA, CPP, and many more.

**Limits:**
- Maximum file size: 128 MB per file.
- Maximum files per submission: 10.

Files are scanned for malware on upload. Infected files are rejected.

### Text Entry
Students type or paste their response directly into a text editor within the platform.

**Features:**
- Rich text formatting.
- Character limit (configurable by the instructor, default 50,000 characters).
- Auto-save drafts every 30 seconds.
- Spell check.

Text entries are stored in the database and included in assignment exports.

### Choosing a submission type
When creating the assignment, select one of:
- **File Upload Only** — Students must upload one or more files.
- **Text Entry Only** — Students write their response inline.
- **Both** — Students can choose either method.

## Grading Workflow

### Viewing submissions
1. Open the assignment from the course content page.
2. Click **View Submissions** or go to the **Grades** tab.
3. The submission list shows:
   - Student name.
   - Submission date/time.
   - Status (Submitted, Late, Graded, Resubmitted).
   - Current grade (if graded).

### Grading a submission
1. Click a student's submission to open the grading panel.
2. **Review the submission** — View uploaded files in the browser (PDFs, images) or download them. For text entries, read the response inline.
3. **Enter a grade** — Type a numeric score (e.g., 85 out of 100).
4. **Provide feedback** — Write comments for the student. The feedback editor supports rich text and file attachments.
   - Use **rubric scoring** if a rubric was attached to the assignment (select criteria and assign scores).
5. **Mark as graded** — Click **Save & Release**. The student receives a notification and can view their grade and feedback.

### Rubric grading
Rubrics make grading consistent and transparent:

1. When creating the assignment, click **Add Rubric**.
2. Define criteria (e.g., "Argument Clarity", "Evidence", "Grammar").
3. For each criterion, define performance levels (e.g., Excellent: 10 pts, Good: 7 pts, Fair: 4 pts, Poor: 0 pts).
4. During grading, click the appropriate level for each criterion. The total grade is calculated automatically.

### Bulk grading
For assignments with many submissions:
1. On the submissions page, click **Bulk Grade**.
2. A compact list shows all ungraded submissions.
3. Enter grades and feedback for each student in sequence.
4. Click **Save All** to release all grades at once.

### Gradebook
All assignment grades feed into the course **Gradebook** (accessible from the course admin menu). The gradebook shows:
- Each student's grade on every assignment.
- Running total and percentage.
- Final course grade calculation.

## Plagiarism Detection

If plagiarism detection is enabled for your platform, the following features are available:

- **Text Entry submissions** are automatically checked against a database of previously submitted content and web sources.
- A **similarity score** (0–100%) is displayed next to each submission in the grading view.
- Submissions with a similarity score above the configured threshold (default: 50%) are flagged with a warning icon.
- Click **View Report** to see highlighted matching text and source links.

**Note:** Plagiarism detection currently applies to text entries only. File uploads are not scanned for plagiarism.

To enable plagiarism detection:
1. Go to **Admin Dashboard → Settings → Features**.
2. Toggle **Plagiarism Detection** on.
3. Set the similarity threshold percentage.
4. Save changes.

## Student Submission View

Students access assignments from within the course:

1. Navigate to the lesson containing the assignment.
2. The assignment card shows:
   - Title and instructions.
   - Due date (with countdown timer if approaching).
   - Current status (Not Submitted, Submitted, Graded, Late).
   - Grade and feedback (if released).
3. Click **Submit Assignment** to open the submission form.
4. Depending on the configured type, upload files, write text, or both.
5. Click **Submit**. A confirmation is shown, and the student receives a submission receipt via email.

**Draft mode:** Students can save a draft and return later. Drafts are not visible to instructors. The assignment is only submitted when the student explicitly clicks **Submit**.

**Viewing feedback:** Once graded, the student can view:
- Their numeric grade.
- Instructor comments.
- Graded rubric (if used).
- Attached feedback files.
