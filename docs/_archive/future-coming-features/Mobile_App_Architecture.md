# Mobile App (React Native + Expo) — Architecture & Implementation Plan

> **Status:** Planned  
> **Stack:** React Native + Expo (managed workflow)  
> **Target:** Post-redesign release, after Admin AI Agent  

---

## 1. Vision

A native mobile app for Koodoox built with React Native and Expo, giving learners and admins a first-class mobile experience — offline-capable course consumption, push notifications, native video playback, and full access to all platform features. The app will share the same API as the web app, ensuring feature parity with minimal backend changes.

---

## 2. Feasibility Assessment

### 2.1 Backend API — READY ✅

| Component | Status | Details |
|---|---|---|
| **REST API** | ✅ Fully ready | All platform features exposed via `/api/v1/` — courses, communities, podcasts, auth, analytics, webhooks, AI |
| **Auth** | ✅ Mobile-friendly | Login returns `access_token` + `refresh_token` in body (not just cookies). Supports Bearer token auth header. Refresh token rotation built-in. |
| **OAuth (Google)** | ✅ Ready | Third-party OAuth login endpoint available |
| **SSO (WorkOS)** | ✅ Ready | Enterprise SSO via WorkOS |
| **API Tokens** | ✅ Ready | Org-scoped API tokens for programmatic access |
| **Video Streaming** | ✅ Ready | HTTP Range-request streaming (1MB chunks), supports mp4, webm, mov, etc. Works with both local and S3 storage |
| **Audio Streaming** | ✅ Ready | Same Range-request pattern for podcast episodes |
| **File Upload** | ✅ Ready | S3-compatible and local filesystem storage |
| **JSON Responses** | ✅ Ready | All endpoints return structured JSON — no HTML or server-rendered content |
| **Pagination** | ✅ Ready | Consistent pagination patterns across list endpoints |
| **OpenAPI Schema** | ✅ Auto-generated | FastAPI auto-generates OpenAPI/Swagger docs — can generate TypeScript client types |

### 2.2 What's MISSING (Needs Building)

| Component | Status | Why |
|---|---|---|
| **Push Notifications** | ❌ Not built | No Firebase Cloud Messaging (FCM), no OneSignal, no web push. Need to build notification infrastructure from scratch. |
| **Offline Support** | ❌ Not built | No offline-first patterns. Web app is fully online. Need local DB (SQLite via expo-sqlite) + sync engine. |
| **Mobile Auth Flow** | ⚠️ Partial | Auth returns tokens in body ✅, but no biometric auth, no secure token storage pattern for mobile. |
| **Deep Linking** | ❌ Not built | No universal links / deep link routing for sharing course links to mobile app. |
| **Background Sync** | ❌ Not built | No background task infrastructure for syncing course progress when offline. |
| **Push Notification Subscriptions** | ❌ Not built | No endpoint for registering device push tokens. |
| **Media Caching** | ❌ Not built | No client-side video/audio caching for offline playback. |

### 2.3 Key Architecture Decisions Already Made for Us

| Decision | Current State | Mobile Implication |
|---|---|---|
| **API auth** | Bearer token + cookie | App uses Bearer token (simple, secure) |
| **File storage** | S3-compatible | Direct S3 URLs for media — no proxy needed |
| **Video delivery** | HTTP Range requests | Native `expo-av` or `react-native-video` can use Range headers |
| **Real-time** | Hocuspocus (WebSocket) | Possible via `react-native-websocket` or `expo-websocket` |
| **Analytics** | Tinybird HTTP API | Works from mobile — just HTTP POST |

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Expo SDK 52+ (managed workflow) | Best DX for React Native, OTA updates, EAS Build |
| **Navigation** | Expo Router (file-based) | Same pattern as Next.js App Router — familiar to web team |
| **UI** | Native components + custom design system | Medusa UI patterns ported to React Native |
| **State** | TanStack Query (React Query) | Server state caching, pagination, optimistic updates |
| **Local DB** | expo-sqlite + drizzle-orm | Offline-first course content and progress |
| **Video** | expo-av / react-native-video | Native video playback with caching |
| **Audio** | expo-av | Podcast playback with background audio |
| **Auth** | expo-auth-session + secure-store | OAuth flows + secure token storage |
| **Push** | expo-notifications + Firebase Cloud Messaging | Push notifications for course updates, discussions |
| **Background** | expo-background-fetch + expo-task-manager | Background sync for progress |
| **Payments** | Stripe SDK (react-native-stripe) | In-app purchases and enrollments |

