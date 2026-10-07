# Cloudflare Media & Storage Integration Plan

> **Status:** In Progress — Frontend player component built
> **Target:** Next development cycle (backend + HLS integration)
> **Type:** External service integration (SaaS)

---

## 1. Overview

Consolidate all media and file storage into **Cloudflare's ecosystem** — replacing the current self-hosted video pipeline, image hosting, and resource file storage. This gives us HLS adaptive bitrate streaming, signed URL authentication, AES-128 encryption, global CDN delivery, zero egress fees, and a single provider for everything.

### Services Used

| Service | Purpose | Cost Component |
|---|---|---|
| **Cloudflare Stream** | Videos (course lessons) + Audio (podcast episodes) | $5 per 1,000 min stored/mo |
| **Cloudflare Images** | Course thumbnails, podcast artwork, user avatars, UI images | Included in Starter Bundle |
| **Cloudflare R2** | Course resource files (PDFs, docs, zips, etc.) | $0.015/GB/month |

### What Stays the Same

- **YouTube videos** (`SUBTYPE_VIDEO_YOUTUBE`) — unchanged, still use `react-youtube`
- **Self-hosted videos** (`SUBTYPE_VIDEO_HOSTED`) — kept for legacy content, no new uploads
- **Tracking system** (TrailStep playback position) — already built, no changes needed
- **Lesson preview page** — minimal changes, only the `VideoActivity` component

---

## 2. Pricing Summary

### 2a. Starter Bundle ($5/month) — All You Need to Start

The **$5 Starter Bundle** includes both Stream and Images:

| Service | What you get | Cost |
|---|---|---|
| **Stream** | Store up to **1,000 min** video/audio, deliver up to **5,000 min/mo** watched | Included |
| **Images** | Store up to **100,000 images**, deliver up to **500,000 images/mo** | Included |
| **Total** | | **$5/month** |

### 2b. Overage & Scaling

| Resource | When you exceed | Cost |
|---|---|---|
| Stream storage over 1,000 min | Buy more in $5 increments | $5 per 1,000 min |
| Stream delivery over 5,000 min/mo | Auto-billed at $1 per 1,000 min | $1 per 1,000 min |
| Images over 100,000 stored | Auto-billed at $0.65 per 1,000 images | $0.65 per 1,000 images |
| Images over 500,000 delivered/mo | Auto-billed at $0.65 per 1,000 images | $0.65 per 1,000 images |
| **R2 storage** | Separate (not in bundle) | **$0.015/GB/month** |
| **R2 operations (reads)** | Separate | **$0.36 per million reads** |
| **R2 egress** | N/A | **$0 (free)** |

### 2c. Cost Examples

| Scenario | Videos Stored | Watch Time | Images | Resources | Total |
|---|---|---|---|---|---|
| **Start** (10 courses, 20h video) | 1,200 min | 2,000 min/mo | 500 images | 500 MB | **~$7/mo** |
| **Medium** (100 courses, 200h video) | 12,000 min | 20,000 min/mo | 5,000 images | 5 GB | **~$30/mo** |
| **Large** (1,000 courses, 2,000h video) | 120,000 min | 200,000 min/mo | 50,000 images | 50 GB | **~$300/mo** |

**Key insight:** Unlike AWS S3 or Bunny.net, **egress is always free**. Your cost grows predictably with storage, not with popularity.

---

## 3. Database Changes

### 3a. Activity Model (Courses) — No Migration Needed

The `Activity` model already has `extra_metadata` (JSONB column). All Cloudflare references are stored here:

```python
# apps/api/src/db/courses/activities.py
class Activity(ActivityBase, table=True):
    # ... existing fields ...
    extra_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
```

**Storage format in `extra_metadata`:**

```json
{
  "cloudflare_video_uid": "abc-123-def-456",
  "cloudflare_video_status": "ready",
  "cloudflare_video_duration": 600.5,
  "cloudflare_image_uid": "img-abc-123",
  "cloudflare_resource_path": "course-uuid/resource.pdf"
}
```

### 3b. PodcastEpisode Model — Simple Column Addition

```python
# apps/api/src/db/podcasts/episodes.py
class PodcastEpisode(PodcastEpisodeBase, table=True):
    # ... existing fields ...
    cloudflare_video_uid: Optional[str] = Field(default=None)
```

**Migration required:** Generate an Alembic revision.

### 3c. Resource Files — New Table (Recommended)

For course resources (PDFs, documents, etc.), a new table gives us better tracking:

