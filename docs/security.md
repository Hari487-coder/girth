# Security

## Principles

- The server is authoritative for role, ownership, verification status and payment status. Nothing the client sends about itself is trusted.
- History is append-only at the database level.
- Private data (farmer identity, coordinates, contracts, ledger) never appears on public endpoints.
- Secrets live in environment variables; none are committed.

## Controls in place

| Area | Control |
| --- | --- |
| Authentication | Password hashes (bcrypt, cost 12); random 256-bit session tokens stored as SHA-256; HttpOnly, SameSite=Lax, Secure (production) signed cookies; sessions expire (`SESSION_TTL_DAYS`) and are revocable |
| Authorisation | `requireRole` on every private route; farmer/organisation/customer scoping on every read; reviewers cannot verify their own readings |
| Input validation | zod schemas for every body; coerced numbers with bounds; 1 MB JSON body limit |
| Rate limiting | 300 req/min per IP globally; 10/min on login; 120/min on public tree pages |
| Uploads | Images only, decoded by sharp to validate; 10 MB cap; stored under generated keys; original bytes hashed |
| Headers | helmet defaults; CORS allow-list with credentials only for `WEB_ORIGINS` |
| CSRF | SameSite=Lax cookies, JSON/multipart-only mutations, CORS allow-list |
| SQL injection | Prisma parameterised queries; the only raw SQL is a fixed `nextval` and the health check |
| Logging | pino structured logs with request IDs; cookies and authorisation headers redacted; no passwords or tokens logged |
| Integrity | Database triggers on measurements, ledger, audit log, audits, photos, trees |
| Audit log | Every mutation writes who, what, previous state, new state, reason, request ID, IP |

## Before real users (checklist)

- [ ] Dependency audit (`npm audit`, Renovate/Dependabot enabled)
- [ ] Authentication review: password policy, lockout after repeated failures, session revocation on password change, phone OTP for farmers
- [ ] Authorisation review: walk every route in `api.md` with each role
- [ ] Upload review: content sniffing, EXIF stripping policy for public thumbnails (retain originals privately)
- [ ] API abuse test: rate limits under load, oversized bodies, slow uploads
- [ ] Database permissions: application role cannot DROP/TRUNCATE; migrations run with a separate role
- [ ] Secrets review: rotation procedure for `SESSION_SECRET`, `AUDIT_SAMPLING_SALT`, storage keys
- [ ] Privacy review of `/public/*` responses against `database.md` privacy split
- [ ] Backup restore test (see `deployment.md`)
- [ ] Incident response: who is paged, how sessions are revoked, how a compromised key is rotated

## Known gaps today

- Farmer login is phone + password; OTP over SMS arrives with the notification channels.
- No account lockout yet (rate limiting only).
- EXIF data on uploaded originals is retained (it is evidence); public thumbnails are re-encoded by sharp without metadata.
- Legal documents (terms, privacy policy, agreements) are placeholders that need professional review.