---

## 4. Screens & Navigation Structure

```
App
├── Auth Stack
│   ├── Login
│   ├── Sign Up
│   ├── Forgot Password
│   ├── OAuth Callback (Google)
│   └── SSO Callback (WorkOS)
│
├── Main Tab Navigator (Bottom Tabs)
│   ├── Home (Feed)
│   │   ├── Continue Learning
│   │   ├── Featured Courses
│   │   ├── Recent Activity
│   │   └── Recommended
│   │
│   ├── Courses
│   │   ├── Course List (search/filter)
│   │   ├── Course Detail
│   │   ├── Lesson Preview (video + sections)
│   │   │   ├── What You'll Learn
│   │   │   ├── Lesson Video (full-screen)
│   │   │   ├── Key Takeaways
│   │   │   ├── Resources (download)
│   │   │   ├── Knowledge Check (Q&A accordion)
│   │   │   └── Up Next
│   │   └── Course Curriculum (accordion)
│   │
│   ├── Communities
│   │   ├── Community List
│   │   ├── Community Detail
│   │   ├── Discussion Thread
│   │   └── Create Post
│   │
│   ├── Podcasts
│   │   ├── Podcast List
│   │   ├── Podcast Detail
│   │   ├── Episode Player (full-screen audio)
│   │   └── Episode Notes
│   │
│   └── Profile
│       ├── My Profile
│       ├── My Courses
│       ├── My Certificates
│       ├── Settings
│       └── App Settings (dark mode, notifications, cache)
│
├── Admin Stack (if admin)
│   ├── Dashboard
│   ├── Analytics
│   ├── User Management
│   ├── Course Management
│   └── AI Agent Chat
│
└── Modals
    ├── Share Sheet
    ├── Image Picker
    ├── Video Player (full-screen)
    └── Search
```

---

## 5. Key Features

### 5.1 Course Consumption (Core)

| Feature | Implementation |
|---|---|
| **Video playback** | Native video player with play/pause, seek, speed control, full-screen, picture-in-picture (PiP) |
| **Offline download** | Download course videos and resources for offline viewing via `expo-file-system` |
| **Progress tracking** | Auto-sync lesson completion — works offline, syncs when online |
| **Knowledge checks** | Interactive Q&A accordion cards with answer validation |
| **Resources** | Downloadable files with native share sheet |
| **Course outline** | Accordion with chapter/lesson tree, completion status indicators |
| **Continue learning** | Resume from last uncompleted lesson |

### 5.2 Podcasts

| Feature | Implementation |
|---|---|
| **Background audio** | Play podcasts in background with lock screen controls (via `expo-av`) |
| **Playback speed** | 0.5x - 2x speed control |
| **Chapter markers** | Episode chapter navigation |
| **Download for offline** | Download episodes for offline listening |
| **Playlist queue** | Queue episodes for continuous playback |

### 5.3 Communities

| Feature | Implementation |
|---|---|
| **Feed browsing** | Infinite scroll with pull-to-refresh |
| **Rich text posts** | Markdown rendering for discussions |
| **Image/video upload** | Native image picker + camera integration |
| **Push notifications** | New replies, mentions, reactions |
| **Reactions** | Emoji reactions on posts and comments |

### 5.4 Offline Mode

| Feature | Implementation |
|---|---|
| **Offline-first architecture** | Local SQLite database via `expo-sqlite` + drizzle-orm |
| **Sync engine** | Queue changes when offline, sync when online (via TanStack Query persistence) |
| **Offline video** | Pre-downloaded videos play without internet |
| **Offline progress** | Track lesson completion offline, sync on reconnection |
| **Conflict resolution** | Last-write-wins for progress data (low conflict risk) |

