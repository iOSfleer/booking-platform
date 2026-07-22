# Umsetzungsplan – Admin-Kalenderansicht im Outlook-Stil

## 1. Ziel

Für den Adminbereich soll eine neue Kalenderansicht entstehen, die sich am Outlook-Prinzip orientiert:

- Umschaltung zwischen **Tag**, **Woche** und **Monat**
- im **Tag-View** wird nur der ausgewählte Tag angezeigt
- freie **Zeitslots** werden sichtbar gemacht
- vorhandene **Termine erscheinen als Kacheln** im Zeitraster
- optional später: Drag & Drop, Resize, Schnellanlage

Die neue Ansicht soll die bestehende Terminliste nicht ersetzen, sondern ergänzen.

---

## 2. Ausgangslage im aktuellen Projekt

Der aktuelle Stand des Projekts enthält bereits:

- eine Adminseite unter `src/frontend/pages/admin.js`
- bestehende Terminverwaltung mit Liste, Filter, Pagination und Aktionen
- Backend-Modelle für Termine, Mitarbeiter, Leistungen, Öffnungszeiten und Ausnahmen
- Terminstatus im Backend
- Authentifizierung für Admin / Mitarbeiter

Das ist eine gute Basis, weil die Daten bereits vorhanden sind. Für die Kalenderansicht muss hauptsächlich die **Darstellung** und die **Abfrage im sichtbaren Zeitraum** ergänzt werden.

---

## 3. Fachliche Anforderungen

### 3.1 Ansichten

#### Tag
- zeigt genau einen Tag
- Zeitachse z. B. von 08:00 bis 20:00 Uhr
- freie Slots sichtbar
- Termine als Kacheln im korrekten Zeitfenster

#### Woche
- zeigt 7 Tage nebeneinander
- Termine werden pro Tag positioniert
- Überlappungen müssen optisch lösbar sein

#### Monat
- zeigt ein Monatsraster
- Termine werden pro Tag kompakt angezeigt
- bei vielen Terminen: Anzeige wie „+3 weitere“

### 3.2 Interaktionen
- Wechsel zwischen Tag / Woche / Monat
- Navigation: **Heute**, **Zurück**, **Vor**
- Klick auf freien Slot → Termin anlegen
- Klick auf Termin → Detailansicht / Bearbeitung
- Klick auf Tag im Monatsview → Tag-Ansicht dieses Datums

### 3.3 Sichtbare Inhalte
Pro Termin sollen mindestens sichtbar sein:
- Titel oder Service-Name
- Start- und Endzeit
- optional Kunde
- Status-Farbe
- optional zuständiger Mitarbeiter

---

## 4. Technische Entscheidung

### Empfehlung
Für das MVP sollte die Kalenderansicht **innerhalb der bestehenden Adminseite** ergänzt werden, aber sauber als Komponenten ausgelagert.

Warum:
- keine neue Admin-App notwendig
- vorhandene Auth und Datenstrukturen können weiterverwendet werden
- weniger Umbau im Projekt

### Empfohlener Aufbau
Die aktuelle Monolith-Datei `src/frontend/pages/admin.js` sollte schrittweise in Komponenten zerlegt werden.

---

## 5. Vorgeschlagene Dateistruktur

### Frontend

```text
src/frontend/
├── pages/
│   └── admin.js
├── components/
│   └── admin-calendar/
│       ├── CalendarToolbar.js
│       ├── CalendarViewSwitcher.js
│       ├── DayCalendarView.js
│       ├── WeekCalendarView.js
│       ├── MonthCalendarView.js
│       ├── CalendarEventCard.js
│       ├── CalendarTimeGrid.js
│       ├── CalendarMonthCell.js
│       ├── CalendarEventDetailsModal.js
│       └── CalendarEventCreateModal.js
└── utils/
    └── calendar.js
```

### Backend

Falls benötigt, Ergänzungen im Backend:

```text
src/backend/BookingPlatform.Api/
├── Controllers/
│   └── AdminCalendarController.cs   (optional)
├── Dtos/
│   └── CalendarDtos.cs              (optional)
└── Services/
    └── CalendarService.cs           (optional)
```

