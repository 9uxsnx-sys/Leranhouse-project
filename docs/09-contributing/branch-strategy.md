# Branch Strategy

> Koodook follows a simplified Git flow with `main` as the primary integration branch. Feature work happens on short-lived branches that are merged back via pull requests.

## Main Branch

- **`main`** is the primary and only permanent branch.
- It is **protected** — direct pushes are not allowed.
- All changes to `main` must go through a pull request.
- `main` should always be in a deployable state.
- CI checks must pass before any PR can be merged.

## Feature Branches

All development work happens on dedicated branches branched off `main`. Feature branches should be:

- **Short-lived** — typically a few days, never more than a week.
- **Focused** — one branch per feature, fix, or task.
- **Deleted** after merging back into `main`.

### Branch Naming

Use the following naming convention:

```
<prefix>/<short-description>
```

The prefix indicates the type of work:

| Prefix | When to Use | Example |
|---|---|---|
| `feature/` | New features | `feature/course-analytics` |
| `fix/` | Bug fixes | `fix/login-redirect-loop` |
| `docs/` | Documentation changes | `docs/api-endpoint-refs` |
| `refactor/` | Code refactoring | `refactor/auth-service` |
| `chore/` | Maintenance, deps, tooling | `chore/upgrade-bun-version` |

**Naming rules:**

- Use **kebab-case** — lowercase letters and hyphens only.
- Keep names descriptive but concise (2–5 words).
- Do **not** include issue numbers in the branch name (reference the issue in the PR description instead).

```
Good:
  feature/course-publishing
  fix/empty-state-crash
  docs/setup-guide
  refactor/payment-service

Bad:
  feature/CoursePublishing       # PascalCase
  fix/login_redirect_loop        # snake_case
  feature/f/add-course-analytics # too many prefixes
  fix/bug-1234                   # issue number, not descriptive
```

## Keeping Branches Up to Date

Feature branches should stay current with `main` to minimize merge conflicts. There are two ways to update:

### Rebasing (preferred)

Rebase your branch onto the latest `main`:

```bash
git checkout main
git pull origin main
git checkout feature/my-feature
git rebase main
```

Rebasing keeps the commit history linear and clean. **However**, never rebase a branch that is already in a pull request and being reviewed — it rewrites history and makes it hard for reviewers to track changes.

### Merging (during review)

If your branch is already in a PR and being reviewed, merge `main` into your branch instead:

```bash
git checkout feature/my-feature
git merge main
```

This preserves the existing commit history that reviewers have already seen.

## Branch Lifecycle

Each branch goes through the following stages:

```
1. Create ──► 2. Work ──► 3. PR ──► 4. Review ──► 5. Merge ──► 6. Delete
```

### 1. Create

Branch off `main` with a descriptive name:

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

### 2. Work

Make changes, commit frequently (see [commit conventions](./commit-conventions.md)), and push regularly:

```bash
git push origin feature/my-feature
```

### 3. Open a PR

Open a pull request against `main`. Follow the [PR guide](./pull-requests.md) for the description template and checklist.

### 4. Review

Respond to reviewer feedback. Push additional commits to address comments — do not rebase or force-push during review unless explicitly requested.

### 5. Merge

Once approved, a maintainer will squash-merge the PR into `main`. All commits in the branch are squashed into a single commit.

### 6. Delete

After merging, delete the feature branch:

```bash
git branch -d feature/my-feature          # local
git push origin --delete feature/my-feature  # remote
```

Or delete it through the GitHub UI after the PR is merged.

## Visual Workflow

```
main:  A---B---C---D---E---F---G
              \         /
feature/xxx    X---Y---Z
```

- Commits A through G are on `main`.
- The feature branch branches off at B, adds commits X, Y, Z.
- Z is a merge commit (or squash merge) bringing the feature into `main`.

## Rules Summary

| Rule | Detail |
|---|---|
| **Never commit directly to `main`** | All changes go through PRs |
| **Branch off `main`** | Always create branches from the latest `main` |
| **Use descriptive kebab-case names** | `feature/course-analytics`, not `fix/123` |
| **Keep branches short-lived** | Merge within a few days |
| **Delete after merge** | Clean up both local and remote branches |
| **Rebase before PR** | Update your branch before opening a PR |
| **Merge (don't rebase) during review** | Avoid rewriting history once a PR is open |
| **Squash merge to main** | All PR commits become a single commit on `main` |