### 5.5 Push Notifications

| Feature | Implementation |
|---|---|
| **Course updates** | New lesson posted, course published |
| **Discussion replies** | Someone replied to your discussion post |
| **Mentions** | Someone mentioned you in a discussion |
| **Achievements** | Certificate awarded, course completed |
| **Admin alerts** | (Future) Admin agent notifications |
| **Deep links** | Tap notification → opens exact screen in app |

### 5.6 Admin Features (Mobile)

| Feature | Implementation |
|---|---|
| **Analytics dashboard** | View key metrics on mobile with charts |
| **Course management** | Create/edit/publish courses from mobile |
| **User management** | View users, manage roles |
| **AI Agent chat** | Talk to the admin AI agent (same as web) |

---

## 6. API Integration Pattern

All API calls go through a shared client layer:

```typescript
// api/client.ts
import { secureStore } from './storage'

const API_BASE = process.env.EXPO_PUBLIC_API_URL

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync('access_token')
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  
  if (response.status === 401) {
    const refreshed = await refreshToken()
    if (refreshed) return request(endpoint, options)
  }
  
  return response.json()
}
```

**Key advantage:** The API already supports `Bearer` token auth — no backend changes needed.

---

## 7. Auth Flow (Mobile)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Login Screen │     │   Expo App    │     │  Koodoox API │
│  (user)       │     │  (mobile)     │     │  (backend)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │  Email + Password  │                    │
       │──────────────────►│  POST /auth/login  │
       │                    │──────────────────►│
       │                    │                    │
       │                    │  200: {tokens}     │
       │                    │◄──────────────────│
       │                    │                    │
       │                    │  Store in          │
       │                    │  expo-secure-store │
       │                    │                    │
       │  ✅ Logged in      │                    │
       │◄──────────────────│                    │
       │                    │                    │
       │  (Later)           │                    │
       │  Open app          │                    │
       │──────────────────►│  Check secure-store │
       │                    │  for existing token │
       │                    │                    │
       │                    │  Token valid?      │
       │                    │  ├─ Yes → Home     │
       │                    │  └─ No → POST      │
       │                    │         /auth/      │
       │                    │         refresh     │
       │                    │                    │
       │                    │  OR → Google OAuth │
       │                    │  via expo-auth-    │
       │                    │  session           │
```

**Token storage:** `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences on Android)

---

## 8. Offline Architecture

```
┌───────────────────────────────────────────────────────┐
│                    React Native App                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐     ┌─────────────────────────┐   │
│  │  TanStack Query  │     │   SQLite Local DB        │   │
│  │  (Server cache)  │◄───►│   (expo-sqlite)          │   │
│  │                  │     │   • Courses              │   │
│  │  • Auto refetch  │     │   • Lessons              │   │
│  │  • Optimistic    │     │   • Progress             │   │
│  │    updates       │     │   • Downloaded videos    │   │
│  │  • Pagination    │     │   • User data            │   │
│  └────────┬─────────┘     └───────────┬─────────────┘   │
│           │                           │                  │
│           ▼                           ▼                  │
│  ┌──────────────────────────────────────────────┐       │
│  │           Sync Engine                         │       │
│  │  • Queue mutations when offline               │       │
│  │  • Replay when online                         │       │
│  │  • Conflict resolution (last-write-wins)      │       │
│  └──────────────────────────────────────────────┘       │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────────────────────────────────┐       │
│  │           Network Layer                       │       │
│  │  • Online → API calls                         │       │
│  │  • Offline → Local DB reads                   │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Push Notification Infrastructure

### Backend Changes Needed

New table: `device_tokens`

```sql
CREATE TABLE device_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token TEXT NOT NULL,
  platform TEXT NOT NULL,  -- 'ios' | 'android'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

