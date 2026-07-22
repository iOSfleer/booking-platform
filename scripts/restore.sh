#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file.sql>"
  exit 1
fi

FILE="$1"
if [ ! -f "$FILE" ]; then
  echo "Backup file not found: $FILE"
  exit 1
fi

echo "[restore] restoring from $FILE"
docker compose exec -T postgres psql -U booking_user -d booking_platform < "$FILE"
echo "[restore] done"
