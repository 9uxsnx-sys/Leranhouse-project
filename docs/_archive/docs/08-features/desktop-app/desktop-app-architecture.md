# Desktop App Architecture

> Cross-platform desktop app built with Capacitor Electron — same Next.js codebase as web and mobile, native OS protection, app store distribution.

---

## Why a Desktop App

### The Problem with Web-Only

| Issue | Web Browser | Desktop App |
|-------|------------|-------------|
| **Screen recording prevention** | ❌ Widevine L3 only (software — bypassable) | ✅ **Native OS APIs** — black screen in captures |
| **Video protection** | ❌ L3 DRM — decrypted in software | ✅ PlayReady SL3000 / FairPlay — hardware-backed |
| **Offline downloads** | ❌ Limited (PWA) | ✅ Full local sandbox + encryption |
| **Professional perception** | ❌ "Cheap platform" feeling | ✅ "Premium software" feeling |
| **App store presence** | ❌ | ✅ Microsoft Store, Mac App Store |

### Strategic Goal

By offering a **desktop app**, we:
1. **Eliminate the web browser entirely** — users download the app instead of visiting a URL
2. **Get hardware-backed DRM** — PlayReady (Windows) / FairPlay (macOS) — the strongest available
3. **Prevent screen recording** at the OS level — `SetWindowDisplayAffinity` on Windows
4. **Save CDN costs** — offline playback from local storage
5. **Build a premium brand** — a native app feels more professional than a browser tab

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              LearnHouse Web App                   │
│           (Next.js — shared codebase)             │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│           Capacitor Electron Shell                │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │         Electron Main Process                │ │
│  │                                              │ │
│  │  • Window management                         │ │
│  │  • Native menu / tray                        │ │
│  │  • Auto-updates                              │ │
│  │  • Deep linking                              │ │
│  └──────────────┬───────────────────────────────┘ │
│                 │                                  │
│  ┌──────────────▼───────────────────────────────┐ │
│  │         Electron Renderer Process            │ │
│  │  (Chromium — loads your Next.js app)         │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │         Native Protection Layer              │ │
│  │                                              │ │
│  │  Windows:                                    │ │
│  │  • SetWindowDisplayAffinity                  │ │
│  │    (WDA_EXCLUDEFROMCAPTURE)                  │ │
│  │  • PlayReady SL3000 DRM                      │ │
│  │                                              │ │
│  │  macOS:                                      │ │
│  │  • FairPlay DRM                              │ │
│  │  • Secure Enclave playback pipeline          │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Screen Recording Prevention

### Windows: WDA_EXCLUDEFROMCAPTURE

This is a **native Win32 API** that tells Windows:

> "This window must be excluded from all screen capture attempts"

```cpp
SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
```

**What it blocks:**
- OBS Studio
- Windows Game Bar (Win+G)
- Snipping Tool
- Zoom / Teams screen sharing
- Any third-party screen recorder

**In Electron:**

```javascript
const { BrowserWindow } = require('electron')

const win = new BrowserWindow({
  webPreferences: { /* ... */ }
})

// Enable content protection
win.setContentProtection(true)
```

### macOS: FairPlay + Secure Enclave

On macOS, video playback is handled through **Apple's FairPlay DRM** pipeline:
- Video decryption happens in the **Secure Enclave** (hardware security chip)
- Decoded frames go directly to the GPU framebuffer
- Screen recorders cannot access the frame data

---

## Offline Downloads

### Same Architecture as Mobile

The desktop app uses the same offline download system as the mobile app:

1. User downloads a course lesson
2. Video is stored in the **app's private sandbox** (encrypted at rest)
3. Subsequent playbacks read from local storage — **zero CDN cost**
4. If access is revoked, content is removed on next app launch

### Storage Location

| Platform | Path |
|----------|------|
| **Windows** | `%APPDATA%/learnhouse/videos/` |
| **macOS** | `~/Library/Application Support/learnhouse/videos/` |

Files are stored without extensions and AES-encrypted with a machine-specific key.

---

## Key Desktop Features

### 1. Auto-Update

- Uses `electron-updater` with GitHub Releases
- Users are notified when a new version is available
- Updates download in the background and install on restart

### 2. Deep Linking

- `learnhouse://course/{uuid}` opens directly to course content
- `learnhouse://community/{uuid}` opens community discussions
- Registered as default protocol handler on Windows/macOS

### 3. Native Menus

- Standard app menu (File, Edit, View, Window, Help)
- "Download for offline" option in context menu
- System tray icon with quick actions

### 4. Auto-Start

- Option to launch on system startup
- Minimize to tray instead of closing

---

## Distribution

### Windows

- **Package format:** NSIS installer (`.exe`) or MSIX (Microsoft Store)
- **Signing:** Authenticode certificate for Windows SmartScreen
- **Store:** Microsoft Store optional — direct download is primary

### macOS

- **Package format:** `.dmg` (drag to Applications) or `.pkg`
- **Signing:** Apple Developer ID certificate for notarization
- **Store:** Mac App Store optional — direct download is primary

### Build Commands

```bash
# Build the Next.js app
cd apps/web
bun run build

# Build desktop app for current platform
npx cap open electron
# or
npx cap build electron

# Package for distribution
# Windows:
cd electron
npm run build:win

# macOS:
cd electron
npm run build:mac
```

---

## Comparison: Web vs Mobile vs Desktop

| Feature | Web | Mobile App | Desktop App |
|---------|-----|-----------|-------------|
| **Screen recording prevention** | ❌ | ✅ FLAG_SECURE | ✅ WDA_EXCLUDEFROMCAPTURE |
| **DRM level** | L3 (software) | L1 (hardware) | SL3000 (hardware) |
| **Offline playback** | ❌ | ✅ | ✅ |
| **CDN cost savings** | ❌ | ✅ | ✅ |
| **App store presence** | ❌ | ✅ | ✅ |
| **No browser needed** | ❌ | ✅ | ✅ |
| **Codebase** | Same | Same | Same |

---

## Related Documents

- [Mobile App Architecture](../mobile-app/mobile-app-architecture.md) — Mobile app (Capacitor)
- [Video Protection & DRM](../video/video-protection-drm.md) — Screen recording prevention, offline downloads
- [Cloudflare Stream Integration](../video/cloudflare-stream-integration.md) — Video upload and streaming
