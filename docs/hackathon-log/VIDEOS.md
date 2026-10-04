# 🎬 Videos · drei Pflichtvideos, je maximal 60 Sekunden

Stand So 04.10.2026, 01:30. Verbindliche Vorgabe des Teams: **genau drei Videos, jedes höchstens 60 s, Dateiformat MP4 oder MOV.** (1) Team Introduction, (2) Product Demo, (3) Technical Walkthrough. Die früheren Formate (Demo 2 min, Tech 3 min, Team 60–90 s, separater 1-min-Walkthrough) gelten nicht mehr; die Brief-Vorgabe „1-minute walkthrough" (C5-Brief S. 6) erfüllt die Product Demo.

Alle Shotlists, Voice-over-Texte Wort für Wort, Belege im Bild, Aufnahme-Checklisten, Schnitt- und Export-Hinweise stehen in [pitch/VIDEO-STRATEGY.md](../../pitch/VIDEO-STRATEGY.md). Voice-over-Blöcke für ElevenLabs: [pitch/VOICE-ELEVENLABS.md](../../pitch/VOICE-ELEVENLABS.md). Pitch-Text und Fachwort-Liste: [pitch/PITCH-60S.md](../../pitch/PITCH-60S.md).

## Übersicht

| # | Video | Länge | Wer | Ton | Kernbotschaft |
|---|---|---|---|---|---|
| 1 | Team Introduction | ≤ 60 s (Shotlist 0:58) | Osman filmt und schneidet; Hanno, Osman, Recep vor der Kamera | echte Stimmen, kein Voice-over | Drei Leute, drei Rollen, ein Grund: Niemand soll bei null anfangen, wenn die Nachbarkrankheit schon weiter ist |
| 2 | Product Demo | ≤ 60 s (0:58) | Recep nimmt auf und schneidet | ElevenLabs `eleven_v4`, 135 Wörter | Dein Problem hat einen Nachbarn, der es schon halb gelöst hat, und die Karte zeigt mit Quelle, wo |
| 3 | Technical Walkthrough | ≤ 60 s (0:58) | Hanno | ElevenLabs `eleven_v4`, 132 Wörter | Der Graph ist die Leitplanke: kein Satz ohne Quelle, kein Modell ohne Prüfung durch Code |

**Export:** MP4 (H.264, 1920×1080, 30 fps, AAC) oder MOV. Länge nach dem Export prüfen, unter 60,0 s. Dateinamen `constellate_team.mp4`, `constellate_demo.mp4`, `constellate_tech.mp4`.

## Product Demo in einem Satz

Problem → Herangehensweise → Lösung im Bild, Noras Weg in einem Take: Startseite, Suche „Krabbe" → Graph mit Edge-Panel (Quelle sichtbar) → `/g/PSAP` „One gene, 4 disease names" → „Related communities" MLD, „Why linked" → Action Card `?via=MONDO_0018868` → Honest Gap `/d/MONDO_0012720` → `/about` mit URL. Nora ist eine Komposit-Figur und wird im ersten Satz so genannt (DECISIONS P9).

## Technical Walkthrough in einem Satz

Ein Satz Architektur (offene Datenbanken → Pipeline → evidenzgestufter Graph → statische App), `make validate` grün mit Hero-Zeile, drei OpenAI-Stellen mit Datei im Bild (`pipeline/05_openai_extract.py`, `pipeline/06_openai_reconcile.py`, `app/lib/explain.ts`), `npm run e2e:run` grün, Offenlegung als Untertitel.

## Regeln

- Erst aufnehmen, wenn Feature-Freeze (12:00) gilt. Vorher nur Skript und Probe-Takes. Upload bis 14:00, Links im Teamboard und in [STATUS.md](STATUS.md).
- Englisch, Querformat, ruhige Stimme, keine Musik, keine Effekte, keine Motion-Clips in den Pflichtvideos.
- Live-URL im Video sichtbar lassen (Browserleiste, Production-Domain), keine localhost-Demos, keine Fixture-Badges.
- Jeder Claim im Voice-over existiert im Tool als Kante mit Quelle oder steht mit Primärquelle in [MEDICAL-BACKGROUND.md](../MEDICAL-BACKGROUND.md) (ohne ⚠️). Was nicht belegt sichtbar ist, bekommt den markierten Ersatzsatz.
- Fachwörter nur, wenn sie im selben Moment im Bild erklärt sind (Liste in [pitch/PITCH-60S.md](../../pitch/PITCH-60S.md)). Kein „cure", keine Organisationsnamen, solange `data/curated/orgs.csv` leer ist, keine 10×-Zahl ohne `docs/MOONSHOT.md`.
- Offenlegung in Video-Beschreibung und README: Voice-over mit ElevenLabs (Eleven v4), Team-Video echte Stimmen, Code mit Claude Code.
- Pitch 10.10. (falls Top 2): 3 min, Hauptfassung aus pitch/PITCH-60S.md als erste Minute, dann Demo-Pfad live, dann Moonshot.
