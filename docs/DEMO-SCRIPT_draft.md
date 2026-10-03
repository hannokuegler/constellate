# Demo-Skript · Constellate

Owner: Recep. Stand So 04.10.2026, 01:30. Dieser Entwurf vom 03.10. (Demo 2:00, acht Szenen) ist **abgelöst**: Das Team hat drei Pflichtvideos à höchstens 60 Sekunden festgelegt, Dateiformat MP4 oder MOV. Das gültige Demo-Skript mit Shotlist (Summe 0:58), Voice-over Wort für Wort (135 Wörter), Beleg im Bild je Szene, Aufnahme-Checkliste und Ersatzsätzen steht in **[pitch/VIDEO-STRATEGY.md](../pitch/VIDEO-STRATEGY.md), Abschnitt 2 „Product Demo"**. Die ElevenLabs-Blöcke D1 bis D7 stehen in [pitch/VOICE-ELEVENLABS.md](../pitch/VOICE-ELEVENLABS.md).

## Die Demo in 60 Sekunden (Kurzfassung der Shotlist)

| Zeit | Screen / Route | Was passiert |
|---|---|---|
| 0:00–0:09 | `/` | Nora als Komposit vorgestellt, Karte „We just got the diagnosis", „Krabbe" tippen |
| 0:09–0:18 | `/d/MONDO_0009499` | Linie Krabbe → GALC, Edge-Panel: Quelle, Konfidenz, Counter-evidence (`e_3dbc42738b5a`) |
| 0:18–0:25 | `/g/PSAP` | „One gene, 4 disease names", Zeilen Saposin A, B, C (OMIM 611722, 249900, 610539) |
| 0:25–0:34 | `/d/MONDO_0009499`, „I lead a patient group" | „Related communities" → MLD, „Why linked", Badge `inferred`, Formel (`e_e270315fe572`) |
| 0:34–0:49 | `/d/MONDO_0009499/action?via=MONDO_0018868` | Action Card: What transfers / What differs / Needs expert review, `[e_…]`-Zitat, „Approved therapies" (nur Pipeline-Daten) |
| 0:49–0:55 | `/d/MONDO_0012720` | Honest Gap: „What was searched, as of …", „What would close this gap" |
| 0:55–0:58 | `/about` | Schlusssatz, URL sichtbar |

## Was aus dem alten Entwurf entschieden oder erledigt ist

- Geparkte Punkte A bis E sind entschieden (DECISIONS P9 bis P11): Einstieg „Your family is not the first …", Schluss „Don't rebuild what a neighbouring disease already built.", Name Constellate, Komposit-Mutter Nora, Honest-Gap-Fall `MONDO:0012720`, Kernversprechen „join instead of build".
- Szene 4 des alten Entwurfs war falsch: `e_e270315fe572` ist eine `similar_phenotype`-Kante (inferred), nicht „shared gene PSAP". Die PSAP-Brücke zeigt `/g/PSAP`.
- Das Gegenbeispiel Pelizaeus-Merzbacher passt nicht in 60 s und bleibt im Tool und im Technical Walkthrough.
- Die Liste „Bewusst weggelassen" (Zeitvergleiche, US-Screening-Staaten, Österreich-Screening, Namen von Forschenden, Organisationen, FBX-101/PBKR03-Status) gilt weiter und steht in [pitch/STORY.md](../pitch/STORY.md) §9.

## Vor dem Dreh prüfen

Checkliste in [pitch/VIDEO-STRATEGY.md](../pitch/VIDEO-STRATEGY.md) §4: Kanten-IDs im Live-Tool öffnen, Action Card ansehen und das Voice-over daran anpassen (Sterne-Sätze), Honest-Gap-Zahlen im Shard lesen, Production-URL `https://constellate-vert.vercel.app` in der Browserleiste, Länge unter 60 s.
