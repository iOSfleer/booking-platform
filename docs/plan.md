# Plan – Terminbuchung SaaS

## Status
Die Planungsphase ist abgeschlossen. Dieser Plan ist die verbindliche Grundlage für die anschließende Umsetzung.

---

## 1. Vision

Entwicklung einer mandantenfähigen SaaS-Plattform für Unternehmens-Websites mit integrierter Online-Terminbuchung.

Die Plattform richtet sich zunächst an kleine und mittlere Unternehmen, die Termine online anbieten und verwalten möchten.

### Erste Zielbranche
- Friseure

### Später mögliche Zielgruppen
- Werkstätten
- KFZ-Prüfstellen
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

### Priorität
1. Terminbuchung
2. Adminbereich
3. Multi-Tenant
4. Automatisierung
5. KI-Funktionen

---

## 3. MVP-Funktionsumfang

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
- Buchung erfolgreich abschließen

### 3.3 Benachrichtigungen
Nach erfolgreicher Buchung:
- E-Mail an Kunde
- E-Mail an Unternehmen

Später:
- SMS
- WhatsApp
- Kalenderdatei (.ics)

### 3.4 Einfache Administration
- Termine ansehen
- Termine verschieben
- Termine stornieren
- Leistungen pflegen
- Öffnungszeiten pflegen

---

## 4. Bewusst nicht im MVP enthalten

- Kunden-Login
- SMS-Benachrichtigungen
- WhatsApp-Benachrichtigungen
- KI-Funktionen
- Analyse-Agent
- API für Dritte
- komplexe Reports / Dashboards
- Mehrsprachigkeit
- mehrere Standorte pro Unternehmen

---

## 5. Fachliche Regeln für das MVP

- Jeder Termin besteht aus genau einer Leistung
- Jede Leistung hat eine feste Dauer
- Termine werden in festen 30-Minuten-Slots geplant
- Doppelbuchungen sind ausgeschlossen
- Buchung ist nur innerhalb der Öffnungszeiten möglich
- Buchung ist nur innerhalb eines definierten Vorlaufzeitraums möglich
- Storno und Umbuchung sind nur bis 24 Stunden vor Terminbeginn möglich
- Ein Termin wird optional einem Mitarbeiter zugeordnet, falls mehrere Mitarbeiter vorhanden sind
- Öffnungszeiten gelten pro Wochentag
- Mehrere Zeitblöcke pro Tag sind möglich
- Ausnahmen werden manuell gepflegt
- Kunden buchen ohne Login
- Ein Kundenkonto ist im MVP nicht vorgesehen

---

## 6. Rollen im MVP

### Administrator
- verwaltet Öffnungszeiten
- verwaltet Leistungen
- sieht alle Termine
- kann Termine ändern

### Mitarbeiter
- sieht eigene Termine
- kann Termine bearbeiten, sofern berechtigt

### Kunde
- bucht ohne Login
- erhält Bestätigung per E-Mail

---

## 7. Benutzer- und Rechtekonzept

- Administrator und Mitarbeiter erhalten einen internen Login
- Kunden buchen ohne Login
- Rollen- und Rechteprüfung ist Pflicht
- Mandantendaten dürfen nicht zwischen Unternehmen vermischt werden

---

## 8. Buchungslogik

### Grundmodell
- Slot-basiertes Modell mit festen Startzeiten
- Standard-Slotgröße: 30 Minuten
- Jede Leistung besitzt eine feste Dauer
- Die Verfügbarkeit wird anhand von Öffnungszeiten, Ausnahmen und bestehenden Terminen berechnet

### Buchungsregeln
Ein Termin ist buchbar, wenn:
- der Slot innerhalb der Öffnungszeiten liegt
- die Leistung in den Slot passt
- kein anderer Termin den Zeitraum blockiert
- keine Ausnahme oder Abwesenheit vorliegt
- der Vorlaufzeitraum eingehalten wird

### Vorlaufzeit
- Buchungen sind nur bis mindestens 24 Stunden im Voraus möglich

### Storno / Umbuchung
- Storno und Umbuchung sind bis 24 Stunden vor Terminbeginn möglich