```python
# apps/api/src/db/courses/resources.py
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class CourseResource(SQLModel, table=True):
    __tablename__ = "course_resources"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    resource_uuid: str = Field(unique=True, index=True)
    course_id: int = Field(foreign_key="courses.id")
    activity_id: Optional[int] = Field(foreign_key="activities.id", default=None)
    org_id: int = Field(foreign_key="organizations.id")
    
    filename: str
    filesize: int  # bytes
    mimetype: str
    r2_key: str  # path in R2 bucket, e.g. "orgs/{org_id}/courses/{course_id}/file.pdf"
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## 4. New Activity Subtype

Add `SUBTYPE_VIDEO_CLOUDFLARE` to the `ActivitySubTypeEnum`:

```python
# apps/api/src/db/courses/activities.py
class ActivitySubTypeEnum(str, Enum):
    # ... existing ...
    SUBTYPE_VIDEO_YOUTUBE = "SUBTYPE_VIDEO_YOUTUBE"
    SUBTYPE_VIDEO_HOSTED = "SUBTYPE_VIDEO_HOSTED"
    SUBTYPE_VIDEO_CLOUDFLARE = "SUBTYPE_VIDEO_CLOUDFLARE"  # NEW
    # ...
```

---

## 5. Environment Variables

Add to `apps/api/.env`:

| Variable | Description | Service | Required |
|---|---|---|---|
| `CLOUDFLARE_STREAM_ACCOUNT_ID` | Cloudflare account ID (hex hash) | Stream | Yes |
| `CLOUDFLARE_STREAM_API_TOKEN` | API token with Stream:write scope | Stream | Yes |
| `CLOUDFLARE_STREAM_SIGNING_KEY` | Base64-encoded 256-bit HMAC key | Stream | Yes |
| `CLOUDFLARE_IMAGES_API_TOKEN` | API token for Images management | Images | Yes |
| `CLOUDFLARE_R2_ACCESS_KEY` | R2 S3-compatible Access Key ID | R2 | Yes |
| `CLOUDFLARE_R2_SECRET_KEY` | R2 S3-compatible Secret Access Key | R2 | Yes |
| `CLOUDFLARE_R2_BUCKET_RESOURCES` | Bucket name for course resources | R2 | Yes |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public URL for the R2 bucket | R2 | Optional |

---

## 6. Backend: Cloudflare Service Modules

### 6a. Directory Structure

```
apps/api/src/services/media/
  ├── __init__.py
  ├── cloudflare_stream.py    # Video + Audio via Cloudflare Stream
  ├── cloudflare_images.py    # Images via Cloudflare Images
  └── cloudflare_r2.py        # Resource files via Cloudflare R2
```

### 6b. Cloudflare Stream Service (`cloudflare_stream.py`)

```python
"""Cloudflare Stream integration for videos and podcast audio.

Handles upload, signed URL generation, deletion, and metadata retrieval.
Billing: $5 per 1,000 minutes stored per month. No egress fees.
"""

import os
import base64
import json
import hashlib
import hmac
import time
import httpx
from typing import Optional, BinaryIO

CLOUDFLARE_STREAM_ACCOUNT_ID = os.getenv("CLOUDFLARE_STREAM_ACCOUNT_ID", "")
CLOUDFLARE_STREAM_API_TOKEN = os.getenv("CLOUDFLARE_STREAM_API_TOKEN", "")
CLOUDFLARE_STREAM_SIGNING_KEY = os.getenv("CLOUDFLARE_STREAM_SIGNING_KEY", "")

CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"
CLOUDFLARE_STREAM_BASE = f"{CLOUDFLARE_API_BASE}/accounts/{CLOUDFLARE_STREAM_ACCOUNT_ID}/stream"
```

| Function | Signature | Purpose |
|---|---|---|
| `upload_video()` | `(file_bytes: bytes, filename: str, meta: Optional[dict] = None) -> str` | Upload MP4 or MP3 -> returns video UID |
| `upload_video_from_url()` | `(url: str, meta: Optional[dict] = None) -> str` | Upload from external URL -> returns video UID |
| `generate_signed_url()` | `(video_uid: str, expires_sec: int = 86400) -> str` | Generate time-limited HLS manifest URL |
| `delete_video()` | `(video_uid: str) -> bool` | Delete video/audio from Cloudflare |
| `get_video_info()` | `(video_uid: str) -> dict` | Get duration, ready status, thumbnail URL |
| `update_video_meta()` | `(video_uid: str, meta: dict) -> bool` | Set name, metadata on video |

#### `generate_signed_url()` — Full Implementation

```python
def generate_signed_url(
    video_uid: str,
    expires_sec: int = 86400,
) -> str:
    """Generate a signed HLS manifest URL valid for expires_sec seconds.
    
    Uses HMAC-SHA256 with the Cloudflare Stream signing key.
    The signing key must be generated once via:
      POST https://api.cloudflare.com/client/v4/accounts/{account}/stream/keys
    
    Signed URLs must be enabled on the account:
      POST https://api.cloudflare.com/client/v4/accounts/{account}/stream
      Body: {"requireSignedURLs": true}
    
    Returns URL like:
      https://customer-{hash}.cloudflarestream.com/{uid}/manifest/video.m3u8?token={jwt}
    """
    if not CLOUDFLARE_STREAM_SIGNING_KEY:
        raise ValueError("CLOUDFLARE_STREAM_SIGNING_KEY is not configured")

    key = base64.b64decode(CLOUDFLARE_STREAM_SIGNING_KEY)
    exp = int(time.time()) + expires_sec

    payload = json.dumps({
        "sub": video_uid,
        "exp": exp,
    }, separators=(",", ":"))

    payload_b64 = base64.urlsafe_b64encode(payload.encode()).rstrip(b"=").decode()
    signature = hmac.new(key, payload_b64.encode(), hashlib.sha256).hexdigest()
    token = f"{payload_b64}.{signature}"

    account_hash = CLOUDFLARE_STREAM_ACCOUNT_ID
    return f"https://customer-{account_hash}.cloudflarestream.com/{video_uid}/manifest/video.m3u8?token={token}"
