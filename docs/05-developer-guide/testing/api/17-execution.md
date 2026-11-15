# Test Execution

> Status: as-built · Last verified: 2026-11-15

This document covers how to run tests, interpret results, measure coverage, and integrate testing into CI. Read this after you have written tests using one of the templates (06-16).

The API uses `uv` and requires Python `>=3.14.3,<3.14.4` (see `apps/api/pyproject.toml`). There is no `[dev]` extra — test dependencies (`pytest`, `pytest-asyncio`, `pytest-cov`) are regular dependencies installed by `uv sync`.

---

## Running Tests

All commands run from `apps/api`.

### Run all tests

```bash
cd apps/api
uv run pytest
```

### Run a specific test file

```bash
uv run pytest src/tests/routers/test_communities_router.py
```

### Run a specific test class

```bash
uv run pytest src/tests/routers/test_communities_router.py::TestCommunitiesRouter
```

### Run a specific test method

```bash
uv run pytest src/tests/routers/test_communities_router.py::TestCommunitiesRouter::test_community_endpoints
```

### Run tests matching a keyword

```bash
uv run pytest -k "community"
uv run pytest -k "upload or thumbnail"
```

### Run tests with verbose output

```bash
uv run pytest -v
uv run pytest -v -k "community"
```

### Stop on first failure

```bash
uv run pytest -x
```

### Run tests and show print statements

```bash
uv run pytest -s
```

### Collect-only (list tests without running them)

```bash
uv run pytest --co
```

---

## Common Flags

| Flag | Purpose |
|------|---------|
| `-x` | Stop after first failure |
| `-v` | Verbose output (show each test name) |
| `-s` | Show stdout/stderr (print statements) |
| `--tb=short` | Shorter traceback format |
| `--tb=long` | Full traceback format |
| `--lf` | Run only the last failed tests |
| `--ff` | Run failed tests first, then the rest |
| `--co` | **Collect-only** — lists tests, runs none |
| `--cov` | Enable coverage (configuration in `pyproject.toml`) |
| `--cov-report=html` | Write an HTML coverage report |
| `--no-header` | Suppress pytest header |

---

## Coverage

Coverage is configured in `pyproject.toml`:

```toml
[tool.coverage.run]
source = ["src"]
omit = [
    "src/tests/*",
    "src/services/ai/*",
    "src/routers/ai/*",
    "src/routers/code_execution.py",
    "src/routers/stream.py",
]

[tool.coverage.report]
fail_under = 25
show_missing = true
```

Branch coverage is **not** enabled (`branch` is not set), so the threshold applies to line coverage.

### Run with coverage

```bash
uv run pytest --cov
```

The run fails if total coverage drops below 25%.

### Generate HTML coverage report

```bash
uv run pytest --cov --cov-report=html
```

Open `htmlcov/index.html` in a browser to see line-by-line coverage.

### Generate XML coverage report (CI)

```bash
uv run pytest --cov --cov-report=xml
```

Useful for uploading to Codecov, Coveralls, or SonarQube.

### View coverage for a specific module

```bash
uv run pytest --cov=src/services/communities --cov-report=annotate src/tests/
```

---

## CI Integration

There is currently no workflow file in the repository; the snippets below are templates.

### GitHub Actions example

```yaml
# .github/workflows/test-api.yml
name: API Tests

on:
  push:
    branches: [main, develop]
    paths:
      - "apps/api/**"
  pull_request:
    paths:
      - "apps/api/**"

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.14.3"

      - uses: astral-sh/setup-uv@v5

      - name: Install dependencies
        run: |
          cd apps/api
          uv sync --frozen

      - name: Run tests with coverage
        run: |
          cd apps/api
          uv run pytest --cov --cov-report=html --cov-report=xml --junitxml=report.xml

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: apps/api/htmlcov/

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: apps/api/report.xml
```

### GitLab CI example

```yaml
# .gitlab-ci.yml
api-tests:
  stage: test
  image: python:3.14.3
  script:
    - pip install uv
    - cd apps/api
    - uv sync --frozen
    - uv run pytest --cov --cov-report=html --cov-report=xml --junitxml=report.xml
  artifacts:
    reports:
      junit: apps/api/report.xml
    paths:
      - apps/api/htmlcov/
```

---

## Interpreting Results

### Test output structure

```
============================= test session starts ==============================
platform linux -- Python 3.14.3, pytest-9.0.3, pluggy-1.x
rootdir: /path/to/apps/api
configfile: pyproject.toml
plugins: asyncio-1.3.0, cov-7.1.0
collected ... items

src/tests/routers/test_communities_router.py ...............              [ 31%]
src/tests/routers/test_courses_router.py ................................ [100%]

============================== ... passed in ...s ==============================
```

(Collected/passed counts depend on the working tree; the suite currently has 174 `test_*.py` modules.)

### Reading a failure

```
FAILED src/tests/routers/test_communities_router.py::TestCommunitiesRouter::test_community_endpoints

___________________________________ FAILURES ___________________________________
______________ TestCommunitiesRouter.test_community_endpoints _________________

self = <test_communities_router.TestCommunitiesRouter object at 0x...>

    async def test_community_endpoints(self):
        community_id = str(uuid4())
        ...
>       assert response.status_code == 200
E       assert 403 == 200
E        +  where 403 = <Response [403 Forbidden]>.status_code
```

**What to check:**
1. **403 Forbidden** → The user lacks permission for this operation. Check authz setup in the test.
2. **404 Not Found** → The resource was not created, or the route is wrong.
3. **422 Unprocessable Entity** → The request payload is malformed. Check required fields and types.
4. **500 Internal Server Error** → An unhandled exception occurred. Check the server logs or traceback.

---

## Debugging Failing Tests

### 1. Add print statements

```python
response = await client.post("/api/v1/communities", json=payload, cookies=cookies)
print("Status:", response.status_code)
print("Body:", response.json())
```

Run with `uv run pytest -s` to see the output.

### 2. Use --tb=long for full traceback

```bash
uv run pytest -x --tb=long
```

### 3. Check database state

```python
# In a service test, print DB state
orgs = await db.exec(sqlalchemy.select(Organization)).all()
print("Orgs in DB:", orgs)
```

### 4. Verify fixture setup

```python
# Check if the user actually has the expected role
print("User role:", admin_user.role_id)
print("Role rights:", admin_user.role.rights)
```

### 5. Test with the live server

If pytest behaves differently from the live server, use [live validation](./18-live-validation.md) to compare behavior.

---

## Performance Tips

| Problem | Solution |
|---------|----------|
| Tests are slow | Run `--cov` only when needed; skip it during rapid iteration |
| Database state leaking | Ensure `scope="function"` on fixtures; use `yield` cleanup |
| Too many async warnings | Set `asyncio_default_fixture_loop_scope = "function"` in config |
| Flaky tests | Check for shared mutable state between tests; use fresh fixtures |
| Tests pass locally but fail in CI | Check for OS path separators, environment variables, or Docker differences |

---

## Rules Summary

| Rule | Detail |
|------|--------|
| Run the full suite before pushing | `uv run pytest` from `apps/api` |
| Keep coverage above 25% | `fail_under = 25` in `pyproject.toml` |
| Use `-x` during development | Stop on first failure to iterate fast |
| Use `-v` in CI | Verbose output helps diagnose failures |
| Run `uv run pytest --cov` before commits | Ensure the coverage threshold is met |
| Do not skip coverage for new code | Every new feature must maintain or improve coverage |
