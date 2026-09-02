# Experiments

Girth exists to test assumptions, not to ship features. Every experiment is a
row in the `Experiment` table (`/experiments` API, admin dashboard) with a
hypothesis, method, metric, target, result, learning and decision. Results
are entered by people; the platform supplies the measurements.

## EXP-01: Farmers maintain trees when payment depends on survival

- **Assumption:** survival-linked pay changes behaviour compared with per-sapling payment.
- **Experiment:** 5 to 10 farmers, 100 to 300 trees, one cluster, one season.
- **Metric:** 12-month verified survival rate (`programOverview.survivalPct`).
- **Target:** 85%.
- **Instrument:** `Tree.status` history, verified measurements, audit discrepancy rate.
- **Decision rule:** ≥ 85% persevere; 70 to 85% adjust the payment model and re-run; < 70% pivot the incentive design.

## EXP-02: People value verified growth

- **Assumption:** "this tree is alive and grew 6 cm" is worth paying for; "we planted a tree" is not.
- **Experiment:** show the MVP and the public tree page to 100 people; count QR scans, profile views, sponsorship intent, actual commitments.
- **Metric:** commitments per 100 viewers; repeat visits after a growth update.
- **Target:** 5 commitments per 100; 50% open the next update.
- **Instrument:** analytics (privacy-conscious), `Sponsorship` rows, notification opens (when email lands).
- **Warning:** compliments are not validation. Only commitments count.

## EXP-03: Verification can be done cheaply

- **Assumption:** clustered field audits keep verification cost well under sponsorship revenue per tree.
- **Experiment:** log auditor time and travel per visit for the pilot cluster.
- **Metric:** cost per verified tree; audit discrepancy rate.
- **Target:** under 20% of annual sponsorship revenue per tree; discrepancy rate under 5%.
- **Instrument:** `Audit` rows, `auditDiscrepancyPct`, a simple cost log (to be added to the audit result form).

## EXP-04 (designed, not run): A simple verification system creates enough trust

- **Experiment:** show sponsors the public page with and without the verification section; ask what they would pay.
- **Metric:** stated and revealed willingness to pay.

## Reading the numbers

The platform analytics overview (`GET /analytics/overview`) reports trees
registered/alive/dead, survival %, measurements by status, audits by result and
discrepancy %, farmers and sponsorships. Program overviews break the same
numbers down per programme. Never present unverified trees as verified in any
of these.
