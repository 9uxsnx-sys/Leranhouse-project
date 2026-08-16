
# LearnHouse Version Decision

## Why we are changing versions
We prefer the **simpler, clean bottom‑fixed black mobile navbar** with:
- Black background (bg‑black/90) + backdrop blur
- Icons spaced evenly in a row
- Text labels under each icon
- No expandable pill menu
- Uses Lucide icons

This design was in version 1.2.x!

## Which version to use?
**1.2.0** (git tag: `1.2.0`) — released May 12, 2026!

## How to switch to 1.2.0
1. Checkout the 1.2.0 tag:
   ```bash
   git checkout 1.2.0
   ```

2. Verify we're on the correct commit:
   ```bash
   git log --oneline -1
   ```

3. Re‑install dependencies if needed (since dependencies may change):
   - For web/collab: `cd apps/web && bun install`
   - For API: `cd apps/api && uv sync`

## To go back to the latest version later
```bash
git checkout main
```

