# Tests

Automatische Tests für NamazVR. Sie öffnen die App in einem unsichtbaren Chromium (Handy- und Computer-Ansicht)
und prüfen Inhalte, alle Ansichten und alle Abläufe. Die App selbst braucht weiterhin keinen Build.

```
cd tests
npm install
npx playwright install chromium
npm test                 # alles (etwa 2–3 Minuten)
npm test -- inhalte      # nur Tests, deren Name „inhalte“ enthält
```

Bei jedem Push laufen die Tests auch auf GitHub (Reiter „Actions“, Ablauf „Tests“).

## Was geprüft wird

- **Inhalte**: Türkisch, Englisch und Arabisch haben dieselben Texte wie Deutsch (nichts fehlt, nichts leer);
  alle Gebete × 4 Rechtsschulen × Männer/Frauen, Waschung, Umre, Hac, Cem, Semah und Geschichten bauen vollständige Schritte;
  Rakʿāt, 7 Tavaf-Runden, 7 Saʿy-Strecken, Steinwürfe, Verszahlen der Suren; Qibla-Richtung für vier Städte,
  Gebetszeiten in Berlin zur Tagundnachtgleiche, Beginn des Ramadan 1447.
- **Oberfläche**: jede Ansicht in jeder Sprache, am Handy und am Computer – ohne Fehler, ohne unübersetzte Schlüssel,
  am Handy steht nichts seitlich über.
- **Abläufe**: jedes Gebet und die Waschung bis zum Ende, Gemeinschaftsgebet, Empore, Kinder-Modus mit Stern,
  Umre und Hac durch alle Orte, Cemevi (Frauen ohne Kopftuch), alle Geschichten mit Frage und Stern
  (dabei ist nie eine Figur zu sehen), Sternenhimmel.
- **Funktionen**: Profile mit eigenem Fortschritt, Einstellungen bleiben nach dem Neuladen, Erinnerung und Kalender-Export.
- **Seiten**: Anleitung und Beta-Seite, Sprungmarken, vorhandene Dateien.

Nicht geprüft werden können: echte VR-Brille (Haltungserkennung, Hände), hörbarer Ton und die Stimmen-Downloads.

## Bildschirmfotos zum Ansehen der Gestaltung

```
node shots.mjs <Zielordner>            # alle Ansichten, Handy und Computer
node shots.mjs <Zielordner> handy      # nur Handy
```
