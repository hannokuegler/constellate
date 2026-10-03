# pitch/ · Story, Pitch, Videos, Stimme

Stand So 04.10.2026, ca. 03:00 (Wien). Entwurf des Story-Agents auf dem Branch `pitch-story`; nichts hiervon ist entschieden, Entscheidungen trifft Hanno. Quellenregel wie im Repo: jede Zahl und jede medizinische Aussage mit Primärquelle oder aus `app/public/data/meta.json` (Export `2026-10-03+397464a`), ⚠️-Punkte aus [docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) kommen nicht vor. Die Mutter ist eine Komposit-Figur und wird so genannt. Keine Patientenorganisation wird genannt, solange `data/curated/orgs.csv` leer ist. Kein „cure"; Constellate ist Forschungs-Navigation, keine medizinische Beratung.

## Dateien

| Datei | Inhalt | Für wen zuerst |
|---|---|---|
| [STORY.md](STORY.md) | Die Verkaufsgeschichte aus drei Blickwinkeln (Mutter, Zuschauer, Jury), Problem in einem Satz, der Herz-Moment, Ohnmacht → Handlung, Honest Gap als Stärke, je drei Varianten für Einstiegs- und Schlusssatz mit Empfehlung, Liste dessen, was in keinem Video vorkommt | Hanno (Entscheidungen), Recep (Skript) |
| [PITCH-60S.md](PITCH-60S.md) | 60-Sekunden-Pitch Wort für Wort, Fassung A „Herz zuerst" (empfohlen) und Fassung B „Jury zuerst", Regie, Fußnoten mit Primärquellen | Hanno, Recep (Pitch 10.10., Discord-Text) |
| [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md) | Vier Pflichtvideos: Ziel, Zuschauer, Dramaturgie, Shotlist mit Zeitcodes, Route, Voice-over, sichtbarer Beleg (Kanten-ID, Quelle); Tech-Video mit Dateien, Zeilenbereichen und Terminal-Befehlen; Team-Video mit Fragen-Leitfaden; drei Befunde aus dem Export, die den Demo-Entwurf korrigieren | Recep (Demo, Walkthrough), Hanno (Tech), Osman (Team) |
| [VOICE-ELEVENLABS.md](VOICE-ELEVENLABS.md) | Voice-over mit `eleven_v4`: Stimmprofil, Regler, fertige Skript-Blöcke je Request (D1–D8, W1, T1–T2), Aussprache-Tabelle, Offenlegung, Ablauf mit Uhrzeiten | Hanno (Erzeugung), Recep (`.tts.txt`) |
| [MOTION-PROMPTS.md](MOTION-PROMPTS.md) | Sechs Prompts für kurze Motion-Clips (Intro-Bumper, Übergänge, Outro, Pitch-Opener 10.10.), jeder mit „Einsatz erlaubt"; nie als Ersatz für die Pflichtvideos, keine medizinischen Aussagen, keine Zahlen | Hanno, nach der Abgabe |

## Die drei Befunde, die vor dem Dreh beachtet werden müssen

1. `e_e270315fe572` (Krabbe → MLD) ist eine `similar_phenotype`-Kante (`inferred`, simGIC 0,22), **nicht** die „shared gene PSAP"-Kante aus dem Demo-Entwurf. Das Skript sagt jetzt „a phenotype similarity Constellate computed, formula shown"; die PSAP-Brücke zeigt `/g/PSAP`.
2. `app/public/data/trial/` ist leer, `orgs.csv` hat nur die Kopfzeile, `docs/MOONSHOT.md` fehlt, data-v2-Felder sind nur Fixture. Folge: keine Organisation, keine 10×-Zahl, keine Länderfilter-Einblendung im Voice-over, bis die Daten da sind; die beiden Therapie-Sätze (Krabbe ohne Medikament, MLD-Gentherapie) nur mit sichtbarem Beleg im Tool, sonst Ersatzsätze (in VIDEO-STRATEGY markiert).
3. Honest-Gap-Fall vorgeschlagen: `MONDO:0012720` „Krabbe disease due to saposin A deficiency" (ClinicalTrials.gov 0, NIH RePORTER 0, Europe PMC 2 im aktuellen Export). Alternative `MONDO:0009590`. Entscheidung Hanno und Osman.

## Offene Entscheidungen für Hanno

| # | Frage | Empfehlung hier |
|---|---|---|
| 1 | Name der Komposit-Mutter | Nora (steht schon in `app/lib/persona.ts` und docs/STORY.md); Kind bleibt namenlos |
| 2 | Einstiegssatz | „Your family is not the first. What you need may already exist under another disease's name." (Hannos Satz, steht auf `/about`) |
| 3 | Schlusssatz | „Don't rebuild what a neighbouring disease already built."; „Every edge has a source, and when there is none, we say so" in der Honest-Gap-Szene |
| 4 | Pitch-Fassung | A „Herz zuerst" für Pitch und Discord, B als Q&A-Reservoir und HackOS-Beschreibung |
| 5 | Voice-over | ElevenLabs `eleven_v4`, offengelegt; Team-Video echte Stimmen. Falls Recep spricht: gleiche Skripte |
| 6 | Honest-Gap-Fall | `MONDO:0012720`, sobald Osman die Org-Lage bestätigt |
| 7 | Motion | nur nach der Abgabe, nur Pitch-Opener 10.10. und Teaser |

