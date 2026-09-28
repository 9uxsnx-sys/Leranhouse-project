# Test Execution

This document covers how to run tests, interpret results, measure coverage, and integrate testing into CI. Read this after you have written tests using one of the templates (06-16).

---

## Running Tests

### Run all tests

```bash
cd apps/api
pytest
```

### Run a specific test file

```bash
pytest src/tests/routers/test_communities_router.py
```

### Run a specific test class

```bash
pytest src/tests/routers/test_communities_router.py::TestCommunitiesRouter
```

### Run a specific test method

```bash
pytest src/tests/routers/test_communities_router.py::TestCommunitiesRouter::test_community_endpoints
```

### Run tests matching a keyword

```bash
pytest -k "community"
pytest -k "upload or thumbnail"
```

### Run tests with verbose output

```bash
pytest -v
pytest -v -k "community"
```

### Stop on first failure

```bash
pytest -x
```

### Run tests and show print statements

```bash
pytest -s
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
| `--co` | Show coverage report in terminal |
| `--no-header` | Suppress pytest header |

---

## Coverage

### Run with coverage

```bash
pytest --co
```

This runs the standard pytest-cov configuration from `pyproject.toml`:

```toml
[tool.coverage.run]
source = ["src"]
branch = true

[tool.coverage.report]
fail_under = 25
```

### Generate HTML coverage report

```bash
pytest --co --co-report=html
```

Open `htmlcov/index.html` in a browser to see line-by-line coverage.

### Generate XML coverage report (CI)

```bash
pytest --co --co-report=xml
```

Useful for uploading to Codecov, Coveralls, or SonarQube.

### View coverage for a specific module

```bash
pytest --co --co-report=annotate src/tests/ --src src/communities
```

---

## CI Integration

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
          python-version: "3.12"

      - name: Install dependencies
        run: |
          cd apps/api
          pip install -e ".[dev]"

      - name: Run tests with coverage
        run: |
          cd apps/api
          pytest --co --junitxml=report.xml

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
  script:
    - cd apps/api
    - pip install -e ".[dev]"
    - pytest --co --junitxml=report.xml
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
platform win32 -- Python 3.12.0, pytest-9.0.3, pluggy-1.5.0
rootdir: C:\Projects\learnhouse\apps\api
configfile: pyproject.toml
plugins: asyncio-0.25.3, cov-6.0.0
collected 47 items

src\tests\routers\test_communities_router.py ...............              [ 31%]
src\tests\routers\test_courses_router.py ................................ [100%]

============================== 47 passed in 3.21s ==============================
```

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

Run with `pytest -s` to see the output.

### 2. Use --tb=long for full traceback

```bash
pytest -x --tb=long
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
| Tests are slow | Use `--co` only when needed; avoid in rapid iteration |
| Database state leaking | Ensure `scope="function"` on fixtures; use `yield` cleanup |
| Too many async warnings | Set `asyncio_default_fixture_loop_scope = "function"` in config |
| Flaky tests | Check for shared mutable state between tests; use fresh fixtures |
| Tests pass locally but fail in CI | Check for OS path separators, environment variables, or Docker differences |

---

## Rules Summary

| Rule | Detail |
|------|--------|
| Run the full suite before pushing | `pytest` from `apps/api` |
| Keep coverage above 25% | `fail_under = 25` in pyproject.toml |
| Use `-x` during development | Stop on first failure to iterate fast |
| Use `-v` in CI | Verbose output helps diagnose failures |
| Run `pytest --co` before commits | Ensure coverage threshold is met |
| Do not skip coverage for new code | Every new feature must maintain or improve coverage |
