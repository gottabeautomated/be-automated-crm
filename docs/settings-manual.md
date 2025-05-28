# Be Automated CRM - Einstellungen Handbuch

## Inhaltsverzeichnis
1. [Datenverwaltung](#datenverwaltung)
   - [Datenexport](#datenexport)
   - [Datenimport](#datenimport)
   - [Datenaufbewahrung](#datenaufbewahrung)
2. [Pipeline-Einstellungen](#pipeline-einstellungen)
3. [Benachrichtigungseinstellungen](#benachrichtigungseinstellungen)
4. [Integrationen](#integrationen)
   - [API-Keys](#api-keys)
   - [Webhooks](#webhooks)
   - [Verbundene Apps](#verbundene-apps)

## Datenverwaltung

### Datenexport
Die Datenverwaltung bietet Ihnen die Möglichkeit, Ihre CRM-Daten in verschiedenen Formaten zu exportieren:

#### Kontakte exportieren
- Exportieren Sie alle Ihre Kontakte als CSV-Datei
- Die exportierte Datei enthält folgende Informationen:
  - ID
  - Name
  - E-Mail
  - Telefon
  - Unternehmen
  - Deal-Wert
  - Status
  - Tags
  - Letzter Kontakt
  - Erstellungsdatum
  - Aktualisierungsdatum

#### Deals exportieren
- Exportieren Sie alle Ihre Deals als CSV-Datei
- Die exportierte Datei enthält folgende Informationen:
  - ID
  - Name
  - Wert
  - Stage
  - Wahrscheinlichkeit
  - Erwartetes Abschlussdatum
  - Erstellungsdatum
  - Aktualisierungsdatum

### Datenimport
- Importieren Sie Kontakte aus einer CSV-Datei
- Die CSV-Datei sollte folgende Spalten enthalten:
  - Name
  - E-Mail
  - Telefon
  - Unternehmen
  - Weitere optionale Felder
- Eine Vorlage für die CSV-Datei steht zum Download bereit

### Datenaufbewahrung
- Legen Sie fest, wie lange inaktive oder gelöschte Daten im System aufbewahrt werden sollen
- Standardeinstellung: 365 Tage
- Mindestaufbewahrungszeit: 30 Tage
- Die Einstellung wird für zukünftige Daten angewendet
- Bestehende Daten folgen der vorherigen Richtlinie, bis sie manuell bereinigt werden

## Pipeline-Einstellungen
- Passen Sie die Pipeline-Stages an Ihre Bedürfnisse an
- Funktionen:
  - Neue Stage hinzufügen
  - Bestehende Stages bearbeiten
  - Stages löschen
  - Reihenfolge der Stages per Drag & Drop anpassen
  - Wahrscheinlichkeit pro Stage festlegen
  - Farben für Stages definieren

## Benachrichtigungseinstellungen
- Konfigurieren Sie Ihre Benachrichtigungspräferenzen:
  - E-Mail-Benachrichtigungen
    - Neue Leads
    - Aufgaben-Erinnerungen
    - Wöchentliche Zusammenfassungen
    - Gewonnene Deals
    - Verlorene Deals
  - Browser-Benachrichtigungen
  - Benachrichtigungshäufigkeit

## Integrationen

### API-Keys
- Erstellen und verwalten Sie API-Keys für die Integration mit anderen Systemen
- Funktionen:
  - Neuen API-Key erstellen
  - API-Key kopieren
  - API-Key löschen
  - Anzeige des Erstellungsdatums und letzten Verwendungszeitpunkts
- Sicherheitshinweise:
  - API-Keys sollten sicher aufbewahrt werden
  - Nicht verwendete API-Keys sollten gelöscht werden
  - Jeder API-Key sollte einen aussagekräftigen Namen haben

### Webhooks
- Konfigurieren Sie Webhooks für automatische Benachrichtigungen
- Verfügbare Events:
  - `contact.created`: Neuer Kontakt erstellt
  - `contact.updated`: Kontakt aktualisiert
  - `deal.created`: Neuer Deal erstellt
  - `deal.updated`: Deal aktualisiert
  - `deal.won`: Deal gewonnen
  - `deal.lost`: Deal verloren
- Funktionen:
  - Webhook-URL hinzufügen
  - Events für Webhook auswählen
  - Webhook aktivieren/deaktivieren
  - Webhook löschen
  - Anzeige des Erstellungsdatums und letzten Auslösungszeitpunkts

### Verbundene Apps
- Verwalten Sie die Verbindungen zu anderen Anwendungen
- Funktionen:
  - App verbinden/trennen
  - Status der Verbindung anzeigen
  - Verbindungszeitpunkt anzeigen
- Verfügbare Apps:
  - Google Calendar
  - Microsoft Teams
  - Slack
  - Zapier
  - Weitere Apps werden regelmäßig hinzugefügt

## Wichtige Hinweise
- Alle Einstellungen werden automatisch gespeichert
- Änderungen an der Datenaufbewahrung werden nur auf zukünftige Daten angewendet
- Die Funktion "Alle Daten löschen" ist eine kritische Operation und erfordert eine Bestätigung
- Exportierte CSV-Dateien können in gängigen Tabellenkalkulationsprogrammen geöffnet werden
- Stellen Sie sicher, dass Ihre CSV-Importdateien dem vorgegebenen Format entsprechen

## Best Practices
1. **Regelmäßige Backups**
   - Exportieren Sie Ihre Daten regelmäßig als CSV
   - Bewahren Sie die Exporte an einem sicheren Ort auf

2. **Datenaufbewahrung**
   - Setzen Sie die Aufbewahrungsfrist entsprechend Ihrer gesetzlichen Anforderungen
   - Berücksichtigen Sie dabei die DSGVO-Compliance

3. **Pipeline-Anpassung**
   - Strukturieren Sie Ihre Pipeline nach Ihren Geschäftsprozessen
   - Verwenden Sie aussagekräftige Namen für die Stages

4. **Benachrichtigungen**
   - Aktivieren Sie nur die Benachrichtigungen, die für Sie relevant sind
   - Wählen Sie eine angemessene Benachrichtigungshäufigkeit

5. **Integrationen**
   - Verwenden Sie aussagekräftige Namen für API-Keys
   - Testen Sie Webhooks nach der Erstellung
   - Überprüfen Sie regelmäßig die Aktivität der verbundenen Apps
   - Trennen Sie nicht mehr benötigte Verbindungen 