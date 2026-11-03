# NamazVR – Gebetsassistent für Meta Quest und Handy

Web-App, die Schritt für Schritt durch das islamische Gebet führt – in VR (Meta Quest, WebXR) in einem virtuellen Gebetsraum, auf dem Handy als installierbare App (PWA) und am Computer im Browser.

## Funktionen
- Alle 5 Pflichtgebete (Fajr 2, Dhuhr 4, Asr 4, Maghrib 3, Isha 4 Rakʿāt) mit korrektem Ablauf
- Sprachen: Deutsch, Türkçe, English, العربية (von rechts nach links) – in den Einstellungen wählbar, beim ersten Start nach der Gerätesprache
- Jeder Schritt mit Arabisch, Umschrift und Bedeutung; auf Türkisch mit türkischer Umschrift und den in der Türkei üblichen Begriffen (Sübhâneke, Tahiyyât, Salli-Bârik, Rabbenâ)
- Gesichtslose Vorbeter-Figur zeigt die Haltung (Takbīr, Qiyām, Rukūʿ, Sujūd, Sitzen, Taslīm)
- Bodentafel vor dem Gebetsteppich – lesbar in Rukūʿ und Sujūd
- Bewegungsanzeige: Piktogramm mit Pfeil und Ansage („Verbeugen“, „Niederwerfen“, „Aufsetzen“ …) im Panel, auf der Bodentafel und als kurze Einblendung vor dem Blick
- Haltungserkennung in VR über Kopfhöhe und Blickneigung (Stehen, Rukūʿ, Sujūd, Sitzen, Kopfdrehung beim Taslīm) – mit Vibration, wenn die Haltung erreicht ist; der Auto-Modus wartet, bis du die Haltung eingenommen hast
- Mixed Reality („START AR“ auf der Quest): Gebetsteppich, Vorbeter und Tafel im eigenen Zimmer, der Moscheeraum wird ausgeblendet; Qibla per „Hier ist die Qibla“ (Blickrichtung) oder Nord-Kalibrierung, „Teppich hierher“ legt den Platz unter die Füße
- Handerkennung (ohne Controller): prüft Hände beim Takbīr, übereinandergelegt, auf den Knien, auf dem Boden, auf den Oberschenkeln und beim Bittgebet, mit Hinweis, was noch fehlt; erkennt den erhobenen Zeigefinger im Tashahhud
- Auto-Modus (schaltet automatisch weiter) und Vorlesen (Sprachausgabe)
- Qibla: Stadt oder GPS wählen, nach Norden schauen, kalibrieren → der Mihrab zeigt nach Mekka
- Tasbīḥ-Zähler (33 / 33 / 34)
- Gebetszeiten offline aus dem Sonnenstand: aktuelles und nächstes Gebet mit Countdown im Menü, Tagesübersicht, Methoden MWL, Diyanet (Näherung), ISNA, Ägypten, Umm al-Qura sowie Asr Standard/Ḥanafī; Näherung für hohe Breiten im Sommer
- Rechtsschule wählbar (Ḥanafī, Shāfiʿī, Mālikī, Ḥanbalī): Handhaltung, Eröffnungs-Bittgebet, Rafʿ al-Yadayn, Sitzhaltung (Iftirāsh/Tawarruk), Qunūt, Witr-Form, Asr-Berechnung
- Anleitung für Männer oder Frauen (Handhaltung, Verbeugung, Niederwerfung, Sitzen, ʿAwra, Hinweise); Vorbeterin mit Kopftuch
- Weitere Gebete: Sunnah vor/nach den Pflichtgebeten, Witr, Jumuʿa, Taḥiyyat al-Masjid
- Wuḍūʾ-Trainer: 12 Schritte mit Körper-Piktogramm, Pflicht/Sunnah je Rechtsschule
- Lernen & Quiz: 24 Fragen (zufällig 10), Fortschritt, Tage in Folge, Abzeichen
- Anfänger-Modus (langsamer, liest jeden Schritt vor) und Spiritueller Modus (innere Bedeutung jedes Schritts, Atem-Dhikr im Tasbīḥ)
- Vier große Moscheen (26–60 m): Klassisch, Osmanisch, Andalusisch und Großmoschee mit Nebenkuppeln, Emporen und Buntglas; jede mit Minbar; nachts dunkle Fenster und hellere Lampen (freie Gestaltungen, keine Nachbauten)
- Cemaat (Gemeinschaftsgebet): Imam vorn, Gemeinde in Reihen (klein oder groß wie am Freitag); im natürlichen Takt folgt jeder mit eigener Verzögerung, eigenem Tempo und kleinen Abweichungen, ein Nachzügler kommt in der zweiten Rakʿa und holt sie nach dem Salām nach; danach Bittgebet im Sitzen; der Imam spricht Takbīr, „Samiʿa llāhu…“ und Salām (wenn das Gerät eine arabische Stimme hat); Frauenreihen hinter den Männern
- Durch die Moschee gehen: W A S D am Computer, Stick auf der Quest
- Handy-Version: Figur oben, Bedienung unten, Qibla-Kompass über den Handy-Sensor, installierbar und offline nutzbar

