# Architecture

Girth is a tree identity, measurement and verification platform. One tree is
the unit; every table, endpoint and screen hangs off a tree's permanent ID.

## Shape

```
apps/web        React + Vite + Tailwind (customer, farmer, auditor, org, admin UIs)
apps/api        Fastify + Prisma on PostgreSQL (all rules, all state changes)
packages/domain Pure TypeScript rules shared by both (checks, status machine, money, sampling)
docs/           This documentation
```

The browser never touches the database. Every state change is a server call
that validates input, checks the caller's role and ownership, writes inside a
transaction together with an audit-log line and any notification event, and
only then returns.

## Decisions and why

**Separate API + SPA, not a full-stack framework.** The farmer app must work
offline (queue measurements, sync later) and be installable as a PWA; the
public tree page must be cacheable and cheap; organisations will want an API.
A plain HTTP API with a stateless SPA fits all three. The public tree page will
get server-rendered link previews (OG tags) as a small edge function when we
need shareability; it does not justify moving the whole app to SSR now.

**Fastify.** Schema-friendly, fast, small, first-party plugins for cookies,
CORS, helmet, rate limiting and multipart. Express would work too; Fastify's
plugin encapsulation and built-in structured logging (pino) with request IDs
give us observability for free.

**PostgreSQL + Prisma migrations.** Relational data with real foreign keys, and
integrity rules that live in the database (triggers) so that history cannot be
edited by anyone, including us. Prisma gives typed queries and a migration
history in git. JSON columns appear only for immutable snapshots (audit log
before/after) and notification payloads, never as the source of truth.

**Append-only history, enforced twice.** Measurements, audits, ledger entries
and audit-log lines are never updated or deleted by application code, and the
database refuses if anything tries (`prisma/migrations/*_immutability_guards`).
Corrections are new rows that reference the old ones. This is the technical
form of the product promise: "the history cannot be silently changed".

**Money in integer paise.** No floating point ever touches an amount. The
farmer payment model is a versioned `PaymentConfig` row, not code.

**Session cookies, not JWTs.** Sessions are revocable rows; the cookie holds a
random token and the database stores only its hash. Roles are read from the
database on every request; the client never tells the server who it is.

**Storage abstraction.** Photos go through a `Storage` interface. Local disk in
development and tests; S3-compatible object storage (Cloudflare R2 or AWS S3)
in staging and production. Originals are kept byte-for-byte with a SHA-256;
thumbnails are derived.

**Notification outbox.** Events are rows written in the same transaction as
the change. A worker delivers them (in-app now; email, SMS, WhatsApp later).
No request ever waits on a third-party messaging API.

**Deterministic audit sampling.** Selection is a keyed hash of the measurement
ID and a secret salt, so a selection can be reproduced in a dispute but not
predicted by a farmer. The rate is a setting an admin can change with a reason.

## Roles

| Role | Sees | Changes |
| --- | --- | --- |
| ADMIN | Everything | Everything, always with an audit-log reason where it matters |
| FIELD_AUDITOR | All trees, queue, audits | Submits measurements, verifies/flags, records audit results, tree status |
| FARMER | Own trees, own ledger | Submits measurements and photos for own trees |
| CUSTOMER | Sponsored trees, public pages | Sponsors and names trees |
| ORGANISATION | Own organisation's programs, clusters, trees, reports | Creates programs and clusters, registers trees |

## Request lifecycle

1. `x-request-id` is generated (or accepted from a trusted proxy) and echoed back.
2. The session cookie is unsigned and resolved to a user; missing or expired sessions mean `request.user = null`.
3. The route validates the body with the shared zod schema (`packages/domain/src/schemas.ts`); failures are 400 with field paths.
4. The route checks role and ownership (`requireRole`, `assertOrganisationScope`, tree scope).
5. A service performs the change inside `prisma.$transaction`, writing the audit-log line and notification event alongside it.
6. Errors map to status codes in one place (`apps/api/src/app.ts`); database guard violations surface as 422 with the guard's message.

## What is deliberately not here yet

Real payment gateways, email/SMS delivery, the S3 driver, offline sync in the
web app, Telugu translations, PDF reports, satellite or AI anything. See
`roadmap.md` for when each arrives and what has to be validated first.
