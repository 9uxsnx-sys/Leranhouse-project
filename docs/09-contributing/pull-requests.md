# Pull Requests

> All code changes to Koodook are submitted via pull requests. This guide covers the PR workflow, template, review process, and checklist.

## Branch Naming

Before opening a PR, create a branch following the naming conventions from the [branch strategy](./branch-strategy.md):

| Prefix | Purpose | Example |
|---|---|---|
| `feature/` | New features | `feature/course-analytics` |
| `fix/` | Bug fixes | `fix/login-redirect` |
| `docs/` | Documentation | `docs/api-refresh` |
| `refactor/` | Code refactoring | `refactor/auth-service` |
| `chore/` | Maintenance tasks | `chore/update-deps` |

## PR Workflow

```
1. Create branch  ──►  2. Make changes  ──►  3. Commit  ──►  4. Push  ──►  5. Open PR  ──►  6. Review  ──►  7. Merge
```

### Step-by-Step

1. **Create a branch** off `main` with a descriptive name.
2. **Make your changes** following the [coding standards](./coding-standards.md).
3. **Commit** using [Conventional Commits](./commit-conventions.md).
4. **Push** your branch to the remote repository.
5. **Open a pull request** against `main` with a descriptive title and filled-out template.
6. **Request review** from at least one maintainer.
7. **Address feedback** — make requested changes and push new commits.
8. **Merge** — once approved, a maintainer will squash-merge your PR.

## PR Description Template

Use the following template when opening a pull request:

```markdown
## Description

<!-- What does this PR do? Provide a clear, concise summary. -->

## Related Issue

<!-- Link to the issue this PR addresses, if applicable. -->
Closes #ISSUE_NUMBER

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactor
- [ ] Performance improvement
- [ ] Other (please describe)

## How Has This Been Tested?

<!-- Describe the tests you ran to verify your changes. -->
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing (describe steps)

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes. -->

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have added tests that prove my fix/feature works
- [ ] All existing tests pass locally
- [ ] I have updated documentation accordingly
- [ ] My commits follow the Conventional Commits format
- [ ] My branch is up to date with main

## Additional Context

<!-- Add any other context about the PR here. -->
```

## Review Process

### What Reviewers Look For

- **Correctness**: Does the code do what it claims to do?
- **Design**: Is the approach appropriate? Is the code well-structured?
- **Test coverage**: Are there adequate tests? Do they cover edge cases?
- **Performance**: Are there obvious performance issues?
- **Security**: Are there any security vulnerabilities introduced?
- **Accessibility**: Do UI changes follow accessibility best practices?
- **Style**: Does the code follow the [coding standards](./coding-standards.md)?
- **Documentation**: Are new features or changes documented?

### Review Flow

1. A maintainer or designated reviewer is assigned to the PR.
2. The reviewer leaves comments, suggestions, and requests for changes.
3. The author responds to each comment — either by making the change or explaining why it's not needed.
4. Once all concerns are addressed, the reviewer approves the PR.
5. A maintainer merges the PR.

### How to Request Changes

If you're reviewing and find issues, be specific:

- **What** needs to change
- **Why** it needs to change
- **How** it could be changed (optional, but helpful)

### How to Respond to Feedback

- Address every comment, even if it's just a 👍 or "Done."
- If you disagree with a suggestion, explain your reasoning politely.
- Push new commits to address feedback — do not rebase or force-push during review unless requested.

## Merge Strategy

Koodook uses **squash merge**. All commits in a PR are squashed into a single commit when merged into `main`. This keeps the main branch history clean and linear.

- The squash commit message defaults to the PR title.
- Ensure your PR title is descriptive and follows the [commit conventions](./commit-conventions.md).

## PR Checklist

Before submitting your PR, run through this checklist:

### Code

- [ ] Code follows the project's [coding standards](./coding-standards.md).
- [ ] No debugging code, commented-out code, or `console.log` / `print()` statements.
- [ ] All linting checks pass (`ruff`, `bun run lint`, etc.).
- [ ] No new warnings introduced.

### Tests

- [ ] Existing tests pass locally.
- [ ] New tests added for new functionality.
- [ ] Edge cases are covered.

### Documentation

- [ ] Related documentation is updated (if applicable).
- [ ] New features have documentation or usage examples.
- [ ] Public APIs have docstrings or JSDoc comments.

### Commits

- [ ] Commit messages follow [Conventional Commits](./commit-conventions.md).
- [ ] Commits are small, logical units.
- [ ] No merge commits in the branch.

### Branch

- [ ] Branch is up to date with `main`.
- [ ] Branch name follows naming conventions.
- [ ] Branch will be deleted after merge.

## CI Checks

All PRs must pass the following CI checks before merging:

- **Lint**: Code style and formatting checks
- **Test**: Unit and integration tests
- **Build**: Project builds successfully
- **Type check**: TypeScript type checking passes

If any CI check fails, investigate and fix the issue before requesting another review.
