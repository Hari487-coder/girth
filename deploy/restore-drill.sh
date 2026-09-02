#!/usr/bin/env bash
# Restore drill: take a fresh dump, restore it into a scratch database, run the
# data-quality checks against it, then drop it. A backup that has never been
# restored is only a hopeful story. Record the result in docs/operations.md.
set -euo pipefail
cd "$(dirname "$0")"
COMPOSE="docker compose -f docker-compose.staging.yml --env-file .env"
SCRATCH="girth_restore_$(date -u +%Y%m%d%H%M%S)"
START=$(date +%s)

echo "dumping live database"
$COMPOSE exec -T postgres pg_dump -U girth --no-owner girth > /tmp/girth-drill.sql

echo "restoring into ${SCRATCH}"
$COMPOSE exec -T postgres psql -U girth -d postgres -c "CREATE DATABASE ${SCRATCH};"
$COMPOSE exec -T postgres psql -U girth -d "${SCRATCH}" -q < /tmp/girth-drill.sql

echo "running data QA against the restored copy"
set -a; source .env; set +a
$COMPOSE exec -T -e DATABASE_URL="postgresql://girth:${POSTGRES_PASSWORD}@postgres:5432/${SCRATCH}" api node dist/scripts/data-qa.js
RESULT=$?

$COMPOSE exec -T postgres psql -U girth -d postgres -c "DROP DATABASE ${SCRATCH};"
rm -f /tmp/girth-drill.sql
echo "restore drill finished in $(( $(date +%s) - START ))s with exit ${RESULT}"
exit $RESULT
