# Voice-over-Plan · ElevenLabs Eleven v4

Stand So 04.10.2026. Nur Funktionen, die in [docs/RESOURCES.md](../docs/RESOURCES.md) §4 belegt sind (Prüfdatum dort 2026-10-03). Account: Hanno, einziger Inhaber; Login und API-Key werden nicht geteilt (Nutzungsbedingungen, §4.3). Recep liefert Text, Hanno erzeugt MP3.

## 1. Entscheidung, die Hanno trifft

RESOURCES empfiehlt KI-Voice-over für Demo, Walkthrough und Tech (gleiche Stimme in drei Videos, kein Take-Chaos nach einer Nacht ohne Schlaf, Text ist gleich Skript und damit prüfbar), **offengelegt** in Video-Beschreibung und README. Gegenargument: eine echte Stimme wirkt wärmer. Fällt die Entscheidung auf „Recep spricht", bleibt alles unten gültig bis auf Abschnitt 4 (Erzeugung); die Skript-Blöcke sind dann Sprechtext.

**Team-Video: immer echte Stimmen und echte Gesichter.** Keine KI-Stimme, kein Voice Cloning, kein Avatar.

## 2. Modell und Stimmprofil

| Punkt | Festlegung | Quelle in RESOURCES |
|---|---|---|
| Modell | `eleven_v4` (Web-App „Text to Speech", Modell „Eleven v4"); Fallback `eleven_multilingual_v2`, wenn v4 bei Fachbegriffen zickt | §4.1 |
| Regler | nur Stability und Similarity; Startwerte Stability 0,5 / Similarity 0,75; bei wechselhafter Betonung Stability 0,65. **Kein** Speed, **kein** Style, **kein** SSML in v4 | §4.1, §4.4 |
| Tempo und Pausen | über den Text: Absätze, Ellipsen „…", Großbuchstaben für Betonung; Feintempo im Schnitt höchstens ±5 % | §4.1 |
| Audio-Tag | genau einer, in der ersten Zeile jedes Requests: `[calm, measured narration]` | §4.1 |
| Zeichenlimit | 10.000 Zeichen je Request im TTS-Endpoint; falls der Dialogue-Endpoint nötig wird, höchstens 2.000 Zeichen je Request | §4.1, §4.6 |
| Ausgabe | MP3, in der Web-App herunterladen (Creator bis 192 kbps) | §4.2 |
| Stimme | „Stimme Y", noch nicht gewählt: Voice Library → Englisch, amerikanisch oder neutral, ruhig, mittleres Tempo, vertrauenswürdig, kein Trailer-Ton. Drei Kandidaten mit denselben zwei Testsätzen (unten), eine Stimme für alle drei Videos. Platzhalter aus den Doku-Beispielen: `21m00Tcm4TlvDq8ikWAM` (Verfügbarkeit im Account prüfen) | §4.4 |
| Nach Freigabe | nicht neu erzeugen (Modell kann sich nach dem Launch ändern), finale MP3s sofort sichern | §4.1 |

**Stimmprofil in Worten (für die Auswahl):** warm, ruhig, glaubwürdig. Eine Stimme, die eine Mutter um zwei Uhr nachts nicht erschreckt und eine Jurorin nicht langweilt. Mittlere Tonlage, keine Werbe-Energie, keine Nachrichtensprecher-Härte. Testsätze für die Auswahl:

```
[calm, measured narration]
This is a composite character, not a real person. Call her Nora.

One gene, P-S-A-P, sits behind three disease names: a Krabbe-like, an M-L-D-like and a Gaucher-like disorder. Metachromatic leukodystrophy.
```

## 3. Welche Videos bekommen Voice-over

| Video | Voice-over | Request-Aufteilung | Zeichen (ca.) |
|---|---|---|---|
| Demo 2:00 | ElevenLabs, Stimme Y | **acht Requests, einer je Szene** (D1 bis D8), damit Recep jede Szene einzeln unter die Aufnahme legen kann; Alternative: ein Request mit Absätzen, wenn der Schnitt sonst zu lange dauert | 1.900 |
| Walkthrough 1:00 | gleiche Stimme | ein Request (W1) | 750 |
| Tech 3:00 | gleiche Stimme | zwei Requests (T1 = Szenen 1 bis 4, T2 = Szenen 5 bis 8) wie in RESOURCES | 2.900 |
| Team 60–90 s | **keine KI-Stimme** | – | – |

