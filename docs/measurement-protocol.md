# Measurement protocol

Girth is trunk circumference, in centimetres, measured with a flexible tape at
a standard height above ground. The number only counts once a human has
verified it against evidence.

## Standard

- **Height:** 130 cm above the ground on the uphill side of the tree (the
  forestry "breast height" convention). For saplings shorter than 130 cm,
  measure at 30 cm and record that height; the system warns when a reading is
  more than 20 cm from standard.
- **Tape:** flat against the bark, perpendicular to the stem, not over a knot
  or branch collar. Read to the nearest 0.5 cm.
- **Once per season:** one reading per tree per measurement round. A second
  reading on the same date is rejected as a duplicate.

## Field workflow (mobile, offline-tolerant)

1. Scan the tree's QR tag → the app opens that tree and shows the last verified girth.
2. Confirm the tag code matches the tree.
3. Wrap the tape at standard height.
4. Enter the girth.
5. Photograph the tape on the trunk with the reading visible.
6. The app captures GPS and the timestamp automatically.
7. Submit. Without connectivity the reading is queued with a
   `clientSubmissionId`; the API treats a resend of the same ID as the same
   submission, so retries never double-count.

## What the API records

`POST /trees/:publicId/measurements` (multipart or JSON):

| Field | Required | Notes |
| --- | --- | --- |
| `measurementDate` | yes | ISO date; not in the future, not before planting |
| `measurementHeightCm` | yes | integer cm |
| `girthCm` | yes | 0.1 to 999 |
| `latitude`, `longitude` | strongly recommended | compared against the tree's registered location |
| `photo` | strongly recommended | JPEG/PNG/WebP up to 10 MB; stored as-is with a SHA-256 |
| `clientSubmissionId` | for offline clients | idempotency key per tree |
| `deviceMetadata`, `notes` | optional | |

## Automated checks (anomaly detection, not truth)

Run at submission (`packages/domain/src/measurementChecks.ts`). `FAIL` rejects
the submission as an input error; `WARN` accepts it and marks it as an anomaly
so a reviewer looks first.

| Check | FAIL when | WARN when |
| --- | --- | --- |
| tree_status | tree is not measurable (DEAD, RETIRED, REPLACED, PLANNED) | |
| date_valid | future date, or before planting | dated before the last verified reading |
| height | height missing | more than 20 cm from 130 cm |
| girth_plausible | outside 0.5 to 600 cm | |
| location_near_tree | | more than 150 m from the tree, or no location |
| photo_present | | no photo attached |
| duplicate | another reading exists for that date | |
| growth_plausible | | shrank more than 1 cm, or grew more than 15 cm per year since the last verified reading |

Thresholds are constants today; they become per-species settings once the
pilot produces real growth data.

## Corrections

Verified readings are never edited. A wrong reading is corrected by a new
measurement that references the old one (`correctsId`); the old one becomes
`SUPERSEDED` and stays in the history.
