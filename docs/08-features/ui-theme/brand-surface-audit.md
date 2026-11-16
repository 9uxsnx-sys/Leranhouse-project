> Status: audit · Created: 2026-11-16 · Companion to [theme-color-plan.md](./theme-color-plan.md)
>
> **Implementation status (2026-11-16):** the statuses below are the original audit snapshot. Every **Ready** and **Needs work** row in sections 3 and 4 is now connected — the surface reads `bg-brand` / `text-brand-fg` / `hover:bg-brand-hover`, and `--brand` resolves on all four shells (learner, dashboard, auth, embed) plus `document.documentElement` so portalled dialogs inherit it. Charts are on the brand ramp (section 4.7), and the two **Blocked** rows in section 5 are fixed. The foreground on brand fills is no longer only derived: Branding → Theme → **Text & Icons** pins `customization.general.brand_fg` when the automatic black/white choice is not wanted, and the automatic choice itself now compares both candidates rather than using a luminance threshold. Still open: the optional **`--brand-soft` selection tint**, and everything listed under **Excluded** (unchanged by design). Mobile shells remain out of scope.

# Brand colour — full surface audit

Every place in the product that could take the organization's brand colour, what it is in plain language, and whether it is already connected.

Scope: **desktop, learner side and admin dashboard**, inside an organization. Mobile shells are out of scope and are not audited here.

---

## 1. The rule this list follows

The Claude approach is **one saturated colour, used as a signal, never as decoration**:

- **Structural UI is neutral.** Backgrounds, sidebars, headers, cards, text, borders, icons.
- **The accent appears only on things that ask for an action or show progress.**
- **One filled primary per view.** A screen with two coloured buttons has no primary.
- The industry pattern agrees: 17 of 22 major SaaS products use exactly one saturated colour, and the common split is 60% neutral background / 30% structure / 10% accent.

WCAG floors that apply to anything we theme:
- **4.5:1** for normal text on the brand fill,
- **3:1** for component boundaries and meaningful graphics.

That is why links, focus rings, checkboxes and status colours stay out of this list.

---

## 2. Status legend

| Status | Meaning |
|---|---|
| **Linked** | Already reads `--brand`. Changing the colour in Theme changes it right now. |
| **Ready** | Built with the shared button or a plain colour class, and `--brand` already resolves on that screen. One class or token swap — no structural work. |
| **Needs work** | Hand-written element (raw `<a>` / `<button>`), or geometry we must preserve, or duplicated variants. A real code change, not a one-liner. |
| **Blocked** | The screen has no `--brand` in scope, so it cannot be themed until the token is added there. |
| **Excluded** | Stays neutral or semantic on purpose. |

---

## 3. Learner side (`/orgs/<slug>/…`)

### 3.1 Course detail page

| What it is | Status | What it takes |
|---|---|---|
| The big full-width **"Continue learning"** button under the course cover | **Ready** | Shared `primary` button, large size — turns brand in step 4 |
| The **"Get access"** button shown on paid courses | **Ready** | Same component |
| The thin **progress bar** under the cover showing how far the learner is | **Ready** | Currently hard-coded `bg-black` — swap to `bg-brand` |

### 3.2 Course end page (after the last activity)

| What it is | Status | What it takes |
|---|---|---|
| **"Continue learning"** pill at the bottom | **Needs work** | Hand-written 48px pill, not the shared button. Colouring it means editing the pill directly or migrating it to the component |
| **"Back to course"** pill | **Needs work** | Same |
| **"Verify certificate"** pill | **Needs work** | Same |
| The **course progress bar** in the middle of the page | **Ready** | Colour class swap |
| **"Download certificate"** green button | **Excluded** | Success colour, not brand |

### 3.3 Course activity / lesson player

| What it is | Status | What it takes |
|---|---|---|
| **"Sign in to continue"** button on a locked activity | **Needs work** | Hand-written link styled as a button |
| **"Continue"** button at the end of an activity | **Needs work** | Same |
| **"Retry"** button in the lesson error state | **Needs work** | Same |
| **"Continue"** inside a Markdown activity | **Needs work** | Same |
| Video player play / buffer / volume chrome | **Excluded** | Sits on top of video, must not compete |

### 3.4 Progress (Trail) page

| What it is | Status | What it takes |
|---|---|---|
| **Course progress bar** on a trail card | **Ready** | Colour class swap |
| **Progress bar** on the trail list row | **Ready** | Same |
| "View certificate" / "Continue" **text links** | **Excluded** | Links stay ink + underline |

