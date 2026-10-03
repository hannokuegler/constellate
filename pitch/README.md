# pitch/ · Story, Pitch, Videos, Stimme

Stand So 04.10.2026, ca. 02:00 (Wien), Branch `marketing` (davor `pitch-v2`). Dauer-Prompt der Marketing-Session: [docs/prompts/MARKETING-STANDING.md](../docs/prompts/MARKETING-STANDING.md). Überarbeitung nach dem Team-Feedback: **drei Pflichtvideos, jedes höchstens 60 Sekunden** (Team Introduction, Product Demo, Technical Walkthrough), Dateiformat MP4 oder MOV; Pitch mit weniger Fachbegriffen in der Reihenfolge Problem → Herangehensweise → Lösung. Entscheidungen P9 bis P11 ([docs/DECISIONS.md](../docs/DECISIONS.md)): Nora als Komposit-Mutter in zwei Momenten, Pitch „Herz zuerst", ElevenLabs `eleven_v4` für die Voice-over, Team-Video mit echten Gesichtern, Honest-Gap-Fall `MONDO:0012720`.

Quellenregel wie im Repo: jede Zahl und jede medizinische Aussage mit Primärquelle oder aus `app/public/data/meta.json` (Export `2026-10-03+397464a`), ⚠️-Punkte aus [docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) kommen nicht vor. Nora ist eine Komposit-Figur und wird so genannt. Keine Patientenorganisation wird genannt, solange `data/curated/orgs.csv` leer ist. Kein „cure"; Constellate ist Forschungs-Navigation, keine medizinische Beratung.

## Dateien

| Datei | Inhalt | Für wen zuerst |
|---|---|---|
| [STORY.md](STORY.md) | Die Verkaufsgeschichte aus drei Blickwinkeln (Mutter, Zuschauer, Jury), Problem in einem Satz, der Herz-Moment, Ohnmacht → Handlung, Honest Gap als Stärke, Einstiegs- und Schlusssatz, Liste dessen, was in keinem Video vorkommt | Hanno, Recep |
| [PITCH-60S.md](PITCH-60S.md) | 60-Sekunden-Pitch Wort für Wort (Problem 15 s → Herangehensweise 20 s → Lösung 20 s → Schluss 5 s), Kurzfassung 30 s, **Fachwort-Liste** (was ersetzt wurde und warum), Regie, Fußnoten mit Primärquellen | Hanno, Recep (Pitch 10.10., Discord-Text, HackOS-Beschreibung) |
| [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md) | Die drei 60-s-Videos: je Ziel, Zuschauer, Kernbotschaft, Shotlist mit Zeitcodes (Summe ≤ 0:58), Route, Voice-over Wort für Wort (≤ 135 Wörter), Beleg im Bild, Aufnahme-Checkliste, Schnitt, Export, wer, Deadline; Tech-Video mit exakten Dateien, Zeilen und Befehlen | Recep (Demo), Hanno (Tech), Osman (Team) |
| [VOICE-ELEVENLABS.md](VOICE-ELEVENLABS.md) | Voice-over mit `eleven_v4` nur noch für Demo (D1–D7) und Tech (T1): Stimmprofil, Regler, Skript-Blöcke je Request, Aussprache, Streichreihenfolge, Offenlegung | Hanno (Erzeugung), Recep (`.tts.txt`) |
| [MENTOR-INTRO.md](MENTOR-INTRO.md) | Vorstellung für das Mentor-Gespräch Woan-Yu Lin (03:45) in Pitch-v2-Sprache, Belegstand im Tool, Plan nach dem Gespräch je Antwort A/B/C | Hanno (spricht), Osman (Protokoll) |
| [SUBMISSION-TEXTS.md](SUBMISSION-TEXTS.md) | Abgabetexte v1 für HackOS und Google Form (Englisch, je Feld ein Code-Block): Name, Einzeiler, 50-Wort-Text, Langbeschreibung, OpenAI-Absatz in zwei Varianten, Stack, Quellen mit Lizenz, Team, Links, Offenlegung, Prüfbefehl | Osman (Abgabe 14:00), Hanno (Varianten wählen) |
| [MOTION-PROMPTS.md](MOTION-PROMPTS.md) | Sechs Prompts für kurze Motion-Clips, alle **nur für den Pitch am 10.10. und Teaser nach der Abgabe** markiert; in den 60-s-Videos kein Platz (höchstens eine 2-s-Titelkarte in Klartext) | Hanno, nach der Abgabe |

