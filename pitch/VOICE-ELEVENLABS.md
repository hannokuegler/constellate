# Voice-over-Plan · ElevenLabs Eleven v4

Stand So 04.10.2026, 01:20 (Wien). Nur Funktionen, die in [docs/RESOURCES.md](../docs/RESOURCES.md) §4 belegt sind (Prüfdatum dort 2026-10-03). Account: Hanno, einziger Inhaber; Login und API-Key werden nicht geteilt (Nutzungsbedingungen, §4.3). Recep liefert Text, Hanno erzeugt MP3. Entscheidung P10: ElevenLabs `eleven_v4` für die Videos mit Voice-over, Team-Video mit echten Stimmen, Offenlegung im README.

## 1. Welche Videos bekommen Voice-over

Seit der Team-Vorgabe (drei Videos, je maximal 60 s) gibt es **nur noch zwei** Voice-over-Videos. Skripte Wort für Wort in [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md).

| Video | Voice-over | Request-Aufteilung | Wörter | Zeichen (ca.) |
|---|---|---|---|---|
| Product Demo ≤ 60 s | ElevenLabs, Stimme Y | **sieben Requests, einer je Szene** (D1 bis D7), damit Recep jede Szene einzeln unter die Aufnahme legen kann | 135 | 800 |
| Technical Walkthrough ≤ 60 s | gleiche Stimme | **ein Request** (T1), Absätze als Pausen; falls der Schnitt es braucht, sechs Requests T1a bis T1f je Szene | 132 | 850 |
| Team Introduction ≤ 60 s | **keine KI-Stimme**, echte Stimmen, echte Gesichter | – | – | – |

Credit-Bedarf konservativ mit 1 Credit je Zeichen: ca. 1.650 Zeichen Sprechtext, mit Probelauf und zwei Takes ca. 5.000 Credits; der Faktor für v4 steht nirgends und wird nach dem ersten Take im Dashboard abgelesen (§4.2). Selbst der Free-Plan reicht dafür.

