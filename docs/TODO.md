# TODO Liste für CRM-Anwendung

- [ ] **DealDetailModal weiter ausarbeiten:**
  - [ ] Design verfeinern und an das Gesamtdesign anpassen.
  - [ ] Überlegen, welche weiteren Informationen oder Aktionen relevant sind (z.B. verknüpfte Kontakte/Aktivitäten anzeigen, Links zu anderen Bereichen).
  - [ ] Buttons für "Bearbeiten" und "Löschen" (falls gewünscht) aus dem Modal heraus implementieren. Dafür müssten die entsprechenden Callback-Funktionen (`onEdit`, `onDelete`) von `DealsPage` an `DealDetailModal` durchgereicht werden.
  - [ ] Ggf. eine Historie der Änderungen oder Aktivitäten zum Deal anzeigen.

- [ ] **Filterfunktionalität auf der Kontaktseite implementieren.**

- [ ] **Weitere Filteroptionen auf der Deal-Pipeline-Seite hinzufügen (Datumsbereich, Wertbereich, Tags).**

- [ ] **"Quick Tip"-Bereich in der Sidebar mit dynamischen Inhalten füllen.**

- [ ] **Firebase Functions für komplexere Backend-Logik oder Trigger erstellen (z.B. Benachrichtigungen).**

- [ ] **Benachrichtigungs-Icon im Header mit Funktionalität versehen.**

- [ ] **Platzhalter für Logo und Benutzer-Avatar im Header durch tatsächliche Bilder/Daten ersetzen.**

- [ ] **Vollständige Implementierung der Authentifizierung (z.B. Passwort zurücksetzen, Registrierung falls benötigt).**

- [ ] **Tests schreiben (Unit-Tests, Integrationstests).**

- [ ] **Deployment-Strategie festlegen und umsetzen.**

- [ ] **Aktivitäten-Timeline: Uhrzeit für Aktivitäten ermöglichen:**
  - [ ] `ActivityFormData` in `src/types/activityTypes.ts` erweitern (z.B. um `activityTime: string`).
  - [ ] In `AddActivityModal.tsx` ein separates Input-Feld für die Uhrzeit hinzufügen.
  - [ ] Logik in `AddActivityModal.tsx` anpassen, um Datum und Uhrzeit zu einem `Timestamp` zu kombinieren.
  - [ ] `formatDate`-Funktion in `ActivityItem.tsx` anpassen, um auch die Uhrzeit anzuzeigen (z.B. `dd.MM.yyyy HH:mm`).

- [ ] **Aktivitäten-Timeline: Automatische Assessment-Erstellung für vergangene Kalendertermine (Feature für später):**
  - [ ] Konzept für Kalenderfunktion und Speicherung von Terminen in Firestore entwickeln (`users/{userId}/calendarEvents/{eventId}`).
  - [ ] Firebase Cloud Function entwerfen:
    - [ ] Zeitgesteuert (Scheduled Function) oder Trigger-basiert.
    - [ ] Logik zum Abrufen von Kalenderterminen und vorhandenen Aktivitäten/Assessments.
    - [ ] Logik zum Identifizieren von Terminen, die ein Assessment benötigen.
    - [ ] Automatische Erstellung eines Assessment-Platzhalters in der Timeline oder In-App-Benachrichtigung.
  - [ ] Ggf. UI zur Konfiguration dieses Features oder zur einfachen Bearbeitung der generierten Assessments.

- [ ] **Firebase Function für E-Mail-Versand von Assessment-Ergebnissen implementieren:**
  - [ ] Firebase Functions im Projekt einrichten (falls noch nicht geschehen).
  - [ ] E-Mail-Dienst auswählen und konfigurieren (z.B. SendGrid, Mailgun, oder direkter SMTP-Versand über NodeMailer).
  - [ ] Firebase Function `sendAssessmentEmail` erstellen:
    - [ ] Nimmt `SendEmailData` (definiert in `src/types/assessmentTypes.ts`) als Parameter.
    - [ ] Verwendet den konfigurierten E-Mail-Dienst zum Versenden der E-Mail.
    - [ ] Behandelt Fehler und gibt einen entsprechenden Status zurück.
  - [ ] In `src/services/firebase/assessmentService.ts` die Funktion `sendAssessmentResultEmailService` anpassen:
    - [ ] Den simulierten Aufruf durch einen tatsächlichen Aufruf der Firebase Function (`httpsCallable`) ersetzen.
    - [ ] Sicherstellen, dass Authentifizierung und Fehlerbehandlung korrekt implementiert sind.
  - [ ] Sicherheitsregeln für Firebase Functions prüfen und anpassen.
  - [ ] Ausführliche Tests der E-Mail-Funktionalität durchführen.

- [ ] **Kalenderfunktion: Problem mit Endzeit-Initialisierung im Modal beheben:**
  - [ ] Untersuchen, warum die Endzeit im `AddEditEventModal` bei einem einzelnen Klick auf einen Kalenderslot nicht korrekt basierend auf der Event-Typ-Dauer berechnet wird, sondern auf einen festen Wert springt (z.B. 26.5. 10 Uhr).
  - [ ] Die Logik in den `useEffect`-Hooks des Modals (insbesondere die Behandlung von `initialEndTime` und `hasExplicitEndTime`) überprüfen und korrigieren, um sicherzustellen, dass die Endzeit korrekt initialisiert wird.
  - [ ] Sicherstellen, dass die Unterscheidung zwischen "Ziehen eines Zeitbereichs" und "Klick auf einzelnen Slot" im Modal korrekt gehandhabt wird.

- [ ] **Kalenderfunktion: Monatsansicht zeigt keine Termine an:**
  - [ ] Untersuchen, warum in der Monatsansicht keine Termine angezeigt werden, obwohl Daten vorhanden sind und andere Ansichten (Tag, Woche) funktionieren.
  - [ ] Mögliche Ursachen prüfen: CSS-Konflikte (globale Stile, Tailwind-Interferenzen, spezifische Monatsansicht-Stile von react-big-calendar), Interferenz durch das `withDragAndDrop` HOC, fehlerhafte Event-Props oder interne Darstellungslogik der Bibliothek für die Monatsansicht.
  - [ ] DOM-Inspektion und CSS-Debugging in den Entwicklertools des Browsers durchführen, um unsichtbare oder falsch positionierte Event-Elemente zu identifizieren.
  - [ ] Ggf. testweise `react-big-calendar.css` nach Tailwind CSS importieren oder eine minimale Testimplementierung erstellen. 