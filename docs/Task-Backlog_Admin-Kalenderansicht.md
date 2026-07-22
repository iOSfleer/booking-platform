# Task-Backlog – Admin-Kalenderansicht

Dieses Backlog übersetzt den Umsetzungsplan in konkrete, umsetzbare Arbeitspakete.

Ziel: Eine Outlook-ähnliche Kalenderansicht im Adminbereich mit **Tag / Woche / Monat**.

---

## 1. Umsetzung im bestehenden Frontend einplanen

### Ziel
Die Kalenderansicht wird in die bestehende Adminseite unter `src/frontend/pages/admin.js` integriert, aber nicht vollständig dort belassen.

### Vorgehen
1. neuen Tab **Kalender** in der Admin-Navigation ergänzen
2. Kalender-UI als eigene Komponenten auslagern
3. gemeinsame Hilfsfunktionen in `utils/calendar.js` ablegen
4. bestehende Terminliste als Verwaltungsansicht beibehalten

### Empfohlene Komponenten
- `CalendarToolbar`
- `CalendarViewSwitcher`
- `DayCalendarView`
- `WeekCalendarView`
- `MonthCalendarView`
- `CalendarEventCard`
- `CalendarEventDetailsModal`
- `CalendarEventCreateModal`
- `CalendarTimeGrid`
- `CalendarMonthCell`

### Einbaupunkt in der Adminseite
In `src/frontend/pages/admin.js`:
- neuer `activeTab`-Wert: `calendar`
- neuer Button in der Tab-Leiste
- neues Rendering-Branch für die Kalenderansicht

---

## 2. Epic A – Grundlagen der Kalenderansicht

### A1 – Kalender-Tab anlegen
**Ziel:** Der Admin kann einen neuen Tab „Kalender“ öffnen.

**Tasks:**
- Tab-Button zur Admin-Navigation hinzufügen
- neues Rendering für `activeTab === 'calendar'` ergänzen
- Platzhalteransicht einfügen

**Akzeptanzkriterium:**
- der Tab ist sichtbar und anklickbar
- die Kalenderansicht lädt ohne Fehler

---

### A2 – Kalender-Zustand anlegen
**Ziel:** Die Ansicht kann zwischen Tag, Woche und Monat wechseln.

**Tasks:**
- State für `calendarView` anlegen (`day`, `week`, `month`)
- State für `calendarDate` anlegen
- Buttons für `Heute`, `Zurück`, `Vor` implementieren
- Zeitraumwechsel je nach Ansicht definieren

**Akzeptanzkriterium:**
- Wechsel der Ansicht funktioniert
- Navigation ändert das Datum korrekt

---

### A3 – Hilfsfunktionen auslagern
**Ziel:** Datumslogik wird nicht direkt in `admin.js` vergraben.

**Tasks:**
- `utils/calendar.js` anlegen
- Funktionen für Tagesbeginn/-ende
- Funktionen für Wochenbeginn/-ende
- Funktionen für Monatsbereich
- Navigationsfunktionen auslagern

**Akzeptanzkriterium:**
- Kalenderlogik ist wiederverwendbar
- `admin.js` bleibt beherrschbar

---

## 3. Epic B – Datenanbindung

### B1 – Zeitraumbezogene Termindaten laden
**Ziel:** Die Kalenderansicht lädt nur relevante Termine.

**Tasks:**
- API-Abfrage um `fromUtc` und `toUtc` erweitern
- Kalenderdaten für den sichtbaren Zeitraum laden
- optional Filterparameter ergänzen

**Akzeptanzkriterium:**
- es werden nur Termine im sichtbaren Bereich geladen
- Navigation triggert neue Datenabfrage

---

### B2 – Kalender-DTO definieren
**Ziel:** Das Frontend bekommt exakt die Daten, die es für die Darstellung braucht.

**Tasks:**
- DTO für Kalenderereignis festlegen
- Felder: `id`, `title`, `startTimeUtc`, `endTimeUtc`, `status`, `customerName`, `serviceName`, `employeeName`
- Mapping aus bestehenden Appointment-Daten

**Akzeptanzkriterium:**
- Frontend muss keine unnötigen Zusatzabfragen machen
- Daten sind direkt renderbar

---

## 4. Epic C – Tag-Ansicht

### C1 – Tagesraster anzeigen
**Ziel:** Ein einzelner Tag wird als Zeitskala dargestellt.

**Tasks:**
- Stundenraster aufbauen
- Arbeitszeitbereich anzeigen
- leere Slots sichtbar machen
- Terminpositionen anhand Zeit berechnen