Tempo-Kontrolle: Jeder Block muss in seine Szenenzeit passen (Spalte „Zeit" in VIDEO-STRATEGY). Ist ein MP3 länger als die Szene, zuerst den Text kürzen (Streichreihenfolge in Abschnitt 6), erst dann Stability erhöhen; Tempo im Schnitt höchstens ±5 %.

## 2. Modell und Stimmprofil

| Punkt | Festlegung | Quelle in RESOURCES |
|---|---|---|
| Modell | `eleven_v4` (Web-App „Text to Speech", Modell „Eleven v4"); Fallback `eleven_multilingual_v2`, wenn v4 bei Fachbegriffen zickt | §4.1 |
| Regler | nur Stability und Similarity; Startwerte Stability 0,5 / Similarity 0,75; bei wechselhafter Betonung Stability 0,65. **Kein** Speed, **kein** Style, **kein** SSML in v4 | §4.1, §4.4 |
| Tempo und Pausen | über den Text: Absätze, Ellipsen „…", Großbuchstaben für Betonung; Feintempo im Schnitt höchstens ±5 % | §4.1 |
| Audio-Tag | genau einer, in der ersten Zeile jedes Requests: `[calm, measured narration]` | §4.1 |
| Zeichenlimit | 10.000 Zeichen je Request im TTS-Endpoint, wir bleiben unter 1.000 | §4.1 |
| Ausgabe | MP3, in der Web-App herunterladen (Creator bis 192 kbps) | §4.2 |
| Stimme | „Stimme Y", noch nicht gewählt: Voice Library → Englisch, amerikanisch oder neutral, ruhig, mittleres Tempo, vertrauenswürdig, kein Trailer-Ton. Drei Kandidaten mit denselben zwei Testsätzen (unten), eine Stimme für beide Videos. Platzhalter aus den Doku-Beispielen: `21m00Tcm4TlvDq8ikWAM` (Verfügbarkeit im Account prüfen) | §4.4 |
| Nach Freigabe | nicht neu erzeugen (Modell kann sich nach dem Launch ändern), finale MP3s sofort sichern | §4.1 |

**Stimmprofil in Worten:** warm, ruhig, glaubwürdig. Eine Stimme, die eine Mutter um zwei Uhr nachts nicht erschreckt und eine Jurorin nicht langweilt. Mittlere Tonlage, keine Werbe-Energie, keine Nachrichtensprecher-Härte. Testsätze für die Auswahl:

```
[calm, measured narration]
Nora is a composite, not a real person.

One gene, P-S-A-P, sits behind three disease names: Krabbe-like, M-L-D-like, Gaucher-like. Metachromatic leukodystrophy.
```

## 3. Ablauf, wer was wann

| Zeit (So) | Wer | Was |
|---|---|---|
| 08:00–09:00 | Recep | Probe-Take der Demo gegen die Live-App timen (Cursor-Tempo, Szenenlängen); Abweichungen in die Blöcke unten eintragen |
| 09:00 | Hanno | Dashboard prüfen (Plan aktiv? Credits? „Eleven v4" in der Modellauswahl?), ein Test-Call mit den Testsätzen, Stimme Y wählen, Namen in RESOURCES §4.4 eintragen |
| bis 11:00 | Recep | Skripte final: diese Datei ist die Quelle; daraus je Video eine `.tts.txt` (nur die Blöcke, erste Zeile der Tag, Zahlen ausgeschrieben, Lautschrift wo nötig). Ablage im Team-Drive `04_Submission/`, nicht im Repo |
| 11:00 | alle | Skript eingefroren. Jede Textänderung danach bedeutet neuer Take und neu synchronisieren |
| 11:15–11:45 | Hanno | MP3s erzeugen: Demo (7), Tech (1); je Datei Hörprobe mit Recep auf die Fachbegriffe unten; höchstens drei Takes je Block; Ablage Drive `04_Submission/audio/`, Namen `demo_D1_v1.mp3`, `tech_T1_v1.mp3` |
| 12:00 | alle | Entscheidung über die Sätze mit Stern (Abschnitt 6) anhand der Live-Action-Card; betroffene Blöcke ggf. mit Ersatzsatz neu erzeugen (D1, D5) |
| 12:00–12:30 | Recep | Aufnahme Demo (stumm), dann Audio unterlegen |
| 12:00–12:45 | Hanno | Aufnahme Tech (Terminal, Editor, Browser), Audio unterlegen |
| 13:15 | Osman | Untertitel aus dem Skripttext (Schnittprogramm oder YouTube „Auto-Sync"), Fachbegriffe nachprüfen |

Notlösung, wenn Hanno zum Engpass wird (§4.4): Recep legt einen eigenen Free-Account an (10.000 Credits, v4 verfügbar) und schreibt „elevenlabs.io" in den Video-Titel; nicht-kommerzieller Plan, andere Stimme möglich. Fällt ElevenLabs ganz aus: Recep spricht dieselben Blöcke selbst ein; die Offenlegung im README entfällt dann.

## 4. Aussprache-Hinweise

v4 versteht IPA in Schrägstrichen mit Anführungszeichen, z. B. `"/ˌbaɪoʊˈkemɪstri/"`; einfacher ist Lautschrift im Text oder Buchstabieren („P-S-A-P") (§4.1). Zahlen ausschreiben (aktuell werden keine gesprochen). Vor der finalen Erzeugung jeden Begriff einmal einzeln anhören.

| Begriff | Im `.tts.txt` schreiben | Hinweis |
|---|---|---|
| Krabbe | `Krabbe` zuerst testen; wenn falsch: `"/ˈkrɑːbeɪ/"` oder `KRAH-bay` | US-Patientencommunity sagt „KRAH-bay"; deutsche Aussprache „KRAH-be" wäre für die Jury ungewohnt. Entscheidung nach Hörprobe |
| Nora | `Nora` | NOR-ah, meist korrekt |
| metachromatic leukodystrophy | `metachromatic leukodystrophy`, bei Fehlern `"/ˌmɛtəkroʊˈmætɪk ˌluːkoʊˈdɪstrəfi/"` | nur einmal voll (Demo D4), danach `M-L-D` |
| MLD | `M-L-D` | buchstabieren |
| PSAP | `P-S-A-P` | buchstabieren, nie „psap" |
| Gaucher | `Gaucher`, bei Fehlern `go-SHAY` | Demo D3 |
| GALC | `G-A-L-C` | kommt nur im Bild vor, nicht gesprochen |
| MONDO | `MONDO` als Wort | Tech T1 |
| Next.js | `Next J-S` | Tech T1 |
| JSON | `jay-son` | Tech T1 |
| Playwright | `Playwright` | meist korrekt |
| Pelizaeus-Merzbacher, saposin, lysosomal, hypomyelinating, simGIC, Resnik, Louvain, PMID, NCT, jsonl | nicht mehr gesprochen | nur im Bild oder auf `/methods` |

## 5. Skript-Blöcke je Request

Jeder Block ist ein Request. Erste Zeile ist der Audio-Tag. Absätze sind Pausen. Sätze mit Stern nur, wenn der Beleg im Tool sichtbar ist (VIDEO-STRATEGY §2, Fußnoten * und **); sonst Ersatzsatz einsetzen, **bevor** erzeugt wird. Kanten-IDs werden nie vorgelesen.

### Demo · D1 (0:00–0:09)

```
[calm, measured narration]
Nora is a composite, not a real person. Her son was diagnosed with Krabbe disease; there is no approved medicine anywhere in the world.
```

Ersatz für D1, falls „Approved therapies: Not found in EMA, FDA as of …" für Krabbe nicht aus Pipeline-Daten im Bild ist: `Nora is a composite, not a real person. Her son was just diagnosed with Krabbe disease, a disease so rare that families end up organising the research themselves.`

### Demo · D2 (0:09–0:18)

```
[calm, measured narration]
She types Krabbe. Every line shows its source, how sure we are, and what speaks against it.
```

### Demo · D3 (0:18–0:25)

```
[calm, measured narration]
One gene, P-S-A-P, sits behind three disease names: Krabbe-like, M-L-D-like, Gaucher-like. Names hide what they share.
```

### Demo · D4 (0:25–0:34)

```
[calm, measured narration]
Later she leads a group. Her neighbour on the map: metachromatic leukodystrophy… M-L-D, linked by shared symptoms, formula shown.
```

### Demo · D5 (0:34–0:49)

```
[calm, measured narration]
The Action Card: what carries over, what differs, what an expert must check, every sentence sourced.

M-L-D has an approved gene therapy, proven with a study that followed untreated children for years.

That study design exists.
```

Ersatz für den zweiten und dritten Absatz von D5, falls „Approved therapies" für MLD nicht aus Pipeline-Daten sichtbar ist: `The M-L-D community already runs studies this group can ask to join, instead of starting from zero.`

### Demo · D6 (0:49–0:55)

```
[calm, measured narration]
Where there is no trail, we say so: what we searched, what to test next.
```

### Demo · D7 (0:55–0:58)

```
[calm, measured narration]
Don't rebuild what a neighbouring disease already built.
```

### Tech · T1 (0:00–0:58, ein Request)

```
[calm, measured narration]
Open databases go through a Python pipeline into an evidence-graded graph, exported as static jay-son for a Next J-S app. No server database, nothing to go down.

Make validate checks every edge: source, date, confidence, a counter-evidence field that may be empty but never missing. And it asserts the hero path exists.

OpenAI at three points. Extract: claims from abstracts; code rejects any claim whose quoted snippet is not in the abstract. Reconcile: names to MONDO ids; the judge can only pick from five candidates, or none.

Explain, the third point: a sentence without a source is dropped and shown struck through. Model ids come from environment variables, never hard-coded.

The Playwright test clicks the hero path at desktop and phone width and fails on any console error.

Research navigation, not medical advice.
```

Falls T1 als sechs Einzel-Requests gebraucht wird (T1a bis T1f): je Absatz ein Request, Tag jeweils in der ersten Zeile.

## 6. Streichreihenfolge, falls ein Block zu lang wird

Demo: D5 „every sentence sourced" → D2 „and what speaks against it" wird „what speaks against it" → D4 „formula shown" → D1 „anywhere in the world". Tech: T1 Absatz 1 „nothing to go down" → Absatz 3 „or none" → Absatz 4 „never hard-coded" → Absatz 6 ganz (dann Untertitel statt gesprochen).

## 7. Offenlegung

**README-Block** (Abschnitt „AI & tool disclosure", Vorlage in RESOURCES „Offenlegung"):

```
- Voice-over of the Product Demo and the Technical Walkthrough was generated with ElevenLabs (Eleven v4).
  The Team Introduction uses our real voices. No voice of a real person was cloned.
```

**Video-Beschreibung (HackOS, YouTube unlisted oder Drive):** „Voice-over generated with ElevenLabs (Eleven v4). Nora, the patient-group leader in this video, is a composite character, not a real person. Constellate is a research-navigation tool, not medical advice."

Pflicht-Attribution „elevenlabs.io" im Titel gilt nur beim Free-Plan oder nicht eingeloggt (§4.3); mit aktivem Creator-Plan ist die Offenlegung freiwillig, wir machen sie trotzdem.

## 8. Was wir nicht tun (RESOURCES §4.5)

Keine Soundeffekte, keine Musik, kein Dubbing, kein Voice Cloning, keine Conversational Agents, keine Mehrsprachigkeit im Produkt (bricht die Zitierpflicht), keine öffentliche TTS-Route mit freiem Text. Die optionale „Read aloud"-Funktion (A1) ist ein App-Feature mit eigener Timebox und nicht Teil dieses Plans.
