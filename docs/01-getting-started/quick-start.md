# Quick Start

> Get Koodook running locally in 5 minutes.

---

## Prerequisites

Make sure you have these installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) --- must be running
- [Bun](https://bun.sh/) --- `bun --version`
- [uv](https://docs.astral.sh/uv/) --- `uv --version`

---

## 1. Clone and Start

```bash
git clone <repo-url>
cd learnhouse-dev
bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
```

The CLI will:
1. Check and create environment files if missing
2. Start Docker containers (PostgreSQL + Redis)
3. Install dependencies (`bun install`, `uv sync`)
4. Start API (port 1338), Web (port 3000), Collab (port 4000)

---

## 2. Open the App

Navigate to [http://localhost:3000](http://localhost:3000).

Log in with:
```
Email:    admin@school.dev
Password: admin123456
```

---

## 3. Next Steps

- See the [Development Setup](./development-setup.md) guide for detailed configuration
- Browse the [Architecture Overview](../02-architecture/overview.md) to understand the system
- Check the [Admin Guide](../04-admin-guide/README.md) to learn about course management