```

### 6c. Cloudflare Images Service (`cloudflare_images.py`)

```python
"""Cloudflare Images integration for course thumbnails, podcast artwork, avatars.

Billing: Included in Starter Bundle (up to 100,000 images stored, 500,000 delivered/mo).
"""

import os
import httpx
from typing import Optional, BinaryIO

CLOUDFLARE_IMAGES_API_TOKEN = os.getenv("CLOUDFLARE_IMAGES_API_TOKEN", "")
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_STREAM_ACCOUNT_ID", "")

IMAGES_API_BASE = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/images/v1"
```

| Function | Signature | Purpose |
|---|---|---|
| `upload_image()` | `(file_bytes: bytes, filename: str, require_signed_urls: bool = True) -> str` | Upload image -> returns image UID |
| `upload_image_from_url()` | `(url: str) -> str` | Upload from URL -> returns image UID |
| `generate_signed_url()` | `(image_uid: str, expires_sec: int = 86400) -> str` | Generate time-limited image URL |
| `delete_image()` | `(image_uid: str) -> bool` | Delete image |
| `get_image_info()` | `(image_uid: str) -> dict` | Get image metadata |
| `get_variant_url()` | `(image_uid: str, variant: str = "public") -> str` | Get URL for specific variant (size) |

**Key concept: Variants**

Cloudflare Images lets you define **variants** — different sizes of the same image:

| Variant | Size | Use Case |
|---|---|---|
| `thumbnail` | 150x150 | List views, small cards |
| `medium` | 600x400 | Episode cards, course cards |
| `hero` | 1200x630 | Course detail page, social sharing |
| `original` | Full size | Full resolution |

You define variants once in the Cloudflare dashboard. Then you serve the right size automatically:

```
https://imagedelivery.net/{account_hash}/{image_uid}/thumbnail
https://imagedelivery.net/{account_hash}/{image_uid}/medium
https://imagedelivery.net/{account_hash}/{image_uid}/hero
```

### 6d. Cloudflare R2 Service (`cloudflare_r2.py`)

```python
"""Cloudflare R2 integration for course resource files (PDFs, documents, etc.).

R2 is S3-compatible object storage with zero egress fees.
Billing: $0.015/GB/month storage, $0.36 per million reads.
Uses AWS SDK for S3-compatible operations.
"""

import os
import boto3
from botocore.config import Config
from typing import Optional, BinaryIO
from datetime import datetime, timedelta

CLOUDFLARE_R2_ACCESS_KEY = os.getenv("CLOUDFLARE_R2_ACCESS_KEY", "")
CLOUDFLARE_R2_SECRET_KEY = os.getenv("CLOUDFLARE_R2_SECRET_KEY", "")
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_STREAM_ACCOUNT_ID", "")
R2_BUCKET = os.getenv("CLOUDFLARE_R2_BUCKET_RESOURCES", "learnhouse-resources")

R2_ENDPOINT = f"https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"

r2_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=CLOUDFLARE_R2_ACCESS_KEY,
    aws_secret_access_key=CLOUDFLARE_R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)
```

| Function | Signature | Purpose |
|---|---|---|
| `upload_file()` | `(file_bytes: bytes, key: str, content_type: str) -> str` | Upload file to R2 -> returns ETag |
| `generate_download_url()` | `(key: str, expires_sec: int = 3600) -> str` | Generate presigned download URL |
| `delete_file()` | `(key: str) -> bool` | Delete file from R2 |
| `get_file_info()` | `(key: str) -> dict` | Get file metadata (size, type, last modified) |
| `list_files()` | `(prefix: str) -> list` | List all files under a prefix (e.g., course UUID) |

**R2 key naming convention:**

```
orgs/{org_id}/courses/{course_uuid}/{resource_uuid}_{filename}
```

This keeps files organized and allows listing all resources for a course.

#### `generate_download_url()` — Full Implementation

```python
from boto3 import client as boto3_client
from botocore.config import Config

