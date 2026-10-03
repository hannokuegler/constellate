# Voice-over-Plan · ElevenLabs Eleven v4

Stand So 04.10.2026, 01:20 (Wien); Persona heißt wieder Maria (C5-Brief), D1–D7 gegen 2,3 Wörter/s nachgerechnet, Stimmen-Kandidaten in §2a. Nur Funktionen, die in [docs/RESOURCES.md](../docs/RESOURCES.md) §4 belegt sind (Prüfdatum dort 2026-10-03). Account: Hanno, einziger Inhaber; Login und API-Key werden nicht geteilt (Nutzungsbedingungen, §4.3). Recep liefert Text, Hanno erzeugt MP3. Entscheidung P10: ElevenLabs `eleven_v4` für die Videos mit Voice-over, Team-Video mit echten Stimmen, Offenlegung im README.

## 1. Welche Videos bekommen Voice-over

Seit der Team-Vorgabe (drei Videos, je maximal 60 s) gibt es **nur noch zwei** Voice-over-Videos. Skripte Wort für Wort in [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md).

| Video | Voice-over | Request-Aufteilung | Wörter | Zeichen (ca.) |
|---|---|---|---|---|
| Product Demo ≤ 60 s | ElevenLabs, Stimme Y | **sieben Requests, einer je Szene** (D1 bis D7), damit Recep jede Szene einzeln unter die Aufnahme legen kann | 126 | 760 |
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
Meet Maria, from the challenge brief. Her son has Krabbe disease.

One gene, P-S-A-P, sits behind three disease names: Krabbe-like, M-L-D-like, Gaucher-like. Metachromatic leukodystrophy.
```

## 2a. Stimmen-Kandidaten (Auswahl So 09:00, Hanno)

Aus den Default-Voices von ElevenLabs (für alle Accounts freigeschaltet, Beschreibungen laut [ElevenLabs Default Voices](https://elevenlabs.io/docs/voices/default-voices), Suche 04.10. 01:20). Ob jede Stimme mit `eleven_v4` angeboten wird, im Dashboard prüfen; sonst dieselbe Stimme mit `eleven_multilingual_v2`.

| # | Stimme | Profil laut ElevenLabs | Warum | Risiko |
|---|---|---|---|---|
| 1 | **Matilda** (Empfehlung) | weiblich, mittleres Alter, amerikanisch, freundlich, Narration | warm ohne Werbeton; eine Frauenstimme erzählt Marias Weg glaubwürdig, ohne nach Maria selbst zu klingen (die Stimme erzählt über sie, nicht als sie) | kann im Tech-Video zu weich wirken; dort Stability 0,65 |
| 2 | **Brian** | männlich, mittleres Alter, amerikanisch, tief, Narration, ruhig | sehr ruhig, trägt Tech und Demo gleich gut | tiefe Männerstimme kann bei einer Kinderkrankheit schwer und dokumentarisch wirken |
| 3 | **George** | männlich, mittleres Alter, britisch, warm, Narration | warm, international, „neighbouring" passt zur britischen Schreibweise im Skript | britischer Akzent bei US-geprägten Inhalten (FDA, „KRAH-bay") etwas fremd |

Vorgehen: alle drei mit den Testsätzen oben, je ein Take, Hanno und Recep hören blind (ohne Namen) und wählen. Bei Gleichstand Matilda. Gewählten Namen hier und in RESOURCES §4.4 eintragen.

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
| Maria | `Maria` | mah-REE-ah, meist korrekt |
| Libmeldy / Lenmeldy | `Libmeldy`, bei Fehlern `LIB-mel-dee` | wird nicht gesprochen, nur im Bild; für Q&A und Pitch 10.10. |
| metachromatic leukodystrophy | `metachromatic leukodystrophy`, bei Fehlern `"/ˌmɛtəkroʊˈmætɪk ˌluːkoʊˈdɪstrəfi/"` | nur einmal voll (Demo D4), danach `M-L-D` |
| MLD | `M-L-D` | buchstabieren |
| PSAP | `P-S-A-P` | buchstabieren, nie „psap" |
| Gaucher | `Gaucher`, bei Fehlern `go-SHAY` | Demo D3 |
| GALC | `G-A-L-C` | kommt nur im Bild vor, nicht gesprochen |
| MONDO | `MONDO` als Wort | Tech T1 |
| Next.js | `Next J-S` | Tech T1 |
| JSON | `jay-son` | Tech T1 |
| Playwright | `Playwright` | meist korrekt |
| Pelizaeus-Merzbacher | in den Videos nicht gesprochen; für Pitch 10.10. und Q&A: `pel-ih-ZAY-us MERTS-bah-ker`, IPA `"/ˌpɛlɪˈzeɪəs ˈmɛrtsbɑːkər/"` | deutscher Ursprung (Friedrich Pelizaeus, Ludwig Merzbacher), im Englischen meist anglisiert wie links; Hörprobe vor dem 10.10. |
| saposin, lysosomal, hypomyelinating, simGIC, Resnik, Louvain, PMID, NCT, jsonl | nicht mehr gesprochen | nur im Bild oder auf `/methods` |

## 5. Skript-Blöcke je Request

Jeder Block ist ein Request. Erste Zeile ist der Audio-Tag. Absätze sind Pausen. Sätze mit Stern nur, wenn der Beleg im Tool sichtbar ist (VIDEO-STRATEGY §2, Fußnoten * und **); sonst Ersatzsatz einsetzen, **bevor** erzeugt wird. Kanten-IDs werden nie vorgelesen.

### Demo · D1 (0:00–0:10) · 20 Wörter

```
[calm, measured narration]
Meet Maria, from the challenge brief. Her son has Krabbe disease.

