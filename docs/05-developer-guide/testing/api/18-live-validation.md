# Live-Server API Probe Testing

This document describes how to perform ad-hoc manual API validation against a running server using curl (or any HTTP client). Use this **optionally** after automated tests pass, to verify real server behavior with real database state.

---

## When to Use Live Validation

| Situation | Use Live Validation? |
|-----------|---------------------|
| Automated tests pass and you want final confirmation | Yes |
| You are debugging a test that passes but the feature behaves wrong in production | Yes |
| You are testing webhook delivery against a real endpoint | Yes |
| You are smoke-testing a deployment | Yes |
| You have already confirmed behavior via pytest | No (optional) |
| The feature is trivially simple (e.g., a boolean field toggle) | No (optional) |

---

## Setup

### 1. Start the server

```bash
cd apps/api
uvicorn src.main:app --reload --port 8000
```

### 2. Get an authentication cookie

```bash
# Login as admin
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Verify login worked
cat cookies.txt
```

### 3. Set up convenience variables (PowerShell)

```powershell
$BASE = "http://localhost:8000/api/v1"
$COOKIE = "cookies.txt"
```

### 4. Set up convenience variables (Bash)

```bash
BASE="http://localhost:8000/api/v1"
COOKIE="cookies.txt"
```

---

## Probe Pattern

Every probe follows the same structure:

```bash
# CREATE
curl -s -X POST "$BASE/{resource}" \
  -H "Content-Type: application/json" \
  -b "$COOKIE" \
  -d '{"field": "value"}' | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

```bash
# READ (single)
curl -s -X GET "$BASE/{resource}/{uuid}" -b "$COOKIE" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

```bash
# READ (list)
curl -s -X GET "$BASE/{resource}?offset=0&limit=10" -b "$COOKIE" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

```bash
# UPDATE
curl -s -X PUT "$BASE/{resource}/{uuid}" \
  -H "Content-Type: application/json" \
  -b "$COOKIE" \
  -d '{"field": "new_value"}' | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

```bash
# DELETE
curl -s -X DELETE "$BASE/{resource}/{uuid}" -b "$COOKIE"
```

---

## Example: Community Publish/Unpublish (from chat history)

This is a real-world example of validating the Community publish/unpublish feature.

### Step 1: Create a community

```bash
curl -s -X POST "$BASE/communities" `
  -H "Content-Type: application/json" `
  -b "$COOKIE" `
  -d '{"name":"Test Community","short_description":"Testing","description":"Full description","category":"education","language":"en","country":"US"}' `
  | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Expected: Status 200, response contains `"uuid": "..."`.

### Step 2: Read the community (verify creation)

```bash
curl -s -X GET "$BASE/communities/{uuid}" -b "$COOKIE` | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Expected: `"is_published": false`.

### Step 3: Publish the community

```bash
curl -s -X PUT "$BASE/communities/{uuid}/publish" -b "$COOKIE" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Expected: `"is_published": true`.

### Step 4: Unpublish the community

```bash
curl -s -X DELETE "$BASE/communities/{uuid}/publish" -b "$COOKIE" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Expected: `"is_published": false`.

### Step 5: Verify publish/unpublish idempotency

```bash
# Publish twice — second call should not error
curl -s -X PUT "$BASE/communities/{uuid}/publish" -b "$COOKIE"
curl -s -X PUT "$BASE/communities/{uuid}/publish" -b "$COOKIE"  # Should still return 200
```

### Step 6: Clean up

```bash
curl -s -X DELETE "$BASE/communities/{uuid}" -b "$COOKIE"
```

---

## Example: Full CRUD Probe