### Terminbestätigung
- Ein Termin ist nach erfolgreicher Buchung sofort bestätigt
- E-Mail wird direkt versendet

---

## 9. Mandantenmodell

### Grundentscheidung
- Subdomain pro Mandant im Startmodell
- Gemeinsame Datenbank für alle Mandanten
- Saubere logische Trennung über UnternehmenID

### Mandantenfähige Inhalte
Jedes Unternehmen erhält:
- eigenes Branding
- eigene Öffnungszeiten
- eigene Mitarbeiter
- eigene Kunden
- eigene Termine
- eigene Leistungen
- eigene Domain oder Subdomain später optional

### Wichtige technische Entscheidung
- Erstes Modell: eine gemeinsame Datenbank
- Spätere Option: separate Datenbanken je Mandant

---

## 10. Benachrichtigungen

### MVP
- E-Mail an Kunde
- E-Mail an Unternehmen

### Technische Festlegung
- Externer Transaktionsmail-Dienst

### Spätere Erweiterungen
- Reminder per E-Mail
- SMS
- WhatsApp

---

## 11. Öffnungszeiten und Ausnahmen

### Öffnungszeiten
- pro Wochentag gepflegt
- mehrere Zeitblöcke pro Tag möglich

### Ausnahmen
- Feiertage
- Urlaubstage
- Sonderöffnungszeiten
- Abwesenheiten

### Pflege
- manuell im Adminbereich
- später mögliche Automatisierung

---

## 12. Terminstatus

### Vollständiges Statusmodell
- Angefragt
- Bestätigt
- Verschoben
- Storniert
- Erledigt
- No-Show

### MVP-relevante Kernstatus
- Bestätigt
- Verschoben
- Storniert

---

## 13. Minimaler MVP-Workflow

### Kunde
1. Website öffnen
2. Leistung auswählen
3. freien Termin auswählen
4. Kontaktdaten eingeben
5. Buchung bestätigen
6. Bestätigungs-E-Mail erhalten

### Unternehmen
1. Im Adminbereich anmelden
2. Öffnungszeiten pflegen
3. Leistungen pflegen
4. Termine ansehen
5. Termine verschieben oder stornieren

---

## 14. Datenmodell – erste Version

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

## 15. Nicht-funktionale Anforderungen

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
- Einwilligung zur Datenverarbeitung dokumentieren

---

## 16. Technologiestack

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

## 17. Zielarchitektur

Internet
→ Nginx
→ Frontend (Next.js)
→ Backend (ASP.NET Core)
→ PostgreSQL

Alles zunächst auf einem Server.
Später horizontale Skalierung möglich.

---

## 18. Deployment

### Entwicklung
- Lokale Docker-Umgebung

### Source Control
- GitHub

### Automatisierung
- GitHub Actions

### Pipeline
1. Build
2. Tests
3. Docker Image erstellen
4. Deployment auf Server

---

## 19. Hosting

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

## 20. Erweiterungen / spätere Ausbaustufen

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

## 21. Geschäftsmodell

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

## 22. MVP-Entscheidungen

Verbindlich festgelegt:
- Zielbranche: Friseure
- Kundenlogin: nein
- Mitarbeiter-/Admin-Login: ja
- Buchungsmodell: slotbasiert
- Slotgröße: 30 Minuten
- Storno/Umbuchung: bis 24 Stunden vorher
- E-Mail-Versand: externer Transaktionsmail-Dienst
- Mandantenmodell: Subdomain + gemeinsame Datenbank
- Öffnungszeiten: pro Wochentag, mehrere Zeitblöcke, manuelle Ausnahmen
- Statusmodell: vollständiges Modell

---

## 23. Nächste Schritte vor Umsetzung

1. Umsetzung anhand dieses Plans starten
2. Datenmodell in Tabellen und Beziehungen übertragen
3. technische Grundstruktur aufsetzen
4. Authentifizierung und E-Mail-Dienst festlegen
5. Buchungslogik implementieren
6. Adminbereich ergänzen
7. Deployment automatisieren

---

## 24. Abschluss

Dieser Plan ist die gemeinsame Grundlage für die Umsetzung der Plattform.
