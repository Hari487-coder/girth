# Staging sign-off

Production means real farmers and real money. Staging is signed off only when
every line below has a date and a name next to it. Automated checks are run
by the commands shown; manual ones are recorded in the tables.

## 1. Deploy verification (automated)

```bash
node scripts/smoke.mjs https://<staging>                   # shell, health, headers, public privacy, rate limit
SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... node scripts/smoke.mjs https://<staging>   # plus signed-in path
ssh <server> 'cd /opt/girth/deploy && docker compose -f docker-compose.staging.yml --env-file .env exec -T api node dist/scripts/data-qa.js'
```

- [ ] Smoke test passed
- [ ] Data QA passed on the staging database
- [ ] CI green on the deployed commit (tests, authorisation matrix, abuse tests, storage driver against MinIO, container builds)

## 2. Real phone testing

Complete `docs/phone-testing.md` on at least one budget Android and one iPhone.

- [ ] QR scan (camera app) opens the public tree page
- [ ] In-app scan works on Android Chrome; manual ID works everywhere
- [ ] GPS captured outdoors; distance shown to the reviewer
- [ ] Camera capture and photo evidence visible to the reviewer
- [ ] Offline measurement queued; synced after reconnect; no duplicates
- [ ] Reviewer verification updates farmer payment and public page
- [ ] Installable as an app on Android

## 3. Security review

| Check | How | Done |
| --- | --- | --- |
| Dependency audit | `npm audit --omit=dev` shows no high/critical, or each is triaged in writing | |
| Authorisation matrix | `apps/api/test/authorization.test.ts` covers every private route (add new routes when you add them) | |
| Abuse inputs | `apps/api/test/abuse.test.ts` green | |
| Secrets | `deploy/.env` not in git; `SESSION_SECRET`, `AUDIT_SAMPLING_SALT`, DB and MinIO passwords generated with `openssl rand -hex 32`; rotation steps in `security.md` | |
| Transport | `curl -I https://<staging>/api/health` shows HTTPS with a valid certificate and `strict-transport-security` | |
| Cookies | Browser devtools: `girth_session` is HttpOnly, Secure, SameSite=Lax | |
| Uploads | Non-image and > 10 MB rejected on staging (repeat the abuse test by hand once) | |
| Privacy | Public endpoints show no farmer names, phones or coordinates (smoke test checks this); walk `/public/trees/:id` for one tree by eye | |
| Database permissions | Application role cannot `DROP`/`TRUNCATE` in production (staging may share a role; note the difference) | |
| Immutability | `apps/api/test/acceptance.test.ts` "history cannot be silently changed" green; spot-check by trying to edit a verified reading in the database | |
| Logging | Staging logs contain no passwords, cookies or tokens (grep the last 1,000 lines) | |
| Ports | Only 80/443 (and SSH) exposed on the host; MinIO console and Postgres not reachable from the internet (`nmap` or `ss -ltnp`) | |

## 4. Data QA

| Check | Done |
| --- | --- |
| `data-qa` invariants pass | |
| Seed accounts changed or disabled before real users (`SEED_ON_BOOT=false`, rotate seeded passwords) | |
| One real tree registered end to end: farmer, land, cluster, tree, tag, QR printed, first measurement verified | |
| Program overview and CSV export match a hand count for that cluster | |

## 5. Operations

| Check | Done |
| --- | --- |
| Nightly backup cron installed (`deploy/backup.sh`) and one backup visible in the bucket | |
| Restore drill run (`deploy/restore-drill.sh`) with the result recorded in `operations.md` | |
| Uptime check on `/api/health` from outside the server | |
| Error tracking DSN configured (or explicitly deferred with a date) | |
| Who is on call and how sessions/keys are revoked written down | |

## 6. Go / no-go

Production requires: every automated check green; every phone scenario passed on a budget Android; no open high/critical security finding; a successful restore drill; seed accounts disabled.

| Item | Name | Date |
| --- | --- | --- |
| Deploy verification | | |
| Phone testing | | |
| Security review | | |
| Data QA | | |
| Operations | | |
| **Go for production** | | |
