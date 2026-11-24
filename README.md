# BonsaiPilot

- [Präsentation](https://nellalalalalala.github.io/)
- [Präsentations-Canvas](https://nellalalalalala.github.io/canvas/)
- [Interaktive App-Demo](https://nellalalalalala.github.io/app/)

Statische Veröffentlichung für GitHub Pages: `main`, Verzeichnis `/`.
Die drei Ansichten benötigen keinen Build-Schritt. Profil und Spielstände bleiben im Browser des jeweiligen Geräts.

## Gemini-Co-Pilot

Nur der Chat verwendet ein separates API auf dem PC über Cloudflare HTTPS.
Der API-Schlüssel bleibt auf dem PC und ist in diesem Repository nicht enthalten.
Ist der PC oder Tunnel offline, funktionieren die Präsentation, der Canvas und das Baum-Spiel weiter.
Für die Verbindung werden signierte App-Sitzungen im Arbeitsspeicher der Seite verwendet, keine Drittanbieter-Cookies.
Bei einem Wechsel der Quick-Tunnel-Adresse muss `app/api-config.json` auf die neue HTTPS-Adresse aktualisiert werden.

## Aktualisieren

Die Quelle befindet sich auf dem PC in `florevia-presentation/public`.
`scripts/export_github_pages.py` im Quellprojekt exportiert in ein leeres Verzeichnis und nimmt die Backend-Adresse über `--backend` entgegen.
Keine privaten Konfigurationen, Serverdateien oder Laufzeitdaten mit veröffentlichen.
Die vorherige Website bleibt über die Git-Historie wiederherstellbar.

Fotos und Schriften: Lizenzangaben unter `assets/photos/`, `assets/fonts/` und im Bildnachweis der App.
