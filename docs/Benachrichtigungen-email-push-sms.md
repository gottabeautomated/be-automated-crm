# Implementierung der Speicherung von Benachrichtigungseinstellungen

Um die Benachrichtigungseinstellungen (E-Mail, Browser-Push) persistent zu machen, sind folgende Schritte notwendig:

## 1. Datenstruktur in Firestore definieren

- **Speicherort:** Eine Subcollection `settings` unter dem jeweiligen Benutzerdokument: `users/{userId}/settings`.
- **Dokument:** Innerhalb dieser Subcollection ein Dokument, z.B. `notificationPreferences`.
- **Felder im `notificationPreferences`-Dokument:**
  - `emailNotifications`: Objekt (Map)
    - `newLead`: Boolean
    - `taskReminder`: Boolean
    - `weeklySummary`: Boolean
    - `dealWon`: Boolean
    - `dealLost`: Boolean
    - *(Weitere E-Mail-Benachrichtigungstypen hier hinzufügen)*
  - `browserNotificationsEnabled`: Boolean
  - `notificationFrequency`: String (z.B. 'immediately', 'daily', 'weekly')
  - `smsNotificationsEnabled` (*zukünftig für SMS*): Boolean
  - `smsNotificationTypes` (*zukünftig für SMS*): Objekt (Map)
    - `criticalAlert`: Boolean

## 2. Service-Funktionen in Firebase erstellen/erweitern

Es sollte eine neue Datei `src/services/firebase/settingsService.ts` erstellt werden oder eine bestehende Service-Datei erweitert werden, die folgende Funktionen enthält:

- **`getUserNotificationSettings(userId: string): Promise<NotificationSettings | null>`**
  - Liest das `notificationPreferences`-Dokument aus `users/{userId}/settings`.
  - Gibt die Einstellungen zurück oder `null`, falls keine vorhanden sind.

- **`updateUserNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void>`**
  - Schreibt/aktualisiert das `notificationPreferences`-Dokument in `users/{userId}/settings` mit den übergebenen Einstellungen.
  - Verwendet `setDoc` mit `{ merge: true }`, um nur die geänderten Felder zu aktualisieren und bestehende nicht zu überschreiben, falls nur Teil-Updates gesendet werden.

*(Definition des `NotificationSettings`-Typs wäre hier hilfreich, z.B. in `src/types/settingsTypes.ts`)*

## 3. Integration in `NotificationSettingsTab.tsx`

- **Einstellungen laden:**
  - In einem `useEffect`-Hook beim Mounten der Komponente:
    - `auth.currentUser.uid` verwenden, um `getUserNotificationSettings` aufzurufen.
    - Die lokalen States (`emailNotifications`, `browserNotificationsEnabled`, `notificationFrequency`) mit den abgerufenen Daten initialisieren.
    - Standardwerte setzen, falls keine Einstellungen in Firestore gefunden werden.
- **Einstellungen speichern:**
  - Die `handle...Change`-Funktionen und `handleSaveNotificationSettings` müssen angepasst werden:
    - `updateUserNotificationSettings` mit `auth.currentUser.uid` und den aktuellen lokalen State-Werten aufrufen.
    - Nach erfolgreichem Speichern eine Bestätigungsmeldung (z.B. `toast.success()`) anzeigen.
  - Der separate "Speichern"-Button ist gut, um mehrere Änderungen auf einmal zu bestätigen. Alternativ könnten Änderungen auch direkt beim Umschalten eines Toggles gespeichert werden (mit individuellen `updateUserNotificationSettings`-Aufrufen).

## 4. Typdefinitionen (Optional, aber empfohlen)

- Erstellen einer Datei `src/types/settingsTypes.ts` (oder ähnlich) zur Definition der Struktur der `NotificationSettings`.
  ```typescript
  export interface EmailNotificationPreferences {
    newLead?: boolean;
    taskReminder?: boolean;
    weeklySummary?: boolean;
    dealWon?: boolean;
    dealLost?: boolean;
    // ... weitere Typen
  }

  export interface NotificationSettings {
    emailNotifications?: EmailNotificationPreferences;
    browserNotificationsEnabled?: boolean;
    notificationFrequency?: 'immediately' | 'hourly' | 'daily' | 'weekly' | 'never';
    smsNotificationsEnabled?: boolean; // Für zukünftige SMS-Funktion
    // ... weitere Einstellungen
  }
  ```

## Zukünftige Erweiterung: SMS-Benachrichtigungen

- Die Datenstruktur und Service-Funktionen können später erweitert werden, um SMS-Benachrichtigungspräferenzen zu unterstützen, sobald diese Funktionalität benötigt wird. 