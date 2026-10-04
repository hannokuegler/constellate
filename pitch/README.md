# pitch/ · Story, Pitch, Videos, Stimme

Stand So 04.10.2026, 04:27 (Europe/Vienna), Branch `recep-video`. Team-Texte nach den Antworten von Osman und Recep aktualisiert; P14–P16 gegen `origin/orchestrator:docs/DECISIONS.md` gelesen. Genau drei Videos: Team, Demo, Tech; je 0:58 geplant, unter 60 s, MP4 H.264 1920×1080/30 fps oder MOV. Maria ist die Figur aus dem Challenge-Brief, nur in Video und Pitch; in der App keine Persona-Auswahl oder Moment-Karten. Extract und Explain mit Claude, Reconcile als Fuzzy-Match. Hanno entscheidet und merged.

Quellenregel wie im Repo: jede Zahl und jede medizinische Aussage mit Primärquelle oder aus `app/public/data/meta.json` (Export `2026-10-04+f35b3a5`), ⚠️-Punkte aus [docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) kommen nicht vor. Maria wird mit „Meet Maria, from the challenge brief" und „not a real person" im Bild eingeführt. Jeder gesprochene Produkt- oder Evidenzfakt muss gleichzeitig im Tool sichtbar sein. Keine Patientenorganisation wird genannt, solange `data/curated/orgs.csv` leer ist. Kein „cure"; Constellate ist Forschungs-Navigation, keine medizinische Beratung.

## Dateien

| Datei | Inhalt | Für wen zuerst |
|---|---|---|
| [STORY.md](STORY.md) | Die Verkaufsgeschichte aus drei Blickwinkeln (Mutter, Zuschauer, Jury), Problem in einem Satz, der Herz-Moment, Ohnmacht → Handlung, Honest Gap als Stärke, Einstiegs- und Schlusssatz, Liste dessen, was in keinem Video vorkommt | Hanno, Recep |
| [PITCH-60S.md](PITCH-60S.md) | 60-Sekunden-Pitch Wort für Wort (Problem 15 s → Herangehensweise 20 s → Lösung 20 s → Schluss 5 s), Kurzfassung 30 s, **Fachwort-Liste** (was ersetzt wurde und warum), Regie, Fußnoten mit Primärquellen | Hanno, Recep (Pitch 10.10., Discord-Text, HackOS-Beschreibung) |
| [VIDEO-ACTIONPLAN.md](VIDEO-ACTIONPLAN.md) | Einseitiger Produktionsplan: Zuständigkeiten, Voraussetzungen, Zeiten, Werkzeuge, Done-Kriterien, Upload und offene Hanno-Entscheidungen | alle drei |
| [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md) | Die drei 60-s-Videos: je Ziel, Zuschauer, Kernbotschaft, Shotlist mit Zeitcodes (Summe ≤ 0:58), Route, Voice-over Wort für Wort (≤ 135 Wörter), Beleg im Bild, Aufnahme-Checkliste, Schnitt, Export, wer, Deadline; Tech-Video mit Befehlen; tatsächliche Claude-Dateien und Zeilen ergänzt Hanno bis 11:00 | Recep (Demo), Hanno (Tech), Osman (Team) |
| [VOICE-ELEVENLABS.md](VOICE-ELEVENLABS.md) | Voice-over mit `eleven_v4` nur noch für Demo (D1–D7) und Tech (T1): Stimmprofil, Regler, Skript-Blöcke je Request, Aussprache, Streichreihenfolge, Offenlegung | Hanno (Erzeugung), Recep (`.tts.txt`) |
| [MENTOR-INTRO.md](MENTOR-INTRO.md) | Vorstellung für das Mentor-Gespräch Woan-Yu Lin (03:45) in Pitch-v2-Sprache, Belegstand im Tool, Plan nach dem Gespräch je Antwort A/B/C | Hanno (spricht), Osman (Protokoll) |
| [SUBMISSION-TEXTS.md](SUBMISSION-TEXTS.md) | Abgabetexte v1 für HackOS und Google Form (Englisch, je Feld ein Code-Block): Name, Einzeiler, 50-Wort-Text, Langbeschreibung, KI-Absatz (seit P15 Claude, OpenAI als Reserve), Stack, Quellen mit Lizenz, Team, Links, Offenlegung, Prüfbefehl | Osman (Abgabe 14:00), Hanno (Varianten wählen) |
| [MOTION-PROMPTS.md](MOTION-PROMPTS.md) | Acht Prompts: 1–6 für Pitch/Teaser; 7/8 als Demo-Hybrid nur nach Hanno-Entscheidung A/B/C (§2a), Verbotsliste beachten | Hanno, Recep |

## Aktueller Video-Stand

- Osman und Recep: je 34 Wörter; Namen und Einblendungen final. Hannos Text bleibt unverändert (41 Wörter), ebenso der gemeinsame Schluss. Echte 16-s-Takes und Schluss mit Stoppuhr prüfen.
- D1 ohne Therapie-Satz: Im Intro fehlt der gleichzeitige Beleg. D5 nur passend zur sichtbaren Action Card; vor dem Skript-Freeze festlegen. T1 nennt Claude für Extract/Explain und Fuzzy-Match für Reconcile.
- Osman und Recep bevorzugen Motion-Hybrid; Empfehlung seit P16 bleibt die echte Scroll-Story. Hanno entscheidet A/B/C und Musik bis 09:00.
- Schnittprogramm noch nicht vorhanden; Recep wählt und testet es bis 08:00. Die Team-Aufnahme findet gemeinsam vor den Bildschirmaufnahmen statt. Ablauf: [VIDEO-ACTIONPLAN.md](VIDEO-ACTIONPLAN.md).

## Befunde aus dem Export, die vor dem Dreh gelten

