# Agent Guidelines — LearnHouse Medusa Redesign

> **Read this file FIRST before making ANY changes to the codebase.**
> These rules prevent costly mistakes like editing the wrong page or component.

---

## ⚠️ HARD RULES (Do NOT Violate)

### RULE #1: Know Your Part

| If the route contains... | It is... | Action |
|--------------------------|----------|--------|
| `/dash/` | **Admin Dashboard** | ❌ Do NOT apply Medusa redesign. Keep original. |
| `(withmenu)/` | **User Part** | ✅ Medusa redesign applies here. |

**Always check the full file path before editing.** If the path contains `/dash/`, STOP and verify you're supposed to edit it.

### RULE #2: Component Separation

| Component | Used For | Action |
|-----------|----------|--------|
| `CourseCard.tsx` | User Part (homepage courses tab, listings) | ✅ Edit freely for Medusa redesign |
| `CourseThumbnail.tsx` | Admin Dashboard (dash/courses) | ❌ **NEVER TOUCH** |

**Never replace `CourseThumbnail` with `CourseCard`** — they belong to different parts of the app.

### RULE #3: File Path Verification

Before editing any file, verify:
1. Is the path under `apps/web/`? → Good
2. Does the path contain `(withmenu)` or `dash`? → Check Rule #1
3. Which component does this page use? → Check Rule #2
4. Is this the right file? → If unsure, ask or check `docs/UI_ROUTES_MAP.md`

---

## 📋 Required Reading for New Agents

Read these files in order before starting work:

1. **[PROJECT_VISION.md](file:///c%3A/Projects/learnhouse-dev/learnhouse-dev/docs/PROJECT_VISION.md)** — Overall project goals and architecture
2. **[UI_ROUTES_MAP.md](file:///c%3A/Projects/learnhouse-dev/learnhouse-dev/docs/UI_ROUTES_MAP.md)** — Complete route map (User vs Admin)
3. **[AGENT_GUIDELINES.md](file:///c%3A/Projects/learnhouse-dev/learnhouse-dev/docs/AGENT_GUIDELINES.md)** — This file (rules to follow)
4. **[medusa-ui-redesign.md](file:///c%3A/Projects/learnhouse-dev/learnhouse-dev/apps/web/docs/medusa-ui-redesign.md)** — Medusa design specs and progress
5. **[DEV_SETUP.md](file:///c%3A/Projects/learnhouse-dev/learnhouse-dev/DEV_SETUP.md)** — How to run the project locally

---

## 🔧 Workflow Rules

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Original codebase — do NOT push redesign work here |
| `feat/learnhouse-1.2.0-custom` | **Active development branch** — all redesign work goes here |

**Always verify which branch you're on before making changes.**

### Before Making Changes

1. Read `docs/AGENT_GUIDELINES.md`
2. Read `docs/UI_ROUTES_MAP.md` to confirm the route
3. Check the file path for `/dash/` or `(withmenu)`
4. Confirm the component name matches the expected one
5. Proceed

### After Making Changes

1. Verify the change is in the correct part (User vs Admin)
2. Test the affected route in the browser
3. Make sure you haven't accidentally touched Admin Dashboard files

---

## ❌ Common Mistakes to Avoid

| Mistake | Why It's Wrong | How to Avoid |
|---------|---------------|--------------|
| Editing `dash/courses/client.tsx` for a homepage courses tab | That's the **Admin Dashboard**, not the User Part | Check the path for `/dash/` |
| Using `CourseCard` in an Admin Dashboard page | `CourseCard` is a User Part component | Check `docs/UI_ROUTES_MAP.md` |
| Applying Medusa styles to `CourseThumbnail` | That's an Admin component — keep original | Never touch `CourseThumbnail.tsx` |
| Editing files under `dash/` at all | Unless specifically asked, Admin Dashboard is off-limits | Verify with the project lead first |

---

## 📞 If Unsure

If you're not sure whether a file should be edited or which component to use:

- Check `docs/UI_ROUTES_MAP.md`
- Check `docs/PROJECT_VISION.md`
- **Ask the user for clarification before proceeding**