There is no approved medicine, anywhere in the world.
```

Im Bild dazu die Einblendung „Maria: persona from the challenge brief, not a real person". Ersatz, nur falls Krabbe vor dem Dreh unter „Approved therapies" nicht mehr „Honest Gap: Not found …" zeigt: `Meet Maria, from the challenge brief. Her son has Krabbe disease, and families like hers end up leading the research.`

### Demo · D2 (0:10–0:17) · 16 Wörter

```
[calm, measured narration]
She types Krabbe. Every line shows its source, how sure we are, what speaks against it.
```

### Demo · D3 (0:17–0:24) · 16 Wörter

```
[calm, measured narration]
One gene, P-S-A-P, sits behind three disease names: Krabbe-like, M-L-D-like, Gaucher-like. Names hide what they share.
```

### Demo · D4 (0:24–0:33) · 20 Wörter

```
[calm, measured narration]
Now she leads a patient group. Her neighbour on the map: metachromatic leukodystrophy… M-L-D, linked by shared symptoms, formula shown.
```

### Demo · D5 (0:33–0:48) · 33 Wörter

```
[calm, measured narration]
The Action Card: what carries over, what differs, what an expert must check.

M-L-D has an approved gene therapy, and a study of how the disease unfolds over time.

That study design exists.
```

Geändert gegenüber 01:20: „proven with a study that followed untreated children for years" ist raus, weil diese Vergleichskohorte (Fumagalli 2022) nicht im Tool sichtbar ist; gesprochen wird nur, was die Karte zeigt (Libmeldy unter „Approved therapies", HOME-Studie unter „Reusable assets"). Ersatz für Absatz 2 und 3, falls „Approved therapies" für MLD vor dem Dreh fehlt: `The M-L-D community already runs studies this group can ask to join, instead of starting from zero.`

### Demo · D6 (0:48–0:54) · 13 Wörter

```
[calm, measured narration]
Where there is no trail, we say so, and show what we searched.
```

### Demo · D7 (0:54–0:58) · 8 Wörter

```
[calm, measured narration]
Don't rebuild what a neighbouring disease already built.
```

Tempo-Check (01:20, ohne Audio-Tag gezählt): D1 2,0 · D2 2,3 · D3 2,3 · D4 2,2 · D5 2,2 · D6 2,2 · D7 2,0 Wörter/s. „metachromatic leukodystrophy" zählt als zwei Wörter, spricht sich aber wie fünf; D4 deshalb beim Probe-Take zuerst prüfen.

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

Demo (die ersten zwei Kürzungen der alten Liste sind schon drin): D4 „formula shown" → D1 „anywhere in the world" → D6 „and show what we searched". Tech: T1 Absatz 1 „nothing to go down" → Absatz 3 „or none" → Absatz 4 „never hard-coded" → Absatz 6 ganz (dann Untertitel statt gesprochen).

## 7. Offenlegung

**README-Block** (Abschnitt „AI & tool disclosure", Vorlage in RESOURCES „Offenlegung"):

```
- Voice-over of the Product Demo and the Technical Walkthrough was generated with ElevenLabs (Eleven v4).
  The Team Introduction uses our real voices. No voice of a real person was cloned.
```

**Video-Beschreibung (HackOS, YouTube unlisted oder Drive):** „Voice-over generated with ElevenLabs (Eleven v4). Maria, the patient-group leader in this video, is the persona from the challenge brief, not a real person. Constellate is a research-navigation tool, not medical advice."

Pflicht-Attribution „elevenlabs.io" im Titel gilt nur beim Free-Plan oder nicht eingeloggt (§4.3); mit aktivem Creator-Plan ist die Offenlegung freiwillig, wir machen sie trotzdem.

## 8. Was wir nicht tun (RESOURCES §4.5)

Keine Soundeffekte, keine Musik, kein Dubbing, kein Voice Cloning, keine Conversational Agents, keine Mehrsprachigkeit im Produkt (bricht die Zitierpflicht), keine öffentliche TTS-Route mit freiem Text. Die optionale „Read aloud"-Funktion (A1) ist ein App-Feature mit eigener Timebox und nicht Teil dieses Plans.
