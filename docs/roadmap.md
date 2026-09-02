# Roadmap

Build in phases. Each phase exists to validate something; nothing moves to the
next column until the previous column's experiment has a result.

## NOW (Phase 1 pilot: 5 to 10 farmers, 100 to 300 trees, one cluster)

| Item | Status |
| --- | --- |
| Tree identity (`GIRTH-nnnnnn`, sequence, tags, QR) | API done, tested |
| Measurement submission with photo, GPS, timestamp, idempotent offline retry | API done, tested |
| Automated checks and anomaly detection | Done, unit + integration tested |
| Human verification queue: verify / flag / remeasure | API done, tested |
| Random audits with discrepancy records | API done, tested |
| Payment config + immutable ledger + manual mark-paid | API done, tested |
| Audit log, status history, notification outbox | API done |
| Public tree page data (privacy split) | API done, tested |
| Roles: admin, auditor, farmer, customer, organisation | API done |
| Organisation programs, clusters, overview, CSV report | API done, tested |
| Local environment, migrations, seed, CI | Done |
| Web wired to the API: sign-in, public `/tree/:id`, marketplace, sponsor flow, My Trees, farmer home + measurement wizard (QR scan where supported, photo, GPS, offline queue), review queue, audits, admin, program overview | Done, verified in the browser |
| PWA manifest + service worker (installable farmer app) | Done |
| Farmer strings routed through a dictionary (English; Telugu draft for native review) | Done |
| S3-compatible storage driver (tested against MinIO) | Done |
| Staging deployment on the VPS (Postgres, MinIO, API, web behind the edge proxy, HTTPS); smoke test, data QA, backup cron, restore drill all green | Done, 2 Sep 2026 |
| Authorisation matrix, abuse-input and container-build tests in CI | Done |
| **Real phone testing** (`docs/phone-testing.md`) and staging sign-off (`docs/staging-signoff.md`) | Next: needs hands on a budget Android |
| Real subdomain for staging (one DNS A record) so no network filter blocks it | Next: needs DNS |
| Public tree page link previews (server-rendered OG tags) | Next |

## NEXT (Phase 2 institutional pilot: 1 organisation, ~1,000 trees)

- Offline mode in the farmer app (queue, sync status, "3 measurements waiting")
- Notification delivery worker: email first, then SMS/WhatsApp
- Organisation dashboard with survival/growth/verification charts
- Bulk tree import (CSV) and tag batch printing
- Farmer phone OTP login
- PDF reports
- Telugu translations (i18n scaffolding first)

## LATER (Phase 3 production platform)

- Real customer payments (Indian gateway, webhooks) and farmer payouts (regulated provider)
- Advanced analytics, unit and cluster economics calculators with editable assumptions
- Institutional APIs and verification-as-a-service for organisations bringing their own farmers
- Operational monitoring, alerting, restore drills as routine

## FUTURE (only after validation)

- Environmental credit integrations (Green Credit or similar)
- Anything involving satellites, LiDAR, AI recognition, blockchain: not planned

## Explicitly not building

Blockchain, carbon credits, AI tree detection, satellite monitoring, complex
GIS, tokenisation, cryptocurrency, social features, gamification, loyalty
systems. The problem is proving a tree survived and grew. Solve that first.
