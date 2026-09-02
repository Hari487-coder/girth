# Database

PostgreSQL, managed by Prisma migrations in `apps/api/prisma/migrations`.
The schema is `apps/api/prisma/schema.prisma`; this page explains the intent.

## Entity map

```
Organisation ─┬─ Program ─── TreeCluster ─┐
              └─ User (ORGANISATION)      │
Farmer ── User (FARMER)                   │
  ├── LandPlot ───────────────────────────┤
  ├── FarmerAgreement                     │
  └── PaymentLedger                       ▼
                                        Tree ── TreeTag
                                          ├── TreeStatusHistory
                                          ├── Measurement ── MeasurementCheck
                                          │      ├── Photo
                                          │      ├── Audit ── Photo
                                          │      └── PaymentLedger
                                          └── Sponsorship ── User (CUSTOMER)
AuditLog, NotificationEvent, Experiment, Setting, PaymentConfig, Session
```

## Tree identity

- `Tree.seq` is backed by a PostgreSQL sequence; `Tree.publicId` is `GIRTH-` +
  six-digit padded `seq`. Both are frozen by trigger. Sequences never reuse
  numbers, so an ID is never recycled even if a create is rolled back.
- A replacement tree is a new `Tree` with `replacementForId` pointing at the
  dead original; the original moves to `REPLACED`.
- Physical tags live in `TreeTag`; replacing a tag keeps the tree and links old
  tag → new tag.

## Status machine

`Tree.status` follows `packages/domain/src/treeStatus.ts`. Every transition
writes a `TreeStatusHistory` row and an `AuditLog` line. `DEAD` can only go to
`REPLACED` or `RETIRED`; nothing goes back to alive.

## Append-only tables

Guarded by triggers in `20260902061100_immutability_guards`:

| Table | Guard |
| --- | --- |
| `AuditLog` | no UPDATE, no DELETE |
| `Measurement` | facts (tree, submitter, date, height, girth, location) frozen; VERIFIED can only become SUPERSEDED; no DELETE |
| `PaymentLedger` | amount, currency, farmer, tree, measurement, reason frozen; PAID cannot change status; no DELETE |
| `Audit`, `MeasurementCheck`, `Photo`, `TreeStatusHistory` | no DELETE |
| `Tree` | `publicId` and `seq` frozen; no DELETE |

Tests reset with `TRUNCATE`, which does not fire row triggers; nothing in the
application uses TRUNCATE.

## Privacy split

Public reads (`/public/trees/:id`) select only species, status, coarse
location (cluster label or district + state), verified girth history, public
photos and the sponsor's chosen tree name. Farmer names, phones, land
coordinates, agreements, ledger and audit notes are never joined into that
query.

## Money

All amounts are integer paise. `PaymentConfig` rows are versioned; exactly one
is active. Ledger lines reference the config they were computed under.

## Migrations

```
npm run db:migrate        # prisma migrate deploy (all environments)
npm run db:migrate:dev    # prisma migrate dev (local schema changes)
```

Rules: never edit an applied migration; add a new one. Any migration that
touches guarded tables must keep the guards. Destructive changes need a backup
restore test first (see `deployment.md`).
