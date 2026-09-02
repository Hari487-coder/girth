#!/usr/bin/env bash
# Runs ON the VPS after the stack is up: data QA, backup cron, first backup, restore drill.
set -euo pipefail
DIR=/opt/girth
COMPOSE="docker compose -f $DIR/deploy/docker-compose.staging.yml --env-file $DIR/deploy/.env"

echo "== data QA on staging"
$COMPOSE exec -T api node dist/scripts/data-qa.js

echo "== backup cron"
chmod +x "$DIR/deploy/backup.sh" "$DIR/deploy/restore-drill.sh"
CRON_LINE="15 2 * * * $DIR/deploy/backup.sh >> /var/log/girth-backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'girth/deploy/backup.sh'; echo "$CRON_LINE" ) | crontab -
crontab -l | grep girth

echo "== first backup"
"$DIR/deploy/backup.sh"

echo "== restore drill"
"$DIR/deploy/restore-drill.sh"

echo "== exposure check (host ports)"
ss -ltn | awk 'NR>1 {print $4}' | grep -vE '127\.0\.0\.|\[::1\]' | sort -u
