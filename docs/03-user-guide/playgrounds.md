> Status: as-built · Last verified: 2026-11-15

# Playgrounds

"Playground" covers two interactive formats: runnable code blocks inside lesson content, and AI-generated HTML experiences that administrators create for the organization.

## Code playground blocks

A code playground block appears inside lesson content that uses the rich-text editor. It has a code editor, a **Run** action and a set of tabs:

| Tab | Content |
|---|---|
| Description | The exercise statement |
| Tests | Test cases checked when you run the code |
| Output | Standard output, errors, compile output and execution time |
| History | Previous runs and saved code |

Depending on the block, the editor may be read-only. When it is editable, you can change the code and re-run it; each run that uses test cases counts as an attempt. Some blocks use a timed mode and lock after the challenge window expires.

Running requires you to be signed in. The run happens on the platform's execution service, not in your browser.

## AI playgrounds

An AI playground is an HTML application generated for the organization and embedded as a block, on a board.

- The block renders in a sandboxed frame, so it can use scripts, forms and popups.
- Buttons, quizzes, charts, timelines and similar interactions work directly in the frame.
- The generated HTML is fixed for learners; prompts and regenerations belong to the editor, not to the learner view.

Administrators create playgrounds from **Dashboard → Playgrounds** on the Pro plan. Each playground has an access type and a published/draft state. A playground that is not published is not served to learners.

| Access value | Dashboard label |
|---|---|
| `public` | Public |
| `authenticated` | Members |
| `restricted` | Restricted |
| Any other value | Private |

The badge is shown on the dashboard card. The API enforces the stored access value when the playground is requested.

## Tips

- Read the description tab before running a code block; it states what the exercise expects.
- Use the tests tab to compare your output with the expected result.
- The history tab keeps your previous runs, so you can return to an earlier version.
- In timed blocks, the timer is part of the activity. Running after it expires is blocked.

## Where to find them

| Location | What you see |
|---|---|
| Course page or activity | Embedded code blocks |
| Board | An AI playground block, with the rest of the canvas |
| Standalone | No learner-facing playground catalogue exists; playgrounds are opened through the content that embeds them |

## Related

- [Boards](./boards.md) — the main surface for AI playground blocks.
- [Activities](./activities.md) — lesson content that can contain code blocks.
- [Developer guide](../05-developer-guide/README.md) and [Playgrounds API](../06-api-reference/playgrounds.md).
