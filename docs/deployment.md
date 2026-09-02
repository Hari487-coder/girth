# Deployment

## Environments

| Environment | Database | Storage | Web | API |
| --- | --- | --- | --- | --- |
| LOCAL | embedded Postgres (`npm run db:up`) or docker-compose | local disk (`apps/api/storage`) | `npm run dev` on :3200 | `npm run dev:api` on :4000 |
| STAGING | managed Postgres (separate instance) | separate bucket | static host | container/app service |
| PRODUCTION | managed Postgres with automated backups | production bucket | static host | container/app service, ≥2 instances |

Never share databases, buckets, secrets or payment credentials across environments.

## Local

```bash
npm install
npm run db:up            # starts PostgreSQL on 127.0.0.1:5433 (keep this terminal open)
npm run db:migrate       # applies migrations
npm run db:seed          # admin, auditor, org, farmer, customer, demo trees
npm run dev:api          # http://localhost:4000
npm run dev              # http://localhost:3200 (web)
```

Copy `apps/api/.env.example` to `apps/api/.env` and set `SESSION_SECRET`.
Docker users can run `docker compose up -d` instead of `db:up` (Postgres on
5433 and MinIO on 9000) with `STORAGE_DRIVER=local` until the S3 driver lands.

## CI (GitHub Actions, `.github/workflows/ci.yml`)

On every pull request and push: install, build domain, typecheck all
workspaces, unit tests, API acceptance tests against a Postgres service
container, web build.

## Staging (recommended first target)

The API is a plain Node process that needs `DATABASE_URL`, `SESSION_SECRET`,
`WEB_ORIGINS`, `PUBLIC_TREE_BASE_URL`, `AUDIT_SAMPLING_SALT` and storage
settings. `render.yaml` at the repository root describes a Render web service
plus managed Postgres; Railway or Fly.io are equivalent. Steps:

1. Create the Postgres instance; set `DATABASE_URL`.
2. Create the object storage bucket (Cloudflare R2 or S3); the S3 storage driver is the next API increment.
3. Set secrets; deploy the API with `npm run build && npm run db:migrate && npm start`.
4. Deploy the web app as static files (`npm run build -w apps/web`, serve `apps/web/dist` with an SPA fallback) with `VITE_API_URL` set to the API origin and `VITE_APP_ENV=staging`. Add that web origin to the API's `WEB_ORIGINS`. Because the session cookie is `SameSite=Lax`, host the web app and API on the same site (e.g. `app.girth.example` and `api.girth.example`) or reverse-proxy the API under `/api` on the web origin, as the dev server does.
5. Smoke test: `GET /health`, login as the seeded admin, `GET /public/trees/GIRTH-000001`.

Migrations run before the new version starts serving. A migration that would
fail on existing data blocks the deploy; that is intended.

## Production

Same as staging plus: manual approval on the deploy, health check gating,
rollback = redeploy previous image (migrations are forward-only, so write them
to be backward compatible with the previous version for one release).

## Backups

Managed Postgres with daily automated backups, 30-day retention, point-in-time
recovery where available. **Test a restore into a scratch instance before the
pilot starts and once a quarter after**; record the date and duration in
`operations.md`. Object storage: versioning enabled; originals are never
deleted.

## Monitoring

- Error tracking: Sentry (or equivalent) on API and web, with request ID correlation.
- Uptime: external check on `/health` every minute.
- Alerts: API 5xx rate, p95 latency, failed notification deliveries, failed payment webhooks (later), storage put failures, database connection errors.
- Logs: pino JSON shipped to the platform's log store; searchable by `requestId`, `userId`, `entityId`.