## Lokal testen (ohne Headset)
```bash
python3 -m http.server 8080
```
Dann http://localhost:8080 öffnen. Maus ziehen = umsehen, Klick = Button, ← / → = Schritte.
Handy-Ansicht am Computer testen: http://localhost:8080/?mobile (oder das Browserfenster schmal machen).

Für VR-Simulation im Browser: Chrome-Erweiterung **Immersive Web Emulator** (von Meta) installieren.

## Auf die Meta Quest bringen
WebXR braucht HTTPS. Am einfachsten:
1. Ordner auf **GitHub Pages**, **Netlify** oder **Vercel** hochladen (kostenlos).
2. Die URL im **Meta Quest Browser** öffnen → „ENTER VR“.
3. Optional: Als PWA installieren oder später mit **Bubblewrap** als echte Quest-App (APK) für den Meta Horizon Store verpacken.

## Als Handy-App (iOS / Android)
- **Sofort:** Seite auf dem Handy öffnen → „Zum Home-Bildschirm“ (iOS: Teilen-Menü, Android: Menü → „App installieren“). Dann startet sie wie eine App, auch offline.
- **Für App Store / Google Play:** Mit [Capacitor](https://capacitorjs.com) verpacken (`npm i @capacitor/core @capacitor/cli`, `npx cap init`, `npx cap add ios` / `android`). Für iOS braucht man Xcode und ein Apple-Developer-Konto (99 $/Jahr), für Android Android Studio und ein Google-Play-Konto (einmalig 25 $).

## Dateien
- `src/i18n.js` – Sprachwahl und Textzugriff `t()`
- `src/lang/de.js`, `tr.js`, `en.js`, `ar.js` – alle Texte je Sprache (Oberfläche, Anleitungen, Bedeutungen, Quiz)
- `src/prayer.js` – Gebete, arabische Texte, Rechtsschulen, Unterschiede Frauen/Männer, Schrittfolge
- `src/hands.js` – Handhaltung aus der Hand-Erkennung
- `src/wudu.js` – Gebetswaschung und Körper-Piktogramm
- `src/learn.js` – Quiz, Fortschritt, Abzeichen
- `src/spirit.js` – Spiritueller Modus (innere Bedeutung, Atem-Rhythmus)
- `src/mobile.js` – Handy-Oberfläche und Kompass
- `src/figure.js` – Vorbeter-Figur und Haltungen
- `src/panel.js` – Bedienpanel, Bodentafel und Bewegungs-Einblendung
- `src/movement.js` – Bewegungsansagen, Piktogramme, Haltungserkennung
- `src/environment.js` – Gebetsräume in vier Stilen
- `src/congregation.js` – Imam und Gemeinde für das Gemeinschaftsgebet
- `src/qibla.js` – Qibla-Berechnung und Städte
- `src/prayertimes.js` – Gebetszeiten-Berechnung
- `src/main.js` – Szene, Eingabe (Maus, Touch, Controller, Hand-Tracking), Zustand
- `manifest.webmanifest`, `sw.js`, `icons/` – installierbare App (PWA), offline

## Hinweis
Lernhilfe nach verbreiteter sunnitischer Praxis. Die Unterschiede der Rechtsschulen und zwischen Frauen und Männern sind vereinfacht dargestellt. Vor einer Veröffentlichung sollten ein Imam oder Gelehrte die Inhalte prüfen.