## Was sich gegenüber dem Stand 03:00 geändert hat

1. Vier Videos (Demo 2:00, Walkthrough 1:00, Tech 3:00, Team 60–90 s) sind durch **drei Videos à ≤ 60 s** ersetzt. Der Brief-Walkthrough („follow a family or patient group through the graph") ist die Product Demo. Pelizaeus-Merzbacher als Gegenbeispiel passt nicht in 60 s und bleibt im Tool und im Tech-Video.
2. Pitch und Voice-over ohne unerklärte Fachbegriffe: „knowledge graph" → „map", „mechanism" → „what goes wrong in the body", „natural-history cohort" → „a study that followed untreated children for years", „phenotype similarity" → „shared symptoms", „edge" → „line". Liste mit Begründung in PITCH-60S.md.
3. Keine Zahlen mehr im gesprochenen Text (874, 1.066, 251, 17, 0,22); sie stehen auf `/methods`, im Bild und in den Fußnoten.
4. Voice-over-Bedarf sinkt auf ca. 1.650 Zeichen (vorher 5.600).

## Befunde aus dem Export, die vor dem Dreh gelten

1. `e_e270315fe572` (Krabbe → MLD) ist eine `similar_phenotype`-Kante (`inferred`, Konfidenz 0,216), nicht die „shared gene PSAP"-Kante. Demo sagt „linked by shared symptoms, formula shown"; die PSAP-Brücke zeigt `/g/PSAP`.
2. **Update 01:15 (Export `2026-10-04+f35b3a5`):** `approved_therapies` und `assets` sind live (Libmeldy bei MLD mit EMA-Quelle, Krabbe 0 Treffer in EMA/FDA), die Therapie-Sätze D1 und D5 sind damit im Tool belegt. Vorher: `approved_therapies` und `assets` fehlten im Export (PR #1 `data-v2` im Review), `orgs.csv` hat nur die Kopfzeile, `docs/MOONSHOT.md` fehlt. Folge: keine Organisation, keine 10×-Zahl; die beiden Therapie-Sätze (Krabbe ohne Medikament, MLD-Gentherapie) nur mit sichtbarem Beleg in der Action Card, sonst Ersatzsätze (in VIDEO-STRATEGY und VOICE-ELEVENLABS markiert).
3. Honest-Gap-Fall `MONDO:0012720` (P11): ClinicalTrials.gov 0, NIH RePORTER 0, Europe PMC 2 im Export vom 2026-10-03; Osman bestätigt die Org-Lage.

## Offene Punkte für Hanno

| # | Frage | Empfehlung hier |
|---|---|---|
| 1 | Stimme Y in ElevenLabs | So 09:00 mit den Testsätzen wählen, eine Stimme für Demo und Tech |
| 2 | Sterne-Sätze (Therapie) in der Demo | Entscheidung um 12:00 an der Live-Action-Card; ohne Pipeline-Beleg Ersatzsätze |
| 3 | Titelkarte im Team-Video | Klartext (2 s), kein Motion-Clip |
| 4 | Motion | nur nach der Abgabe, nur Pitch-Opener 10.10. und Teaser |
| 6 | Persona Maria statt Nora (Osmans Wunsch, umgesetzt in allen `pitch/`-Dateien) | DECISIONS P9 nachtragen (sagt noch Nora und „Maria verworfen"); Abgleich mit dem Brief in [STORY.md](STORY.md) §2a: passt, eine Reibung (Moment 1 ist im Brief Devon) |
| 7 | Team-Video: Background statt Projektbeitrag | Texte H/O/R in [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md) §1; vor dem Dreh: Osman klärt, ob RBI genannt werden darf, Recep ergänzt, was er seit dem TGM macht, beide Nachnamen |
| 5 | Abgabetexte: Einzeiler A oder B, OpenAI-Absatz A oder B, Satz zu KI-Coding-Assistenten | A; OpenAI-Absatz um 11:00 nach echtem Stand (heute wäre B wahr); KI-Satz ja ([SUBMISSION-TEXTS.md](SUBMISSION-TEXTS.md) §12) |

## Zeitplan bis 15:00 (Aufnahme ab Freeze 12:00, Upload bis 14:00)

Quellen: [docs/SUBMISSION-CHECKLIST.md](../docs/SUBMISSION-CHECKLIST.md) §4, [docs/RESOURCES.md](../docs/RESOURCES.md) Video-Pipeline, [CLAUDE.md](../CLAUDE.md) Deadlines. Personenzeit für Videos ca. 3 h (Recep 80 min, Hanno 75 min, Osman 60 min).

| Zeit (So) | Hanno | Recep | Osman |
|---|---|---|---|
| bis 02:00 | `pitch/` v2 liegt vor (dieser Branch) | | |
| 06:00 | **Gate: End-to-End live**, Hero-Pfad klickbar auf der Production-URL | | |
| 06:00–08:00 | Extract mit Key, Explain echt, P1-Bugs | hero_path.yaml Block A (R1) | orgs.csv (O2), orgs_CHECK |
| 08:00–09:00 | | Probe-Take Demo gegen die Live-App timen (Cursor, Szenenlängen ≤ 0:58) | HackOS: Upload-Format (MP4/MOV direkt oder Link) und Längenlimit prüfen, Team in HackOS eintragen |
| 09:00 | ElevenLabs: Dashboard, Test-Call, Stimme Y wählen | | |
| 09:00–11:00 | Polish, Moonshot-Panel nur mit MOONSHOT.md | Skripte final + `.tts.txt` (Demo D1–D7, Tech T1), Einwilligung Team-Video einholen, MOONSHOT.md (R2) | README (O3), Lizenzen, Reproduce-Test vorbereiten |
| 11:00 | **Repo public.** `make validate` und `npm run build` für das Tech-Video vorbereiten | **Skripte eingefroren** | Reproduce-Test auf frischem Clone |
| 11:00–12:00 | Quality-Gates mit Osman (Live-URL, Hero-Pfad, Honest Gap, Edge-Quellen, OpenAI 3×, Fallback, README, Lizenzen, Secrets) | Kanten-IDs aus VIDEO-STRATEGY §0 im Live-Tool prüfen | Quality-Gates prüfen |
| 11:15–11:45 | MP3s erzeugen (Demo 7, Tech 1), Hörprobe mit Recep | Hörprobe | |
| **12:00** | **Feature-Freeze.** Danach nur P1-Bugs. Entscheidung Sterne-Sätze an der Live-Action-Card | | |
| 12:00–12:45 | Tech-Video aufnehmen (Terminal, Editor, Browser) | Demo-Pfad stumm aufnehmen, 2–3 Takes (12:00–12:30) | Team-Video filmen (alle drei, gleicher Ort, 12:00–12:30) |
| 12:45–13:30 | Tech schneiden, Audio unterlegen, Untertitel, Export, Länge < 60 s prüfen | Demo schneiden, Audio D1–D7 unterlegen, Export, Länge prüfen | Team-Video schneiden, Namens-Einblendungen, Untertitel; ab 13:15 Untertitel Demo/Tech |
| 13:30–14:00 | Upload Tech, Link im privaten Fenster prüfen | Upload Demo, Link prüfen | Upload Team, Link prüfen |
| 13:45 | Alle drei Links im Teamboard (Bereich Links) und in `docs/STATUS.md` | | |
| **14:00** | **Alle drei Videos hochgeladen** | | |
| 14:00–14:30 | | | HackOS-Abgabe und Google Form, alle Felder, alle Links verifiziert |
| 14:30–14:45 | Zip des Repos als Backup | Discord-Post (Text aus PITCH-60S „Gesprochener Text am Stück"), letzter Live-URL-Check | MP4s als Backup auf Drive |
| **14:45** | **Nichts mehr pushen, kein Redeploy** | | |
| **15:00** | **Abgabe-Deadline** (9:00 ET), keine späte Abgabe | | |
| nach 15:00 | optional Motion-Clips (MOTION-PROMPTS.md), Pitch-Slides 10.10. nur falls Top 2 | | |

## Was nach der Abgabe kommt (nur falls Top 2)

Live-Pitch Sa 10.10., 3 Minuten: Hauptfassung aus PITCH-60S als erste Minute, dann Demo-Pfad live (Szenen 2 bis 6 der Product Demo, mit mehr Zeit auch das Gegenbeispiel Pelizaeus-Merzbacher), dann Moonshot aus `docs/MOONSHOT.md` mit Annahmen. Opener optional aus MOTION-PROMPTS Prompt 6. Slides: Gliederung in [docs/PITCH-OUTLINE_draft.md](../docs/PITCH-OUTLINE_draft.md).
