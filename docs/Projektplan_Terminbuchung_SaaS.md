# Projektplan – SaaS für Unternehmens-Websites mit Online-Terminbuchung

## 1. Vision

Entwicklung einer mandantenfähigen Plattform (Multi-Tenant), die kleinen und mittleren Unternehmen eine moderne Website mit integrierter Online-Terminbuchung bietet.

Zielgruppen:

- KFZ-Prüfstellen
- Werkstätten
- Friseure
- Physiotherapeuten
- Ärzte
- Fahrschulen
- Handwerker
- Beratungsunternehmen

---

## 2. Ziele des Produkts

### Primäres Ziel
Kunden sollen online einfach und schnell Termine buchen können.

### Sekundäre Ziele
- Unternehmen sollen Termine administrieren können
- Jede Firma soll eigenes Branding und eigene Inhalte erhalten
- Die Plattform soll später sauber auf mehrere Mandanten skalieren

### Leitprinzip
Zuerst Funktionalität.
Keine Zeit mit perfektem Design verschwenden.

Priorität:
1. Terminbuchung
2. Adminbereich
3. Multi-Tenant
4. Automatisierung
5. KI-Funktionen

---

## 3. MVP – Funktionsumfang Phase 1

### 3.1 Öffentliche Website
Seiten:
- Startseite
- Leistungen
- Über uns
- Kontakt
- Impressum
- Datenschutz

### 3.2 Online-Terminbuchung
Funktionen:
- Freie Termine anzeigen
- Datum auswählen
- Uhrzeit auswählen
- Leistung auswählen
- Kundendaten erfassen
- Termin bestätigen

### 3.3 Benachrichtigungen
Nach erfolgreicher Buchung:
- E-Mail an Kunden
- E-Mail an Unternehmen

Später:
- SMS
- WhatsApp
- Kalenderdatei (.ics)

### 3.4 MVP-Abgrenzung
Im MVP bewusst noch nicht enthalten:
- Kunden-Login
- SMS/WhatsApp
- KI-Funktionen
- Analyse-Agent
- komplexe Reporting-Dashboards
- API-Zugriff für Dritte

---

## 4. Fachliche Anforderungen / offene Fragen

Diese Punkte sollten vor der Umsetzung verbindlich entschieden werden:

### 4.1 Terminlogik
- Werden Termine über feste Zeitslots oder über freie Dauer gebucht?
- Hat jede Leistung eine feste Dauer?
- Gibt es Pufferzeiten vor oder nach Terminen?
- Können mehrere Leistungen in einem Termin gebucht werden?
- Gibt es maximale Buchungen pro Zeitslot?

### 4.2 Buchungsregeln
- Wie weit im Voraus darf gebucht werden?
- Wie kurzfristig darf noch gebucht werden?
- Gibt es Storno- und Umbuchungsfristen?
- Wann gilt ein Termin als bestätigt?
- Sind Doppelbuchungen technisch ausgeschlossen?

### 4.3 Ressourcen
- Wird nur ein Mitarbeiter geplant oder auch Räume / Geräte?
- Kann ein Termin mehreren Ressourcen zugeordnet werden?
- Muss die Verfügbarkeit pro Mitarbeiter separat berechnet werden?

### 4.4 Mandantenmodell
- Identifikation des Mandanten über Subdomain, eigene Domain oder beides?
- Kann ein Benutzer mehreren Unternehmen zugeordnet sein?
- Werden alle Mandantendaten in einer gemeinsamen Datenbank gespeichert oder später getrennt?

### 4.5 Rollen und Rechte
- Welche Rollen brauchen wir im MVP wirklich?
- Soll ein Kunde sich anmelden können oder nur ohne Account buchen?
- Was darf ein Mitarbeiter ändern?
- Was darf ein Administrator ändern?

### 4.6 Öffnungszeiten und Ausnahmen
- Öffnungszeiten pro Wochentag?
- Mehrere Zeitblöcke pro Tag möglich?
- Feiertage automatisch oder manuell gepflegt?
- Urlaub, Krankheit und Sonderöffnungszeiten pro Unternehmen oder pro Mitarbeiter?

### 4.7 Benachrichtigungen
- Welcher E-Mail-Dienst wird verwendet?
- Welche Vorlagen werden benötigt?
  - Buchung
  - Bestätigung
  - Umbuchung
  - Storno
  - Erinnerung
- Wer bekommt welche Benachrichtigungen?

### 4.8 Rechtliches / DSGVO
- Welche Daten dürfen gespeichert werden?
- Welche Löschfristen gelten?
- Wie wird die Einwilligung zur Datenverarbeitung dokumentiert?
- Benötigen wir ein Löschkonzept und Audit-Log?

---

## 5. Phase 2 – Administrationsbereich

### 5.1 Benutzerverwaltung
Rollen:
- Administrator
- Mitarbeiter
- Kunde (optional)

### 5.2 Terminverwaltung
- Termine ansehen
- Termine verschieben
- Termine stornieren
- Historie / Protokoll

### 5.3 Öffnungszeiten
- Standardöffnungszeiten
- Feiertage
- Urlaubstage
- Sonderöffnungszeiten

### 5.4 Serviceverwaltung
- Leistungen anlegen
- Dauer pflegen
- Preis pflegen
- Aktiv / Inaktiv schalten

---

## 6. Phase 3 – Multi-Tenant-Architektur