**Akzeptanzkriterium:**
- Tag zeigt nur einen Tag
- Slots und Termine sind visuell unterscheidbar

---

### C2 – Termin-Kacheln im Tag-View
**Ziel:** Termine erscheinen als Kacheln im Stundenraster.

**Tasks:**
- Kartenlayout für Termine definieren
- Dauer in Höhe umrechnen
- Statusfarben anwenden
- Titel und Zeit anzeigen

**Akzeptanzkriterium:**
- Termine sind im richtigen Zeitfenster sichtbar
- Kachelgröße entspricht der Dauer

---

### C3 – Slot-Klick im Tag-View
**Ziel:** Freie Zeiten können für neue Termine genutzt werden.

**Tasks:**
- Klick auf freien Slot abfangen
- Startzeit in Modal übergeben
- Neuanlage-Modal öffnen

**Akzeptanzkriterium:**
- Klick auf freien Slot öffnet das Erstellen-Modal

---

## 5. Epic D – Wochenansicht

### D1 – Wochenlayout anzeigen
**Ziel:** Die Woche wird mit 7 Spalten dargestellt.

**Tasks:**
- 7-Tage-Grid bauen
- Tageskopf mit Datum und Wochentag anzeigen
- Zeitraster vertikal darstellen

**Akzeptanzkriterium:**
- Woche zeigt exakt 7 Tage
- Datumswechsel funktioniert

---

### D2 – Termine in der Woche positionieren
**Ziel:** Jeder Termin erscheint in der richtigen Tages-Spalte.

**Tasks:**
- Termine nach Datum gruppieren
- Position nach Startzeit berechnen
- Höhe nach Dauer berechnen

**Akzeptanzkriterium:**
- Termine stehen am richtigen Tag und zur richtigen Uhrzeit

---

### D3 – Überlappungen behandeln
**Ziel:** Überschneidende Termine dürfen sich nicht verdecken.

**Tasks:**
- einfache Kollisionslogik einbauen
- nebeneinanderliegende Spalten berechnen
- Layout testen

**Akzeptanzkriterium:**
- überlappende Termine bleiben lesbar

---

## 6. Epic E – Monatsansicht

### E1 – Monatsraster anzeigen
**Ziel:** Ein klassisches Monatsgrid wird dargestellt.

**Tasks:**
- Monatsstart und Monatsende berechnen
- 6x7-Raster aufbauen
- Tage außerhalb des Monats optisch schwächer anzeigen

**Akzeptanzkriterium:**
- Monat ist vollständig sichtbar
- Kalender kann zwischen Monaten wechseln

---

### E2 – Termine im Monat anzeigen
**Ziel:** Termine erscheinen kompakt pro Tag.

**Tasks:**
- pro Tag kleine Terminliste darstellen
- bei vielen Terminen „+n weitere“ anzeigen
- Klick auf Tag öffnet Tagesansicht

**Akzeptanzkriterium:**
- Monatsansicht bleibt übersichtlich
- Termine sind pro Tag erkennbar

---

## 7. Epic F – Termin-Interaktionen

### F1 – Termin-Detailmodal
**Ziel:** Ein Klick auf einen Termin öffnet die Details.

**Tasks:**
- Modal-Komponente erstellen
- Termin-Details anzeigen
- Aktionen für Bearbeiten, Stornieren, Verschieben vorbereiten

**Akzeptanzkriterium:**
- Klick auf Kachel öffnet vollständige Details

---

### F2 – Termin anlegen aus Kalender heraus
**Ziel:** Der Admin kann direkt im Kalender einen Termin anlegen.

**Tasks:**
- Create-Modal mit vorgefülltem Datum/Uhrzeit
- Service-Auswahl integrieren
- Kunde erfassen oder auswählen
- speichern gegen API anbinden

**Akzeptanzkriterium:**
- neuer Termin kann aus dem Kalender heraus erstellt werden

---

### F3 – Termin bearbeiten / verschieben
**Ziel:** Termine können aus der Detailansicht heraus verändert werden.

**Tasks:**
- bestehende Endpunkte für Reschedule verwenden
- Umsetzungslogik im Modal ergänzen
- nach Speicherung Kalender neu laden

**Akzeptanzkriterium:**
- Änderungen sind direkt im Kalender sichtbar

---

## 8. Epic G – UI/UX und Qualität

### G1 – Statusfarben und Legende
**Ziel:** Der Kalender ist schnell lesbar.

**Tasks:**
- Farben pro Status definieren
- kleine Legende einbauen
- Kontraste prüfen

