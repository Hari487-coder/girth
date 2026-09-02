#!/usr/bin/env bash
# Nightly database backup: pg_dump → gzip → the evidence bucket under backups/.
# Cron on the server: 15 2 * * * /opt/girth/deploy/backup.sh >> /var/log/girth-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"
COMPOSE="docker compose -f docker-compose.staging.yml --env-file .env"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="girth-${STAMP}.sql.gz"
set -a; source .env; set +a

$COMPOSE exec -T postgres pg_dump -U girth --no-owner girth | gzip > "/tmp/${FILE}"
$COMPOSE run --rm -v "/tmp/${FILE}:/tmp/${FILE}:ro" --entrypoint /bin/sh minio-init -c \
  "mc alias set local http://minio:9000 ${S3_ACCESS_KEY_ID} ${S3_SECRET_ACCESS_KEY} >/dev/null && mc cp /tmp/${FILE} local/${S3_BUCKET}/backups/${FILE}"
rm -f "/tmp/${FILE}"
echo "backup ${FILE} stored in ${S3_BUCKET}/backups/"

# keep the last 30 in the bucket (listing parsed on the host; the mc image has no awk)
MC="$COMPOSE run --rm --entrypoint /bin/sh minio-init -c"
$MC "mc alias set local http://minio:9000 ${S3_ACCESS_KEY_ID} ${S3_SECRET_ACCESS_KEY} >/dev/null && mc ls local/${S3_BUCKET}/backups/" 2>/dev/null \
  | awk '{print $NF}' | grep -E '^girth-.*\.sql\.gz$' | sort | head -n -30 \
  | while read -r old; do
      [ -n "$old" ] && $MC "mc alias set local http://minio:9000 ${S3_ACCESS_KEY_ID} ${S3_SECRET_ACCESS_KEY} >/dev/null && mc rm local/${S3_BUCKET}/backups/${old}" && echo "pruned ${old}"
    done || true
