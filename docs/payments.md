# Payments

Two money flows: farmers are paid for trees that stay alive and grow;
customers and organisations pay to sponsor trees. Both are recorded as
immutable ledger rows. No real gateway or payout provider is connected yet.

## Farmer payment model (illustrative)

`PaymentConfig` rows are versioned; one is active. Amounts are integer paise.

| Field | Meaning | Seed value |
| --- | --- | --- |
| `survivalPaise` | paid when a reading is verified and the tree is alive | ₹600 |
| `growthBonusPaise` | paid when verified growth ≥ `minGrowthCmForBonus` | ₹200 |
| `basePaise` | paid per verified reading regardless (0 by default) | ₹0 |
| `deadPaise` | paid when a tree is confirmed dead (0: a dead tree earns nothing) | ₹0 |
| `penaltyPaise` | reserved for audit findings | ₹0 |
| `replacementRule` | text policy | new tree linked to the original |

**Every config is labelled "Illustrative payment model".** The pilot exists to
find out what these numbers should be. Admins change them with
`POST /payments/config` and a reason; the change is audit-logged.

## Ledger

`PaymentLedger` rows are created when a reading is verified
(`packages/domain/src/payments.ts` decides the lines). Statuses:
`ELIGIBLE → APPROVED → PAID`, or `CANCELLED` while unpaid.

- Amount, farmer, tree, measurement, reason and creation time are frozen by a database trigger.
- A PAID row can never change status.
- Reversals are new negative `ADJUSTMENT` rows, never edits.
- An audit that finds a major discrepancy cancels unpaid rows for that reading and adjusts paid ones.

The farmer sees pending and paid totals on `GET /me/payments` and `GET /me/farm`.

## Paying out (pilot)

For the pilot, payouts happen outside the system (bank transfer/UPI by the
programme team). The admin records the transfer with
`POST /payments/:id/mark-paid { externalPaymentId }`. When volumes justify it,
a regulated payout provider replaces this step and the webhook, not the admin,
marks rows PAID.

## Customer sponsorship

`POST /trees/:publicId/sponsorships` creates a `PENDING_PAYMENT` sponsorship
at the price in setting `sponsorship.price_paise` (illustrative default
₹2,499 for `sponsorship.term_years` = 5). Activation is server-side only:
`POST /sponsorships/:id/activate { externalPaymentId }` by an admin today, a
payment-gateway webhook later. The client can never mark itself paid.

Planned plan types: one-time, prepaid multi-year, organisation-sponsored, gift.

## Unit economics

Per tree: customer revenue − farmer payment − verification cost − platform
cost − acquisition cost = contribution. Verification cost per tree is the
number the pilot must discover (Experiment EXP-03); the analytics overview
reports audit counts and discrepancy rates to feed it.

## What is deliberately not stored

Card numbers, CVVs, bank credentials, UPI PINs. Only provider transaction IDs.
