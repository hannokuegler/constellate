# Tech-Video · Voice-over für den Motion-Clip (50 s)

Stand So 04.10.2026 (Wien). Voice-over für den stummen Motion-Clip über den Tech-Stack (Prompt im Chat vom 04.10., Hintergrund [docs/TECH-SETUP.md](../docs/TECH-SETUP.md)). Die Blöcke sind auf das gelieferte Video getimt (50,0 s, 1920×1080, Szenen Sekunde für Sekunde gesichtet).

Einordnung: [docs/VIDEOS.md](../docs/VIDEOS.md) und [MOTION-PROMPTS.md](MOTION-PROMPTS.md) sagen, dass das Pflicht-Tech-Video die echte App zeigt und kein Motion-Clip ist. Dieser Clip ist damit für Pitch, README und Teaser sicher; ob er das Technical Walkthrough ersetzt, entscheidet Hanno (Regel 6).

## In einem Befehl (auf Hannos Mac)

Die Cloud-Sessions erreichen `api.elevenlabs.io` nicht (Netzwerk-Policy), darum läuft das lokal. Voraussetzung: `ffmpeg` und `ELEVENLABS_API_KEY` in `.env.local` (Root) oder in der Shell.

```bash
python3 pitch/tech_video.py ~/Downloads/<motion-video>.mp4
```

