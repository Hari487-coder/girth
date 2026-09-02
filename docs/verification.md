# Verification

A number becomes a fact in four steps: submitted → automated checks →
human review → verified. A share of verified readings is then physically
audited. Nothing here claims to prove truth; it makes fabrication expensive and
detectable, and it records every decision.

## States

```
SUBMITTED ──(checks)──▶ PENDING_REVIEW ──▶ VERIFIED
                             │            ▲   │
                             ├──▶ FLAGGED ┘   └──▶ SUPERSEDED (by a correction)
                             └──▶ REMEASURE_REQUIRED
```

Reviewers (FIELD_AUDITOR, ADMIN) cannot verify their own submissions. A
verified reading can only be superseded, never un-verified; the database
enforces this.

## Verify

On `POST /measurements/:id/verify`, in one transaction:

1. Status → VERIFIED with reviewer, time and notes.
2. Photos on the reading become public evidence.
3. If this is the newest verified reading, `Tree.currentGirthCm/Date` update.
4. A tree that was PLANTED, NEEDS_ATTENTION or FLAGGED becomes ACTIVE.
5. Growth is computed against the previous verified reading.
6. Ledger lines are written under the active payment config (see `payments.md`).
7. Audit sampling runs; a selected reading gets an `Audit` row with the reported girth frozen on it.
8. Audit-log lines and notification events are written.

## Flag and remeasure

`flag` marks the reading FLAGGED and the tree FLAGGED; `remeasure` marks the
reading REMEASURE_REQUIRED and the tree NEEDS_ATTENTION, and notifies the
farmer. Both leave the reading in the queue for a later decision. A subsequent
verified reading returns the tree to ACTIVE.

## Random audits

- Sampling rate: setting `audit.sampling_rate`, default 0.10 (10%). Admins
  change it with a reason; the change is audit-logged.
- Selection: keyed hash of the measurement ID and `AUDIT_SAMPLING_SALT`.
  Reproducible for disputes, unpredictable without the salt.
- Admins can also schedule a manual audit with a reason.

## Recording an audit

`POST /audits/:id/result` records what the auditor observed: girth, tree
status, location, photo, notes.

| Difference (observed − reported) | Result |
| --- | --- |
| within ±1 cm | PASS |
| within ±3 cm | MINOR_DISCREPANCY |
| beyond ±3 cm, or tree observed dead | MAJOR_DISCREPANCY |
| `fraudSuspected` | FRAUD_SUSPECTED |

On MAJOR or FRAUD: the tree becomes FLAGGED (or DEAD if observed dead), unpaid
ledger eligibility for that reading is cancelled, paid amounts get a negative
adjustment entry, and sponsors are notified. **The original reading is not
edited.** Reported 14 cm, audited 9 cm, difference −5 cm is what the record
says, forever.

## What reviewers see

The queue orders anomalies first and shows every check with its detail, the
distance from the registered tree location, the previous verified girth, the
photo and the submitter. The reviewer's job is judgement; the system's job is
to make the anomaly obvious and the decision permanent.