Credit-Bedarf konservativ mit 1 Credit je Zeichen: ca. 5.600 Zeichen Sprechtext, mit Probelauf und zwei Takes ca. 17.000 Credits; der Faktor für v4 steht nirgends und wird nach dem ersten Take im Dashboard abgelesen (§4.2).

## 4. Ablauf, wer was wann (Deadlines aus RESOURCES)

| Zeit (So) | Wer | Was |
|---|---|---|
| 08:00–09:00 | Recep | Probe-Version des Demo-Skripts gegen die Live-App timen (Cursor-Tempo, Szenenlängen); Abweichungen in die Blöcke unten eintragen |
| 09:00 | Hanno | Dashboard prüfen (Creator aktiv? Credits? „Eleven v4" in der Modellauswahl?), ein Test-Call mit den Testsätzen, Stimme Y wählen, Namen in RESOURCES §4.4 eintragen |
| bis 11:00 | Recep | Skripte final: `pitch/VOICE-ELEVENLABS.md` ist die Quelle; daraus je Video eine `.tts.txt`-Fassung (nur die Blöcke, erste Zeile der Tag, Zahlen ausgeschrieben, Lautschrift wo nötig). Ablage im Team-Drive `04_Submission/`, nicht im Repo |
| 11:00 | alle | Skript eingefroren. Jede Textänderung danach bedeutet neuer Take und neu synchronisieren |
| 11:15–11:45 | Hanno | MP3s erzeugen: Demo (8), Walkthrough (1), Tech (2); je Datei Hörprobe mit Recep auf die Fachbegriffe unten; höchstens drei Takes je Block; Ablage Drive `04_Submission/audio/`, Namen `demo_D1_v1.mp3` usw. |
| 12:00–12:45 | Recep | Aufnahme Demo-Pfad (stumm), dann Audio unterlegen |
| 12:00–13:00 | Hanno | Aufnahme Tech (Terminal, Editor), Audio unterlegen |
| 13:30 | Osman | Untertitel: YouTube „Auto-Sync" mit dem Skripttext, Fachbegriffe nachprüfen |

Notlösung, wenn Hanno zum Engpass wird (§4.4): Recep legt einen eigenen Free-Account an (10.000 Credits, v4 verfügbar) und schreibt „elevenlabs.io" in den Video-Titel; nicht-kommerzieller Plan, andere Stimme möglich.

## 5. Aussprache-Hinweise

v4 versteht IPA in Schrägstrichen mit Anführungszeichen, z. B. `"/ˌbaɪoʊˈkemɪstri/"`; einfacher ist Lautschrift im Text oder Buchstabieren („P-S-A-P") (§4.1). Zahlen und Prozente ausschreiben. Vor der finalen Erzeugung jeden Begriff einmal einzeln anhören.

| Begriff | Im `.tts.txt` schreiben | Hinweis |
|---|---|---|
| Krabbe | `Krabbe` zuerst testen; wenn falsch: `"/ˈkrɑːbeɪ/"` oder `KRAH-bay` | US-Patientencommunity sagt „KRAH-bay"; deutsche Aussprache „KRAH-be" wäre für die Jury ungewohnt. Entscheidung nach Hörprobe |
| metachromatic leukodystrophy | `metachromatic leukodystrophy`, bei Fehlern `"/ˌmɛtəkroʊˈmætɪk ˌluːkoʊˈdɪstrəfi/"` | nur einmal voll, danach `M-L-D` |
| MLD | `M-L-D` | buchstabieren |
| PSAP | `P-S-A-P` | buchstabieren, nie „psap" |
| saposin | `saposin`, bei Fehlern `"/səˈpoʊsɪn/"` (suh-PO-sin) | kommt in der Demo nicht vor, in Tech evtl. |
| GALC | `G-A-L-C` | buchstabieren |
| ARSA | `A-R-S-A` | buchstabieren |
| PLP1 | `P-L-P-one` | |
| Pelizaeus-Merzbacher | `Pelizaeus-Merzbacher`, bei Fehlern `"/ˌpɛlɪˈzeɪəs ˈmɛrtsbɑːxər/"` (pel-ih-ZAY-us MERTS-bah-ker) | |
| Gaucher | `Gaucher`, bei Fehlern `go-SHAY` | |
| lysosomal | `lysosomal` | meist korrekt |
| hypomyelinating | `hypomyelinating`, bei Fehlern `hy-po-MY-eh-lin-ay-ting` | |
| MONDO, HPO, OMIM, ORPHA | `MONDO` als Wort; `H-P-O`, `O-M-I-M` buchstabiert; `ORPHA` als Wort | |
| simGIC | `sim-G-I-C` | Tech |
| Resnik | `Resnik` (REZ-nik) | Tech |
| Louvain | `Louvain` (loo-VAN) | Tech |
| PMID, NCT | `P-M-I-D`, `N-C-T` | Tech |
| jsonl | `jay-son-L` | Tech |
| 874 / 1,066 / 524 / 350 | ausgeschrieben: `eight hundred seventy-four`, `one thousand sixty-six`, `five hundred twenty-four`, `three hundred fifty` | |
| 0.22 | `point two two` | |

## 6. Skript-Blöcke je Request

Jeder Block ist ein Request. Erste Zeile ist der Audio-Tag. Absätze sind Pausen. Sätze mit Stern (siehe [VIDEO-STRATEGY.md](VIDEO-STRATEGY.md) Abschnitt 1) nur, wenn der Beleg im Tool sichtbar ist; sonst Ersatzsatz einsetzen, bevor erzeugt wird. Kanten-IDs werden nie vorgelesen.

### Demo · D1 (0:00–0:10)

```
[calm, measured narration]
This is a composite character, not a real person. Call her Nora. Her son was diagnosed with Krabbe disease a few weeks ago.

Your family is not the first. What you need may already exist under another disease's name.
```

### Demo · D2 (0:10–0:30)

```
[calm, measured narration]
She types Krabbe. For Krabbe disease there is no approved drug anywhere in the world; the only established treatment is a stem-cell transplant, and it helps only before symptoms start.

Every line on this map is an edge with a source, a date, an evidence level, and a slot for counter-evidence… even when that slot is empty.
```

Ersatz für den zweiten Satz von D2, falls der Therapie-Beleg nicht im Tool sichtbar ist: `She types Krabbe. The map shows the gene, the symptoms, and every neighbouring diagnosis.`

### Demo · D3 (0:30–0:50)

```
[calm, measured narration]
One gene, P-S-A-P, sits behind three disease names at once: a Krabbe-like, an M-L-D-like and a Gaucher-like disorder, depending on which piece of the protein is broken.

Those children test normal for the Krabbe enzyme. Only a mechanism-based view finds them. Names hide mechanisms.
```

### Demo · D4 (0:50–1:08)

```
[calm, measured narration]
Months later, she leads a group. The closest related community is metachromatic leukodystrophy… M-L-D.

This link is marked inferred: a phenotype similarity Constellate computed, with the formula right there, and a confidence of point two two. We show that instead of hiding it. The gene page showed the other bridge: P-S-A-P.
```

### Demo · D5 (1:08–1:23)

```
[calm, measured narration]
And here is the counter-example. Pelizaeus-Merzbacher disease looks similar, but it is a hypomyelinating disease caused by P-L-P-one, not a lysosomal one.

Similar symptoms, different cause, so the assets do not transfer. The tool says no.
```

### Demo · D6 (1:23–1:45)

```
[calm, measured narration]
The Action Card says what transfers, what differs, and what needs expert review. Every sentence ends in the edge behind it; a sentence without an edge is dropped, and you see it dropped.

M-L-D already has an approved gene therapy, approved against a natural-history cohort of untreated children. That study design exists.

She can ask to join or adapt it instead of starting from zero, and she leaves with a sourced proposal she can send this week.
```

Ersatz für den mittleren Absatz von D6, falls „Approved therapies" nicht aus Pipeline-Daten sichtbar ist: `The neighbouring community has studies, a registry history and an outcome scale this group can ask to join or adapt.` (nur mit sichtbarem „Reusable assets"; sonst Absatz streichen.)

### Demo · D7 (1:45–1:54)

```
[calm, measured narration]
And when there is no trail, Constellate says so: what we searched and when, which communities are closest, and the next question to test.

That is a finding, not a failure.
```

### Demo · D8 (1:54–2:00)

```
[calm, measured narration]
Don't rebuild what a neighbouring disease already built.

Constellate.
```

### Walkthrough · W1 (1:00, ein Request)

```
[calm, measured narration]
A composite patient-group leader searches for Krabbe disease. One box, one map.

Every link carries its source, its date, its evidence level, its confidence, and a slot for counter-evidence.

One gene, P-S-A-P, sits behind three disease names: Krabbe-like, M-L-D-like, Gaucher-like. Names hide mechanisms.

The closest related community: metachromatic leukodystrophy. The link is marked inferred, formula shown, confidence shown.

The Action Card: what transfers, what differs, what needs expert review. Each sentence cites its edge, or it is dropped. Here is what must be checked before we join forces.

Constellate.
```

### Tech · T1 (0:00–1:40)

```
[calm, measured narration]
Constellate is an offline Python pipeline that writes a static evidence graph, and a Next.js app that reads it. No graph database: the dataset is JSON shards under app slash public slash data, so nothing can go down during a demo. Eight steps: fetch, slice, build, enrich, extract, reconcile, analytics, trials. Two of them call OpenAI; the app calls it a third time.

Everything is reproducible from the raw sources. Make reproduce fetches H-P-O, MONDO and Orphanet with sha-two-fifty-six in a manifest, slices three hundred fifty core diseases plus five hundred twenty-four neighbours, and enriches them from ClinicalTrials dot gov, Europe P-M-C, N-I-H RePORTER, Open Targets, Reactome and ClinVar. The validator checks the data contract: every edge has an id, evidence, a counter-evidence field that may be empty but never missing, and the hero path must exist. Current export: eight hundred seventy-four diseases, four evidence levels.

Extract. Abstracts go to OpenAI with Structured Outputs; the schema forces a snippet, a P-M-I-D, a predicate from a closed vocabulary. Then code, not the model, decides: the snippet must occur verbatim in the abstract, the P-M-I-D must match, subject and object must resolve to graph nodes and be mentioned in the text. Anything that fails lands in rejected dot jay-son-L with its reasons. What survives becomes a text-mined edge, dashed in the graph, labelled unverified until a person checks the P-M-I-D.

Reconcile. Patient-organisation disease names are free text. We embed them, take the top five MONDO candidates by cosine, and a judge model picks one, with a Structured Output schema that only allows those five ids or none. It cannot invent an id. Without a key, a fuzzy match takes over and is labelled as such. And only organisations verified by hand enter the product.
```

### Tech · T2 (1:40–3:00)

```
[calm, measured narration]
Explain. The prompt gives the model only the edges, and demands an edge id at the end of every sentence. The post-check is a dozen lines of code: a sentence survives only if it cites an id from the input; an unknown id is stripped; a sentence without support is dropped and shown struck through. The model id comes from an environment variable, never hard-coded; without a key the app writes template text and says so. The graph is the guardrail.

Analytics. Phenotype similarity is sim-G-I-C, an information-content-weighted Jaccard over ancestor-closed H-P-O terms, with Resnik best-match-average for the top twenty. Counter-examples are not a pathway artefact: a pair is flagged when the phenotypes are similar but the curated MONDO mechanism classes differ and no causal gene is shared. That is how Pelizaeus-Merzbacher ends up next to Krabbe with a red flag. Subtype roll-ups are marked and never gain confidence. Louvain with a fixed seed gives seventeen clusters.

Two guards. The validator asserts the hero path in the data: Krabbe to G-A-L-C, the Krabbe family to P-S-A-P, P-S-A-P to the M-L-D family, and Pelizaeus-Merzbacher flagged as mechanism differs. The Playwright test clicks the same path in the built app at desktop and phone width, opens the edge panel, the action card and the honest gap, and fails on any console error.

Limits, said out loud: one cluster, not ten thousand diseases. O-M-I-M only indirectly. Text-mined claims are hypotheses until checked. Our organisation list is curated and empty until verified. The metrics on the methods page say pending until we measure them. Constellate is research navigation, not medical advice.
```

## 7. Offenlegung

**README-Block** (in den Abschnitt „AI & tool disclosure", Vorlage in RESOURCES „Offenlegung"):

```
- Voice-over of the Demo, Walkthrough and Tech videos was generated with ElevenLabs (Eleven v4).
  The Team video uses our real voices. No voice of a real person was cloned.
```

**Video-Beschreibung (YouTube unlisted oder Drive):** „Voice-over generated with ElevenLabs (Eleven v4). The patient-group leader in this video is a composite character, not a real person. Constellate is a research-navigation tool, not medical advice."

Pflicht-Attribution „elevenlabs.io" im Titel gilt nur beim Free-Plan oder nicht eingeloggt (§4.3); mit aktivem Creator-Plan ist die Offenlegung freiwillig, wir machen sie trotzdem.

## 8. Was wir nicht tun (RESOURCES §4.5)

Keine Soundeffekte, keine Musik (VIDEOS.md), kein Dubbing, kein Voice Cloning, keine Conversational Agents, keine Mehrsprachigkeit im Produkt (bricht die Zitierpflicht), keine öffentliche TTS-Route mit freiem Text. Die optionale „Read aloud"-Funktion (A1) ist ein App-Feature mit eigener Timebox und nicht Teil dieses Plans.
