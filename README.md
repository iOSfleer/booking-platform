# Booking Platform MVP (Umsetzung von `plan.md`)

Diese Umsetzung enthält ein lauffähiges MVP-Grundgerüst gemäß Plan:

- **Backend**: ASP.NET Core Web API + EF Core + PostgreSQL
- **Frontend**: Next.js (minimaler Buchungs-Flow)
- **Infra**: Docker Compose + Nginx Reverse Proxy
- **MVP-Logik**:
  - Slot-basiert (30 Minuten)
  - Buchung nur innerhalb Öffnungszeiten
  - Mindestvorlauf 24h
  - Konfliktprüfung gegen bestehende Termine
  - Mandantenbezug über `CompanyId`

## Projektstruktur

- `src/backend/BookingPlatform.Api` – API, Datenmodell, Buchungslogik, Auth
- `src/frontend` – öffentliche MVP-UI
- `infra/nginx/default.conf` – Reverse Proxy
- `docker-compose.yml` – lokales Gesamtsystem
- `docker-compose.prod.yml` – produktionsnaher Betrieb mit GHCR-Images
- `.env.production.example` – Vorlage für Produktionsvariablen
- `.github/workflows/ci.yml` – Build-Pipeline (Backend/Frontend/Docker)
- `.github/workflows/cd.yml` – GHCR Image-Publishing + optionales Prod-Deploy
- `.github/workflows/develop.yml` – Develop-Checks + optionales Staging-Deploy
- `docs/operations.md` – Healthcheck/Backup/Restore Runbook

## Seed-Daten

Beim ersten Start werden Demo-Daten erzeugt:

- CompanyId: `11111111-1111-1111-1111-111111111111`
- Subdomain: `salon-beispiel`
- Admin Login:
  - E-Mail: `admin@salon-beispiel.local`
  - Passwort: `Admin123!`
- Mitarbeiter Login:
  - E-Mail: `mitarbeiter@salon-beispiel.local`
  - Passwort: `Mitarbeiter123!`

## Lokaler Start

```bash
docker compose up --build
```

Danach:

- App über Nginx: `http://localhost:8081`
- API via Proxy: `http://localhost:8081/api/...`
- Healthcheck: `http://localhost:8081/health`

## Wichtige API-Endpunkte

Öffentlich:

- `GET /api/public/companies/{companyId}/services`
- `GET /api/public/companies/{companyId}/availability?serviceId=...&date=...`
- `POST /api/public/companies/{companyId}/bookings`
- Tenant-basiert (Subdomain oder Header `X-Tenant-Subdomain`):
  - `GET /api/public/services`
  - `GET /api/public/availability?serviceId=...&date=...`
  - `POST /api/public/bookings`

Intern:

- `POST /api/auth/login`
- `GET /api/admin/employees` (JWT)
- `GET /api/admin/appointments?employeeId=...&search=...&sortBy=startTime|customer|service|status&sortDir=asc|desc&page=1&pageSize=20` (JWT)
- `GET /api/admin/appointments/export-csv?...` (JWT)
- `PATCH /api/admin/appointments/{id}/cancel` (JWT)
- `PATCH /api/admin/appointments/{id}/reschedule` (JWT)
- `PATCH /api/admin/appointments/{id}/assign-employee` (JWT)
- `GET /api/admin/notifications` (Admin)
- `GET /api/admin/audit-logs` (Admin)
- `GET|POST|PUT|DELETE /api/admin/services` (Admin)
- `GET|POST|PUT|DELETE /api/admin/business-hours` (Admin)
- `GET|POST|PUT|DELETE /api/admin/exceptions` (Admin)

## Admin-Frontend

- `http://localhost:8081/admin`
- Tabs für Bereiche (Termine, Leistungen, Öffnungszeiten, Ausnahmen, Benachrichtigungen, Audit Logs)
- Tabellen-/Card-Layout für bessere Übersicht
- CRUD für Leistungen, Öffnungszeiten und Ausnahmen/Abwesenheiten
- Mitarbeiter-Filter für Termine und Ausnahmen
- Termin-Storno + Termin-Umbuchung + Mitarbeiter-Zuweisung
- Suche + Datumsfilter (von/bis) + Sortierung + Pagination in der Terminliste
- CSV-Export für gefilterte/sortierte Termine
- Verbesserte clientseitige Formularvalidierung + klare Fehlermeldungen

## CI/CD

- **CI**: baut Backend/Frontend + Docker-Images bei Push/PR
- **CD** (`main`/`master`): baut/published Images nach GHCR + optionales Prod-Deploy
  - erforderliche Deploy-Secrets:
    - `SERVER_HOST`
    - `SERVER_USER`
    - `SERVER_SSH_KEY`
    - `SERVER_TARGET_PATH`
    - `GHCR_USERNAME`
    - `GHCR_TOKEN`
- **Develop** (`develop`): Build-Checks, develop-Images (`develop-latest`) + optionales Staging-Deploy
  - optionale Staging-Secrets:
    - `STAGING_SERVER_HOST`
    - `STAGING_SERVER_USER`
    - `STAGING_SERVER_SSH_KEY`
    - `STAGING_SERVER_TARGET_PATH`
    - `STAGING_GHCR_USERNAME`
    - `STAGING_GHCR_TOKEN`

## Betrieb

- Runbook: `docs/operations.md`
- Backup-Skript: `scripts/backup.sh`
- Restore-Skript: `scripts/restore.sh`

## E-Mail-Konfiguration

In `src/backend/BookingPlatform.Api/appsettings.json` können SMTP-Daten gesetzt werden:

- `Email:SmtpHost`
- `Email:SmtpPort`
- `Email:Username`
- `Email:Password`
- `Email:FromAddress`
- `Email:EnableSsl`

Bei erfolgreicher Buchung werden E-Mails an Kunde und Unternehmen versendet und in `notifications` protokolliert.

## Hinweis

Dies ist bewusst ein MVP-Fundament entsprechend Priorisierung im Plan (Funktion vor Design).