**Akzeptanzkriterium:**
- Status ist visuell sofort erkennbar

---

### G2 – Lade- und Leerezustände
**Ziel:** Die Ansicht verhält sich sauber bei fehlenden Daten.

**Tasks:**
- Loading-State anzeigen
- leere Kalenderansicht darstellen
- Fehler sauber melden

**Akzeptanzkriterium:**
- Nutzer versteht jederzeit, was passiert

---

### G3 – Responsives Verhalten
**Ziel:** Die Kalenderansicht funktioniert auch auf kleineren Bildschirmen.

**Tasks:**
- mobile Darstellung prüfen
- Woche/Monat ggf. horizontal scrollen
- Tag-View priorisieren

**Akzeptanzkriterium:**
- Kalender bleibt nutzbar auf kleineren Displays

---

## 9. Priorisierte Umsetzungsreihenfolge

### Phase 1 – Muss zuerst
1. Kalender-Tab anlegen
2. View-State anlegen
3. Zeitraum-Logik auslagern
4. Termindaten für Zeitraum laden

### Phase 2 – Kernfunktion
5. Tag-Ansicht bauen
6. Wochen-Ansicht bauen
7. Monats-Ansicht bauen

### Phase 3 – Bedienung
8. Detailmodal
9. Erstellen-Modal
10. Bearbeiten / Verschieben

### Phase 4 – Feinschliff
11. Statusfarben
12. Ladezustände
13. Responsiveness
14. Tests

---

## 10. Vorschlag für konkrete Tickets

### Ticket 1
**Titel:** Admin-Kalender-Tab hinzufügen

**Beschreibung:**
Im Adminbereich wird ein neuer Tab „Kalender“ ergänzt.

**Definition of Done:**
- Tab ist im UI sichtbar
- Tab öffnet eine eigene Kalenderansicht

---

### Ticket 2
**Titel:** Kalender-View-State und Navigation implementieren

**Beschreibung:**
Tag/Woche/Monat sowie Heute/Vor/Zurück werden steuerbar.

**Definition of Done:**
- View-Wechsel funktioniert
- Datum navigiert korrekt

---

### Ticket 3
**Titel:** Termine zeitraumbasiert für Kalender laden

**Beschreibung:**
Kalender lädt nur Termine im sichtbaren Zeitraum.

**Definition of Done:**
- API-Abfrage mit from/to funktioniert
- Kalender rendert nur relevante Termine

---

### Ticket 4
**Titel:** Tag-Ansicht mit Zeitslots und Termin-Kacheln

**Beschreibung:**
Die Tagesansicht zeigt ein Stundenraster und Termine als Kacheln.

**Definition of Done:**
- Slots sichtbar
- Termine an richtiger Position

---

### Ticket 5
**Titel:** Wochenansicht mit 7-Spalten-Layout

**Beschreibung:**
Die Wochenansicht zeigt 7 Tage nebeneinander.

**Definition of Done:**
- Woche korrekt dargestellt
- Termine pro Tag sichtbar

---

### Ticket 6
**Titel:** Monatsansicht kompakt darstellen

**Beschreibung:**
Die Monatsansicht zeigt Termine kompakt im Tagesraster.

**Definition of Done:**
- Monat vollständig sichtbar
- Terminüberlauf wird begrenzt dargestellt

---

### Ticket 7
**Titel:** Termin-Detailmodal und Slot-Erstellung

**Beschreibung:**
Termine können angeklickt und freie Slots zur Anlage genutzt werden.

**Definition of Done:**
- Termin-Details öffnen sich
- neue Termine können vorbereitet werden

---

## 11. Grobe Aufwandsschätzung

Wenn das schlank als MVP umgesetzt wird:

- Kalender-Tab + Navigation: klein
- Tag-Ansicht: mittel
- Wochen-Ansicht: mittel bis größer
- Monats-Ansicht: mittel
- Modals + Interaktionen: mittel
- Feinschliff: klein bis mittel

Gesamt: **mittlerer Aufwand**, gut in mehrere kleine Arbeitsschritte teilbar.

---

## 12. Empfehlung für den Start

Ich würde mit dieser Reihenfolge starten:

1. Tab + Navigation
2. Datenladung für Zeitraum
3. Tag-Ansicht
4. Woche
5. Monat
6. Modals
7. Feinschliff

So entsteht schnell eine erste nutzbare Kalenderansicht, ohne zu früh in komplexe Spezialfälle zu gehen.

---

**Dateiablage:** `docs/Task-Backlog_Admin-Kalenderansicht.md`
