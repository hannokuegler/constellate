# Video-Actionplan · Sonntag 04.10.2026 · Europe/Vienna

Stand 04:27. **Ziel: drei Videos bis 14:00 hochgeladen**, je 0:58 geplant, unter 60 s; Englisch, 16:9, MP4 H.264, 1920×1080, 30 fps (MOV alternativ). Rollen: Osman Team, Recep Demo, Hanno Tech und ElevenLabs. **Schnittwerkzeug offen: keines vorhanden.** Recep wählt bis 08:00 ein verfügbares Programm (CapCut / iMovie / DaVinci), richtet es ein und testet Import, Untertitel und Export; vor Auswahl keine Festlegung. Zeitfenster unten sind Produktionsvorschläge.

## Team · Osman filmt

| Schritt | Wer | Bis wann | Werkzeug | Done-Kriterium |
|---|---|---|---|---|
| Ort, Licht, Probe | Osman + alle | 11:00 | Handy, Stoppuhr | Ruhiger Ort festgelegt, Licht von vorn; quer 1080p/30, Augenhöhe; H/O/R und Schluss gestoppt, Hanno bestätigt Einwilligung |
| Gemeinsamer Dreh | Osman + alle | 12:20 | Handy | Ab 12:00 drei Takes je Person plus gemeinsamer Schluss; verständlicher Ton |
| Schnitt, Untertitel, Export | Osman; Recep prüft | 13:15 | Schnittprogramm offen; ffprobe | Beste Takes, bestätigte Namen, englische Untertitel; `constellate_team.mp4`, unter 60 s |

## Demo · Recep

| Schritt | Wer | Bis wann | Werkzeug | Done-Kriterium |
|---|---|---|---|---|
| P16 prüfen, Probe | Recep | ab 05:00; Probe 08:00, spätestens 09:00 | design-v2, Live-App, Stoppuhr | Intro 0:00–0:10 / Outro 0:54–0:58 gegen `origin/design-v2`; jede Szene gestoppt. Wenn App noch nicht bereit: Blocker an Hanno |
| Stimme / Motion wählen | Hanno; Recep hört | 09:00 | ElevenLabs; §2a | Stimme getestet; A/B/C und Musik entschieden |
| Bildweg, Skript-Freeze | Hanno + Recep | 11:00 | Live-App; ggf. Motion | A: Scroll-Story; B: 3-s-Titel innerhalb des Intros; C: Prompts 7/8 ersetzen 10-s-Intro/4-s-Outro. Clips geprüft, D1–D7 passend; Belege zeitgleich sichtbar |
| MP3s | Hanno + Recep | 11:15–11:45 | ElevenLabs | Sieben Blöcke D1–D7, Aussprache und Szenenlängen abgehört |
| Stumme Aufnahme | Recep | 12:45 | OBS oder QuickTime | Ab 12:00 vorbereiten, Team-Dreh 12:00–12:20; danach 2–3 stumme App-Takes, Live-URL sichtbar |
| Schnitt, Export | Recep; Osman Untertitel | 13:30 | Schnittprogramm offen; ffprobe | D1–D7 je Szene, Zooms im Schnitt, Belege lesbar; `constellate_demo.mp4`, unter 60 s |

Motion: Osman und Recep wollen Hybrid; **Hanno entscheidet A/B/C**. Empfehlung in §2a bleibt A. Bei instabiler Scroll-Story bis 09:00 den dortigen 5-s-Motion-Ersatz entscheiden und neu timen; bei unbrauchbarem Motion echte App-Bilder. Keine medizinischen Aussagen, Krankheits-/Gennamen, Zahlen, Logos, Kinder, Krankenhäuser oder Gesichter in Motion; nur erlaubter Prompt-Text.

## Tech · Hanno

| Schritt | Wer | Bis wann | Werkzeug | Done-Kriterium |
|---|---|---|---|---|
| Belege und Skript | Hanno | 11:00 | Editor/Terminal 16 pt; `make validate`; Build, `npm run e2e:run` | Grüne Läufe; echte Claude-Dateien für Extract/Explain samt Zeilen eingetragen, Fuzzy-Match gezeigt; T1 eingefroren |
| Stimme | Hanno | 11:15–11:45 | ElevenLabs | T1 abgehört, auf sechs Szenen passend |
| Aufnahme, Schnitt, Export | Hanno; Osman Untertitel | Aufnahme 12:20–12:45; fertig 13:30 | Bildschirmaufnahme; Schnittprogramm offen; ffprobe | Nach Team-Dreh Code/Terminal/App aufnehmen, T1 unterlegen; `constellate_tech.mp4`, unter 60 s |

**Gemeinsamer Abschluss:** Jeder prüft seinen Export mit `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 DATEI.mp4` (Ergebnis < 60), Bild, Ton und Untertitel. **13:30–14:00:** Osman Team, Recep Demo, Hanno Tech auf die offizielle Hackathon-Webseite laden; Links im privaten Fenster abspielen und in [SUBMISSION-TEXTS.md §9](SUBMISSION-TEXTS.md#9--links) eintragen. Osman prüft die konkreten Upload-Felder bis 09:00. Abgabe 15:00; ab 14:45 kein Push.

**Offen bei Hanno:** Motion A/B/C; Musik ja/nein; Stimme; „anywhere in the world“ (derzeit gestrichen, weltweiter Beleg fehlt); Track-Preis-Frage nach P15 mit der Orga klären.