Das Skript erzeugt fehlende Blöcke als `tech_voice/V1.mp3` bis `V8.mp3` neben dem Video, prüft jede Länge gegen ihre Szene, beschleunigt höchstens um 5 %, legt jeden Block auf seinen Startpunkt, normalisiert auf −16 LUFS (wie das Story-Intro) und schreibt `constellate_tech.mp4` plus `constellate_tech.srt` (Untertitel in Schriftform, also „HPO", „Next.js", „JSON") neben das Video. Das Bild wird nicht neu kodiert.

| Fall | Befehl |
|---|---|
| Ein Block klingt falsch | `python3 pitch/tech_video.py VIDEO --force V3` |
| Ein Block ist zu lang | `python3 pitch/tech_video.py VIDEO --short V2 --force V2` (Kurzfassungen für V2, V4, V7) |
| OpenAI ist bis zur Abgabe nicht echt gelaufen | `python3 pitch/tech_video.py VIDEO --honest-v5 --force V5` |
| MP3s kommen aus der Web-App | als `V1.mp3` bis `V8.mp3` in `tech_voice/` legen, dann `--mix-only` |
| Andere Stimme | `ELEVENLABS_VOICE_TECH=<voice_id>` setzen oder `voice_id` in [tech_voice.json](tech_voice.json) |

Getestet in der Cloud mit Platzhalter-Tönen auf dem echten Motion-Video: Ausgabe 50,00 s, H.264 kopiert, AAC, −15,9 LUFS; Tempo-Anpassung und Abbruch bei zu langen Blöcken greifen. Mit echten ElevenLabs-Stimmen ist es noch nicht gelaufen.

## Einstellungen

| Punkt | Wert |
|---|---|
| Modell | `eleven_v4`, Fallback `eleven_multilingual_v2` (ohne Audio-Tag) |
| Stimme | die Consti-Stimme aus `app/story/voices.json` (gleiche Stimme wie im In-App-Intro), überschreibbar |
| Regler | Stability 0,5 (bei schwankender Betonung 0,65), Similarity 0,75, Seed 404; kein Speed, kein Style, kein SSML |
| Requests | acht, einer je Block, damit jeder Block exakt auf seiner Szene startet |
| Pausen | nur über Absätze und Satzzeichen; keine „…", die Stimme macht daraus lange Pausen |
| Quelle der Texte | [tech_voice.json](tech_voice.json); das Skript liest nur diese Datei. Textänderungen dort und hier nachziehen |

## Szenen und Blöcke

| Block | Start | max. Länge | Bild |
|---|---|---|---|
| V1 | 0:00 | 3,5 s | Sternbild, „Constellate · The tech stack" |
| V2 | 0:04 | 5,5 s | 11 Quellen-Chips, ab 0:06 „19 open sources. Licensed, cached, reproducible." |
| V3 | 0:10 | 6,5 s | Python 3.12 · uv · pandas · NetworkX, Licht durch 10 Stationen, ab 0:13 „make reproduce" |
| V4 | 0:17 | 7,5 s | Graph, Zähler fertig bei 0:19, Kante 0:21, Evidenz-Karte und Legende 0:22 bis 0:24 |
| V5 | 0:25,5 | 7,0 s | Extract 0:26, Reconcile 0:27, Explain 0:28, ab 0:30 „Code checks every answer." |
| V6 | 0:33 | 6,5 s | „6,802 static JSON files", Stack-Badges, ab 0:37 „No database. Nothing to crash." |
| V7 | 0:40 | 5,5 s | Checkliste, eine Zeile je Sekunde bis 0:44 |
| V8 | 0:46,5 | 3,5 s | Sternbild, „Constellate", URL |

**V1**
```
[calm, measured narration]
This is Constellate. Here's the stack.
```

**V2**
```
[calm, measured narration]
Nineteen open sources: licensed, cached, reproducible.
```

**V3** (kurz: „A Python pipeline. One command: make reproduce.")
```
[calm, measured narration]
A Python pipeline, ten steps, one command: make reproduce.
```

**V4** (kurz: „Out comes the graph. Every edge carries its source, and its counter-evidence.")
```
[calm, measured narration]
Out comes the graph. Every edge carries its evidence: source, date, confidence, counter-evidence.
```

**V5** („extract" soll um 0:26 fallen)
```
[calm, measured narration]
OpenAI at three points: extract, reconcile, explain. Code checks every answer.
```

V5 ehrlich, solange Extract, Reconcile und Explain nicht mit echtem Key gelaufen sind (heute: 0 `text_mined`-Kanten, kein `explain/`-Ordner), Schalter `--honest-v5`:
```
[calm, measured narration]
OpenAI is wired in at three points. Code checks every answer.
```

**V6** (kurz: „Static files on Vercel. Nothing to crash.")
```
[calm, measured narration]
Static jay-son, served on Vercel. No database, nothing to crash.
```

**V7** (kurz: „Then the gates: tests, and a check against Monarch.")
```
[calm, measured narration]
Then the gates: validator, tests, and a cross-check against Monarch.
```

**V8**
```
[calm, measured narration]
Constellate. Every edge has a source.
```

## Aussprache

| Im Bild | Im Sprechtext | Hinweis |
|---|---|---|
| HPO | `H-P-O` | buchstabiert |
| uv | `U-V` | buchstabiert |
| ClinicalTrials.gov | `Clinical Trials dot gov` | |
| JSON | `jay-son` | |
| Next.js | `Next J-S` | |
| MONDO, Monarch, Python | wie geschrieben | |
| Vercel | `Vercel` | falls falsch: `ver-SELL` |

Gemessenes Tempo der Consti-Stimme im ersten Lauf (04.10.): rund 1,95 Wörter je Sekunde, bei Pausen mit „…" nur 1,6. Die Blöcke sind darauf gekürzt (erster Entwurf mit 105 Wörtern war 40 bis 60 % zu lang). Zahlen sind ausgeschrieben. Kürzen geht vor Tempo: erst die Kurzfassung, dann höchstens +5 % (macht das Skript selbst).

## Belege für jede Aussage

| Aussage | Beleg |
|---|---|
| 19 offene Quellen | `app/public/data/meta.json`, `sources` (19 Einträge) |
| zehn Schritte, `make reproduce` | `Makefile` (fetch bis metrics) plus `validate` |
| Evidenz an jeder Kante, Gegenevidenz | `pipeline/validate.py`, Datenvertrag in `app/README.md` |
| OpenAI an drei Stellen, Code prüft | `pipeline/05_openai_extract.py`, `pipeline/06_openai_reconcile.py`, `app/app/api/explain/route.ts` |
| statisches JSON, Next.js, Vercel, keine Datenbank | `app/public/data/` (6.802 Dateien), `app/package.json`, [docs/TECH-SETUP.md](../docs/TECH-SETUP.md) |
| 76 Tests, Validator, E2E, Monarch | `pipeline/tests/` (76 Testfunktionen), `app/e2e/hero.spec.ts`, `meta.metrics.monarch_spearman` (ρ 0,661) |

Offenlegung wie bei den anderen Videos: Voice-over mit ElevenLabs (Eleven v4), Bild mit Motion.
