# Vorbereitung der Umsetzung – Entscheidungsgrundlage und Start-Backlog

## 1. Ziel dieses Dokuments

Dieses Dokument bereitet den Start der Umsetzung vor. Es bündelt:
- eine Empfehlung für die erste Zielbranche
- eine konkrete Buchungslogik für das MVP
- ein erstes technisches Backlog für die Umsetzung

---

## 2. Empfehlung für die erste Zielbranche

### Bewertete Optionen

#### Friseure
**Vorteile:**
- einfache und wiederkehrende Terminarten
- gut planbare Zeitdauern
- wenig komplexe Ressourcenlogik
- schneller MVP-Start möglich

**Nachteile:**
- starke Konkurrenz

#### Werkstätten
**Vorteile:**
- hoher Bedarf an Terminbuchung
- klarer Business-Nutzen

**Nachteile:**
- oft komplexere Terminarten
- längere und unregelmäßigere Dauer
- häufig zusätzliche Ressourcen wie Hebebühnen oder Geräte

#### KFZ-Prüfstellen
**Vorteile:**
- klarer Terminbedarf

**Nachteile:**
- oft komplexere Abhängigkeiten und festere Abläufe

#### Physiotherapeuten
**Vorteile:**
- hoher Terminbedarf

**Nachteile:**
- häufig komplexere Datenschutzanforderungen
- teilweise sensiblere Daten

#### Fahrschulen
**Vorteile:**
- klarer Terminbedarf

**Nachteile:**
- Terminlogik kann Fahrstunden, Lehrer und Fahrzeuge betreffen

### Empfehlung
Für den MVP empfehle ich **Friseure** als erste Zielbranche.

Begründung:
- einfachste Terminlogik
- gute Grundlage für wiederkehrende Buchungen
- geringes Risiko bei der ersten Implementierung
- später leicht auf andere Branchen übertragbar

---

## 3. MVP-Buchungslogik – empfohlene Festlegung

### 3.1 Grundprinzip
- Jeder Termin besteht aus **genau einer Leistung**
- Jede Leistung hat eine **feste Dauer**
- Buchungen erfolgen nur innerhalb der Öffnungszeiten
- Doppelbuchungen sind ausgeschlossen

### 3.2 Terminformat
Empfohlen wird ein **Slot-basiertes Modell** mit fester Startzeit.

Beispiel:
- 09:00
- 09:30
- 10:00
- 10:30

Die Slot-Größe kann später pro Unternehmen oder Leistung angepasst werden.

### 3.3 Verfügbarkeit
Ein Termin ist buchbar, wenn:
- der Slot innerhalb der Öffnungszeiten liegt
- die Leistung in den Slot passt
- kein anderer Termin den Zeitraum blockiert
- keine Ausnahme oder Abwesenheit vorliegt
- der Vorlaufzeitraum eingehalten wird

### 3.4 Vorlaufzeit
Empfohlene MVP-Regel:
- Buchungen sind nur bis mindestens **24 Stunden im Voraus** möglich

Diese Regel kann später pro Unternehmen konfigurierbar werden.

### 3.5 Storno / Umbuchung
Empfohlene MVP-Regel:
- Storno und Umbuchung sind bis **24 Stunden vor Terminbeginn** möglich

### 3.6 Pufferzeiten
Empfohlene MVP-Regel:
- zunächst **keine Pufferzeiten**
- falls nötig, später konfigurierbar je Leistung

### 3.7 Kundenkonto
Empfohlene MVP-Regel:
- **keine Registrierung / kein Login für Kunden**
- Buchung erfolgt per Name, E-Mail und Telefon

### 3.8 Terminbestätigung
Empfohlene MVP-Regel:
- Termin ist nach erfolgreicher Buchung sofort **bestätigt**
- E-Mail wird direkt versendet

---

## 4. Empfohlene fachliche MVP-Regeln

- Jede Leistung hat Name, Dauer, Preis optional und Aktiv-Status
- Ein Kunde kann mehrere Termine buchen, aber ohne Benutzerkonto
- Ein Termin wird einer Leistung und optional einem Mitarbeiter zugeordnet
- Öffnungszeiten gelten pro Wochentag
- Feiertage und Sonderzeiten werden als Ausnahmen gepflegt
- Buchungen außerhalb der Öffnungszeiten sind nicht möglich
- Terminstatus im MVP:
  - Bestätigt
  - Verschoben
  - Storniert
  - Erledigt optional

---

## 5. Minimaler MVP-Workflow

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

## 6. Erstes technisches Backlog

### Epic A – Grundlagen
- Projektstruktur anlegen
- Docker-Setup erstellen
- PostgreSQL anbinden
- Backend-Grundprojekt ASP.NET Core aufsetzen
- Frontend-Grundprojekt Next.js aufsetzen
- Nginx-Konfiguration vorbereiten

### Epic B – Mandanten / Unternehmen
- Unternehmen als Entität anlegen
- Mandantenkontext definieren
- Domain/Subdomain-Zuordnung vorbereiten
- Branding-Grunddaten speichern

### Epic C – Leistungen
- Leistungen anlegen
- Leistungen bearbeiten
- Leistungen aktiv/inaktiv setzen
- Dauer pro Leistung speichern

### Epic D – Öffnungszeiten und Ausnahmen
- Wochentagsöffnungszeiten speichern
- Sonderöffnungszeiten speichern
- Feiertage / Abwesenheiten speichern

### Epic E – Terminbuchung
- Verfügbare Slots berechnen
- Buchungsformular bauen
- Termin speichern
- Doppelbuchung verhindern
- Bestätigungs-E-Mail senden

### Epic F – Adminbereich
- Login für Mitarbeiter/Admin
- Terminliste anzeigen
- Termin verschieben
- Termin stornieren
- Audit-Log anlegen

### Epic G – Benachrichtigungen
- E-Mail-Versand implementieren
- E-Mail-Vorlagen definieren
- Versandstatus speichern

---

## 7. Technische Entscheidungsfragen vor Start

Diese Punkte sollten vor der ersten Implementierung festgelegt werden:

1. Welche Authentifizierung wird genutzt?
   - eigene Implementierung
   - oder externer Identity-Provider

2. Wie wird Mandantenkontext bestimmt?
   - Subdomain
   - eigene Domain
   - beides

3. Wie wird E-Mail versendet?
   - SMTP
   - SendGrid
   - Mailgun
   - AWS SES

4. Wie wird der erste Deployment-Workflow aufgebaut?
   - manuell
   - GitHub Actions mit automatischem Deploy

5. Wird direkt mit Rollen und Rechten gestartet oder zunächst mit nur einem Admin-Login?

---

## 8. Empfohlene Reihenfolge für die Umsetzung

1. Zielbranche final bestätigen
2. Buchungslogik final bestätigen
3. MVP-Datenmodell in Tabellen überführen
4. Authentifizierung festlegen
5. Backend-Grundgerüst erstellen
6. Frontend-Grundgerüst erstellen
7. Terminverfügbarkeit implementieren
8. Buchung und E-Mail-Versand umsetzen
9. Adminbereich ergänzen
10. Deployment automatisieren

---

## 9. Nächster sinnvoller Schritt

Als nächstes sollten wir entweder:
- die **Zielbranche final auswählen**, oder
- direkt das **Datenmodell in Tabellen und Beziehungen** übersetzen.