1. `e_e270315fe572` (Krabbe → MLD) ist eine `similar_phenotype`-Kante (`inferred`, Konfidenz 0,216), nicht die „shared gene PSAP"-Kante. Demo sagt „linked by shared symptoms, formula shown"; die PSAP-Brücke zeigt `/g/PSAP`.
2. **Update 01:15 (Export `2026-10-04+f35b3a5`):** `approved_therapies`, `assets` und `newborn_screening` sind live (MLD: Libmeldy EMA 2020-12-17, Lenmeldy FDA 2024-03-18; Krabbe 0 Zulassungen, EMA und FDA durchsucht), der Belegstand ist vor dem Dreh erneut zu prüfen; D1 enthält keine Therapie-Aussage. Vorher: `approved_therapies` und `assets` fehlten im Export (PR #1 `data-v2` im Review), `orgs.csv` hat nur die Kopfzeile, `docs/MOONSHOT.md` fehlt. Folge: keine Organisation, keine 10×-Zahl; D5 nur mit gleichzeitig sichtbarem Beleg in der Action Card, sonst Ersatztext (in VIDEO-STRATEGY und VOICE-ELEVENLABS markiert).
3. Honest-Gap-Fall `MONDO:0012720` (P11): ClinicalTrials.gov 0, NIH RePORTER 0, Europe PMC 2 im Export vom 2026-10-03; Osman bestätigt die Org-Lage.

## Offene Punkte

| Wer | Frage / Voraussetzung | Bis wann / Done |
|---|---|---|
| Recep | Schnittprogramm auswählen und einrichten; derzeit keines vorhanden | 08:00: Test-Import, Untertitel, 1080p-Export |
| Recep | P16-Startseite und Demo-Timing | Ab 05:00 Intro/Outro gegen design-v2; Probe 08:00 nach App-Bereitschaft, Blocker bis 09:00 an Hanno |
| Hanno | Motion A/B/C und Musik ja/nein | 09:00; Teamwunsch Hybrid, Empfehlung §2a A; bis Entscheidung ohne Musik |
| Hanno | ElevenLabs-Stimme | 09:00 Test mit Recep; eine Stimme für Demo und Tech |
| Hanno | „anywhere in the world“ | Derzeit gestrichen; nur mit passendem weltweitem Beleg und neuem Timing |
| Hanno + Recep | D5-Belege, tatsächliche Claude-Dateien/Zeilen und T1-Verhalten | 11:00 vor Skript-Freeze; 12:00 erneut am Aufnahme-Stand prüfen |
| Hanno | Track-Preis-Frage P15 mit der Orga klären; Abgabetext-Varianten | Vor Abgabe; [SUBMISSION-TEXTS.md](SUBMISSION-TEXTS.md) §12 |
| Osman | Offizielle Upload-Felder und Org-Lage für Honest Gap | 09:00; Upload-Ziel offizielle Hackathon-Webseite bestätigt |

## Zeitplan bis 15:00

Alle Zeiten Sonntag, Europe/Vienna. Ausführlicher Einseitenplan mit Werkzeugen und Done-Kriterien: [VIDEO-ACTIONPLAN.md](VIDEO-ACTIONPLAN.md).

| Zeit | Zuständigkeit und Ergebnis |
|---|---|
| ab 05:00 | Recep: design-v2-Abgleich für Demo-Anfang und -Ende |
| 06:00 | Hanno: bestehendes Gate End-to-End live; Hero-Pfad klickbar |
| bis 08:00 | Recep: Schnittprogramm bereit und Export getestet |
| 08:00–09:00 | Recep: Probe-Take gegen Live-App, Stoppuhr je Szene; Osman: Upload-Felder prüfen |
| 09:00 | Hanno: Stimme, Motion A/B/C, Musik entscheiden |
| bis 11:00 | Hanno/Recep: sichtbare Belege und Claude-Dateien prüfen, ggf. Motion-Clips fertig; Skripte einfrieren; Repo wird öffentlich |
| 11:15–11:45 | Hanno: sieben Demo-MP3s und T1; Hörprobe mit Recep |
| 12:00 | Feature-Freeze, D5 erneut prüfen; bei Änderung Ersatztext und Audio synchronisieren |
| 12:00–12:20 | Alle: Team-Dreh, Osman filmt drei Takes je Person und gemeinsamen Schluss |
| 12:20–12:45 | Recep: Demo stumm; Hanno: Tech; Osman: Team-Schnitt |
| bis 13:15 | Osman: Team exportieren, danach Untertitel Demo/Tech mitprüfen |
| bis 13:30 | Recep/Hanno: Demo/Tech mit Audio und Untertiteln exportieren; alle Längen mit ffprobe prüfen |
| 13:30–14:00 | Jeder lädt sein Video auf der offiziellen Webseite hoch, prüft den Link im privaten Fenster und trägt ihn in SUBMISSION-TEXTS §9 ein |
| 14:00 | Alle drei Videos hochgeladen; Osman vervollständigt Abgabefelder |
| 14:45 | Kein Push, kein Redeploy |
| 15:00 | Abgabe-Deadline |

## Was nach der Abgabe kommt (nur falls Top 2)

Live-Pitch Sa 10.10., 3 Minuten: Hauptfassung aus PITCH-60S als erste Minute, dann Demo-Pfad live (Szenen 2 bis 6 der Product Demo, mit mehr Zeit auch das Gegenbeispiel Pelizaeus-Merzbacher), dann Moonshot aus `docs/MOONSHOT.md` mit Annahmen. Opener optional aus MOTION-PROMPTS Prompt 6. Slides: Gliederung in [docs/PITCH-OUTLINE_draft.md](../docs/PITCH-OUTLINE_draft.md).