### 3.5 Certificates page

| What it is | Status | What it takes |
|---|---|---|
| **"Back to course"** pill on the "not available" state | **Needs work** | Hand-written pill |
| **"Back to course"** pill on the "no certificate" state | **Needs work** | Same |
| Blue spinner / icons | **Excluded** | Status, not brand |

### 3.6 Collections

| What it is | Status | What it takes |
|---|---|---|
| **"Go to courses"** button | **Ready** | Shared primary button |
| **"Get access"** on a paid collection | **Ready** | Same |
| **"Start"** / second access button on a paid collection | **Ready** | Same |

### 3.7 Podcast pages

| What it is | Status | What it takes |
|---|---|---|
| **"Continue listening"** button on the podcast page | **Ready** | Shared primary button |
| **"Get access"** on a paid podcast | **Ready** | Same |
| **Episode progress bar** in the episode list | **Ready** | Colour class swap |
| **Episode completion indicator** | **Excluded** for the completed part (emerald); the remaining part can be brand |
| Play / pause circles on episodes | **Excluded** | Media control |
| Full podcast player chrome | **Excluded** | Media control |

### 3.8 Store

| What it is | Status | What it takes |
|---|---|---|
| **"Get access"** pill on a product card | **Needs work** | Hand-written pill with its own hover |

### 3.9 Paid lesson disclaimer

| What it is | Status | What it takes |
|---|---|---|
| **"Get access"** button inside the "this lesson is paid" notice | **Needs work** | Hand-written ink button |

### 3.10 Course cards (every listing)

| What it is | Status | What it takes |
|---|---|---|
| **"Start learning"** button revealed on card hover | **Needs work** | Hand-written ink button |

### 3.11 Profile page

| What it is | Status | What it takes |
|---|---|---|
| **Active tab underline** in the profile tab strip | **Linked** | Already `border-brand` — this is the only live consumer today |

### 3.12 Search page

| What it is | Status | What it takes |
|---|---|---|
| **Search submit** button | **Needs work** | Hand-written; also arguably should stay ink as a form control |
| **Active filter chip** | **Needs work** | Selection tint surface — 8–12% brand at low alpha |
| **Active page number** in pagination | **Needs work** | Same treatment as the chip |

### 3.13 Account

| What it is | Status | What it takes |
|---|---|---|
| Active item in the account sidebar | **Excluded** | The animated white container is the state, by decision |
| **"Save"** strip on account settings | **Needs work** | Hand-written ternary |

### 3.14 Community pages

| What it is | Status | What it takes |
|---|---|---|
| **"New discussion"** button | **Ready** | Shared primary button |

---

## 4. Admin dashboard (`/orgs/<slug>/dash/…`)

### 4.1 List toolbars

| What it is | Status | What it takes |
|---|---|---|
| **"New course"** in the courses toolbar | **Ready** | Shared primary button |
| **"New podcast"** (toolbar + empty state) | **Ready** | Same |
| **"New collection"** (toolbar + empty state) | **Ready** | Same |
| **"New community"** (toolbar + empty state) | **Ready** | Same |
| **"New board"** | **Ready** | Same |
| **"New playground"** | **Ready** | Same |
| **"Select"** toggle next to each create button | **Excluded** | Secondary by design — stays neutral |

### 4.2 Edit screens — save strips (15 files)

| What it is | Status | What it takes |
|---|---|---|
| The **"Save"** button at the top of every edit screen (course, collection, podcast, community, org general/SEO/branding/domains/automations/API, payments ×2, notifications, account) | **Needs work** | Each is a hand-written ternary duplicated 15 times. Either convert to the shared button or add `bg-brand` in all 15 |
| **"Saving…" / "Saved"** states | **Excluded** | Neutral states |

### 4.3 Course structure editor

| What it is | Status | What it takes |
|---|---|---|
| **"Save"** on module and lesson detail forms | **Needs work** | Hand-written ternary |
| **"New chapter" / "New activity"** buttons | **Needs work** | `bg-primary` |
| Selection checkboxes when picking activities to copy | **Excluded** | Ink is clearer for a checkbox |

### 4.4 Assignments

| What it is | Status | What it takes |
|---|---|---|
| **"New assignment"**, **"New task"**, **"Evaluate"**, **"Download"** | **Needs work** | `bg-primary` / hand-written |
| **Task progress bar** on the student side | **Ready** | Colour class swap |
| Task-type selection tiles | **Needs work** | `bg-primary` |

### 4.5 Boards