New API endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/push/register` | POST | Register device push token |
| `/api/v1/push/unregister` | POST | Remove device push token |
| `/api/v1/push/send` | POST | Send push to user (admin only) |

### Notification Events

| Event | Trigger | Target |
|---|---|---|
| `course_completed` | User completes a course | User |
| `certificate_claimed` | Certificate issued | User |
| `discussion_reply` | Someone replies to your post | Post author |
| `discussion_mention` | Someone @mentions you | Mentioned user |
| `course_published` | Course goes live | Enrolled learners |
| `new_lesson` | New lesson added | Enrolled learners |
| `enrollment_confirmed` | Successfully enrolled | User |

### Push Service Options

| Option | Cost | Complexity | Best For |
|---|---|---|---|
| **Expo Push Notifications** | Free (via Expo's service) | Low | Getting started quickly |
| **Firebase Cloud Messaging** | Free | Medium | Production, full control |
| **OneSignal** | Free tier available | Low | Multi-platform, rich analytics |

**Recommendation:** Start with Expo Push Notifications (zero infrastructure), migrate to Firebase Cloud Messaging for production.

---

## 10. Implementation Phases

### Phase 1 — Foundation (Weeks 1-3)

- [ ] Initialize Expo project with Expo Router
- [ ] Set up shared API client layer with token management
- [ ] Implement auth flow (login, signup, Google OAuth, token refresh)
- [ ] Implement secure token storage (`expo-secure-store`)
- [ ] Set up TanStack Query with persistence
- [ ] Build bottom tab navigator shell
- [ ] Implement dark/light theme system

### Phase 2 — Course Consumption (Weeks 4-6)

- [ ] Build course list screen with search/filter
- [ ] Build course detail screen
- [ ] Build lesson preview screen with all sections
- [ ] Integrate native video player (`expo-av`)
- [ ] Build course curriculum accordion
- [ ] Implement progress tracking
- [ ] Build knowledge check Q&A cards

### Phase 3 — Podcasts (Week 7)

- [ ] Build podcast list screen
- [ ] Build podcast detail screen
- [ ] Build episode player with background audio
- [ ] Implement playback speed control
- [ ] Add chapter navigation

### Phase 4 — Communities (Week 8)

- [ ] Build community list screen
- [ ] Build discussion feed with infinite scroll
- [ ] Implement post creation (text + images)
- [ ] Build comment threads
- [ ] Add reaction support

### Phase 5 — Offline & Sync (Weeks 9-10)

- [ ] Set up SQLite local database
- [ ] Implement offline course content storage
- [ ] Build download manager for videos
- [ ] Implement sync engine (queue + replay)
- [ ] Add offline progress tracking
- [ ] Build conflict resolution

### Phase 6 — Push Notifications (Week 11)

- [ ] Add push notification backend (device_tokens table, endpoints)
- [ ] Integrate `expo-notifications`
- [ ] Implement push registration on login
- [ ] Build notification handlers with deep linking
- [ ] Add notification preferences in settings

### Phase 7 — Admin Features (Week 12)

- [ ] Build admin analytics dashboard (mobile-optimized charts)
- [ ] Add course management from mobile
- [ ] Add user management from mobile
- [ ] Integrate Admin AI Agent chat

### Phase 8 — Polish & Store Release (Weeks 13-14)

- [ ] Performance optimization (list virtualization, image caching)
- [ ] Accessibility (screen reader support, dynamic type)
- [ ] Apple App Store submission
- [ ] Google Play Store submission
- [ ] EAS Update (OTA updates) configuration

---

## 11. App Store Assets Required

| Asset | Purpose |
|---|---|
| App icon (1024x1024) | App Store + Play Store |
| Splash screen | Launch screen |
| Screenshots (6.5" iPhone + 12.9" iPad) | App Store listing |
| Screenshots (Android) | Play Store listing |
| Preview video (30s) | App Store (optional) |
| Privacy policy URL | Required by both stores |
| Terms of service URL | Required by both stores |

---

## 12. Advantages of React Native + Expo

| Advantage | Why It Matters |
|---|---|
| **Code sharing** | TypeScript everywhere — share types with web app |
| **OTA updates** | Push updates without App Store review (via EAS Update) |
| **Native performance** | 60fps animations, native video, native audio |
| **Push notifications** | Expo Push Notifications — zero infrastructure |
| **Offline-first** | `expo-sqlite` + `expo-file-system` for offline content |
| **Background audio** | Podcasts play with phone locked |
| **Picture-in-Picture** | Video plays in PiP while using other apps |
| **Biometric auth** | Face ID / Fingerprint login |
| **Share sheet** | Native iOS/Android share for course links |
| **EAS Build** | Cloud-based builds, no local Xcode/Android Studio needed |

---

## 13. Comparison: Mobile App vs. Mobile Web (PWA)

| Feature | Mobile Web (PWA) | Native App (RN + Expo) |
|---|---|---|
| **Video playback** | Limited (Safari restrictions) | Full native (PiP, background) |
| **Audio background** | ❌ Not possible | ✅ Full support |
| **Push notifications** | Limited (Safari) | ✅ Full support |
| **Offline** | Partial (Service Worker cache) | ✅ Full (SQLite + file system) |
| **Performance** | Good | ✅ Excellent (native) |
| **App Store presence** | ❌ | ✅ Discovery + trust |
| **Biometric auth** | ❌ | ✅ Face ID / Fingerprint |
| **Share sheet** | Limited | ✅ Full native |
| **Development speed** | ✅ Faster | Slower (more code) |
| **Update cycle** | ✅ Instant | Requires EAS Update or store review |
| **File download** | Limited | ✅ Full native download manager |

**Recommendation:** Build the native app for the best experience. Keep the mobile web as a fallback for users who don't want to install an app.

---

## 14. Backend Changes Required

| Change | Effort | Priority |
|---|---|---|
| Add `device_tokens` table | Small | High (Phase 6) |
| Add push notification endpoints | Medium | High (Phase 6) |
| Add push notification dispatch service | Medium | High (Phase 6) |
| Add `prefers_offline` user setting | Small | Medium |
| Add download manifest endpoint for bulk downloads | Medium | Medium |
| No other backend changes needed | — | — |

**The existing REST API covers 95%+ of what the mobile app needs.** The only significant backend work is push notifications.

---

## 15. Success Metrics

| Metric | Target |
|---|---|
| App Store rating | 4.5+ stars |
| Crash-free rate | >99.5% |
| Offline video playback | >95% success rate |
| Push notification delivery | >99% within 30s |
| Course completion rate (mobile) | Equal to or better than web |
| Daily active users (mobile) | >30% of total DAU |

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **App Store rejection** | Follow Apple/Google guidelines strictly. Avoid paywall circumvention. |
| **Video DRM** | Use expo-av with FairPlay/Widevine support if needed for premium content. |
| **Large app size** | Use on-demand resources for video content. Keep core app under 100MB. |
| **Offline sync conflicts** | Last-write-wins for progress data (low risk — only one device at a time). |
| **API rate limiting** | Cache aggressively on mobile. Reduce polling frequency. |
| **Android fragmentation** | Test on top 20 Android devices via BrowserStack. Use Expo managed workflow. |

---

## 17. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Koodoox Mobile App (Expo)                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐│
│  │  Auth     │  │  Courses │  │ Podcasts │  │  Communities         ││
│  │  Stack   │  │  Stack   │  │  Stack   │  │  Stack               ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘│
│       │              │             │                    │            │
│       └──────────────┴─────────────┴────────────────────┘            │
│                              │                                       │
│                      ┌───────┴────────┐                              │
│                      │  API Client     │                             │
│                      │  (TanStack     │                             │
│                      │   Query +       │                             │
│                      │   Auth)         │                             │
│                      └───────┬────────┘                              │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTPS / Bearer Token
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Koodoox Backend (FastAPI)                         │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │  Auth    │  │  Courses │  │ Podcasts │  │  Push              │   │
│  │  API     │  │  API     │  │  API     │  │  Notification      │   │
│  │          │  │          │  │          │  │  Service (NEW)      │   │
│  └──────────┘  └──────────┘  └──────────┘  └────────┬───────────┘   │
│                                                      │               │
│                                                      ▼               │
│                                          ┌────────────────────┐      │
│                                          │  Firebase / Expo   │      │
│                                          │  Push Service      │      │
│                                          └────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

---

*This document is a living specification and will be updated as implementation progresses.*
