# Commit Conventions

> Koodook follows the Conventional Commits specification for all commit messages. This produces a readable history and enables automated changelog generation.

## Format

Every commit message must follow this structure:

```
type(scope): description

[optional body]

[optional footer(s)]
```

The commit message format is:

```
<type>(<scope>): <description>

<body>

<footer>
```

### Type

The type describes the kind of change. Allowed types:

| Type | Usage | Example |
|---|---|---|
| `feat` | A new feature | `feat(api): add course publishing endpoint` |
| `fix` | A bug fix | `fix(web): handle empty course list gracefully` |
| `docs` | Documentation only | `docs: add API reference for courses` |
| `style` | Code style changes (formatting, whitespace) | `style: format Python files with ruff` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(api): extract payment validation service` |
| `perf` | A performance improvement | `perf(api): cache course list queries` |
| `test` | Adding or updating tests | `test(api): add unit tests for course service` |
| `chore` | Maintenance tasks, dependencies, tooling | `chore: upgrade Next.js to 14.2` |
| `ci` | CI/CD configuration changes | `ci: add GitHub Actions workflow for linting` |
| `cleanup` | Removing dead code, unused imports, or minor cleanup | `cleanup(web): remove unused CourseCard component` |

### Scope

The scope indicates which part of the codebase the change affects. Common scopes:

| Scope | Area |
|---|---|
| `api` | FastAPI backend |
| `web` | Next.js frontend |
| `collab` | Collaboration server |
| `cli` | Command-line tools |
| `docs` | Documentation |
| `db` | Database migrations or schema |
| `payments` | Payment integration |
| `auth` | Authentication and authorization |
| `admin` | Admin panel |

Scopes are lowercase and should be kept short. If a change affects multiple scopes, pick the most relevant one or omit the scope.

### Description

- Use the imperative mood ("add", "fix", "update") — not past tense ("added", "fixed").
- Do not capitalize the first letter.
- Do not end with a period.
- Keep it under 72 characters.

### Body (optional)

Use the body to provide additional context:

- Why the change was made (the motivation).
- What the change does (if not obvious from the description).
- How it works (if the implementation is non-trivial).

Wrap the body at 72 characters per line.

### Footer (optional)

Footers are used for:

- **Breaking changes**: add `BREAKING CHANGE:` followed by a description.
- **Issue references**: `Closes #123`, `Refs #456`.

## Examples

### Good commit messages

```
feat(api): add course publishing endpoint

Adds a PATCH endpoint that transitions a course from "draft" to
"published" status. Includes validation that the course has all
required sections before publishing.

Closes #234
```

```
fix(web): handle empty course list gracefully

Shows an empty state message instead of a blank page when the
user has no enrolled courses.

Fixes #89
```

```
docs: add API reference for payment endpoints
```

```
refactor(api): extract payment validation into dedicated service

The payment validation logic was duplicated across three endpoints.
Moving it into a PaymentValidationService reduces duplication and
makes the code easier to test.
```

```
feat(auth): add password reset flow

BREAKING CHANGE: The password reset endpoint now requires a
valid reset token obtained via the forgot-password flow instead of
accepting the old password directly.
```

```
chore: upgrade Next.js to 14.2

Updates the web app to Next.js 14.2 for the latest performance
improvements and Turbopack stability fixes.
```

### Bad commit messages

| Bad | Why |
|---|---|
| `fix bug` | No type, scope, or description — too vague |
| `feat(web): Added new button` | Uses past tense instead of imperative |
| `fixes` | No description |
| `WIP` | Not meaningful — use a draft PR instead |
| `refactor(api): asdfasdf` | Garbage description |
| `fixed a bunch of stuff` | Too vague, no scope or type |
| `feat(api)(web): add course analytics` | Multiple scopes — pick one or omit |

## When to Commit

- **One commit per logical change**. A commit should represent a single, coherent unit of work.
- **Commit early, commit often** — but each commit should be complete enough to stand on its own.
- **Don't commit broken code** — each commit should at least compile and not break existing tests.
- **Amend or rebase** to clean up local commits before pushing, but **never rebase a branch that others are reviewing**.

### Good patterns

```
Good: A feature is implemented across 3 clean commits:
  feat(api): add course publishing endpoint
  feat(web): add publish button to course editor
  docs: add API reference for course publishing

Bad: The same feature in 10 messy commits:
  WIP
  fix typo
  oops
  trying something
  it works now
  clean up
  add missing import
  forgot to save
  final version
  actually final
```

## Automation

The repository may use tools like `commitlint` or `semantic-release` to validate and process commit messages. Commits that do not follow this convention may be rejected by CI.
