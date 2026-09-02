# Girth

**Don't pay for trees planted. Pay for trees that grow.**

Girth is a tree identity, measurement and verification platform. Every tree
gets a permanent ID and a QR tag; its trunk girth is measured every year with
photo, GPS and timestamp; a human verifies it; a share is physically audited;
farmers are paid for trees that stay alive and grow; sponsors and organisations
see the evidence. One tree is the unit of everything.

> A tree is planted once. Its story shouldn't end there.

## Repository

```
apps/web         React + Vite + Tailwind. Today: the MVP demo (GitHub Pages). Next: wired to the API.
apps/api         Fastify + Prisma + PostgreSQL. Identity, measurement, verification, audits, ledger.
packages/domain  Pure rules shared by both: status machine, checks, payment maths, audit sampling, schemas.
docs/            Architecture, database, API, protocol, verification, payments, security, deployment, operations, experiments, roadmap.
```

Live MVP demo: https://hari487-coder.github.io/girth/ (fictional data, no backend).

## Run it locally

```bash
npm install
npm run db:up        # embedded PostgreSQL on 127.0.0.1:5433 (leave running)
npm run db:migrate
npm run db:seed      # prints the seeded logins
npm run dev:api      # API on http://localhost:4000
npm run dev          # web on http://localhost:3200
```

Copy `apps/api/.env.example` to `apps/api/.env` first (a local `.env` is
already present for development). Docker users can run `docker compose up -d`
instead of `db:up`. The web dev server proxies `/api` to the API, so no CORS
setup is needed locally. Sign in with any account printed by the seed; the
sign-in page lists them outside production.

| Role | Sign in as | Lands on |
| --- | --- | --- |
| Admin | admin@girth.local | `/admin` |
| Field auditor | auditor@girth.local | `/review` |
| Farmer (Ravi) | +919000000001 | `/farm` |
| Customer | customer@girth.local | `/my-trees` |
| Organisation | org@girth.local | `/org` |

## Verify it

```bash
npm run typecheck
npm test             # domain unit tests + API acceptance chain on a real Postgres
```

The acceptance suite (`apps/api/test/acceptance.test.ts`) runs the critical
journey end to end: admin registers farmer, land, cluster and tree → QR →
farmer submits a measurement with a photo → queue → auditor verifies → growth
history and payment eligibility update → farmer sees payment → public tree
page shows the verified history with no private data. It also proves the
history cannot be edited even with database access.

## Read next

Start with [docs/architecture.md](docs/architecture.md), then
[docs/roadmap.md](docs/roadmap.md) for what is built, what is next and what is
deliberately not being built.

## Photo credits

The web app uses real photographs via Wikimedia Commons, credited in the UI:

- [India - Kids - Planting trees for her future](https://commons.wikimedia.org/wiki/File:India_-_Kids_-_Planting_trees_for_her_future_(4040009491).jpg) by McKay Savage, CC BY 2.0
- [Plant a Sapling for Better Future](https://commons.wikimedia.org/wiki/File:Plant_a_Sapling_for_Better_Future.jpg) by Robbieross123, CC BY-SA 4.0
- [Central Library IIT Hyderabad](https://commons.wikimedia.org/wiki/File:Central_Library_IIT_Hyderabad,_Knowledge_Resource_centre_IIT_Hyderabad.jpg) by Mukesh721, CC0
- Species photos: see `apps/web/src/lib/speciesPhotos.ts`
