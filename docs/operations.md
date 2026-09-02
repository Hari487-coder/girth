# Operations

Software alone does not make Girth work. This is the field checklist the
software assumes.

## Before planting

- [ ] Farmer interviewed, agreement drafted and signed (`FarmerAgreement`), land ownership status recorded
- [ ] Land plot registered with a location label and, where the farmer consents, coordinates
- [ ] Species chosen for the site (survival first, sponsorship appeal second)
- [ ] Cluster created under the programme; auditors assigned
- [ ] Payment model confirmed with the farmer in their language, labelled as the pilot's illustrative model

## At planting

- [ ] Tree created in the system → `GIRTH-nnnnnn` allocated
- [ ] QR tag printed (`GET /trees/:id/qr.svg`) and attached; tag code recorded on the tree
- [ ] Planting photograph taken through the app
- [ ] Initial measurement submitted (girth at planting, standard or 30 cm height) and verified by a second person
- [ ] Tree status: PLANTED → ACTIVE on first verification

## During monitoring (each season)

- [ ] Farmer scans, measures, photographs, submits (offline queue allowed)
- [ ] Reviewer clears the queue within the week; anomalies first
- [ ] Sampled audits performed on site within the month; results recorded
- [ ] Farmers with REMEASURE_REQUIRED readings contacted (notification event)

## If a tree dies

- [ ] Farmer reports (measurement notes or status request); auditor confirms on site
- [ ] Status → DEAD with reason; sponsors notified honestly ("did not survive; verified")
- [ ] Replacement policy: new tree registered with `replacementForTreeId`; original stays visible as REPLACED

## Payment run (monthly during pilot)

- [ ] Export `GET /payments/ledger?status=ELIGIBLE`
- [ ] Reconcile against audit findings (cancelled/adjusted rows)
- [ ] Pay by bank transfer/UPI; record each with `mark-paid` and the transfer reference
- [ ] Farmers see paid totals in the app

## Tag replacement

- [ ] Lost or damaged tag: attach a new code via `POST /trees/:id/tags`; the tree keeps its identity and the old tag is recorded as replaced

## Data protection

- [ ] Only the programme team sees farmer phone numbers and coordinates
- [ ] Photos on public pages are thumbnails re-encoded without metadata
- [ ] Access to admin accounts limited to named people; sessions revoked on departure

## Restore drills

| Date | Environment | Duration | Result | Notes |
| --- | --- | --- | --- | --- |
| (none yet) | | | | Run before the pilot starts |
