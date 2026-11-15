# Mobile App Architecture

> Cross-platform mobile app built with Capacitor — same Next.js codebase, native device features, app store distribution.

---

## Why Capacitor (Not React Native / Flutter)

| Factor | Capacitor (Chosen) | React Native | Flutter |
|--------|-------------------|-------------|---------|
| **Codebase reuse** | 100% — same Next.js app | 0% — separate codebase | 0% — separate codebase |
| **Maintenance cost** | 1 codebase to maintain | 2 codebases | 2 codebases |
| **Time to MVP** | Weeks (wrap existing app) | Months (rebuild everything) | Months |
| **Native features** | Plugin ecosystem | Mature ecosystem | Growing |
| **Offline video** | ✅ Filesystem plugin | ✅ Native modules | ✅ Native modules |
| **Screen recording prevention** | ✅ `FLAG_SECURE` plugin | ✅ Native modules | ✅ Native modules |
| **Push notifications** | ✅ Plugin | ✅ Built-in | ✅ Plugin |
| **App Store / Play Store** | ✅ Full support | ✅ Full support | ✅ Full support |

**Decision:** Capacitor lets us ship a mobile app using **100% of our existing Next.js code** with zero rewrite. The web version and mobile app are the same codebase — only the native shell differs.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│              LearnHouse Web App                   │
│           (Next.js — shared codebase)             │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Desktop │  │  Mobile  │  │  Tablet        │  │
│  │ Layout  │  │  Layout  │  │  Layout        │  │
│  └─────────┘  └──────────┘  └────────────────┘  │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │  Responsive Components (same code, adaptive) │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
                        │
        Capacitor wraps the web app in a native WebView
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│           Capacitor Native Shell                  │
│                                                   │
│  ┌─────────────┐  ┌──────────────────────────┐   │
│  │   Android   │  │         iOS              │   │
│  │  (WebView)  │  │       (WebView)          │   │
│  │             │  │                          │   │
│  │ Plugins:    │  │  Plugins:                │   │
│  │ • FLAG_SECURE│  │ • Privacy Screen         │   │
│  │ • Filesystem│  │ • Filesystem             │   │
│  │ • Push      │  │ • Push Notifications     │   │
│  │ • Network   │  │ • Network                │   │
│  └─────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Offline Video Playback

- Videos are downloaded to the app's **sandboxed storage** (AES-encrypted at rest)
- Subsequent views play from local storage — **zero CDN cost**
- User can watch courses without internet connection
- Download status is checked on app launch; revoked content is removed

See [Video Protection & DRM](../video/video-protection-drm.md) for full details.

### 2. Screen Recording Prevention

- **Android:** `FLAG_SECURE` via `@capacitor/privacy-screen` — screen recorders see a black screen
- **iOS:** Privacy screen hides content in app switcher + blocks screenshots

### 3. Push Notifications

- Course updates, community replies, announcements
- Uses Firebase Cloud Messaging (Android) and APNs (iOS)
- Deep linking into specific content on tap

### 4. Bottom Tab Navigation

Mobile app uses a bottom tab bar instead of the desktop sidebar:

```
┌──────────────────────┐
│                      │
│   Content Area       │
│                      │
│                      │
├──────────────────────┤
│ 🏠  📚  💬  👤     │
│ Home Courses Community Profile│
└──────────────────────┘
```

### 5. Responsive Design Patterns

| Desktop | Mobile |
|---------|--------|
| Sidebar navigation | Bottom tab bar |
| Right sidebar cards | Full-width sections |
| Hover interactions | Tap interactions |
| Modal dialogs | Bottom sheets |
| Multi-column layouts | Single-column stacked |

---

## Capacitor Plugins

| Plugin | Purpose |
|--------|---------|
| `@capacitor/privacy-screen` | FLAG_SECURE — block screenshots/recordings |
| `@capacitor/filesystem` | Store downloaded videos in app sandbox |
| `@capacitor/push-notifications` | FCM + APNs for push notifications |
| `@capacitor/network` | Detect online/offline — switch playback source |
| `@capacitor/splash-screen` | App launch splash screen |
| `@capacitor/status-bar` | Status bar styling (dark/light mode) |
| `@capacitor/app` | App lifecycle events, deep linking |

---

## Development Workflow

```bash
# Build the web app
cd apps/web
bun run build

# Copy web build to Capacitor
npx cap copy

# Open native IDE
npx cap open android
npx cap open ios

# Sync changes (after web updates)
bun run build && npx cap copy && npx cap sync
```

---

## App Store Deployment

### Requirements

- **Android:** Google Play Developer account ($25 one-time)
- **iOS:** Apple Developer account ($99/year)

### Build Process

```bash
# Android
cd android
./gradlew assembleRelease
# Generates .apk / .aab in android/app/build/outputs/

# iOS
# Open ios/App/App.xcworkspace in Xcode
# Product → Archive → Distribute to App Store
```

---

## Related Documents

- [Desktop App Architecture](../desktop-app/desktop-app-architecture.md) — Desktop app (Capacitor Electron)
- [Video Protection & DRM](../video/video-protection-drm.md) — Screen recording prevention, offline downloads
- [Cloudflare Stream Integration](../video/cloudflare-stream-integration.md) — Video upload and streaming
