# Environment Variables

> Status: as-built · Last verified: 2026-11-15

Every variable below is read by one of the apps. The API falls back to `apps/api/config/config.yaml` for most settings; the dev CLI only writes the variables it cannot infer (see [Dev env setup](#dev-env-setup)).

---

## `apps/api/.env`

Read by the API (`config/config.py`, `cli.py`, and the routers/services). A value in `.env` overrides the YAML fallback.

### Core

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `LEARNHOUSE_AUTH_JWT_SECRET_KEY` | Signs and verifies HS256 JWTs. **Required**, minimum 32 characters — the API refuses to boot otherwise. | none |
| `LEARNHOUSE_SQL_CONNECTION_STRING` | PostgreSQL connection string | `config.yaml`: `postgresql://learnhouse:learnhouse@localhost:5432/learnhouse` |
| `LEARNHOUSE_REDIS_CONNECTION_STRING` | Redis used by auth rate limiting, session revocation, caches | `config.yaml`: `redis://localhost:6379/learnhouse` |
| `LEARNHOUSE_PORT` | API listen port | `config.yaml`: `1338` |
| `LEARNHOUSE_ENV` | Environment label reported to Sentry | `dev` |
| `LEARNHOUSE_DEVELOPMENT_MODE` | `true` enables uvicorn reload, `/docs` + `/redoc`, verbose Sentry sampling, and demo seeding | `config.yaml`: `false` |
| `LEARNHOUSE_SAAS` | Enables SaaS plan gating and internal-service key warnings | `config.yaml`: `false` |
| `LEARNHOUSE_SENTRY_DSN` | Sentry DSN for the API | empty |
| `LEARNHOUSE_SITE_NAME` | Instance name | `config.yaml`: `LearnHouse` |
| `LEARNHOUSE_SITE_DESCRIPTION` | Instance description | `config.yaml` |
| `LEARNHOUSE_CONTACT_EMAIL` | Contact address | `config.yaml`: `hi@learnhouse.app` |

### Hosting and tenancy

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `LEARNHOUSE_DOMAIN` | Base host used for tenancy and links. Required (non-localhost) when tenancy is `multi`. | `config.yaml`: `localhost:3000` |
| `LEARNHOUSE_FRONTEND_DOMAIN` | Frontend origin returned by `GET /api/v1/instance/info` | `config.yaml`: `localhost:3000` |
| `LEARNHOUSE_SSL` | Marks the deployment as HTTPS | `config.yaml`: `false` |
| `LEARNHOUSE_TENANCY` | `single` (serve the default org on any host) or `multi` (`slug.{domain}`, requires the `ee/` folder or `LEARNHOUSE_SAAS=true`) | inferred; effectively `single` for localhost/self-hosted |
| `LEARNHOUSE_COOKIE_DOMAIN` | Session cookie parent domain; only meaningful in `multi` | `config.yaml`: `.localhost` |
| `LEARNHOUSE_COOKIE_DOMAIN_ALLOW_BROAD` | `true` silences the warning for a broad parent cookie domain | unset |
| `LEARNHOUSE_ALLOWED_ORIGINS` | Comma-separated origins accepted by email-link validation | `config.yaml` list |
| `LEARNHOUSE_ALLOWED_REGEXP` | CORS `allow_origin_regex` in `multi` tenancy (`single` accepts any http(s) origin) | `config.yaml` regex |
| `LEARNHOUSE_USE_DEFAULT_ORG` | **Deprecated** — use `LEARNHOUSE_TENANCY` | unset |
| `LEARNHOUSE_SELF_HOSTED` | **Deprecated** — use `LEARNHOUSE_TENANCY=single` | unset |

### Content delivery

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `LEARNHOUSE_CONTENT_DELIVERY_TYPE` | `filesystem` or `s3api` | `config.yaml`: `filesystem` |
| `LEARNHOUSE_S3_API_BUCKET_NAME` | S3 bucket for media | empty |
| `LEARNHOUSE_S3_API_ENDPOINT_URL` | S3-compatible endpoint | empty |

### Email

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `LEARNHOUSE_EMAIL_PROVIDER` | `resend` or `smtp` | `config.yaml`: `resend` |
| `LEARNHOUSE_SYSTEM_EMAIL_ADDRESS` | From address | empty |
| `LEARNHOUSE_RESEND_API_KEY` | Resend API key | empty |
| `LEARNHOUSE_SMTP_HOST` / `LEARNHOUSE_SMTP_PORT` | SMTP server | empty / `587` |
| `LEARNHOUSE_SMTP_USERNAME` / `LEARNHOUSE_SMTP_PASSWORD` | SMTP credentials | empty |
| `LEARNHOUSE_SMTP_USE_TLS` | STARTTLS toggle | `true` |

### AI, analytics, code execution

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `LEARNHOUSE_GEMINI_API_KEY` | Gemini API key | empty |
| `LEARNHOUSE_IS_AI_ENABLED` | Enables AI endpoints | `config.yaml`: `false` |
| `LEARNHOUSE_TINYBIRD_API_URL` | Setting it enables Tinybird analytics | empty (disabled) |
| `LEARNHOUSE_TINYBIRD_INGEST_TOKEN` | Datasource append token | empty |
| `LEARNHOUSE_TINYBIRD_READ_TOKEN` | Pipe/SQL read token | empty |
| `LEARNHOUSE_JUDGE0_API_URL` | Setting it enables Judge0 code execution | empty (disabled) |
| `LEARNHOUSE_JUDGE0_CLIENT_ID` / `LEARNHOUSE_JUDGE0_CLIENT_SECRET` | Judge0 auth | empty |

### Payments

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `LEARNHOUSE_STRIPE_SECRET_KEY` | Stripe secret key | empty |
| `LEARNHOUSE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | empty |
| `LEARNHOUSE_STRIPE_WEBHOOK_STANDARD_SECRET` | Signing secret for `/payments/stripe/webhook/standard` | empty |
| `LEARNHOUSE_STRIPE_WEBHOOK_CONNECT_SECRET` | Signing secret for `/payments/stripe/webhook/connect` | empty |
| `LEARNHOUSE_STRIPE_CLIENT_ID` | Stripe Connect OAuth client ID | empty |

### Internal and deployment

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `COLLAB_INTERNAL_KEY` | Shared secret for collab → API ydoc calls (`/api/v1/boards/.../ydoc`); must match `apps/collab/.env` | none (dev CLI writes it) |
| `LEARNHOUSE_PLATFORM_URL` | Platform base URL for admin/email links and email-link allowlist | unset |
| `LEARNHOUSE_GOOGLE_OAUTH_CLIENT_ID` | Expected Google token audience. When unset, audience verification is skipped. | unset |
| `CLOUD_INTERNAL_KEY` | SaaS-only key for custom-domain sync endpoints | unset |
| `LEARNHOUSE_PLATFORM_API_KEY` | SaaS-only key for `/internal/packs` | unset |
| `LEARNHOUSE_DISABLE_EE` | `1` ignores the `ee/` folder (the dev CLI sets it unless `--ee`) | unset |
| `LEARNHOUSE_INITIAL_ADMIN_EMAIL` | Admin email for first install / seed | `admin@school.dev` |
| `LEARNHOUSE_INITIAL_ADMIN_PASSWORD` | Admin password for first install; `cli.py install --short` exits if missing | none |
| `LEARNHOUSE_CUSTOM_DOMAIN_DEV_MODE` | `true` skips DNS verification for custom domains | unset |
| `TESTING` | `true` switches the config guards and the test suite to SQLite/in-memory mode | unset |

---

## `apps/web/.env.local`

Read by `apps/web/services/config/config.ts`, `proxy.ts`, the OAuth routes, and the Sentry configs. In development `next.config.js` copies every `NEXT_PUBLIC_*` value into `public/runtime-config.js`; in the standalone image `server-wrapper.js` does the same from the container environment.

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL` | Backend base URL; the API URL is derived from it | `http://localhost:1338` |
| `NEXT_PUBLIC_LEARNHOUSE_API_URL` | Explicit API base URL; overrides the derived `<backend>/api/v1/` | empty |
| `NEXT_PUBLIC_COLLAB_URL` | WebSocket URL of the collab server | `ws://localhost:4000` |
| `NEXT_PUBLIC_LEARNHOUSE_HTTPS` | `true` makes generated URLs use `https://` | `false` |
| `NEXT_PUBLIC_LEARNHOUSE_DOMAIN` | Frontend host used for URL building | `LH_frontend_domain` cookie, else `localhost` |
| `NEXT_PUBLIC_LEARNHOUSE_TOP_DOMAIN` | Top-level domain for subdomain URLs | `LH_top_domain` cookie, else derived from the domain |
| `NEXT_PUBLIC_LEARNHOUSE_DEFAULT_ORG` | Default org slug | `LH_default_org` cookie, else `default` |
| `NEXT_PUBLIC_LEARNHOUSE_PLATFORM_URL` | Platform URL for upgrade links | unset |
| `LEARNHOUSE_PLATFORM_URL` | Server-side alias; also injected into the browser runtime config | unset |
| `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` | Unsplash image picker key | unset |
| `LEARNHOUSE_GOOGLE_CLIENT_ID` / `LEARNHOUSE_GOOGLE_CLIENT_SECRET` | Google OAuth exchange in `app/api/auth/google/*` | unset |
| `NEXT_PUBLIC_LEARNHOUSE_SENTRY_DSN` | Browser/server Sentry DSN; the edge config also accepts `LEARNHOUSE_SENTRY_DSN` | unset |
| `NEXT_PUBLIC_LEARNHOUSE_ENV` | Sentry environment (edge config also accepts `LEARNHOUSE_ENV`) | `dev` |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Enables Sentry source-map upload during `next build` | source maps disabled |
| `BUILD_ID` | Fixed build ID for multi-replica deployments | `learnhouse-production` |

---

## `apps/collab/.env`

Read by `apps/collab/src/index.ts`. The server exits at startup if either required secret is missing.

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `COLLAB_PORT` | Hocuspocus HTTP/WebSocket port | `4000` |
| `LEARNHOUSE_API_URL` | API base URL for membership checks and ydoc persistence | code: `http://localhost:8000`; `.env.example`: `http://localhost:1338` |
| `LEARNHOUSE_AUTH_JWT_SECRET_KEY` | Verifies the `HS256` board token. **Required**, must equal the API value. | none (exits) |
| `COLLAB_INTERNAL_KEY` | Sent as `X-Internal-Key` when persisting ydoc state. **Required**, must equal the API value. | none (exits) |
| `LEARNHOUSE_REDIS_URL` | Redis for cached ydoc state (falls back to the API when unreachable) | `redis://localhost:6379` |
| `COLLAB_TRUST_PROXY` | `true` trusts `x-forwarded-for` for per-IP rate limiting | `false` |

---

## Connection String Format

```
postgresql://<user>:<password>@<host>:<port>/<database>
```

Dev values:

- User/password: `learnhouse` / `learnhouse`
- Host: `localhost`
- Port: **5434** — the dev compose file maps `5434:5432`
- Database: `learnhouse`

`config.yaml` still ships the `5432` fallback; the dev `.env` overrides it to `5434`. Do not rely on the YAML value in dev.

---

## Dev env setup

The dev command checks three files and, if any required key is missing, offers to append the missing keys (it does not abort on its own):

| File | Keys it writes when missing |
|------|-----------------------------|
| `apps/api/.env` | `LEARNHOUSE_AUTH_JWT_SECRET_KEY` (generated), `COLLAB_INTERNAL_KEY` |
| `apps/web/.env.local` | `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL=http://localhost:1338/` |
| `apps/collab/.env` | `COLLAB_PORT=4000`, `LEARNHOUSE_API_URL=http://localhost:1338`, the same JWT secret and collab key |

To regenerate from scratch, delete the three files and re-run the dev command from the repository root:

```powershell
Remove-Item apps/api/.env, apps/web/.env.local, apps/collab/.env
bun run apps/cli/bin/learnhouse.ts dev --admin-email admin@school.dev --admin-password admin123456
```

Existing content is preserved — only missing keys are appended.