## Zeitplan bis 15:00 (Aufnahme ab Freeze 12:00)

Quellen: [docs/SUBMISSION-CHECKLIST.md](../docs/SUBMISSION-CHECKLIST.md) §4, [docs/RESOURCES.md](../docs/RESOURCES.md) Video-Pipeline, [CLAUDE.md](../CLAUDE.md) Deadlines. Personenzeit für Videos ca. 4 h (Recep 100 min, Hanno 90 min, Osman 45 min).

| Zeit (So) | Hanno | Recep | Osman |
|---|---|---|---|
| bis 04:00 | `pitch/` liegt vor (dieser Branch) | | |
| 06:00 | **Gate: End-to-End live**, Hero-Pfad klickbar auf der Production-URL | | |
| 06:00–08:00 | Extract mit Key, Explain echt, P1-Bugs | hero_path.yaml Block A (R1) | orgs.csv (O2), orgs_CHECK |
| 08:00–09:00 | | Probe-Version Demo-Skript gegen die Live-App timen (Cursor, Szenenlängen) | HackOS: Upload-Format für Videos prüfen, Team in HackOS eintragen |
| 09:00 | ElevenLabs: Dashboard, Test-Call, Stimme Y wählen | | |
| 09:00–11:00 | Polish, Moonshot-Panel nur mit MOONSHOT.md | Skripte final + `.tts.txt` (Demo, Walkthrough, Tech aus VOICE-ELEVENLABS.md), Einwilligung Team-Video einholen, MOONSHOT.md (R2) | README (O3), Lizenzen, Reproduce-Test vorbereiten |
| 11:00 | **Repo public.** `make reproduce` einmal komplett laufen lassen (für das Tech-Video) | **Skripte eingefroren** | Reproduce-Test auf frischem Clone |
| 11:00–12:00 | Quality-Gates mit Osman (Live-URL, Hero-Pfad, Honest Gap, Edge-Quellen, OpenAI 3×, Fallback, README, Lizenzen, Secrets) | Kanten-IDs aus VIDEO-STRATEGY §0 im Live-Tool prüfen | Quality-Gates prüfen |
| 11:15–11:45 | MP3s erzeugen (Demo 8, Walkthrough 1, Tech 2), Hörprobe mit Recep | Hörprobe | |
| **12:00** | **Feature-Freeze.** Danach nur P1-Bugs | | |
| 12:00–12:45 | Tech-Video aufnehmen (Terminal, Editor, Browser) | Demo-Pfad stumm aufnehmen, 2–3 Takes | Team-Video filmen (alle drei, gleicher Ort) |
| 12:45–13:30 | Tech schneiden, Audio unterlegen, Limitations-Folie | Demo schneiden, Walkthrough aus derselben Aufnahme kürzen, Audio unterlegen | Team-Video schneiden, Untertitel; ab 13:00 Untertitel und Upload für Demo/Walkthrough mithelfen |
| 13:30 | Alle vier Links im Teamboard (Bereich Links) und in `docs/STATUS.md` | | |
| 13:30–14:00 | Upload Tech, Link im privaten Fenster prüfen | Upload Demo, Walkthrough, Links prüfen | Upload Team, Links prüfen |
| 14:00 | **Alle Videos hochgeladen** | | |
| 14:00–14:30 | | | HackOS-Abgabe und Google Form, alle Felder, alle Links verifiziert |
| 14:30–14:45 | Zip des Repos als Backup | Discord-Post (Text aus PITCH-60S Fassung A), letzter Live-URL-Check | MP4s als Backup auf Drive |
| **14:45** | **Nichts mehr pushen, kein Redeploy** | | |
| **15:00** | **Abgabe-Deadline** (9:00 ET), keine späte Abgabe | | |
| nach 15:00 | optional Motion-Clips (MOTION-PROMPTS.md), Pitch-Slides 10.10. nur falls Top 2 | | |

## Was nach der Abgabe kommt (nur falls Top 2)

Live-Pitch Sa 10.10., 3 Minuten: Fassung A aus PITCH-60S als erste Minute, dann Demo-Pfad live (Szenen 2 bis 6 der Demo), dann Moonshot aus `docs/MOONSHOT.md` mit Annahmen. Opener optional aus MOTION-PROMPTS Prompt 6. Slides: Gliederung in [docs/PITCH-OUTLINE_draft.md](../docs/PITCH-OUTLINE_draft.md).
