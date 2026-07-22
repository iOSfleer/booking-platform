# Operations Runbook

## Healthchecks

- Backend health endpoint: `GET /health`
- Via reverse proxy: `GET http://localhost:8080/health`

Quick check:

```bash
curl -f http://localhost:8080/health
```

## Backups

Create backup:

```bash
./scripts/backup.sh
```

Optional target dir:

```bash
BACKUP_DIR=./backups ./scripts/backup.sh
```

## Restore

```bash
./scripts/restore.sh ./backups/booking_platform_YYYYMMDD_HHMMSS.sql
```

## Production Compose

1. Copy env template on server:

```bash
cp .env.production.example .env.production
```

2. Fill secrets and runtime values in `.env.production`.

3. Start production stack:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

4. After deployment update, verify:

```bash
curl -f http://localhost/health
```

## Notes

- Keep backups outside the server (object storage/offsite copy).
- Test restore regularly on a staging environment.
- For production use, rotate backup files and secure DB credentials via secrets.
