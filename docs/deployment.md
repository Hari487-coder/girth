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

## Staging on a single VPS (current)

`deploy/docker-compose.staging.yml` runs Postgres 17, MinIO (S3-compatible
evidence storage, versioned bucket), the API and the web app as one compose
project. TLS comes from the host's shared front proxy (a Caddy on the external
docker network `edge`, one site block per project), so the stack binds no host
ports itself.

```bash
# on the server, once
sudo mkdir -p /opt/girth && cd /opt/girth
git clone https://github.com/Hari487-coder/girth.git .
cp deploy/.env.staging.example deploy/.env && $EDITOR deploy/.env   # secrets: openssl rand -hex 32
docker network create edge 2>/dev/null || true

# deploy / redeploy
git pull
docker compose -f deploy/docker-compose.staging.yml --env-file deploy/.env up -d --build
# add to the front proxy's Caddyfile, then reload it:
#   girth.<host> { reverse_proxy girth-staging-web-1:80 }
node scripts/smoke.mjs https://girth.<host>
docker compose -f deploy/docker-compose.staging.yml --env-file deploy/.env exec -T api node dist/scripts/data-qa.js
```

Without DNS, `girth.<ip-with-dashes>.sslip.io` resolves to the server and
Let's Encrypt issues a certificate for it. Corporate and some home networks
block wildcard-DNS domains; a real subdomain (one A record to the server, one
more site block on the proxy) avoids that and is the plan for the pilot.

Staging as deployed on 2 Sep 2026: `https://girth.177-7-41-98.sslip.io`,
compose project `girth-staging` in `/opt/girth`, env in `/opt/girth/deploy/.env`
(mode 600, not in git), site block in `/opt/edge/Caddyfile`, nightly backup cron
at 02:15 server time. The API container runs
`prisma migrate deploy` before it serves; `SEED_ON_BOOT=true` seeds demo
accounts on the first boot only (set it back to `false` and rotate the seeded
passwords before real users). Backups: `deploy/backup.sh` nightly via cron,
`deploy/restore-drill.sh` quarterly (record it in `operations.md`).

Without a front proxy, `--profile standalone` adds the stack's own Caddy on
80/443 using `deploy/Caddyfile`.

## Staging on a managed platform (alternative)

The API is a plain Node process that needs `DATABASE_URL`, `SESSION_SECRET`,
`WEB_ORIGINS`, `PUBLIC_TREE_BASE_URL`, `AUDIT_SAMPLING_SALT` and storage
settings. `render.yaml` at the repository root describes a Render web service
plus managed Postgres; Railway or Fly.io are equivalent. Steps:

1. Create the Postgres instance; set `DATABASE_URL`.
2. Create the object storage bucket (Cloudflare R2 or S3) and set `STORAGE_DRIVER=s3` with `S3_BUCKET`, `S3_ENDPOINT` (R2/MinIO), `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. The API refuses to start if the bucket is unreachable.
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