---

## 6. Datenmodell – bereits vorhandene Basis

Die bestehenden Entitäten reichen fachlich fast aus:

- `Appointment`
- `Service`
- `Employee`
- `BusinessHour`
- `ExceptionPeriod`
- `Customer`

### Wichtige Felder aus `Appointment`
- `StartTimeUtc`
- `EndTimeUtc`
- `Status`
- `EmployeeId`
- `ServiceId`
- `CustomerId`
- `Notes`

### Hinweis
Für die Kalenderansicht ist wichtig, dass die API die Daten so liefert, dass der Client daraus direkt Raster und Kacheln berechnen kann.

---

## 7. API-Strategie

## Variante A: Bestehende Termin-API erweitern

Die vorhandene Terminliste kann um einen Kalender-Modus ergänzt werden:

- Query-Parameter `fromUtc`
- Query-Parameter `toUtc`
- optional `employeeId`
- optional `status`
- optional `serviceId`

Vorteile:
- wenig neue API-Oberfläche
- bestehende Logik kann weiterverwendet werden

Nachteil:
- die Listen-API bleibt fachlich etwas gemischt

---

## Variante B: Eigener Kalender-Endpunkt

Empfohlen für bessere Trennung:

```http
GET /api/admin/calendar/events?fromUtc=...&toUtc=...&view=day|week|month
```

Optional weitere Filter:
- `employeeId`
- `serviceId`
- `status`

Antwort z. B.:

```json
{
  "items": [
    {
      "id": "...",
      "title": "Haarschnitt",
      "startTimeUtc": "2026-08-12T09:00:00Z",
      "endTimeUtc": "2026-08-12T09:30:00Z",
      "status": "Confirmed",
      "employeeName": "Anna",
      "customerName": "Max Mustermann",
      "serviceName": "Haarschnitt"
    }
  ]
}
```

### Empfehlung
Für das MVP ist Variante A ausreichend, für saubere Skalierung ist Variante B besser.

---

## 8. Frontend-Konzept

## 8.1 Erweiterung der Admin-Navigation

Die bestehende Adminseite hat bereits Tabs wie:
- Termine
- Leistungen
- Öffnungszeiten
- Ausnahmen
- Benachrichtigungen
- Audit Logs

Neu hinzukommen sollte:
- **Kalender**

Die Terminliste bleibt für Verwaltung, der Kalender wird zur visuellen Planung.

---

## 8.2 Kalender-Kopfbereich

Oben über dem Kalender:
- Button **Heute**
- Button **Zurück**
- Button **Vor**
- Anzeige des aktuellen Bereichs
- Umschalter **Tag / Woche / Monat**
- optional Filter für Mitarbeiter, Leistung, Status

---

## 8.3 Darstellung pro Ansicht

### Tag-Ansicht
- links Zeitachse
- rechts ein Tagesraster
- Termin-Kacheln mit Höhe abhängig von Dauer
- freie Zeitslots sind sichtbar

### Wochen-Ansicht
- 7 Spalten
- Tage nebeneinander
- Terminposition anhand Startzeit
- Kacheln dürfen sich bei Überlappungen teilen

### Monats-Ansicht
- klassisches Grid mit 6 Wochen
- pro Tag eine kleine Liste von Terminen
- bei Überlauf: „+n weitere“

---

## 9. Kalenderlogik im Frontend

## 9.1 Datum und Zeitraum

Der Kalender braucht eine zentrale Logik für:
- Start des Tages
- Ende des Tages
- Start der Woche
- Ende der Woche
- Start des Monats
- Ende des Monats
- Navigation um 1 Tag / 1 Woche / 1 Monat

Diese Logik sollte in `src/frontend/utils/calendar.js` ausgelagert werden.

---

## 9.2 Slot-Berechnung

Für Tag- und Wochenansicht:
- Raster z. B. in 15- oder 30-Minuten-Schritten
- Slots können aus Öffnungszeiten abgeleitet werden
- Termine werden in den Slot eingezeichnet