def generate_download_url(
    key: str,
    expires_sec: int = 3600,
) -> str:
    """Generate a presigned download URL for a file in R2.
    
    URL expires after expires_sec (max 7 days).
    Anyone with the URL can download the file.
    """
    url = r2_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": R2_BUCKET,
            "Key": key,
        },
        ExpiresIn=expires_sec,
    )
    return url
```

---

## 7. Backend: API Routers

### 7a. New Router: `apps/api/src/routers/media/video.py`

Prefix: `/media/video`

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/media/video/upload/{activity_uuid}` | POST | Org admin | Upload MP4 -> Cloudflare -> save UID to activity |
| `/media/video/stream/{activity_uuid}` | GET | Student (course owner) | Return signed HLS URL |
| `/media/video/delete/{activity_uuid}` | DELETE | Org admin | Delete from Cloudflare + clear metadata |
| `/media/video/info/{activity_uuid}` | GET | Org admin | Get video status/duration |

#### Upload Endpoint

```python
@router.post("/upload/{activity_uuid}")
async def upload_video_endpoint(
    activity_uuid: str,
    request: Request,
    file: UploadFile = File(...),
    user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    """
    Upload MP4 to Cloudflare Stream and store the video UID on the activity.
    
    Flow:
    1. Validate activity exists
    2. Check user is org admin (can edit course content)
    3. Validate file type (must be video/*)
    4. Read file bytes
    5. Upload to Cloudflare Stream
    6. Save returned video UID to activity.extra_metadata
    7. Return success with video UID
    """
    # 1. Look up activity
    statement = select(Activity).where(Activity.activity_uuid == activity_uuid)
    activity = db_session.exec(statement).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # 2. Check admin permissions
    org_statement = select(Organization).where(Organization.id == activity.org_id)
    org = db_session.exec(org_statement).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not is_org_admin(user, org):
        raise HTTPException(status_code=403, detail="Only admins can upload videos")

    # 3. Validate file type
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Only video files are allowed")

    # 4. Read file
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # 5. Upload to Cloudflare
    try:
        video_uid = await upload_video(
            file_bytes=file_bytes,
            filename=file.filename or "video.mp4",
            meta={"activity_uuid": activity_uuid, "name": activity.name},
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"Cloudflare upload failed: {str(e)}")

    # 6. Save to activity
    extra_meta = dict(activity.extra_metadata or {})
    extra_meta["cloudflare_video_uid"] = video_uid
    extra_meta["cloudflare_video_status"] = "processing"
    activity.extra_metadata = extra_meta
    db_session.add(activity)
    db_session.commit()

    return {"success": True, "video_uid": video_uid}
```

#### Stream Endpoint

```python
@router.get("/stream/{activity_uuid}")
async def get_video_stream_url(
    activity_uuid: str,
    request: Request,
    user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    """
    Get signed HLS URL for a Cloudflare video.
    
    Flow:
    1. Look up activity
    2. Check user has access to this course (via TrailRun)
    3. Get cloudflare_video_uid from extra_metadata
    4. Generate signed URL (24h expiry)
    5. Return { hls_url, poster_url, duration }
    """
    # 1. Look up activity
    statement = select(Activity).where(Activity.activity_uuid == activity_uuid)
    activity = db_session.exec(statement).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # 2. Check user has access
    from src.services.courses.access import check_course_access_for_user
    course_statement = select(Course).where(Course.id == activity.course_id)
    course = db_session.exec(course_statement).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    has_access = check_course_access_for_user(
        db_session=db_session, user=user, course=course, org_id=course.org_id,
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="No access to this course")

    # 3. Get cloudflare video UID
    if not activity.extra_metadata:
        raise HTTPException(status_code=404, detail="No video configured")
    video_uid = activity.extra_metadata.get("cloudflare_video_uid")
    if not video_uid:
        raise HTTPException(status_code=404, detail="No Cloudflare video configured")

    # 4. Generate signed URL
    try:
        hls_url = generate_signed_url(video_uid=video_uid, expires_sec=86400)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate stream URL: {str(e)}")

    # 5. Build response
    account_hash = os.getenv("CLOUDFLARE_STREAM_ACCOUNT_ID", "")
    poster_url = f"https://customer-{account_hash}.cloudflarestream.com/{video_uid}/thumbnails/thumbnail.jpg"
    duration = activity.extra_metadata.get("cloudflare_video_duration", 0)

    return {
        "hls_url": hls_url,
        "poster_url": poster_url,
        "duration": duration,
        "video_uid": video_uid,
    }
```

### 7b. New Router: `apps/api/src/routers/media/images.py`