Jedes Unternehmen erhält:
- eigenes Branding
- eigene Domain oder Subdomain
- eigene Öffnungszeiten
- eigene Mitarbeiter
- eigene Kunden
- eigene Termine
- eigene Leistungen

Eine gemeinsame Plattform verwaltet alle Mandanten.

Wichtige Entscheidung:
- Mandantentrennung in einer gemeinsamen Datenbank
- oder spätere Trennung in separate Datenbanken

---

## 7. Technologiestack

### Betriebssystem
- Ubuntu LTS

### Containerisierung
- Docker
- Docker Compose

### Reverse Proxy
- Nginx

### Backend
- ASP.NET Core

Empfohlene Architektur:
- API Layer
- Business Layer
- Persistence Layer

### Frontend
- Next.js

### Datenbank
- PostgreSQL

### Caching, später
- Redis

### Messaging, später
- RabbitMQ

---

## 8. Zielarchitektur

Internet
→ Nginx
→ Frontend (Next.js)
→ Backend (ASP.NET Core)
→ PostgreSQL

Alles zunächst auf einem Server.
Später horizontale Skalierung möglich.

---

## 9. Datenmodell – erste Version

### Unternehmen
- ID
- Name
- Domain
- Subdomain
- Logo
- Kontaktinformationen
- Branding-Farben
- Aktiv

### Benutzer
- ID
- UnternehmenID
- Name
- E-Mail
- Telefon
- Passwort / Auth-Daten
- Rolle

### Mitarbeiter
- ID
- UnternehmenID
- Name
- Rolle
- Aktiv

### Leistung / Service
- ID
- UnternehmenID
- Name
- Beschreibung
- Dauer
- Preis
- Aktiv

### Termin / Buchung
- ID
- UnternehmenID
- MitarbeiterID
- LeistungID
- KundeID
- Startzeit
- Endzeit
- Status
- Notizen
- Quelle

### Kunde
- ID
- UnternehmenID
- Name
- E-Mail
- Telefon

### Öffnungszeiten
- ID
- UnternehmenID
- Wochentag
- Von
- Bis
- Aktiv

### Ausnahme / Abwesenheit
- ID
- UnternehmenID
- MitarbeiterID optional
- Datum
- Von
- Bis
- Typ
- Beschreibung

### Benachrichtigung
- ID
- UnternehmenID
- TerminID
- Typ
- Status
- GesendetAm
- Fehler

### Historie / Audit Log
- ID
- UnternehmenID
- Entität
- EntitätID
- Aktion
- BenutzerID
- Zeitstempel
- Details

---

## 10. Terminstatus

Empfohlenes Statusmodell:
- Angefragt
- Bestätigt
- Verschoben
- Storniert
- Erledigt
- No-Show

---

## 11. Nicht-funktionale Anforderungen

### Sicherheit
- Passwortsichere Authentifizierung
- Rollen- und Rechteprüfung
- Schutz vor Fremdzugriff auf Mandantendaten
- Validierung aller Eingaben

### Performance
- Schnelle Termin-Suche
- Gute Antwortzeiten auch bei mehreren Mandanten

### Verfügbarkeit
- Regelmäßige Backups
- Wiederherstellbarkeit prüfen

### Logging / Monitoring
- Fehler-Logging
- Anwendungslogs
- später Monitoring und Alerting

### DSGVO
- Datensparsamkeit
- Löschkonzept
- Protokollierung sensibler Änderungen

---

## 12. Deployment

### Entwicklung
- Lokale Docker-Umgebung

### Source Control
- GitHub

### Automatisierung
- GitHub Actions

Pipeline:
1. Build
2. Tests
3. Docker Image erstellen
4. Deployment auf Server

---

## 13. Hosting

### Start
Hetzner Cloud VPS

Empfehlung:
- Ubuntu
- 4–8 GB RAM
- SSD Storage

### Später
- Mehrere Server
- Load Balancer
- Separate Datenbankserver

---

## 14. Erweiterungen / spätere Ausbaustufen

### Erinnerungen
- E-Mail Reminder
- SMS Reminder
- WhatsApp Reminder

### KI-Funktionen
- Terminassistent
- FAQ-Chatbot
- Automatische Terminvorschläge

### Analyse-Agent
Website-Scanner:
- CMS-Erkennung
- Hosting-Erkennung
- SEO-Bewertung
- Mobile Bewertung
- Performance-Bewertung

Ziel:
Automatische Leadgenerierung für potenzielle Neukunden.

---

## 15. Geschäftsmodell

### Basic
- Website + Terminbuchung

### Professional
- Erinnerungen
- Mitarbeiterverwaltung

### Business
- KI-Funktionen
- Analyse-Dashboard
- API-Zugriff

---

## 16. Nächste Schritte vor der Umsetzung

1. MVP fachlich final festlegen
2. Terminlogik definieren
3. Mandantenmodell festlegen
4. Rollen und Rechte definieren
5. Datenmodell verfeinern
6. API- und Modulstruktur grob skizzieren
7. Technische Grundentscheidung für Auth, E-Mail und Hosting treffen

---

## 17. Wichtigste offene Entscheidungen

- Welche Zielbranche bauen wir zuerst?
- Buchung ohne Login oder mit Login?
- Feste Zeitslots oder flexible Dauer?
- Subdomain oder eigene Domain für Mandanten?
- E-Mail-Versand über welchen Provider?
- Ein Datenbankmodell für alle Mandanten oder später getrennte Datenbanken?
