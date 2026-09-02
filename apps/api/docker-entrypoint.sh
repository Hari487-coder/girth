#!/bin/sh
# Migrations run before the API serves; a failing migration stops the deploy.
set -e
cd /app/apps/api
echo "girth-api: applying migrations"
npx prisma migrate deploy
if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "girth-api: seeding (idempotent)"
  node dist/prisma/seed.js
fi
exec "$@"
