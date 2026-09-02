# API

Base URL: `http://localhost:4000` locally. JSON in, JSON out, except photo
uploads (multipart) and photo/CSV/QR downloads. Authentication is a signed,
HttpOnly session cookie set by `POST /auth/login`. Every response carries
`x-request-id`.

Errors: `{ error, details?, requestId }` with 400 (validation, `details` lists
field paths), 401, 403, 404, 409, 422 (rule violation, including database
integrity guards), 429, 500.

## Auth

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | anyone | `{ identifier (email or phone), password }` → session cookie |
| POST | `/auth/logout` | signed in | Revoke session |
| GET | `/auth/me` | signed in | Current user and role |

## People and structure

| Method | Path | Who |
| --- | --- | --- |
| POST/GET | `/users` | ADMIN |
| POST/GET | `/organisations` | ADMIN (GET also ORGANISATION, own) |
| GET | `/organisations/:id/programs` | ADMIN, ORGANISATION (own) |
| POST | `/programs` | ADMIN, ORGANISATION (own) |
| GET | `/programs/:id/overview` | ADMIN, ORGANISATION (own), FIELD_AUDITOR |
| GET | `/programs/:id/report.csv` | ADMIN, ORGANISATION (own) |
| POST/GET | `/farmers` | ADMIN (GET also FIELD_AUDITOR) |
| GET | `/farmers/:id`, `/farmers/:id/trees`, `/farmers/:id/payments` | ADMIN, FIELD_AUDITOR, the farmer |
| POST/GET | `/land-plots` | ADMIN (GET also FIELD_AUDITOR, FARMER own) |
| POST/GET | `/clusters` | ADMIN, ORGANISATION (own); GET also FIELD_AUDITOR |
| GET | `/clusters/:id/trees` | same |

## Trees

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| POST | `/trees` | ADMIN, ORGANISATION (own) | Allocates `GIRTH-nnnnnn`; optional `tagCode`, `replacementForTreeId` |
| GET | `/trees` | signed in | Scoped to role; filters `status`, `species`, `farmerId`, `clusterId` |
| GET | `/trees/:publicId` | signed in, scoped | Tree, all measurements with checks and photos, status history |
| GET | `/trees/:publicId/measurements` | signed in, scoped | |
| POST | `/trees/:publicId/measurements` | FARMER (own), FIELD_AUDITOR, ADMIN | JSON or multipart with `photo`; see `measurement-protocol.md` |
| POST | `/trees/:publicId/status` | ADMIN, FIELD_AUDITOR | `{ status, reason }`, follows the status machine |
| POST | `/trees/:publicId/tags` | ADMIN, FIELD_AUDITOR | Replace the physical tag, keeping identity |
| GET | `/trees/:publicId/qr.svg` | public | QR pointing at `PUBLIC_TREE_BASE_URL/tree/:publicId` |

## Verification

| Method | Path | Who |
| --- | --- | --- |
| GET | `/measurements/queue` | ADMIN, FIELD_AUDITOR (anomalies first) |
| GET | `/measurements/:id` | reviewers, owning farmer, owning organisation |
| POST | `/measurements/:id/verify` | ADMIN, FIELD_AUDITOR (never the submitter) |
| POST | `/measurements/:id/flag` | same |
| POST | `/measurements/:id/remeasure` | same |
| GET | `/audits?result=PENDING` | ADMIN, FIELD_AUDITOR |
| POST | `/audits` | ADMIN (manual selection with reason) |
| POST | `/audits/:id/result` | ADMIN, FIELD_AUDITOR; multipart with optional `photo` |

## Money

| Method | Path | Who |
| --- | --- | --- |
| GET | `/payments/config` | signed in |
| POST | `/payments/config` | ADMIN, requires `reason` |
| GET | `/payments/ledger?farmerId&status` | ADMIN |
| POST | `/payments/:id/mark-paid` | ADMIN, `{ externalPaymentId }` |
| POST | `/trees/:publicId/sponsorships` | CUSTOMER |
| POST | `/sponsorships/:id/activate` | ADMIN, `{ externalPaymentId }` (gateway webhooks will replace this) |
| GET | `/sponsorships` | ADMIN |

## Me

| Method | Path | Who |
| --- | --- | --- |
| GET | `/me/farm` | FARMER: counts, survival, payments pending/paid |
| GET | `/me/payments` | FARMER |
| GET | `/me/trees` | FARMER: own trees; CUSTOMER: sponsored trees with growth since sponsorship |

## Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/public/trees/:publicId` | The QR landing data: no login, no private fields, cached 60 s |
| GET | `/public/photos/:id` | Thumbnails of verified evidence only |
| GET | `/photos/:id/thumbnail`, `/photos/:id/original` | Signed in, scoped like the tree |

## Platform

| Method | Path | Who |
| --- | --- | --- |
| GET | `/health` | public |
| GET | `/analytics/overview` | ADMIN |
| GET | `/audit-log?entityType&entityId` | ADMIN |
| GET/PUT | `/settings`, `/settings/:key` | ADMIN, PUT requires `reason` |
| GET/POST/PATCH | `/experiments` | ADMIN |

Request and response shapes are the zod schemas in
`packages/domain/src/schemas.ts`; the web client imports the same schemas.