Empfehlung für das MVP:
- **30-Minuten-Raster**, passend zum bestehenden System
- später optional 15 Minuten

---

## 9.3 Überlappungen

Wenn zwei Termine sich überschneiden:
- in der Tages- und Wochenansicht müssen sie nebeneinander dargestellt werden
- Breite wird pro Gruppe aufgeteilt
- Kacheln dürfen sich nicht vollständig überdecken

Eine einfache Layout-Strategie reicht fürs MVP:
- Überschneidungen gruppieren
- Spalten innerhalb der Gruppe berechnen

---

## 9.4 Ganztägige Termine

Falls später benötigt:
- separate Anzeige oberhalb des Stundenrasters
- nicht in die Stunden-Kacheln mischen

Für das MVP kann `allDay` optional bleiben.

---

## 10. Termin-Kachel-Design

Eine Kalender-Kachel sollte möglichst kompakt und informativ sein.

### Inhalt
- Service-Name als Titel
- Uhrzeit von/bis
- Name des Kunden
- Status
- optional Mitarbeiter

### Farbe
Status-Farben helfen bei der schnellen Orientierung:
- bestätigt = blau/grün
- angefragt = gelb
- verschoben = orange
- storniert = grau/rot
- erledigt = dunkelgrün

### Verhalten
- Klick öffnet Detailmodal
- Hover zeigt ggf. Zusatzinfos

---

## 11. Detail- und Erstellen-Dialoge

### Detailmodal
Beim Klick auf eine Kachel:
- vollständige Termininfos
- Status ändern
- verschieben
- stornieren
- Mitarbeiter zuweisen

### Erstellen-Modal
Beim Klick auf freien Slot:
- Datum und Uhrzeit vorbefüllen
- Service auswählen
- Kunde erfassen oder bestehende Auswahl
- speichern

### Später optional
- Drag & Drop zum Verschieben
- Resize zur Anpassung der Dauer

---

## 12. Backend-Erweiterungen

### 12.1 Falls ein Kalender-Endpunkt ergänzt wird

Ein möglicher Controller:
- `AdminCalendarController`

Methoden:
- `GET /api/admin/calendar/events`
- optional `GET /api/admin/calendar/availability`

### 12.2 DTOs

Für die UI sollte ein leichtgewichtiges DTO geliefert werden:
- Id
- Titel
- Startzeit
- Endzeit
- Status
- Kundenname
- Servicename
- Mitarbeitername
- Farbe / Typ optional

### 12.3 Performance

Wichtig:
- nur Daten im sichtbaren Zeitraum laden
- keine unnötigen Full-Table-Loads
- Indizes auf `CompanyId`, `StartTimeUtc`, `EmployeeId` sinnvoll

---

## 13. Wiederverwendung der bestehenden Adminseite

Die aktuelle Datei `src/frontend/pages/admin.js` ist bereits sehr umfangreich.

### Empfehlung für die Umsetzung
1. bestehenden Terminlisten-Tab unverändert lassen
2. neuen Tab `Kalender` hinzufügen
3. Kalenderansicht als eigene Komponenten bauen
4. gemeinsam genutzte Hilfsfunktionen auslagern

Das verhindert, dass `admin.js` noch größer und unübersichtlicher wird.

---

## 14. Empfohlene Implementierungsreihenfolge

### Phase 1 – Daten und API
- prüfen, ob vorhandene Termin-API für Zeiträume reicht
- falls nötig Kalender-Endpunkt ergänzen
- DTO für Kalenderdaten definieren

### Phase 2 – Basis-UI
- neuen Tab **Kalender** hinzufügen
- Toolbar mit Navigation und Ansichtsschalter bauen
- Zeitraum-Zustand im Frontend verwalten

### Phase 3 – Tag-Ansicht
- Stundenraster anzeigen
- Termine rendern
- freie Slots darstellen
- Slot-Klick vorbereiten

### Phase 4 – Wochen-Ansicht
- 7-Spalten-Layout
- Terminplatzierung pro Tag
- Überlappungen behandeln