Prefix: `/media/images`

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/media/images/upload/{entity_type}/{entity_uuid}` | POST | Org admin | Upload image -> Cloudflare Images -> save UID |
| `/media/images/delete/{image_uid}` | DELETE | Org admin | Delete image from Cloudflare |
| `/media/images/stream/{entity_type}/{entity_uuid}` | GET | Any auth user | Get image delivery URL |

`entity_type` values: `course`, `podcast`, `episode`, `activity`, `user`

#### Upload Endpoint

```python
@router.post("/upload/{entity_type}/{entity_uuid}")
async def upload_image_endpoint(
    entity_type: str,
    entity_uuid: str,
    request: Request,
    file: UploadFile = File(...),
    user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    """
    Upload image to Cloudflare Images and save UID to the entity.
    
    entity_type: course, podcast, episode, activity, user
    entity_uuid: UUID of the entity
    """
    # Validate entity_type
    valid_entities = {"course", "podcast", "episode", "activity", "user"}
    if entity_type not in valid_entities:
        raise HTTPException(status_code=400, detail=f"Invalid entity type. Must be one of: {valid_entities}")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Check admin permissions (for course/podcast/episode/activity)
    # (Skip for user avatar — user can upload their own)

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        image_uid = await upload_image(
            file_bytes=file_bytes,
            filename=file.filename or "image.png",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=f"Cloudflare Images upload failed: {str(e)}")

    # Save UID to the appropriate entity
    # Each entity model stores cloudflare_image_uid in extra_metadata or dedicated field

    return {"success": True, "image_uid": image_uid}
```

#### Stream Endpoint

```python
@router.get("/stream/{entity_type}/{entity_uuid}")
async def get_image_url(
    entity_type: str,
    entity_uuid: str,
    variant: str = "medium",
    request: Request,
    user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    """
    Get Cloudflare Images delivery URL for an entity's image.
    
    Returns a URL like:
      https://imagedelivery.net/{account_hash}/{image_uid}/{variant}
    """
    # Look up entity and get image_uid
    # Return the delivery URL
    pass
```

### 7c. New Router: `apps/api/src/routers/media/resources.py`

Prefix: `/media/resources`

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/media/resources/upload/{course_uuid}/{activity_uuid}` | POST | Org admin | Upload file -> R2 -> save to CourseResource table |
| `/media/resources/download/{resource_uuid}` | GET | Student (course owner) | Get presigned download URL |
| `/media/resources/delete/{resource_uuid}` | DELETE | Org admin | Delete file from R2 + DB |
| `/media/resources/list/{course_uuid}` | GET | Student (course owner) | List all resources for a course |

#### Upload Endpoint

```python
@router.post("/upload/{course_uuid}/{activity_uuid}")
async def upload_resource_endpoint(
    course_uuid: str,
    activity_uuid: str,
    request: Request,
    file: UploadFile = File(...),
    user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    """
    Upload a resource file to R2 and create a CourseResource record.
    
    Flow:
    1. Validate course + activity exist
    2. Check user is org admin
    3. Upload file to R2 with key: orgs/{org_id}/courses/{course_uuid}/{resource_uuid}_{filename}
    4. Create CourseResource record in database
    5. Return resource info
    """
    pass

@router.get("/download/{resource_uuid}")
async def download_resource_endpoint(
    resource_uuid: str,
    request: Request,
    user: PublicUser = Depends(get_current_user),
    db_session: Session = Depends(get_db_session),
):
    """
    Get a presigned download URL for a course resource.
    
    Flow:
    1. Look up CourseResource by UUID
    2. Check user has access to the course
    3. Generate presigned R2 URL (1 hour expiry)
    4. Return { download_url, filename, filesize }
    """
    pass
```

### 7d. Register All Routers

Add to `apps/api/src/router.py`:

```python
from src.routers.media import video as media_video_router
from src.routers.media import images as media_images_router
from src.routers.media import resources as media_resources_router

v1_router.include_router(media_video_router, tags=["media-video"])
v1_router.include_router(media_images_router, tags=["media-images"])
v1_router.include_router(media_resources_router, tags=["media-resources"])
```

---

## 8. Frontend: Components

### 8a. Cloudflare Video Player (`CloudflarePlayer.tsx`)

**File:** `apps/web/components/Objects/Activities/Video/CloudflarePlayer.tsx`

> **Status: Built** — MP4 player ready; HLS integration pending Cloudflare Stream backend.

Current player is a fully-featured MP4 player used for testing. When Cloudflare Stream backend is ready, it will be upgraded to use hls.js for HLS streaming with adaptive bitrate.

**Current capabilities (MP4 mode):**

- Play/pause (click video or center icon, keyboard Space/K)
- Skip forward/back 10s (J/L keyboard shortcuts, ←/→ arrows)
- Volume control with visual fill slider (M to mute, ↑/↓ arrows)
- Playback speed: 0.5x–4x ([/] keyboard shortcuts)
- Picture-in-Picture (PiP) mode
- Fullscreen toggle (F key)
- Subtitles/CC toggle (when track provided)
- YouTube-style center play icon (appears briefly on pause, hides on play)
- Buffering indicator spinner
- Progress reporting via `onProgress` callback
- Auto-complete signal via `onComplete` callback
- Keyboard shortcuts reference (shown in test harness)

**Future HLS upgrades (when Cloudflare Stream is integrated):**

- Replace `<video src={...}>` with hls.js loading signed HLS manifest
- Add quality selector (auto/360p/720p/1080p) from HLS variants
- Fetch signed URL from `GET /media/video/stream/{activity_uuid}` on mount
- Integrate with TrailStep tracking for auto-save every 30s and resume position
- Security: `controlsList="nodownload"`, disabled right-click, `disablePictureInPicture`

```tsx
'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Loader2, RotateCcw, RotateCw, PictureInPicture2, Subtitles,
} from 'lucide-react'

interface CloudflarePlayerProps {
  src: string
  poster?: string
  onProgress?: (currentTime: number, duration: number) => void
  onComplete?: () => void
  autoplay?: boolean
  subtitleUrl?: string
}
```

**Key implementation details:**

1. **Current (MP4 mode):** Uses standard `<video>` element with `src` prop. Simple and reliable for testing.
2. **Future (HLS mode):** Fetch `GET /media/video/stream/{activity_uuid}` -> get signed HLS URL -> initialize hls.js -> play
3. **Auto-save (future):** Calls `onProgress` on time update -> existing TrailStep system saves every 30s
4. **Resume (future):** Backend returns saved position from TrailStep -> frontend seeks on load
5. **Security (future):** Video element will have `controlsList="nodownload"` and `disablePictureInPicture`

### 8b. Cloudflare Image Component

**File:** `apps/web/components/Objects/Media/CloudflareImage.tsx`

Simple wrapper that renders an image from Cloudflare Images with variant support:

```tsx
interface CloudflareImageProps {
  imageUid: string
  variant?: 'thumbnail' | 'medium' | 'hero' | 'original'
  alt: string
  className?: string
  width?: number
  height?: number
}

function CloudflareImage({ imageUid, variant = 'medium', alt, className }: CloudflareImageProps) {
  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH
  const src = `https://imagedelivery.net/${accountHash}/${imageUid}/${variant}`

  return <img src={src} alt={alt} className={className} loading="lazy" />
}
```

### 8c. Resource Download Button Component

**File:** `apps/web/components/Objects/Activities/Resources/ResourceDownload.tsx`

```tsx
interface ResourceDownloadProps {
  resource: {
    resource_uuid: string
    filename: string
    filesize: number
  }
}

function ResourceDownload({ resource }: ResourceDownloadProps) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const resp = await fetch(
        `${getAPIUrl()}media/resources/download/${resource.resource_uuid}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      const data = await resp.json()
      // Redirect to presigned URL
      window.open(data.download_url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Preparing...' : `Download ${resource.filename}`}
    </button>
  )
}
```

---

## 9. Security & Content Protection

### 9a. Three-Layer Video Protection

| Layer | Technology | What It Blocks |
|---|---|---|
| 1. Signed URLs | HMAC-SHA256 tokens (24h expiry) | Unauthenticated access, URL sharing after expiry |
| 2. HLS AES-128 encryption | Built into Cloudflare Stream | Raw `.ts` chunks are encrypted |
| 3. Player-level | `controlsList="nodownload"` + no right-click | Casual "Save As" |

### 9b. Image Protection

- **Signed URLs** (optional): Cloudflare Images supports requiring signed URLs
- **Hotlink protection**: Block other sites from embedding your images
- **Variant-based delivery**: Original full-res image is never exposed

### 9c. Resource File Protection

- **Presigned URLs**: 1-hour expiry, generated per-user
- **No public bucket**: R2 bucket is private; only presigned URLs grant access
- **Access check before URL**: Backend verifies course ownership before generating URL

### 9d. What a Leaked URL Can Do

Even if a signed URL is leaked:
- **Video URL**: Expires in 24h; HLS encryption prevents re-saving as playable file
- **Image URL**: Expires in 24h; only serves the medium variant, not original
- **Resource URL**: Expires in 1h; can be regenerated with new key if needed

---

## 10. Integration Points & Flows

### 10a. Course Creation Flow (Admin)

```
Admin creates course
  -> creates chapter
    -> creates activity
      -> Select type: "Video" -> subtype: "Cloudflare"
        -> Upload MP4 -> Cloudflare processes (~30s)
        -> Video UID saved to activity.extra_metadata

  -> adds resources
    -> Upload PDF -> saved to R2 -> CourseResource created

  -> sets course thumbnail
    -> Upload image -> saved to Cloudflare Images
    -> Image UID saved to course.extra_metadata
```

### 10b. Student Viewing Flow

```
Student enrolls -> opens lesson
  -> CloudflarePlayer mounts
    -> Fetches signed HLS URL from backend
    -> hls.js loads HLS manifest
    -> Video plays with adaptive bitrate
    -> Tracking saves position every 30s
    -> Auto-complete at 95%

  -> views resources section
    -> Lists all CourseResource records for this course
    -> Click download -> backend generates presigned R2 URL
    -> File downloads directly from Cloudflare
```

### 10c. Podcast Audio Flow

```
Admin creates podcast episode
  -> Uploads MP3 to Cloudflare Stream
  -> Audio UID saved to PodcastEpisode.cloudflare_video_uid

Student opens episode
  -> Fetches signed HLS URL for audio
  -> Plays via audio-only hls.js
  -> Tracking saves position (existing system)
```

### 10d. Image Usage Across Platform

```
Course card thumbnail  -> CloudflareImage(variant="thumbnail")
Course detail page     -> CloudflareImage(variant="hero")
Podcast episode art    -> CloudflareImage(variant="medium")
User avatar            -> CloudflareImage(variant="thumbnail")
Activity preview image -> CloudflareImage(variant="medium")
```

---

## 11. Implementation Phases

| Phase | Description | Files | Dependencies | Effort |
|---|---|---|---|---|
| **P1** | Add `SUBTYPE_VIDEO_CLOUDFLARE` to enum | `apps/api/src/db/courses/activities.py` | None | 5 min |
| **P2** | Cloudflare Stream service module | `apps/api/src/services/media/cloudflare_stream.py` | P1 | 3 hours |
| **P3** | Video API router | `apps/api/src/routers/media/video.py` | P2 | 3 hours |
| **P4** | Cloudflare Images service + router | `apps/api/src/services/media/cloudflare_images.py` + router | None | 2 hours |
| **P5** | Cloudflare R2 service + router | `apps/api/src/services/media/cloudflare_r2.py` + router + `CourseResource` table | None | 4 hours |
| **P6** | CloudflarePlayer frontend component | `CloudflarePlayer.tsx` + hls.js install | P3 | ✅ Done (MP4 mode, HLS pending) |
| **P7** | CloudflareImage frontend component | `CloudflareImage.tsx` | P4 | 1 hour |
| **P8** | ResourceDownload + admin upload UI | `ResourceDownload.tsx` + course editor | P5 | 4 hours |
| **P9** | Update VideoActivity to handle Cloudflare | `Video.tsx` | P1, P6 | 30 min |
| **P10** | PodcastEpisode cloudflare_video_uid | Migration + model update | P2 | 1 hour |
| **P11** | Write API tests | `test_video_router.py`, `test_resources_router.py` | P3, P5 | 4 hours |
| **P12** | End-to-end testing | Manual + automated | All above | 4 hours |

**Total estimated effort:** ~32 hours (4-5 days full-time)

---

## 12. Rollback Plan

### Video Rollback
- Keep all existing `SUBTYPE_VIDEO_HOSTED` content — still works with old `LearnHousePlayer`
- Don't create Cloudflare activities → old flow unchanged
- Delete from Cloudflare → clear `extra_metadata`

### Images Rollback
- Cloudflare Images URLs can be replaced with direct URLs in the database
- Old images on current hosting still work

### Resources Rollback
- Original files can be kept in current storage as backup
- `CourseResource` table can be deleted if not needed

**No data loss scenario:** Original MP4/MP3/image/resource files can be kept in backup storage (R2 or local) before uploading to Cloudflare.

---

## 13. Testing

### 13a. API Tests

Create `apps/api/src/tests/routers/test_video_router.py`:

| Test | What it checks |
|---|---|
| `test_upload_video_no_auth` | 401 without auth |
| `test_upload_video_non_admin` | 403 for non-admin |
| `test_upload_video_invalid_file` | 400 for non-video |
| `test_get_stream_url_no_auth` | 401 without auth |
| `test_get_stream_url_no_access` | 403 if user doesn't own course |
| `test_get_stream_url_success` | 200 + returns hls_url |
| `test_get_stream_url_no_video` | 404 if no cloudflare_video_uid |
| `test_delete_video_admin` | 200 for admin delete |

Create `apps/api/src/tests/routers/test_resources_router.py`:

| Test | What it checks |
|---|---|
| `test_upload_resource_admin` | 200 + creates CourseResource |
| `test_download_resource_owner` | 200 + returns download_url |
| `test_download_resource_no_access` | 403 for non-owner |
| `test_list_resources_course` | 200 + returns list |

**Important:** All tests should mock Cloudflare API calls (no real API calls in tests).

### 13b. Manual E2E Test Flow

1. Create course with Cloudflare video activity
2. Upload MP4 (small test file ~5MB)
3. Add resource file (PDF)
4. Set course thumbnail image
5. Open lesson as student who owns course
6. Verify: video plays, no download, right-click disabled, progress saves
7. Download resource — verify presigned URL works
8. Open as non-enrolled user — verify 403
9. Test podcast episode with audio upload

---

## 14. Architecture Diagram

```
+----------------------------------------------------------------------+
|  ADMIN (Course Creator)                                               |
|                                                                       |
|  POST /media/video/upload/{uuid}    POST /media/images/upload/{type}/{uuid}  POST /media/resources/upload/{course}/{activity}  |
|  +------------------------------+  +-------------------------------+  +----------------------------------+ |
|  | 1. Validate admin perms     |  | 1. Validate admin perms       |  | 1. Validate admin perms          | |
|  | 2. Upload MP4 to Cloudflare |  | 2. Upload image to Cloudflare |  | 2. Upload file to R2             | |
|  | 3. Save video UID to        |  | 3. Save image UID to entity   |  | 3. Create CourseResource record  | |
|  |    activity.extra_metadata  |  |    extra_metadata             |  | 4. Return resource info          | |
|  +------------------------------+  +-------------------------------+  +----------------------------------+ |
+----------------------------------------------------------------------+
                                     |
                                     v
+----------------------------------------------------------------------+
|  STUDENT (Learner)                                                   |
|                                                                       |
|  GET /media/video/stream/{uuid}    GET /media/resources/download/{uuid}     |
|  +------------------------------+  +----------------------------------+  |
|  | 1. Validate JWT + course    |  | 1. Validate JWT + course         |  |
|  |    access (TrailRun)        |  |    access (TrailRun)             |  |
|  | 2. Get video UID from       |  | 2. Get R2 key from              |  |
|  |    extra_metadata           |  |    CourseResource table          |  |
|  | 3. Generate signed HLS URL  |  | 3. Generate presigned R2 URL    |  |
|  | 4. Return {hls_url, poster} |  |    (1h expiry)                   |  |
|  +------------------------------+  | 4. Return {download_url,        |  |
|              |                     |    filename, filesize}          |  |
|              v                     +----------------------------------+  |
|  +------------------------------+              |                       |
|  | CloudflarePlayer (hls.js)    |              v                       |
|  | - Loads signed HLS manifest  |  Direct download from R2            |
|  | - Auto quality selection     |  (never through your server)        |
|  | - No download button         |                                       |
|  | - Reports progress to        |                                       |
|  |   TrailStep tracking         |                                       |
|  +------------------------------+                                       |
|                                                                       |
|  Images are served directly from Cloudflare:                          |
|  https://imagedelivery.net/{hash}/{uid}/medium                        |
+----------------------------------------------------------------------+
```

---

## 15. Key Decisions & Rationale

| Decision | Chosen Approach | Alternatives | Why |
|---|---|---|---|
| Video provider | Cloudflare Stream | Bunny.net, Mux, self-hosted | Zero egress fees, best cost at scale, global CDN |
| Image provider | Cloudflare Images | Cloudinary, Imgix | Included in $5 bundle, same account as Stream |
| File storage | Cloudflare R2 | AWS S3, Backblaze B2 | Zero egress fees, same Cloudflare account |
| Video storage location | `Activity.extra_metadata` JSONB | New column, new table | No migration needed, flexible |
| New video subtype | `SUBTYPE_VIDEO_CLOUDFLARE` | Reuse `SUBTYPE_VIDEO_HOSTED` | Clean separation, old content still works |
| Player library | hls.js | Shaka Player, video.js | Lightweight, widely used, good React support |
| URL signing | HMAC-SHA256 (Cloudflare native) | Custom JWT, pre-signed S3 URLs | No extra infra, Cloudflare-native |
| Resource file management | Dedicated `CourseResource` table | Store in `extra_metadata` | Proper tracking, listing, pagination |

---

## 16. Backup Strategy

| Content | Where to Keep Backup | Cost |
|---|---|---|
| Videos (original MP4s) | **Cloudflare R2** (separate backup bucket) | $0.015/GB/month — 50GB = $0.75/mo |
| Images | Cloudflare Images handles itself | Included |
| Audio (podcast MP3s) | Same R2 backup bucket | Negligible |
| Resource files (PDFs, etc.) | R2 is primary storage + optional secondary backup | $0.015/GB/month |
| Code + Database | Git + PostgreSQL dump (existing process) | Separate |

**Simple workflow:**
1. Admin uploads MP4 to Cloudflare Stream (for streaming)
2. Backend **also saves a copy to R2 backup bucket** (for redundancy)
3. If Cloudflare ever fails, originals are safe in R2
4. Code + database backup is separate (existing Git + DB dump process)

---

## 17. Future Considerations

| Feature | Description | When |
|---|---|---|
| **Watermarking** | Overlay user ID/email on video for piracy deterrence | Later phase |
| **Offline downloads** | Cloudflare Stream supports on-demand MP4 download | Opt-in per course |
| **Analytics** | Cloudflare provides viewership analytics | Built-in dashboard |
| **AI Transcription** | Cloudflare Workers AI can auto-transcribe videos | Add-on feature |
| **Video chapters** | Auto-generate chapter markers from video | Future enhancement |
| **Live streaming** | Cloudflare Stream supports live events | If needed |
| **Multi-language audio** | Add additional audio tracks to videos | For translated courses |
