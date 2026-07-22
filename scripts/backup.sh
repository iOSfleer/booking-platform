#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TS="$(date +%Y%m%d_%H%M%S)"
FILE="$BACKUP_DIR/booking_platform_$TS.sql"

mkdir -p "$BACKUP_DIR"

echo "[backup] creating $FILE"
docker compose exec -T postgres pg_dump -U booking_user -d booking_platform > "$FILE"
echo "[backup] done: $FILE"
