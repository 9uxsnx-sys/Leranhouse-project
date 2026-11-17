> Status: as-built · Last verified: 2026-11-17

# Changelog

Entries below are derived from the commit history of the current branch (`feat/learnhouse-1.2.0-custom`); dates are commit dates. Work landed on the branch but not yet released is grouped at the end.

## 2026-11-17

- Added dark mode to the desktop product. The semantic Medusa tokens are redefined once inside `.dark`, every elevation utility becomes a hairline ring, and `prefers-color-scheme` no longer overrides the app.
- Added the Light / Dark / System switch to the learner and dashboard sidebars. The choice persists in a `lh_theme` cookie that the server reads, so `<html class="dark">` is in the first byte and there is no flash; `system` is resolved by a blocking script before paint.
- Migrated the hard-coded greys to `dark:` variants across the learner shell, dashboard pages, cards, menus, account, communities, analytics and auth. Light mode is unchanged — the variants are append-only.
- The brand colour now has a per-mode pair: `getBrandStyle()` takes the resolved mode and `deriveDarkBrand()` lifts a light brand into a dark-safe fill, so brand buttons, progress fills, tab underlines and the sidebar pill stay legible on dark surfaces.
- Charts read the dark branch of `useChartTheme()`: lifted brand ramp, darker grid, lighter axis, brighter positive / negative.
- Toasts, tooltips, popovers, dropdowns and the command palette now use tokens instead of fixed white, so nothing flashes white over a dark page.
- Completed the dark-mode coverage audit by *page section* on every UI-reachable surface: lesson page (top bar, What You'll Learn, video area, curriculum sidebar, On This Page, mark-complete), podcast list / detail / audio player, course detail (hero, authors & updates, share), collection, community and discussion editor, trail and certificates, search, account and copilot. Fixed the remaining light-only sections in `CourseAuthors`, `ActivityChapterDropdown`, `ActivityShareDropdown`, `ActivityIndicators`, `CertificateVerificationPage`, `CourseShare`, `PodcastThumbnail`, `CourseUpdates`, `CommunityActions`, `CommunityCard`, `CreateDiscussionCard`, `CollectionThumbnail`, `Watermark`, `UserAvatar` and the assignment toggle. The dashboard analytics tree (49 files) gained its dark variants in the same pass. Mobile-only components, the Tiptap editor blocks, the board canvas and the legacy `Pages/CourseEdit` tree are out of scope — they are not reachable from the UI.
- Re-based the dark surface ladder so cards separate from the page: `page #09090b → card #141417 → hairline #2f2f35`, with inner wells stepping *down* to `#0d0d0f`. The fill delta is deliberately small (1.08:1, the same as GitHub's `#0d1117 → #161b22`) and the hairline carries the separation (1.38:1, GitHub 1.42:1) — a large fill delta turns every card into a bright grey slab on a dark canvas. The six steps are exposed as `--color-dk-*` theme colours, so the ladder is one knob. Two related defects went with it: the small elevation utilities no longer draw a ring on top of the card border (a bordered card was rendering as a 2px outlined box), and card text got its own named five-step scale — `--color-dk-fg-1…5` = `#f4f4f5` / `#d4d4d8` / `#a1a1aa` / `#85858f` / `#62626b` (heading / body / secondary / muted metadata / disabled, 16.6 → 3.0:1 on the card) — so the hierarchy is explicit per level instead of ad-hoc zinc steps. Pure white is never used for text: it glares and leaves the lower levels nowhere to go. Listing search fields are now recessed instead of card-coloured, and course cards have a hover border. Light mode is untouched.
- Lifted the dark secondary-text tokens to that same calibration: `--color-ui-fg-base` `#fafafa → #f4f4f5`, `--color-ui-fg-subtle` `#a1a1aa → #d4d4d8`, `--color-ui-fg-muted` `#7c7c85 → #a1a1aa`, `--color-ui-fg-disabled` `#4a4a52 → #62626b`, and moved the section subtitles (`CourseLearnings`, `CourseAudience`, `CourseRequirements`, the lesson-preview leads) to the secondary tone while the list items they introduce sit on the body tone. On the course detail page the right-rail card labels use `dk-fg-3`, and the "About this course" body sits on the body tier.
- Migrated the learner side onto that scale: 965 explicit `dark:text-zinc-*` / `dark:text-neutral-*` classes across 108 files (learner routes and every shared component they render) now use `dk-fg-1…4`, so a heading, body line, secondary label and metadata row resolve from the same five tokens everywhere instead of per-component zinc steps. The only holdouts are decorative icons and separators (`dark:text-zinc-600`) and the video-player chrome, which stay neutral by design.
- Audited the dashboard home in dark mode and fixed the components that fell through the surface ladder: the `DateRangeFilter` container was painted with the inset well (`#0d0d0f`, *below* the page) while its selected segment used the card fill, so the control had no readable surface — container is now `dk-card`, segment `dk-raised`; `DataTable` rows hovered to `gray-50` (a near-white flash) and selected rows to the invisible inset — now `dk-raised/60`; the `FilterSelect` menu floated at card level with a `gray-100` highlight — now `dk-raised` + `dk-track`; `PaymentsTable` cells were plain `text-gray-900/700/400` with no dark variant (near-black on dark) — now `dk-fg-1/2/4`; the chart hover band was a black overlay that vanished on dark — now `rgba(255,255,255,0.05)` via `ChartTheme.cursorFill`; chart tooltips float on `dk-raised`; the table checkbox inverts to a light fill with a dark tick; and the floating onboarding panel (`bg-white/85`) gained a dark surface. Chart cards now show a "No data yet" empty state when every value is zero (Recharts draws nothing for an all-zero series), and the loading skeleton uses `dk-track` instead of the invisible inset well. Section-card titles across the analytics cards moved from the secondary tone to the heading tone (`dk-fg-1`) so a 13px uppercase label reads as a title in dark; light keeps `gray-500`.
- Fixed the course editor in dark mode. The route wrapper painted a hard-coded `#f8f8f8` over the canvas with no dark variant, so a near-white page sat under light page text and the title was unreadable — it is now transparent in dark (the same wrapper is used by the podcast, collection, community, org, users, payments and notifications editors, so they are fixed too). The shared `PageTabs` pill bar used the inset well (below the page) for its container and the card fill for the active pill — container is now `dk-card`, active pill `dk-raised`. The shared `FormLabel` was hard-coded `text-black`, which made every field label in the editor invisible in dark — now `dk-fg-2`, with `dark:text-red-400` for validation text. Section titles use `dk-fg-1`; the certificate and SEO switches gained a real dark state (light track + dark thumb when on, `dk-track` when off); `dk-inset/40` panels became real recessed wells; and the activity divider plus the Unsplash picker hover gained dark values.
- Extended the same section-title tone to the learner side: 27 card headings across 10 files (course / podcast / collection detail rails, the community sidebar, the discussion composer and the account settings cards) now use `dk-fg-1` in dark instead of the secondary tone, so every 13px uppercase card label reads as a title rather than metadata. Light mode keeps `gray-500`.
- Removed the "Community Discussions" section from the course and podcast detail pages and deleted `CourseCommunitySection` — the resource-level community block is not part of the product.
- Fixed the `grey` badge fill in dark mode: it used the inset well (`#0d0d0f`), which is *below* the page canvas (`#09090b`), so the badges in the course header rendered as bare rings on the page colour. They now sit on the raised surface (`#1d1d21`), the dark counterpart of the light `gray-50` chip.
- Removed the "Access is inherited" explainer card from the community editor's Access tab — the tab now shows only the linked resource and its "Manage parent access" link. The no-parent warning stays for communities that have nothing linked yet.
- Rebuilt the community editor's Linked Content tab on the collection editor's content table: `TableCard` + `DataTable` with the same item / type / price / added / actions columns, a segmented Course / Podcast switch in the toolbar, and search that flips the same table from the linked resource to the org's resources. Selection is single-row (a community links one resource), and it drives the Add / Remove bulk button and the row menu.
- Unified every dashboard edit-page toggle on the course editor's SEO pattern: on = light `zinc-100` track with a dark `zinc-900` thumb, off = `dk-track` with a light thumb. The community moderation, collection general / SEO, course certification, payments, notifications, org SEO and assignment modals toggles previously stayed plain `bg-black` (indistinguishable from the card) or kept a light thumb, so "on" was invisible in dark. Light mode is unchanged.
- Moved the remaining section-card titles across the dashboard edit pages (collection, community, podcast, org, users, payments — 51 titles in 24 files) from the secondary `zinc-400` tone to the heading tone `dk-fg-1`, so they match the dashboard home cards and the course editor. Light mode keeps `gray-500`.
- Split Branding → Theme into **Light theme** and **Dark theme** cards, each with the same four controls (Primary, Hover, Text & Icons, sidebar switch) and its own live preview / WCAG read-out. Both are saved by the existing Branding action row; the dark card writes `dark_color` / `dark_brand_fg` / `dark_brand_hover` / `dark_brand_sidebar` through the same `/orgs/{id}/config/color` endpoint (API extended), and `getBrandStyle()` now takes the dark pair so every shell, menu and the auth/embed layouts read the colour that matches the active mode. An empty dark primary still derives from the light brand; with no colour configured at all, light falls back to ink `#27272a` and dark to white `#fafafa`. Light mode is unchanged.
- Fixed the account Privacy toggles (hide courses / podcasts / communities) failing with "Failed to update privacy setting": `PUT /users/{id}` requires `username` and `email` on every call (they are part of the update schema), but the privacy caller sent only `extra_metadata`, so the API answered 422. The same missing field broke the General profile save (`email`) and the email-change form (`username`); all three now send the current identity fields, and a successful privacy save refreshes the session so the toggles stay on after remounting the page.
- Fixed the sidebar menu cards in dark mode: the avatar hover card (`UserProfilePopup`) and the shared hover tooltip were hard-coded to `bg-white/95` while their text already used `dk-fg-*`, so they rendered light text on a white card. Both now sit on `dk-raised/95`, and the tooltip gets a dark outline. The profile menu's Sign out item also gained a dark state (`red-400` text, `red-500/10` hover instead of the near-white `red-50` flash).
- Lifted the sidebar menu-card labels in dark mode: `HoverMenuItem` items are now `dk-fg-2` (`dk-fg-1` on hover) instead of the muted tone, and the language menu's secondary label sits on `dk-fg-3`, so the options read clearly on the raised card.
- Turned the theme switcher into a sidebar option that behaves exactly like the language switcher: a normal row (or icon-only when collapsed) that opens a hover card with Light / Dark / System and a check on the active mode, replacing the inline segmented control in both sidebars.
- Removed the Help option (documentation / website / Discord / report feedback) from both sidebars, together with the feedback modal it opened, and moved the Collapse / Expand control above the Theme option in the footer.
- Aligned the podcast right-rail access card with the course page: the progress fill now uses `bg-brand` instead of plain black (it was detached from the tenant colour), the Continue Listening button lost its play icon, and the Get Access state mirrors the course — paid shows the amount with a small currency suffix, free drops the hint line and labels the button "Add to progress".
- Finished the auth surfaces (login, signup / open / invite-only, forgot, reset, verify-email, SSO and Google callbacks, token exchange). The split shell painted its page with the inset well (`#0d0d0f`, *below* the canvas) so the panel had no perceivable surface — it is now the page colour, with the form card on `dk-card`. Inputs used the card fill (invisible against the card) with off-palette zinc text — they are now recessed wells (`dk-inset`, strong hairline, `dk-fg-1` text, `dk-fg-4` placeholder) and a `.dark .auth-field:-webkit-autofill` rule stops Chrome repainting autofilled fields white. The shared label / link / secondary-button recipes moved off zinc onto `dk-fg-1…3`; alerts lost their light-only pastel slabs (`dark:bg-*-500/10`, `*-500/30` borders, `*-200` text) and the success / error icon circles lifted from the invisible inset to `dk-raised`; the terms checkbox inverts to a light fill with a dark tick; the callback error tips / code badge got dark values; and the form card gained a `dk-line` hairline (its shadow does not render on dark). The image panel stays a bare `<img>` — no overlay or seam gradient, so the tenant's artwork keeps its real colours in both modes. Light mode is unchanged.

## 2026-11-16

- Added the brand token layer (`--brand`, `--brand-fg`, hover / pressed / soft / ring) and drove the primary button, progress fills and tab underline from it on all four shells.
- Moved every chart series onto the brand ramp; fixed the ramp turning saturated oranges brown by mixing toward white only, and read the colour from the org context rather than `--brand` on the root.
- Added Branding → Theme → **Text & Icons**, which pins the foreground used on brand fills (`customization.general.brand_fg`) with a live WCAG read-out.
- Added Branding → Theme → **Hover Color** (`customization.general.brand_hover`): empty keeps the automatic darkening, a hex is used verbatim, and the pressed state takes one further step in the same direction so a lighter hover stays lighter. Hover and pressed are now real hex values instead of `color-mix()` strings, which lets the row print their contrast ratio.
- Made the automatic foreground compare both candidates instead of using a luminance threshold, and gentled the hover/pressed dimming for dark text so mid-tone brands stay above 4.5:1 in every state.
- Added an opt-in switch that brands the active sidebar tab (`customization.general.brand_sidebar`); off by default, so all three sidebars keep their neutral white pill.
- Reduced Org → Branding → Auth to a single image upload: it saves on selection like the logo and favicon rows, writes the config server-side, and replaces the black gradient on the auth pages.
- The auth image is now rendered as an `<img>` in its own column beside the white form card — no `background-image` and no dark overlay — and the nav-bar header that painted it as a background was removed.
- Org config writes for the brand colour and the auth image now invalidate the org read cache, so the login page reflects an upload immediately instead of after the cache TTL.
- Connected the auth submit CTA to the brand token: `authPrimaryBtnClass` now uses `bg-brand` / `text-brand-fg`, so sign-in, sign-up, forgot, reset and verify inherit the theme and the Text & Icons foreground. Google, SSO and text links stay neutral.
- Widened the auth image column (58/42 → 61.5/38.5 at `lg`, 63.6/36.4 at `xl`) to give the artwork more room without moving the form card.
- Fixed every paginated dashboard table: they requested `limit=10000` while the API caps at 100, so the endpoints answered 422 and the tables rendered empty. They now walk the real pages through `swrFetchAllPages`.
- Fixed the profile's Courses and Podcasts tabs showing 0: they only ever read authored resources. On your own profile they now merge the org listings, so the tabs show what you can open; other profiles keep the authored-only semantics. Seeded podcasts also gain their `ResourceAuthor` row, which the seed script never wrote.
- Restored the profile card meta rows: course cards now pass `extra_metadata` (lessons, duration, difficulty), and podcast cards read real `episode_count` / `total_duration_seconds` instead of a hard-coded 0 and `N/A`. `GET /users/{id}/podcasts` returns those two fields now.
- Fixed the course media cache key that targeted the non-existent `courses/org/{id}` route.

## 2026-11-14

- Localized the learner home page and recorded the change in the docs.
- Localized the podcast module, the progress tab and the search palette.
- Localized communities to French and Arabic and polished the discussion UI.
- Wired the collection metadata editor and translated collection `extra_metadata` per locale.
- Matched the bottom spacing of learner listings to the dashboard shell.

## 2026-11-11

- Re-fetched content on locale switch, added activity translation seed data and updated docs.
- Added `ACTIVITY_TRANSLATIONS` with French keys for all 20 lessons.
- Landed the i18n infrastructure for activity translations, locale UI and module editing.

## 2026-11-10

- Moved target audience to the Overview tab with `LearningItemsList` and removed the "(one per line)" labels.
- Seeded French and Arabic translations for courses, podcasts and collections.
- Added pagination to announcement history, collection content and organization user-group tables.
- Removed broken pagination from access tables and cleaned up the table components.

## 2026-11-09

- Integrated the image cropper for profile picture and banner upload, fixed reply avatars and unified course card borders.
- Added the Instagram-style cropper test page, restructured the account area and updated breadcrumb icons.

## 2026-11-08

- Replaced the "Home" breadcrumb text with an icon and adjusted the profile page layout.
- Restructured account settings with Security and Privacy tabs, including account deletion.
- Redesigned the settings General tab with avatar and banner upload, username check and a three-state save button.

## 2026-11-04

- Fixed z-index layering for the user sidebar hover cards and the three-dots position.
- Shipped the learner home page with four content sections, removed dead code and fixed the build.

## 2026-11-03

- Added `extra_metadata` support for podcast episodes with admin editing and tests.
- Documented the remaining episode `extra_metadata` gaps.

## 2026-11-02

- Restructured the podcast page with an episode list matching the course module style.
- Redesigned the podcast player with the Design A layout and an interactive timeline.

## 2026-10-28

- Prevented auto-play on episode select and removed the episode name from the minimized player.
- Suppressed `AbortError` in the dev overlay and removed the error boundary.
- Fixed the missing slash in the podcast audio stream URL.
- Added the community member count endpoint, redesigned the sidebar cards and updated docs.

## 2026-10-27

- Set the flagship collection to paid with a 12,000 DZD price and updated the seed manifest.
- Added the "Who This Is For" section, learning path badges and the community sidebar.
- Removed footer text, replaced bullets with dots and fixed lesson preview spacing.
- Fixed trail `notify()` calls to receive a database session.

## 2026-10-26

- Serialized the course object to a dict before storing it in `step.data` in the trail service.

## 2026-10-25

- Seeded a backend flagship course with its own artwork.
- Locked the demo seed manifest and build plan.

## 2026-10-24

- Added in-app notifications with three-language templates.
- Switched the notification bell to live data and removed the mockup leftovers.

## 2026-10-21

- Localized collections end to end, then podcasts and episodes, and unified the episode cards.
- Documented collections and podcasts localization.
- Localized chapter and activity content, module and lesson names, and made lesson content editable per language.
- Rendered rich-text lesson bodies as designed sections on the lesson preview page and mounted the renderer with the full activity payload.
- Added a gradient video fallback above rich-text lessons and dropped the uneditable lesson body from the lesson page.
- Hid the duplicate in-content table of contents on lesson preview.
- Aligned lesson page cards and content-tab module and lesson rows with the dashboard card surfaces.
- Dropped the module number label from the curriculum header.
- Completed breadcrumbs for module and lesson views, made the Content breadcrumb return to the module list, and collapsed admin breadcrumbs on mobile.
- Removed the analytics and certification tabs from the course editor and fixed the select triggers.
- Fixed the field select to show a single chevron without a blue ring.
- Documented the course editor cleanup, the field select and the localization API.

## Current development line

- **Access and payments** — the offer form, offer resources panel, payment wall and offers service were removed from the store and payments surfaces. Resource access checks moved into a shared RBAC layer (`apps/api/src/security/rbac/catalog.py`, `media.py`, `resource_access.py`), and a migration links communities to resources.
- **Localization** — new `apps/api/src/services/people_locale.py` resolves instructor and host names per locale across courses, chapters, collections, podcasts and communities. The `en`, `fr` and `ar` locale files were updated.
- **Podcasts** — podcast and episode services, seed generators and translation handling were updated on both the API and the web app.
- **Docs** — the documentation tree was re-audited against the code: superseded plans moved to `docs/_archive/docs/`, live pages no longer link to them, and the documentation home, features index and this changelog were rebuilt.

---

See the [documentation home](../README.md) for the full section index.
