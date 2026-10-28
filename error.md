# Error Log

## Runtime AbortError — "signal is aborted without reason"
- **Status**: ✅ Fixed
- **Root cause**: Next.js 16 routes `onRecoverableError` → `reportGlobalError` → original `window.reportError()` → `error` DOM event → `onUnhandledError` (registered via `addEventListener`) → `handleClientError` → dev overlay. The `reportGlobalError` function captures `window.reportError` at **module load time**, so patching `window.reportError` has no effect. Additionally, explicit `AbortErrorBoundary` components made things **worse** by routing errors through `onCaughtError` → `handleClientError(error)` directly, bypassing both `window.reportError` and `addEventListener`.
- **Fix** (see `apps/web/app/layout.tsx`):
  1. **Removed `AbortErrorBoundary`** from `layout.tsx` and `podcast.tsx` — these routed errors through `handleClientError` directly, which our DOM-level patches cannot intercept.
  2. **Patched `window.addEventListener`** in a synchronous `<head>` script to wrap all `error` and `unhandledrejection` listeners with AbortError filtering. Since `handleGlobalErrors()` registers `onUnhandledError` via `addEventListener('error', ...)` from a React component (after our sync script runs), our wrapper intercepts AbortErrors before they reach `handleClientError` and the dev overlay.
- **Key insight**: The ONLY reliable interception point is `window.addEventListener` for `error` events. `window.reportError` patching is useless because Next.js captures it at module load time. Error boundaries are counterproductive because they route through `handleClientError` directly.
