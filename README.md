# Girth — Grow a greener tomorrow

Live prototype: https://hari487-coder.github.io/girth/

This `gh-pages` branch publishes the buildless Three.js prototype directly through GitHub Pages. The earlier application source remains on `master`.

The entrance offers two paths: **Grow an Impact** for sponsors and **Earn & Grow** for caretakers. Sponsor funding, training, weekly care reports, operator review, simulated payments and community interests share browser-local demo state.

All people, sites, jobs, payments and certificates are fictional. This is a hackathon prototype, with no live payments, authentication or shared backend. The INR600/tree price is a target; the four-visit worker trial does not establish the cost of three years of care. Growth-stage visuals are illustrations, not measured carbon removal.

## Hosting

GitHub Pages serves the root of this branch over HTTPS. `.nojekyll` keeps the files unchanged. All assets and ES module imports are relative, and navigation uses hash routes. No build or API key is required. Third-party notices are in `credits.html` and `vendor/THREE-LICENSE.txt`.

To preview locally, serve this directory with any static HTTP server. Opening `index.html` directly will not load ES modules.

## Deployment

The 3D prototype was migrated to GitHub Pages on 23 November 2026. Updates are published by committing the reviewed static files to this branch. The commit history preserves the previous prototype for rollback.