### Phase 5 – Monats-Ansicht
- Monatsraster
- Terminlisten in den Tageszellen
- „mehr anzeigen“-Logik

### Phase 6 – Interaktionen
- Detailmodal
- Erstellen-Modal
- Bearbeiten / Storno / Verschieben

### Phase 7 – Feinschliff
- responsive Verhalten
- Farben und Statuslegende
- Ladezustände
- leere Zustände
- Tests

---

## 15. Akzeptanzkriterien

Die Umsetzung gilt als abgeschlossen, wenn:

- der Admin zwischen Tag, Woche und Monat wechseln kann
- der Tag-View nur den gewählten Tag zeigt
- Termine als Kacheln korrekt in den Kalender einsortiert werden
- freie Zeitbereiche sichtbar sind
- die Navigation Heute / Vor / Zurück funktioniert
- Klick auf Termin die Detailansicht öffnet
- Klick auf freien Slot eine Neuanlage ermöglicht
- die Ansicht mit der bestehenden Terminverwaltung harmoniert

---

## 16. Tests

### Funktionale Tests
- Tag zeigt nur einen Tag
- Woche zeigt 7 Tage
- Monat zeigt den korrekten Monat
- Navigation lädt den richtigen Zeitraum
- Termine erscheinen zur richtigen Zeit
- Überlappungen werden nicht unlesbar dargestellt

### Technische Tests
- Datenabfrage nur für den sichtbaren Zeitraum
- API-Antworten werden sauber gemappt
- Zeitzonen werden korrekt verarbeitet
- keine doppelten Terminanzeigen

---

## 17. Risiken und Gegenmaßnahmen

### Risiko: Zu große Komponente
Die bestehende `admin.js` ist bereits lang.

**Gegenmaßnahme:**
- Kalender in einzelne Komponenten aufteilen
- Hilfsfunktionen auslagern

### Risiko: Komplexe Überlappungen
Kalender-Layout kann schnell schwierig werden.

**Gegenmaßnahme:**
- MVP mit einfacher Spaltenlogik starten
- erst später Drag & Drop / Resize ergänzen

### Risiko: Falsche Zeitzonen
Kalenderansichten sind anfällig für UTC/Local-Time-Probleme.

**Gegenmaßnahme:**
- UTC im Backend beibehalten
- im Frontend konsequent in lokale Zeit umrechnen
- klare Hilfsfunktionen nutzen

---

## 18. MVP-Empfehlung

Für die erste Version würde ich folgenden Umfang empfehlen:

1. **Kalender-Tab im Adminbereich**
2. **Tag-, Wochen- und Monatsansicht**
3. **Navigation Heute / Vor / Zurück**
4. **Termin-Kacheln mit Statusfarben**
5. **Klick auf Termin → Detailmodal**
6. **Klick auf freien Slot → Termin anlegen**
7. **Keine Drag & Drop-Funktion im ersten Schritt**

Damit ist die Funktion schnell nutzbar, ohne das System unnötig zu komplex zu machen.

---

## 19. Nächster konkreter Umsetzungsschritt

Empfohlene Reihenfolge für die technische Umsetzung im Code:

1. Kalenderdatenmodell und Zeitraum-Query festlegen
2. neue UI-Komponenten anlegen
3. Kalender-Tab in `src/frontend/pages/admin.js` ergänzen
4. Tag-Ansicht implementieren
5. Wochen- und Monatsansicht ergänzen
6. Termin-Details und Slot-Erstellung anbinden

---

## 20. Zusammenfassung

Die Kalenderansicht ist fachlich gut in das bestehende Projekt integrierbar.

Die wichtigsten Punkte sind:
- Wiederverwendung der vorhandenen Termin-Daten
- saubere Trennung in Tag / Woche / Monat
- zeitraumbasierte API-Abfrage
- Auslagerung in wiederverwendbare Frontend-Komponenten
- MVP mit Fokus auf Übersicht und schneller Bedienung

---

**Dateiablage:** `docs/Umsetzungsplan_Admin-Kalenderansicht.md`
