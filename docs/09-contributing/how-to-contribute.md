# How to Contribute

> Contributions to Koodook come in many forms — reporting bugs, suggesting features, writing code, improving documentation, and helping others. This guide explains how to get involved.

## Types of Contributions

### Bug Reports

Bug reports help us make Koodook more reliable. Before filing a bug report:

- **Check existing issues** — search the [issue tracker](https://github.com/learnhouse/learnhouse/issues) to see if the bug has already been reported.
- **Check if it's still reproducible** — verify the bug exists on the latest version.
- **Provide reproduction steps** — the more detail, the faster we can fix it.

A good bug report includes:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior and actual behavior
- Screenshots or screen recordings (if applicable)
- Environment details (OS, browser, Node/Bun version, Python version)
- Relevant logs or error messages
- Whether the issue occurs in development or production

### Feature Requests

Feature requests help shape the future of Koodook. When suggesting a feature:

- **Explain the problem** — what does the feature solve? Who benefits?
- **Describe the proposed solution** — how should it work?
- **Consider alternatives** — what other approaches have you considered?
- **Keep scope realistic** — small, focused features are more likely to be implemented quickly.

Feature requests should be opened as [GitHub Discussions](https://github.com/learnhouse/learnhouse/discussions) first to gather community feedback before being converted into issues.

### Code Contributions

Code contributions are the heart of open source. Before writing code:

1. Check if there's an existing issue or discussion for what you want to work on.
2. Comment on the issue to let others know you're working on it.
3. Follow the [coding standards](./coding-standards.md) and [commit conventions](./commit-conventions.md).
4. Read the [pull request guide](./pull-requests.md) before submitting.

### Documentation Contributions

Documentation improvements are always welcome. This includes:

- Fixing typos or unclear explanations
- Adding missing guides or examples
- Improving code comments and docstrings
- Translating documentation

Documentation contributions follow the same PR workflow as code contributions.

## Reporting Bugs

To report a bug, open a new issue on the [GitHub repository](https://github.com/learnhouse/learnhouse/issues/new/choose). Use the bug report template if one is available. The template will ask for:

```
**Description**
A clear and concise description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**
- OS: [e.g. macOS 14, Windows 11, Ubuntu 22.04]
- Browser: [e.g. Chrome 120, Firefox 121]
- Bun version: [e.g. 1.1.0]
- Python version: [e.g. 3.12]
- PostgreSQL version: [e.g. 16]

**Additional context**
Add any other context about the problem here.
```

## Suggesting Features

Feature suggestions should be posted as [GitHub Discussions](https://github.com/learnhouse/learnhouse/discussions) using the "Ideas" category. Once the idea has community support, a maintainer may convert it into a feature request issue.

When suggesting a feature, include:

- **Problem statement**: what gap or pain point does this address?
- **Proposed solution**: a high-level description of how it should work
- **User impact**: who benefits and how
- **Success criteria**: how will we know when this feature is complete?

## First-Time Contributor Guidance

New to open source? Here's how to make your first contribution:

1. **Find a good first issue** — look for issues labeled `good first issue` or `help wanted` in the repository.
2. **Read the documentation** — start with the [Quick Start](../01-getting-started/quick-start.md) and [Development Setup](../01-getting-started/development-setup.md).
3. **Set up your environment** — make sure you can run Koodook locally.
4. **Comment on the issue** — let others know you're working on it.
5. **Fork and clone** the repository.
6. **Create a branch** following the [branch strategy](./branch-strategy.md).
7. **Make your changes** following the [coding standards](./coding-standards.md).
8. **Submit a pull request** following the [PR guide](./pull-requests.md).

Don't hesitate to ask for help in the issue comments or community channels.

## Communication Channels

| Channel | Purpose |
|---|---|
| [GitHub Issues](https://github.com/learnhouse/learnhouse/issues) | Bug reports and feature tracking |
| [GitHub Discussions](https://github.com/learnhouse/learnhouse/discussions) | Ideas, questions, and community conversation |
| Pull Request comments | Code review and collaboration |
| Commit messages | Tracking changes and rationale |

## Development Workflow Overview

The typical development workflow looks like this:

1. **Pick an issue** — find something to work on.
2. **Create a branch** — branch off `main` using the naming convention from the [branch strategy](./branch-strategy.md).
3. **Set up locally** — follow the [development setup guide](../01-getting-started/development-setup.md).
4. **Make changes** — write code, following the [coding standards](./coding-standards.md).
5. **Test locally** — run the test suite and verify your changes work.
6. **Commit** — use [Conventional Commits](./commit-conventions.md) format.
7. **Push and open a PR** — follow the [PR guide](./pull-requests.md).
8. **Respond to feedback** — address reviewer comments and update your PR.
9. **Merge** — a maintainer will squash-merge your PR once approved.