```powershell
# 1. CREATE
$resp = curl -s -X POST "$BASE/courses" `
  -H "Content-Type: application/json" `
  -b "$COOKIE" `
  -d '{"name":"Probe Course","description":"Created via live probe"}' `
  | ConvertFrom-Json
$id = $resp.uuid
Write-Host "Created: $id"

# 2. READ
curl -s -X GET "$BASE/courses/$id" -b "$COOKIE" | ConvertFrom-Json | ConvertTo-Json -Depth 10

# 3. UPDATE
curl -s -X PUT "$BASE/courses/$id" `
  -H "Content-Type: application/json" `
  -b "$COOKIE" `
  -d '{"name":"Updated Probe Course"}' | ConvertFrom-Json | ConvertTo-Json -Depth 10

# 4. DELETE
curl -s -X DELETE "$BASE/courses/$id" -b "$COOKIE"

# 5. VERIFY DELETION
curl -s -X GET "$BASE/courses/$id" -b "$COOKIE"
# Expected: 404
```

---

## Example: Probe Script (reusable)

Save as `scripts/probe-community.sh`:

```bash
#!/bin/bash
# Probe script for Community CRUD + publish/unpublish
# Usage: ./probe-community.sh <base_url> <cookie_file>

BASE=${1:-"http://localhost:8000/api/v1"}
COOKIE=${2:-"cookies.txt"}

echo "=== Creating community ==="
RESP=$(curl -s -X POST "$BASE/communities" \
  -H "Content-Type: application/json" \
  -b "$COOKIE" \
  -d '{"name":"Probe Community","short_description":"Probe","description":"Probe description","category":"education","language":"en","country":"US"}')
UUID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['uuid'])")
echo "UUID: $UUID"

echo "=== Reading community ==="
curl -s -X GET "$BASE/communities/$UUID" -b "$COOKIE" | python3 -m json.tool

echo "=== Publishing ==="
curl -s -X PUT "$BASE/communities/$UUID/publish" -b "$COOKIE" | python3 -m json.tool

echo "=== Unpublishing ==="
curl -s -X DELETE "$BASE/communities/$UUID/publish" -b "$COOKIE" | python3 -m json.tool

echo "=== Double publish (idempotency) ==="
curl -s -X PUT "$BASE/communities/$UUID/publish" -b "$COOKIE" | python3 -m json.tool
curl -s -X PUT "$BASE/communities/$UUID/publish" -b "$COOKIE" | python3 -m json.tool

echo "=== Deleting ==="
curl -s -X DELETE "$BASE/communities/$UUID" -b "$COOKIE"

echo "=== Verifying deletion ==="
curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/communities/$UUID" -b "$COOKIE"
echo ""
echo "=== Done ==="
```

---

## Common Live Validation Checks

| Check | Command | Expected |
|-------|---------|----------|
| Server is running | `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health` | 200 |
| Auth works | `curl -s -X POST "$BASE/auth/login" -d '{"email":"admin@test.com","pass":"test"}' -c cookies.txt` | 200 + cookie |
| Auth fails (bad password) | Same as above with wrong password | 401 |
| 404 for missing resource | `curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/communities/00000000-0000-0000-0000-000000000000" -b "$COOKIE"` | 404 |
| 422 for bad payload | `curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/communities" -b "$COOKIE" -d '{}'` | 422 |
| Anonymous 401 | `curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/communities"` | 401 |

---

## Limitations

| Limitation | Why It Matters |
|------------|----------------|
| **No isolation** | Live server shares state between probes. Order matters. |
| **No cleanup guarantee** | You must manually delete test data or use a disposable database. |
| **No coverage measurement** | Live probes do not track code coverage. |
| **Manual process** | Cannot be automated in CI reliably. |
| **Slow** | Each probe requires a round-trip to the server. |

Use live validation as a **supplement to automated tests**, not a replacement.

---

## Rules Summary

| Rule | Detail |
|------|--------|
| Always run automated tests first | Live validation is optional, manual confirmation |
| Use a disposable database | Do not probe against production |
| Clean up test data after probing | Delete all resources you created |
| Convert probe scripts to pytest tests | If a probe reveals a bug, write a regression test |
| Do not rely on live probes in CI | Use pytest for CI validation |
