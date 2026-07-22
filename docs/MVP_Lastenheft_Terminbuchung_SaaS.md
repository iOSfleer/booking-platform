# MVP-Lastenheft – Terminbuchung SaaS

## 1. Ziel des MVP

Das MVP soll es einem Unternehmen ermöglichen, über eine einfache Website Termine online anzubieten und Buchungen zuverlässig zu verwalten.

Primäres Ziel:
- Online-Terminbuchung ohne Medienbruch

Sekundäre Ziele:
- einfache Administration für das Unternehmen
- saubere Grundlage für spätere Multi-Tenant-Erweiterung

---

## 2. Zielgruppe für den MVP

Für den Start wird **eine Zielbranche** fokussiert. Die endgültige Auswahl ist noch offen.

Mögliche erste Branchen:
- Friseure
- Werkstätten
- KFZ-Prüfstellen
- Physiotherapeuten
- Fahrschulen

---

## 3. MVP-Funktionsumfang

### 3.1 Öffentliche Website
- Startseite
- Leistungen
- Über uns
- Kontakt
- Impressum
- Datenschutz

### 3.2 Terminbuchung
- Leistungen anzeigen
- freie Termine anzeigen
- Datum auswählen
- Uhrzeit auswählen
- Kundendaten erfassen
- Termin bestätigen
- Buchung erfolgreich abschließen

### 3.3 Benachrichtigungen
- E-Mail an Kunde
- E-Mail an Unternehmen

### 3.4 Einfache Administration
- Termine ansehen
- Termine stornieren
- Termine verschieben
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

## 5. Kern-Use-Cases

### UC1 – Kunde bucht Termin
1. Kunde öffnet Website
2. Kunde wählt Leistung
3. Kunde sieht verfügbare Termine
4. Kunde wählt Datum und Uhrzeit
5. Kunde gibt Kontaktdaten ein
6. Kunde bestätigt Buchung
7. System speichert Termin
8. Kunde und Unternehmen erhalten E-Mail

### UC2 – Unternehmen verwaltet Termin
1. Mitarbeiter meldet sich an
2. Mitarbeiter sieht Terminliste
3. Mitarbeiter kann Termin verschieben oder stornieren
4. Änderungen werden protokolliert

### UC3 – Unternehmen pflegt Verfügbarkeit
1. Administrator oder Mitarbeiter pflegt Öffnungszeiten
2. Unternehmen legt Leistungen mit Dauer an
3. System berechnet daraus verfügbare Zeitfenster

---

## 6. Fachliche Regeln für das MVP

Diese Regeln sollten vor der Entwicklung final festgelegt werden:

- Jede Leistung hat eine feste Dauer
- Ein Termin besteht aus genau einer Leistung
- Ein Termin wird einem Mitarbeiter zugeordnet, falls mehrere Mitarbeiter vorhanden sind
- Doppelbuchungen sind ausgeschlossen
- Buchung ist nur innerhalb der Öffnungszeiten möglich
- Buchung ist nur innerhalb eines definierten Vorlaufzeitraums möglich
- Storno und Verschiebung sind nur für berechtigte Nutzer möglich

---

## 7. Rollen im MVP

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

Hinweis:
- Ein Kundenkonto ist im MVP nicht vorgesehen.

---

## 8. Minimaler Datenbedarf

### Unternehmen
- Name
- Domain oder Subdomain
- Kontaktinformationen
- Logo optional
- Branding optional

### Leistung
- Name
- Dauer
- Preis optional
- Beschreibung
- aktiv/inaktiv

### Mitarbeiter
- Name
- UnternehmenID
- aktiv/inaktiv

### Termin
- UnternehmenID
- MitarbeiterID
- LeistungID
- Startzeit
- Endzeit
- Status
- Kundendaten
- Notizen optional

### Kunde / Kontakt
- Name
- E-Mail
- Telefon

### Öffnungszeiten
- Wochentag
- Von
- Bis

### Ausnahme
- Datum
- Typ
- Beschreibung
- optional Mitarbeiterbezug

---

## 9. Terminstatus

Empfohlenes Statusmodell:
- Angefragt
- Bestätigt
- Verschoben
- Storniert
- Erledigt
- No-Show

Für das MVP reicht möglicherweise bereits:
- Bestätigt
- Storniert
- Verschoben

---

## 10. Technische Leitplanken

### Backend
- ASP.NET Core
- klare Trennung in API, Business und Persistence Layer

### Frontend
- Next.js
- zunächst funktional, schlichtes UI

### Datenbank
- PostgreSQL

### Infrastruktur
- Docker
- Docker Compose
- Nginx
- GitHub Actions für Build und Deployment

---

## 11. Nicht-funktionale Anforderungen

- Mandantendaten dürfen nicht vermischt werden
- Eingaben müssen validiert werden
- Terminverfügbarkeit muss korrekt berechnet werden
- Backups müssen möglich sein
- Logs müssen nachvollziehbar sein
- DSGVO-Anforderungen müssen berücksichtigt werden

---

## 12. Priorisierte offene Fragen vor Implementierungsstart

### Priorität A – Muss vor Start entschieden werden
1. Welche Zielbranche bauen wir zuerst?
2. Buchung ohne Login oder mit Login?
3. Feste Zeitslots oder flexible Dauerlogik?
4. Wie wird Verfügbarkeit berechnet?
5. Welche E-Mail-Infrastruktur wird genutzt?
6. Mandantenerkennung über Subdomain oder eigene Domain?
7. Eine gemeinsame Datenbank oder spätere Trennung?

### Priorität B – Soll vor dem ersten großen Entwicklungsschritt entschieden werden
8. Benötigen wir Mitarbeiter-Login im MVP?
9. Welche Storno- und Umbuchungsregeln gelten?
10. Wie werden Feiertage behandelt?
11. Brauchen wir Pufferzeiten zwischen Terminen?
12. Welche Pflichtfelder hat die Buchung?

### Priorität C – Kann nach dem MVP entschieden werden
13. SMS- und WhatsApp-Versand
14. Erinnerungen
15. Reporting und Analytics
16. Mehrsprachigkeit
17. Kundenkonto

---

## 13. Empfohlene nächste Schritte

1. Zielbranche auswählen
2. Buchungslogik final definieren
3. Rollen und Rechte festlegen
4. E-Mail-Versandlösung bestimmen
5. Datenmodell finalisieren
6. MVP-Backlog in umsetzbare Tickets zerlegen
7. Technisches Grundgerüst aufsetzen

---

## 14. Ergebnis

Wenn die Punkte aus Priorität A geklärt sind, kann die Umsetzung beginnen.
