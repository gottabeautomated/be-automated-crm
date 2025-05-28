# Fehlerbehebung: `rrulestr` nicht gefunden

Wenn der Linter oder TypeScript den Fehler meldet, dass `rrulestr` kein exportiertes Mitglied von `'rrule'` ist (`'"rrule"' has no exported member named 'rrulestr'`), obwohl der Import korrekt erscheint, können die folgenden Schritte helfen, das Problem zu diagnostizieren und zu beheben.

Dies tritt häufig auf, wenn es Probleme mit der Projektkonfiguration, den installierten Abhängigkeiten oder zwischengespeicherten Zuständen gibt.

## Schritte zur Fehlerbehebung

1.  **Abhängigkeiten prüfen und neu installieren:**
    *   Stelle sicher, dass `rrule` in deiner `package.json` als Abhängigkeit aufgeführt ist.
    *   Lösche den `node_modules`-Ordner und die Lock-Datei (`package-lock.json` oder `yarn.lock`):
        ```bash
        rm -rf node_modules
        rm package-lock.json # oder yarn.lock, falls du Yarn verwendest
        ```
    *   Installiere alle Abhängigkeiten neu:
        ```bash
        npm install # oder yarn install
        ```

2.  **`tsconfig.json` überprüfen:**
    *   Stelle sicher, dass die folgenden Compiler-Optionen (oder äquivalente) in deiner `tsconfig.json` gesetzt sind:
        ```json
        {
          "compilerOptions": {
            "esModuleInterop": true,
            "moduleResolution": "node", // oder "bundler" für neuere TS/Vite-Versionen
            // ... andere Optionen
          }
        }
        ```
    *   Überprüfe, ob unter `compilerOptions.types` Einträge vorhanden sind, die möglicherweise die automatische Typauflösung für `rrule` stören könnten.

3.  **Vite Cache leeren / Entwicklungsserver neu starten:**
    *   Wenn du Vite verwendest, stoppe den Entwicklungsserver.
    *   Starte ihn mit der `--force` Option, um den Modul-Cache neu zu erstellen:
        ```bash
        npm run dev -- --force # Passe dies an dein Start-Skript an
        # oder für Vite direkt:
        # npx vite --force
        ```
    *   Alternativ kannst du versuchen, den Vite-Cache-Ordner manuell zu löschen. Dieser befindet sich normalerweise unter `node_modules/.vite`.

4.  **`rrule` und `@types/rrule` Versionen abgleichen:**
    *   Die `rrule`-Bibliothek (ab Version 2.7.0) liefert ihre eigenen TypeScript-Typdefinitionen mit.
    *   Wenn du eine Version von `rrule` >= 2.7.0 verwendest, solltest du **kein** separates Paket `@types/rrule` installiert haben, da dies zu Konflikten führen kann.
        *   Deinstalliere es gegebenenfalls: `npm uninstall @types/rrule` oder `yarn remove @types/rrule`.
    *   Wenn du eine ältere Version von `rrule` (< 2.7.0) verwendest, benötigst du `@types/rrule`. Stelle sicher, dass die Version von `@types/rrule` mit deiner `rrule`-Version kompatibel ist. Überprüfe die `package.json` auf die installierten Versionen.

5.  **Korrekten Import in `src/lib/rruleUtils.ts` sicherstellen:**
    *   Nachdem die obigen Schritte durchgeführt wurden, sollte der Import in `src/lib/rruleUtils.ts` wie folgt aussehen:
        ```typescript
        import { RRule, RRuleSet, rrulestr, Weekday } from 'rrule';
        ```
    *   Die Verwendung von `rrulestr` sollte dann direkt erfolgen:
        ```typescript
        const rule = rrulestr(masterEvent.rruleString, { forceset: true }) as RRuleSet | RRule;
        ```

Wenn nach all diesen Schritten das Problem weiterhin besteht, überprüfe deine Editor-/IDE-Konfiguration. Manchmal können Linter- oder TypeScript-Plugins im Editor veraltete Informationen zwischenspeichern oder eigene Konfigurationen haben, die die korrekte Typauflösung behindern. Ein Neustart des Editors oder des TypeScript-Servers im Editor kann ebenfalls helfen. 