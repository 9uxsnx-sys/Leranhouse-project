# Content and Media Library

> Upload, organize, and reuse media files — images, videos, documents, and more — across all your courses.

## Uploading Media Files

The **Content Library** is a centralized media repository accessible from **Admin Dashboard → Content Library**. Any file uploaded here can be reused across multiple courses, lessons, and pages.

### How to upload
1. Go to **Admin Dashboard → Content Library**.
2. Click the **Upload** button (or drag and drop files into the upload zone).
3. Select one or more files from your computer.
4. While uploading, you can:
   - Add a **name** for each file (defaults to the filename).
   - Select a **folder** to place the file in.
   - Add **alt text** (for images — improves accessibility).
5. Click **Upload**. Progress is shown for each file.

### Upload methods
- **Single upload** — Select one file at a time.
- **Batch upload** — Select multiple files. All are uploaded simultaneously.
- **Drag and drop** — Drag files from your file explorer directly into the library page.

## Supported File Types and Size Limits

### File types

| Category | Supported Formats |
|---|---|
| **Images** | PNG, JPG/JPEG, GIF, SVG, WebP, BMP, ICO |
| **Videos** | MP4, WebM, MOV, AVI, MKV |
| **Documents** | PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, ODT, RTF |
| **Audio** | MP3, WAV, OGG, AAC, FLAC |
| **Archives** | ZIP, RAR, 7Z, TAR.GZ |
| **Code** | HTML, CSS, JS, JSX, TS, TSX, JSON, XML, YAML, MD, PY, JAVA, CPP, SQL, PHP, RB |
| **Other** | SVG icons, fonts (TTF, OTF, WOFF, WOFF2) |

### Size limits

| File Type | Max File Size |
|---|---|
| Images | 20 MB per file |
| Videos | 500 MB per file |
| Documents | 50 MB per file |
| Audio | 100 MB per file |
| Archives | 200 MB per file |
| Code/Other | 10 MB per file |

**Total storage per platform:** Depends on your plan (view current usage and quota in the Storage section below).

> **Tip:** Compress large images and videos before uploading to save storage and improve page load times.

## Organizing Files

### Folders
Keep the library organized by creating a folder structure:

1. In the Content Library, click **New Folder**.
2. Enter a **folder name** (e.g., "Course Thumbnails", "Lecture Videos – Algebra", "Certificates Templates").
3. Click **Create**.

**Best practices for folder naming:**
- Use a consistent naming convention (e.g., `[Course Name] - [Type]`).
- Avoid special characters in folder names.
- Keep the hierarchy shallow — no more than 3 levels deep.

### Moving files
- Drag and drop files between folders.
- Or select files, click **Move**, and choose the destination folder.

### File naming
When uploading, you can rename files. Use descriptive names:
- Good: `algebra-module-1-equations-slides.pdf`
- Avoid: `IMG_48291.jpg`, `document-final-v3-final.pdf`

### Search and filtering
- **Search** — Type a file name or folder name to find files instantly.
- **Filters** — Filter by file type (Images, Videos, Documents, Audio, Other).
- **Sort** — Sort by name, file type, file size, date uploaded, or last modified.

## Using Library Items in Courses

### In lesson content
When editing a lesson with the rich text editor:
1. Place your cursor where you want to insert the media.
2. Click the **Insert Media** button (image icon) in the editor toolbar.
3. The library browser opens. Navigate folders or search for the file.
4. Select the file and click **Insert**.
   - Images are displayed inline.
   - Videos are embedded with a player.
   - Documents are inserted as download links.

### As course thumbnails
1. Go to **Course Settings → General**.
2. Click the **Thumbnail** field.
3. The library browser opens. Select an image.
4. Recommended dimensions: 1280×720 pixels (16:9 ratio).
5. Save the course.

### As assignment attachments
When creating an assignment, you can attach reference files from the library (e.g., a rubric PDF, a template document).

### In certificates
Certificate templates can use library images for logos, backgrounds, and seals.

### File URLs
Every file in the library has a direct URL. You can copy it from the file's detail panel (click the **Copy URL** button). Use this URL in custom HTML, email templates, or external tools.

## Storage Management and Quotas

### Viewing usage
1. Go to **Admin Dashboard → Settings → Storage**.
2. The storage panel shows:
   - **Used** — Total storage currently consumed.
   - **Total** — Your plan's storage quota.
   - **Usage bar** — Visual representation of used vs. available space.
   - **Breakdown** — Storage by file type (images, videos, documents, etc.).

### Freeing up space
- **Delete unused files** — The library shows a **Usage** column indicating how many courses/lessons reference each file. Files with 0 references are safe to delete.
- **Compress images** — Use the built-in compressor (select an image → **Compress**). This reduces file size by up to 70% with minimal quality loss.
- **Download and archive** — Download old or unused files before deleting them for record-keeping.

### Storage alerts
When you reach 80% of your quota, an alert banner appears in the library. At 100%, uploads are blocked until space is freed or the quota is upgraded.

## File Optimization

### Image optimization
The platform automatically applies optimization when you upload images:

- **WebP conversion** — PNG and JPG images are converted to WebP format for browsers that support it (with fallbacks for older browsers).
- **Responsive sizes** — The system generates multiple sizes (thumbnail: 150px, small: 300px, medium: 768px, large: 1200px, original) and serves the appropriate size based on the user's screen.
- **Lazy loading** — Images are loaded only when they enter the viewport, speeding up initial page loads.

### Video optimization
- **Streaming** — Uploaded MP4 videos are processed for HLS (HTTP Live Streaming), which adapts quality based on the user's connection speed.
- **Poster frame** — A thumbnail from the video is automatically extracted and used as the poster image.

### Manual compression
For additional optimization:
1. Select a file in the library.
2. Click the **Optimize** button.
3. For images, choose a quality level (High, Medium, Low).
4. For videos, choose a resolution target (1080p, 720p, 480p).
5. Confirm. A new optimized version replaces the original.

> **Note:** Optimization is non-destructive for images — the original is kept as a backup and can be restored from the file's detail panel.