| What it is | Status | What it takes |
|---|---|---|
| **"New board"** | **Ready** | Shared primary button |
| Board header / toolbar square and buttons | **Needs work** | `bg-primary` |
| **"Add member"** | **Needs work** | `bg-primary` |
| Board canvas "restore" button | **Needs work** | `bg-primary` |

### 4.6 Playgrounds

| What it is | Status | What it takes |
|---|---|---|
| **"New playground"** | **Ready** | Shared primary button |
| Save / create buttons inside the playground modal and card | **Needs work** | `bg-primary` |
| Playground preview overlay controls | **Excluded** | Media chrome |

### 4.7 Analytics

| What it is | Status | What it takes |
|---|---|---|
| **Chart series** | **Linked** | Brand ramp — one hue, five steps, derived from the org hex. Bars, area/line, funnel, scatter and stacked bars all read it. Only the dropoff bar and the A–F grade bands keep semantic colour |
| Tab bar (pill) | **Excluded** | Neutral segmented control |
| Course card percentage toggles | **Needs work** | `bg-primary` |

### 4.8 Onboarding

| What it is | Status | What it takes |
|---|---|---|
| **Onboarding progress fill** | **Ready** | Token swap |
| **"Next" / "Create your first course"** buttons | **Needs work** | `bg-primary` |

### 4.9 Shared modals

| What it is | Status | What it takes |
|---|---|---|
| **Confirm** button in the shared modal | **Needs work** | `bg-primary` — used by both shells |
| **Delete / destructive** confirm | **Excluded** | Danger red |
| Create-podcast, create-community, create-discussion modals | **Needs work** | `bg-primary` |

### 4.10 Notifications

| What it is | Status | What it takes |
|---|---|---|
| Tabs | **Excluded** | Neutral |
| **"Save"** strip | **Needs work** | Hand-written ternary |

---

## 5. Outside the organization shell

These screens sit outside the organization shell. Both now mount the brand tokens, so their primary CTA fills with the tenant colour.

| What it is | Status | What it takes |
|---|---|---|
| **Login / signup / forgot / reset / verify** submit buttons | **Connected** | `authPrimaryBtnClass` in `components/Auth/authStyles.ts` fills with `bg-brand` / `text-brand-fg` / `bg-brand-hover` / `bg-brand-pressed`; the token arrives from `getBrandStyle()` in `app/auth/layout.tsx`. Google, SSO and the text links stay neutral on purpose |
| **Embedded activity** "sign in to continue" button | **Connected** | `app/embed/[orgslug]/layout.tsx` mounts the same tokens |
| Platform **`/home`** and superadmin **`/admin`** | **Excluded** | No organization in scope — platform-level UI, not tenant UI |

---

## 6. Excluded on purpose

| Area | Why |
|---|---|
| Links (public URL in SEO, external links, "View all") | Ink + underline; a coloured link next to a coloured button removes the hierarchy |
| Focus rings | Neutral ink. An arbitrary brand hex can drop below 3:1 and break keyboard access |
| Checkboxes and switches | Ink reads clearer than a tint; also a safety issue on colour-blind users |
| Status pills ("paid", "public", "new") | Semantic, not brand |
| Destructive / success / warning | Always red / emerald / amber |
| Video player chrome | Sits on top of moving video |
| Certificate artwork | Printed/exported asset, not UI |
| Sidebars, headers, page backgrounds | Structural — this is the "neutral-first" half of the approach |
| Mobile shells | Old, untouched, out of scope |

---

## 7. Summary

| Status | Count |
|---|---|
| **Linked** today | 1 (profile tab underline) |
| **Ready** — one class/token swap | ≈ 22 |
| **Needs work** — real code change | ≈ 45, of which 15 are the duplicated save strips |
| **Blocked** — needs a token added to a shell | 2 (auth, embed) |
| **Excluded** | 9 groups |

## 8. Risks this list exposes

1. **The 33 hand-written CTAs.** If step 4 themes only the `<Button>` component, the learner-facing pills stay ink and the product looks half-branded. They have to be converted in the same pass.
2. **One primary per view.** The dashboard has screens that stack filled buttons. Each needs an audit before the brand lands, and the extras demoted to `secondary`.
3. **The 15 duplicated save strips** are the single biggest source of drift — they already differ in label and behaviour.
4. **Charts are mid-change** — one ink series next to an indigo palette. That needs a decision, not a class swap.
5. **No visual verification yet.** The shells render client-side behind `SessionGate`, so this audit is code-verified. The real check is the browser.
