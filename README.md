# Girth

**Don't pay for trees planted. Pay for trees that grow.**

Girth is an MVP prototype for a startup that changes the unit of value in tree
planting: instead of selling saplings, it sells *verified growth*. A customer
sponsors a real tree with a unique ID, a farmer and a location. Every year the
tree's survival and trunk girth are measured, verified and added to a permanent
timeline. The farmer's income is tied to the tree staying alive and growing.

**Live demo:** https://hari487-coder.github.io/girth/

> All trees, farmers, measurements, photos, prices and experiment results in
> this app are **fictional demo data**. This is a Lean Startup prototype built
> to test hypotheses, not a live service.

## The hypotheses this MVP tests

1. People understand and value "pay for growth" more than "plant a tree".
2. People will pay for a tree they can follow over time.
3. Farmers maintain trees when income depends on survival and growth.
4. A simple verification system creates enough trust for customers.

## What's in the prototype

- **Landing** with the core contrast: a planted tree is a claim, a growing tree is proof
- **Marketplace** of sponsorable trees with occasion, species, location, price and status filters
- **Tree profile**: current girth on a measuring tape, verified growth chart, and the full measurement record (photo, GPS, timestamp, verification pipeline)
- **Sponsor flow**: occasion, plan, personalisation, confirmation (no real payment)
- **My Trees** dashboard with a simulated annual growth update (the emotional payoff: 14 → 18 cm)
- **Farmer Portal**: derived farm stats, the prototype incentive model (alive pay + growth bonus, dead tree earns nothing), and a measurement submission form
- **Verification queue**: verify / flag / request remeasurement, with automated sanity checks; verified readings land on the customer timeline
- **Experiment Dashboard**: mock Build → Measure → Learn funnels for each hypothesis

The whole loop works end to end: the farmer submits a measurement, the Girth
team verifies it, and the customer's tree page updates.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · Motion.
State lives in a reducer persisted to localStorage; there is no backend.

## Run it locally

```bash
npm install
npm run dev
```

Deploys to GitHub Pages from the `gh-pages` branch:

```bash
npx vite build --base=/girth/
# copy dist/index.html to dist/404.html for SPA deep links, then
npx gh-pages -d dist
```
