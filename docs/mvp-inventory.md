# MVP inventory: what existed before the production build

Written at the start of the production build (2 Sep 2026) after inspecting the
repository. This is the baseline the production system grows out of.

## What the MVP is

A single-page React application (`apps/web`, previously the repository root)
that demonstrates the Girth thesis with fictional data held in `localStorage`.
It is deployed to GitHub Pages at https://hari487-coder.github.io/girth/ and is
the thing people scan today. It has no backend, no accounts and no persistence
beyond the visitor's browser.

| Screen | Purpose | Status |
| --- | --- | --- |
| Landing | Thesis, real-photo story, trust model, business model | Demo-quality, keep |
| Find a Tree | Marketplace with filters and species photos | Demo data |
| Tree profile | Girth hero number, growth chart, verification evidence | Demo data |
| Sponsor flow | Occasion, plan, name, message | No payment |
| My Trees | Sponsored trees with the "see next year's growth" simulation | Simulation |
| Farmer Portal | Farm summary, illustrative earnings, record measurement | Local-only |
| Verification | Queue with verify / flag / remeasure | Local-only |
| Experiments | Mock Lean Startup funnels | Mock |

## What is reusable as-is

- **Design system**: tokens in `apps/web/src/index.css` (paper/ink/canopy
  palette, Bricolage Grotesque + Instrument Sans + Spline Sans Mono).
- **Components**: `TapeRuler` (the signature measuring tape), `GrowthChart`
  (hand-rolled SVG timeline with hover), `StatusBadge`, `CountUp`,
  `TrunkRings`, `PhotoStory`, `TreeCard`, `DemoPhoto`.
- **Domain rules, now extracted**: the MVP's growth-increment logic, farmer
  earnings maths and status semantics were the seed of `packages/domain`.
- **Copy and story**: headline, verification pipeline wording, the
  8 → 11 → 14 cm example, the honesty labels.
- **Assets**: licensed species and story photographs with credits.

## What is replaced

- `apps/web/src/lib/store.tsx` (localStorage reducer) becomes an API client.
  The reducer's actions map one-to-one onto API calls: `SPONSOR` →
  `POST /trees/:id/sponsorships`, `SUBMIT_MEASUREMENT` →
  `POST /trees/:id/measurements`, `REVIEW_MEASUREMENT` →
  `POST /measurements/:id/{verify,flag,remeasure}`, `SIMULATE_GROWTH` is
  demo-only and has no production equivalent.
- `apps/web/src/lib/seed.ts` demo data becomes the API seed (`apps/api/prisma/seed.ts`).
- Tree IDs move from `GIRTH-001` (3 digits, demo) to `GIRTH-000001` (6 digits,
  database sequence, never recycled).

## What was missing entirely

Identity and roles, a database, evidence storage, an audit log, a payment
ledger, audits with discrepancy records, tree replacement, organisations and
programs, reporting, notifications, tests, CI, environments. All of these are
what the production build adds, starting with the API in `apps/api`.
