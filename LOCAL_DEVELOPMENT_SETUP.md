
# LearnHouse Local Development Setup Guide

This file contains the **exact, step-by-step instructions** for how we set up the LearnHouse development environment on this system!

---

## Prerequisites
We had the following installed:
- `git` (already cloned the repo)
- Docker Desktop (to run containers for PostgreSQL + Redis)
- Bun (JavaScript package manager)
- Windows PowerShell

---

## Step 1: Check Repository Structure
First, we confirmed the repository has all expected components:
- `apps/api/` (Python FastAPI backend)
- `apps/web/` (Next.js frontend)
- `apps/collab/` (WebSocket collaboration server)
- `apps/cli/` (Deployment/management CLI)

---

## Step 2: Set Up Docker Infrastructure (PostgreSQL + Redis)
We created a dedicated Docker Compose file in a `.learnhouse/` directory:

File created: [.learnhouse/docker-compose.dev.yml](file:///c:\Projects\learnhouse-dev\learnhouse-dev\.learnhouse\docker-compose.dev.yml)
```yaml
name: learnhouse-dev

services:
  db:
    image: pgvector/pgvector:pg16
    container_name: learnhouse-db-dev
    restart: unless-stopped
    environment:
      - POSTGRES_USER=learnhouse
      - POSTGRES_PASSWORD=learnhouse
      - POSTGRES_DB=learnhouse
    ports:
      - "5434:5432" # NOTE: Changed from 5432 to avoid conflict
    volumes:
      - learnhouse_db_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U learnhouse"]
      interval: 5s
      timeout: 4s
      retries: 5

  redis:
    image: redis:8.6.1-alpine
    container_name: learnhouse-redis-dev
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - learnhouse_redis_dev_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 4s
      retries: 5

volumes:
  learnhouse_db_dev_data:
  learnhouse_redis_dev_data:
```

Then, we started the containers with:
```powershell
docker compose -f .learnhouse\docker-compose.dev.yml up -d
```

---

## Step 3: Install uv (Python Package Manager)
We installed uv using:
```powershell
irm https://astral.sh/uv/install.ps1 | iex
```
*(uv is installed to `C:\Users\SLIMANE.DD\.local\bin\uv.exe`)*

---

## Step 4: Create Environment Variables
We created .env files for each app:

### File: [apps/api/.env](file:///c:\Projects\learnhouse-dev\learnhouse-dev\apps\api\.env)
```env
LEARNHOUSE_DEVELOPMENT_MODE=true
LEARNHOUSE_AUTH_JWT_SECRET_KEY=R8J4aH5d7qGk9cZxVfT3eW2sXp6mNnQ1bL0kKjH9gFd3s
COLLAB_INTERNAL_KEY=dev-collab-internal-key-abc123xyz
LEARNHOUSE_SQL_CONNECTION_STRING=postgresql://learnhouse:learnhouse@localhost:5434/learnhouse
LEARNHOUSE_INITIAL_ADMIN_EMAIL=admin@school.dev
LEARNHOUSE_INITIAL_ADMIN_PASSWORD=admin123456
```

### File: [apps/web/.env.local](file:///c:\Projects\learnhouse-dev\learnhouse-dev\apps\web\.env.local)
```env
NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL=http://localhost:1338
```

### File: [apps/collab/.env](file:///c:\Projects\learnhouse-dev\learnhouse-dev\apps\collab\.env)
```env
COLLAB_PORT=4000
LEARNHOUSE_API_URL=http://localhost:1338
LEARNHOUSE_AUTH_JWT_SECRET_KEY=R8J4aH5d7qGk9cZxVfT3eW2sXp6mNnQ1bL0kKjH9gFd3s
COLLAB_INTERNAL_KEY=dev-collab-internal-key-abc123xyz
LEARNHOUSE_REDIS_URL=redis://localhost:6379
```

---

## Step 5: Install Dependencies
### Web App (using Bun)
```powershell
cd apps/web
bun install
```

### Collab App (using Bun)
```powershell
cd apps/collab
bun install
```

### API App (using uv)
```powershell
cd apps/api
& "C:\Users\SLIMANE.DD\.local\bin\uv.exe" sync
```

---

## Step 6: Start Services in Separate Terminals

### API Server
```powershell
cd apps/api
& "C:\Users\SLIMANE.DD\.local\bin\uv.exe" run python app.py
```
- Runs on port **1338**
- Auto-reload enabled for fast changes
- API docs available at `http://localhost:1338/docs` or `/redoc`!

### Web Server
```powershell
cd apps/web
bun run dev
```
- Runs on port **3000**
- Turbopack enabled for fast rebuilds

### Collab Server
```powershell
cd apps/collab
bun run dev
```
- Runs on port **4000**
- Uses `tsx watch` for auto-reload

---

## Important Notes
- We changed Postgres port to **5434** (from default 5432) to avoid conflict with a native Windows Postgres server already running on the system!
- Default admin credentials:
  - Email: `admin@school.dev`
  - Password: `admin123456`
- All services have **hot reload** enabled, so edits to code will automatically reload the server!

---

## How to Verify Everything is Working
1. Check containers with `docker ps`
2. Test API health with:
   ```powershell
   Invoke-WebRequest -Uri http://localhost:1338/api/v1/health -UseBasicParsing
   ```
3. Open browser to http://localhost:3000 for the web interface!

---

## Stopping Services
1. Stop each terminal (Ctrl+C) to stop the API, web, and collab servers
2. Stop containers with:
   ```powershell
   docker compose -f .learnhouse\docker-compose.dev.yml stop
   ```
3. (Optional) Remove containers and volumes with:
   ```powershell
   docker compose -f .learnhouse\docker-compose.dev.yml down -v
   ```

