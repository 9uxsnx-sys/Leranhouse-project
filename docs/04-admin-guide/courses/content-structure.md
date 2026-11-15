> Status: as-built · Last verified: 2026-11-15

# Content Structure

The Content tab builds the course from modules (chapters) and lessons (activities). Navigation is drill-down: module list, then lesson list, then the lesson form. The module and lesson names follow the dashboard language.

## Module list

The toolbar contains a search box, the module count, **New**, **Select** and a sort toggle.

| Control | Behaviour |
|---|---|
| Search | Filters modules by their displayed name |
| New | Creates a module immediately with the default name `New Module`; no dialog |
| Select | Switches cards from drag handles to checkboxes |
| Sort | Toggles name order between ascending and descending |

Each module card shows a drag handle, a folder icon and its name. Drag a card by the handle to reorder modules; the new order is saved to the API and an error reverts it.

The three-dot menu offers:

| Item | Behaviour |
|---|---|
| Edit | Opens the module detail form (name and description) |
| Duplicate | Placeholder only; it shows a "coming soon" toast |
| Delete | Deletes the module and its lessons without an extra dialog |

Select mode only selects modules; there is no bulk action in this list. Clicking a module outside select mode opens its lessons.

## Lesson list

The lesson list uses the same toolbar and card pattern inside the selected module. **New** creates a lesson immediately with the default name `New Lesson` and an empty description.

Cards show a drag handle, a file icon, the lesson name and a three-dot menu. Dragging reorders lessons within the module and persists through the course-order endpoint. The menu's **Duplicate** is a placeholder; **Delete** removes the lesson immediately.

## Lesson form

Opening a lesson shows sectioned cards:

| Section | Fields |
|---|---|
| Overview | Lesson name (required), description |
| What you'll learn | Learning objectives list |
| Key takeaways | Hierarchical takeaway list |
| Resources | Named resources with URL or uploaded file |
| Knowledge checks | Question and answer pairs |

The action row contains **Preview**, the locale chip, **Save** and **Publish/Unpublish**. Preview opens the learner lesson-preview page, which renders the objectives, takeaways, resources and knowledge checks; it does not render a separate rich-text body because none exists in this form.

## Reordering and select mode

- Drag-and-drop is disabled while select mode is active.
- Select mode replaces drag handles with checkboxes and highlights selected cards with a blue ring.
- The selection is not tied to a bulk operation; exit select mode with **Cancel**.
- Leaving a search or sort view does not change the saved order until a drag is completed.

## Auto-save and translations

Lesson and module edits auto-save after a 600 ms debounce and are flushed when leaving the form. The Save button forces the pending write.

In a non-source locale the module and lesson lists show localized names. The form loads localized name, description, objectives, takeaways, resources and knowledge checks and writes them to `extra_metadata.translations[locale]`. The source row is never modified. Switching the dashboard language flushes pending text into the language it was typed in before loading the new locale.

## Related

- [General settings](./general.md)
- [Translations](./translations.md)
- HTTP contracts: [Chapters API](../../06-api-reference/chapters.md), [Activities API](../../06-api-reference/activities.md)
