# Video-Strategie · vier Pflichtvideos

Stand So 04.10.2026, ca. 02:30 (Wien). Grundlage: C5-Challenge-Brief S. 6 („A Team video and a 1-minute walkthrough. Follow a family or patient group through the graph to either a justified collaboration and next step, or an honest gap with a plan to investigate it."), Hack-Nation-Regeln (Demo, Tech, Team), [docs/VIDEOS.md](../docs/VIDEOS.md), [docs/RESOURCES.md](../docs/RESOURCES.md) (Video-Pipeline, ElevenLabs §4), [docs/DEMO-SCRIPT_draft.md](../docs/DEMO-SCRIPT_draft.md). Voice-over-Skripte in Request-Form: [VOICE-ELEVENLABS.md](VOICE-ELEVENLABS.md).

Für alle vier: Englisch, 1920×1080 quer, Live-URL in der Browserleiste sichtbar, keine Musik, keine Effekte, Aufnahme erst nach dem Freeze (So 12:00). Jede Aussage im Voice-over existiert im Tool als Kante mit Quelle oder steht mit Primärquelle in [docs/MEDICAL-BACKGROUND.md](../docs/MEDICAL-BACKGROUND.md) (ohne ⚠️). Die Mutter ist eine Komposit-Figur und wird im ersten Satz so genannt.

## 0. Drei Befunde aus dem aktuellen Export, die die Skripte ändern

Geprüft gegen `app/public/data/` (Version `2026-10-03+397464a`), vor dem Dreh gegen den dann aktuellen Export wiederholen (`python3` über die Shards, nie die Dateien in den Kontext laden).

| Befund | Folge für das Skript |
|---|---|
| `e_e270315fe572` (Krabbe → MLD) ist eine **`similar_phenotype`-Kante**, `inferred`, simGIC 0,22, Quelle `Constellate 07_analytics@397464a`. Es ist **nicht** die „shared gene PSAP"-Kante, wie der Demo-Entwurf in Szene 4 sagt. Die `shares_gene`-Kanten von Krabbe führen zu den PSAP-Subtypen (`e_fe860a804de3` Saposin A, `e_70e22ce612b6` kombinierte PSAP-Defizienz, `e_34b965c8ebc8` Saposin C). | Szene 4 sagt „linked by a computed phenotype similarity, formula shown", die PSAP-Brücke wird in Szene 3 auf `/g/PSAP` gezeigt. |
| `app/public/data/trial/` ist leer (Schritt 08 `make trials` noch nicht gelaufen). | Die 5-Sekunden-Einblendung „Studies looking for participants" mit Länderfilter nur, wenn die Dateien vor dem Dreh da sind. Sonst bleibt die Studienliste ohne Länder, oder die Einblendung entfällt. |
| `data/curated/orgs.csv` hat nur die Kopfzeile; `docs/MOONSHOT.md` fehlt; data-v2-Felder (`assets`, `approved_therapies`, `newborn_screening`) sind nur als Dev-Fixture vorhanden. | Keine Organisation im Voice-over. Keine 10×-Zahl. Die Sätze „no approved drug for Krabbe" und „MLD has an approved gene therapy" nur sprechen, wenn die Action Card die Abschnitte „Approved therapies" mit EMA/FDA-Quelle und „Not found in EMA, FDA as of …" für Krabbe wirklich zeigt (Pipeline-Export, **nicht** Fixture); sonst die markierten Ersatzsätze verwenden. |

Hero-Kanten, die im Export verifiziert sind: `e_3dbc42738b5a` (Krabbe → GALC, curated, OMIM:245200 via HPO, Konfidenz 0,90), `e_2c5236d2f740` (Krabbe → PSAP, inferred, Roll-up aus ORPHA:206436, Konfidenz 0,47), `e_795da9c4a6cd` (Krabbe due to saposin A deficiency → PSAP, OMIM:611722), `e_316e60c8ee91` (MLD due to saposin B deficiency → PSAP, OMIM:249900), `e_b4f9b02250a7` (Gaucher due to saposin C deficiency → PSAP, ORPHA:309252 und OMIM:610539), `e_00a92bfb7837` (Krabbe → Pelizaeus-Merzbacher spectrum disorder, similar_phenotype, `mechanism_differs = true`).

## 1. Demo-Video · 2:00 · Recep nimmt auf, Voice-over ElevenLabs (oder Recep spricht, Entscheidung Hanno)

**Ziel:** Die Jury sieht in zwei Minuten eine Familie, die von der isolierten Diagnose zu einem begründeten Vorschlag kommt, und einmal die ehrliche Lücke. Kriterien: Patient progress, Evidence integrity, Graph quality (Gegenbeispiel), Product craft.

**Zuschauer:** Jury und Öffentlichkeit, kein Medizinwissen vorausgesetzt.

**Dramaturgie:** Figur (10 s) → Karte mit Beleg (20 s) → Aha „ein Gen, drei Namen" (20 s) → Nachbar-Community mit ehrlich markierter Unsicherheit (18 s) → das Tool sagt Nein (15 s) → Action Card als Dokument (22 s) → Honest Gap (9 s) → Schlusssatz (6 s).

**Aufnahme:** QuickTime (⌘⇧5), Mausklicks anzeigen, Cursor langsam, Hero-Pfad stumm in zwei bis drei Takes durchklicken; Voice-over später unterlegen. Fenster 1920×1080, Browser-Zoom 110 % für Lesbarkeit, Dark Mode nach Geschmack (vorher an 375 px und Dark Mode getestet, BUGS.md).

### Shotlist

| Zeit | Screen / Route | Klick / sichtbar | Voice-over (Englisch) | Beleg sichtbar |
|---|---|---|---|---|
| 0:00–0:10 | `/` Startseite, Karten „We just got the diagnosis" und „I lead a patient group" | Karte Moment 1 anklicken, „Krabbe" in die Suche tippen | „This is a composite character, not a real person. Call her Nora. Her son was diagnosed with Krabbe disease a few weeks ago. Your family is not the first. What you need may already exist under another disease's name." | Komposit-Hinweis gesprochen; Karten im Bild |
| 0:10–0:30 | `/d/MONDO_0009499` Krabbe disease, MomentBar mit drei Antworten, Ego-Graph | Linie Krabbe → GALC anklicken, Edge-Panel öffnet | „She types Krabbe. For Krabbe disease there is no approved drug anywhere in the world; the only established treatment is a stem-cell transplant, and it helps only before symptoms start.* Every line on this map is an edge with a source, a date, an evidence level, and a slot for counter-evidence, even when that slot is empty." | `e_3dbc42738b5a`, Badge `curated`, Quelle OMIM:245200, Konfidenz 0,90, Abschnitt „Counter-evidence (0)" mit dem Satz „No contradicting evidence recorded in: …" |
| 0:30–0:50 | `/g/PSAP` „One gene, 4 disease names" | Von der Krabbe-Seite auf das Gen PSAP; die Zeilen Saposin A, B, C anklicken | „One gene, P-S-A-P, sits behind three disease names at once: a Krabbe-like, an MLD-like and a Gaucher-like disorder, depending on which piece of the protein is broken. Those children test normal for the Krabbe enzyme. Only a mechanism-based view finds them. Names hide mechanisms." | `e_795da9c4a6cd` OMIM:611722 · `e_316e60c8ee91` OMIM:249900 · `e_b4f9b02250a7` ORPHA:309252 / OMIM:610539 |
| 0:50–1:08 | zurück auf `/d/MONDO_0009499`, Umschalter „I lead a patient group", Abschnitt „Related communities" | Zeile „metachromatic leukodystrophy", Button „Why linked", Edge-Panel | „Months later, she leads a group. The closest related community is metachromatic leukodystrophy, M-L-D. This link is marked inferred: a phenotype similarity Constellate computed, with the formula right there and a confidence of point two two. We show that instead of hiding it. The gene page showed the other bridge: PSAP." | `e_e270315fe572`, Badge `inferred`, Abschnitt „Formula (inferred)", Konfidenz 0,22; Krabbe → PSAP `e_2c5236d2f740` mit Hinweis „Rolled up from subtype" |
| 1:08–1:23 | gleiche Seite, Zeile „Pelizaeus-Merzbacher spectrum disorder" mit Badge „mechanism differs" | „Why linked" anklicken | „And here is the counter-example. Pelizaeus-Merzbacher disease looks similar, but it is a hypomyelinating disease caused by P-L-P-one, not a lysosomal one. Similar symptoms, different cause, so the assets do not transfer. The tool says no." | `e_00a92bfb7837`, Badge „mechanism differs", Snippet „Similar symptoms, different cause …"; Quellen OMIM 312080, Orphanet 702, PMC9313024 |
| 1:23–1:45 | `/d/MONDO_0009499/action?via=MONDO_0018868` Action Card | Spalten „What transfers / What differs / Needs expert review", ein `[e_…]`-Zitat anklicken, Explain-Stream laufen lassen, Button „Export proposal" | „The Action Card says what transfers, what differs, and what needs expert review. Every sentence ends in the edge behind it; a sentence without an edge is dropped, and you see it dropped. MLD already has an approved gene therapy, approved against a natural-history cohort of untreated children.** That study design exists. She can ask to join or adapt it instead of starting from zero, and she leaves with a sourced proposal she can send this week." | Zitat `[e_…]` öffnet Edge-Panel; Explain mit Modus `llm` oder `template` (Label sichtbar); Abschnitt „Approved therapies" (nur Pipeline-Daten) |
| 1:45–1:54 | `/d/MONDO_0012720` Krabbe disease due to saposin A deficiency, Honest Gap | Abschnitte „What was searched, as of …", „Nearest related communities", „What would close this gap" | „And when there is no trail, Constellate says so: what we searched and when, which communities are closest, and the next question to test. That is a finding, not a failure." | Coverage: ClinicalTrials.gov 0 Treffer, NIH RePORTER 0 Treffer, Europe PMC 2, Datum 2026-10-03 (Export prüfen) |
| 1:54–2:00 | `/about`, Überschrift „Your family is not the first …", URL in der Browserleiste | kein Klick, Cursor weg | „Don't rebuild what a neighbouring disease already built. Constellate." | URL |

\* Satz nur, wenn die Action Card für Krabbe „Approved therapies: Not found in EMA, FDA as of …" aus Pipeline-Daten zeigt oder `hero_path.yaml` den Beleg (GeneReviews NBK1238, PMID 15901860) als VERIFIED enthält und dieser im Tool sichtbar ist. Ersatzsatz: „She types Krabbe. The map shows the gene, the symptoms, and every neighbouring diagnosis."

\** Satz nur, wenn der Abschnitt „Approved therapies" für MLD die Zulassung mit EMA- oder FDA-Quelle zeigt (Pipeline-Daten, kein Fixture). Ersatzsatz: „The neighbouring community has studies, a registry history and an outcome scale this group can ask to join or adapt instead of starting from zero." (nur, wenn „Reusable assets" belegt sichtbar ist; sonst beide Sätze streichen und die Zeit auf den Explain-Stream geben).

Wortzahl Voice-over: ca. 300 Wörter, bei 150 Wörtern pro Minute exakt 2:00. Falls es knapp wird: Szene 2 den Nebensatz „even when that slot is empty" streichen, Szene 6 „and you see it dropped".

### Optionale Einblendung „Open studies" (5 s, nur mit `trial/`-Dateien)

In Szene 2 nach dem Edge-Panel: Abschnitt „Studies looking for participants with Krabbe disease", Länderfilter, Button „Contact the study team". Voice-over-Zusatz: „Studies that are looking for children like hers, by country, with a link to the official study contact. No sign-up here; the study team and her doctor decide." Dafür in Szene 6 „and you see it dropped" streichen.

## 2. 1-Minute-Walkthrough · C5-Pflicht · Recep, aus derselben Aufnahme

**Ziel:** Exakt die Brief-Vorgabe: „Follow a family or patient group through the graph to either a justified collaboration and next step, or an honest gap." Ein Take, kein Intro-Pathos, kein Erklären, was man sieht.

**Zuschauer:** Jury, die den Walkthrough vielleicht als Erstes und Einziges ansieht.

**Dramaturgie:** Suche → Kante mit Quelle → PSAP → MLD → Action Card → Schlusssatz aus dem Brief.

| Zeit | Screen / Route | Voice-over (Englisch) | Beleg sichtbar |
|---|---|---|---|
| 0:00–0:08 | `/` → Suche „Krabbe" → `/d/MONDO_0009499` | „A composite patient-group leader searches for Krabbe disease. One box, one map." | MomentBar |
| 0:08–0:20 | Edge-Panel Krabbe → GALC | „Every link carries its source, its date, its evidence level, its confidence, and a slot for counter-evidence." | `e_3dbc42738b5a`, OMIM:245200 |
| 0:20–0:32 | `/g/PSAP` | „One gene, PSAP, sits behind three disease names: Krabbe-like, MLD-like, Gaucher-like. Names hide mechanisms." | OMIM 611722, 249900, 610539 |
| 0:32–0:42 | Related communities → MLD „Why linked" | „The closest related community: metachromatic leukodystrophy. The link is marked inferred, formula shown, confidence shown." | `e_e270315fe572` |
| 0:42–0:56 | Action Card `?via=MONDO_0018868` | „The Action Card: what transfers, what differs, what needs expert review. Each sentence cites its edge, or it is dropped. Here is what must be checked before we join forces." | `[e_…]`-Zitate |
| 0:56–1:00 | `/about` mit URL | „Constellate." | URL |

Wortzahl: ca. 110 Wörter, bewusst unter dem Maximum, damit der Cursor Zeit hat. Keine Honest-Gap-Szene hier (die ist im Demo-Video), außer Hanno will die Gap-Variante des Walkthroughs: dann Szene 0:42–0:56 durch `/d/MONDO_0012720` ersetzen mit dem Satz „Where there is no trail, we say so: what we searched, the nearest communities, the next question to test."

## 3. Tech-Video · 3:00 · Hanno, Terminal und Editor, Voice-over ElevenLabs

**Ziel:** Glaubwürdigkeit durch echten Code. Die Jury und der OpenAI-Track sehen die drei OpenAI-Stellen im Code und im Output, das Evidenzmodell in der Pipeline, die Gegenbeispiel-Logik, den Validator und den E2E-Test. Kriterien: Graph quality, Evidence integrity, Built with OpenAI.

**Zuschauer:** technische Jury, OpenAI-Track-Reviewer.

**Dramaturgie:** Architektur (25 s) → Reproduzierbarkeit im Terminal (30 s) → Extract (25 s) → Reconcile (20 s) → Explain (25 s) → Analytics: simGIC, Gegenbeispiele, Louvain (30 s) → Validator und E2E (15 s) → Limitations (10 s).

**Vorbereitung (vor 12:00):** `make reproduce` einmal komplett laufen lassen und das Terminal-Fenster mit dem Log offen lassen (Netzwerk, dauert); `make validate` muss grün sein; `cd app && npm run build && npm run e2e:run` einmal durch, Screenshots in `app/e2e-shots/`; Editor mit den Dateien unten in Tabs, Schrift 16 pt, Zeilennummern an. Zeilennummern gelten für `origin/integrate` Stand `8bea5bc`; vor dem Dreh mit `grep -n` prüfen.

### Shotlist

| Zeit | Bild | Datei und Zeilen / Terminal-Befehl (live tippen) | Voice-over (Englisch) |
|---|---|---|---|
| 0:00–0:25 | README-Architekturdiagramm (Mermaid, rendert auf GitHub) oder `docs/ARCHITECTURE.md` | `cat Makefile` (Zeilen 4–29, die Targets `fetch` bis `reproduce`) | „Constellate is an offline Python pipeline that writes a static evidence graph, and a Next.js app that reads it. No graph database: the dataset is JSON shards under app slash public slash data, so nothing can go down during a demo. Eight steps: fetch, slice, build, enrich, extract, reconcile, analytics, trials. Two of them call OpenAI, the app calls it a third time." |
| 0:25–0:55 | Terminal | `make validate` (live), dann im zweiten Fenster das fertige `make reproduce`-Log hochscrollen; `python3 -c "import json;m=json.load(open('app/public/data/meta.json'));print(m['version'],m['counts']['nodes'],m['counts']['levels'])"` | „Everything is reproducible from the raw sources: make reproduce fetches HPO, MONDO and Orphanet with sha256 in a manifest, slices three hundred fifty core diseases plus five hundred twenty-four neighbours, and enriches them from ClinicalTrials.gov, Europe PMC, NIH RePORTER, Open Targets, Reactome and ClinVar. The validator checks the data contract: every edge has an id, evidence, a counter-evidence field that may be empty but never missing, and the hero path must exist. Current export: eight hundred seventy-four diseases, four evidence levels." |
| 0:55–1:20 | Editor `pipeline/05_openai_extract.py` | Zeilen 10–16 (Grounding-Checks im Docstring), 129–132 `snippet_in_abstract`, 226–262 `validate_claim`, 316–322 `client.responses.parse(..., text_format=ExtractionResult)`; dazu `pipeline/prompts/extract.md` Zeilen 4–8; Terminal: `head -c 600 data/extract/rejected.jsonl` (nur wenn mit Key gelaufen) | „Extract. Abstracts go to OpenAI with Structured Outputs; the schema forces a snippet, a PMID, a predicate from a closed vocabulary. Then code, not the model, decides: the snippet must occur verbatim in the abstract, the PMID must match, subject and object must resolve to graph nodes and be mentioned in the text. Anything that fails lands in rejected dot jsonl with its reasons. What survives becomes a text-mined edge, dashed in the graph, labelled unverified until a person checks the PMID." |
| 1:20–1:40 | Editor `pipeline/06_openai_reconcile.py` | Zeilen 1–18 (Docstring), 78–100 `load_input` (nur `verified_date`), 295–306 `embedding_candidates`, 317–321 `decision_model` (Literal aus Kandidaten plus `none`), 334–360 `judge` | „Reconcile. Patient-organisation disease names are free text. We embed them, take the top five MONDO candidates by cosine, and a judge model picks one, with a Structured Output schema that only allows those five ids or none. It cannot invent an id. Without a key, a fuzzy match takes over and is labelled as such. And only organisations verified by hand enter the product." |
| 1:40–2:05 | Browser: Action Card mit Explain-Stream; Editor `app/lib/prompts/explain.ts` Zeilen 4–13, `app/lib/explain.ts` Zeilen 14–27, `app/app/api/explain/route.ts` Zeilen 54–77 | im Browser einen durchgestrichenen Satz zeigen, falls einer kommt; sonst die `kept / dropped`-Zählung im Netzwerk-Tab | „Explain. The prompt gives the model only the edges, and demands an edge id at the end of every sentence. The post-check is a dozen lines of code: a sentence survives only if it cites an id from the input; an unknown id is stripped; a sentence without support is dropped and shown struck through. The model id comes from an environment variable, never hard-coded; without a key the app writes template text and says so. The graph is the guardrail." |
| 2:05–2:35 | Editor `pipeline/07_analytics.py` | Zeilen 11–17 (Schritte), 365–386 (simGIC-Matrix), 395 (`resnik_bma`), 462–518 (Mechanismus-Klassen, `mechanism_verdict`), 520–532 (Gegenbeispiel-Paare), 560–583 (Louvain), 610–636 (`rolled_up_edge`) | „Analytics. Phenotype similarity is simGIC, an information-content-weighted Jaccard over ancestor-closed HPO terms, with Resnik best-match-average for the top twenty. Counter-examples are not a pathway artefact: a pair is flagged when the phenotypes are similar but the curated MONDO mechanism classes differ and no causal gene is shared. That is how Pelizaeus-Merzbacher ends up next to Krabbe with a red flag. Subtype roll-ups are marked and never gain confidence. Louvain with a fixed seed gives seventeen clusters." |
| 2:35–2:50 | Editor `pipeline/validate.py` Zeilen 286–314 (Hero-Pfad-Checks); `app/e2e/hero.spec.ts` Zeilen 38–53, 84–96, 112–122; Finder mit `app/e2e-shots/` | Terminal: `make validate` Ausgabe der Hero-Zeilen; `ls app/e2e-shots` | „Two guards. The validator asserts the hero path in the data: Krabbe to GALC, the Krabbe family to PSAP, PSAP to the MLD family, and Pelizaeus-Merzbacher flagged as mechanism differs. The Playwright test clicks the same path in the built app at desktop and phone width, opens the edge panel, the action card and the honest gap, and fails on any console error." |
| 2:50–3:00 | Folie „Limitations" (Klartext, low ink) | Stichpunkte: one cluster, not 10,000 diseases · OMIM only via HPO · text-mined claims are hypotheses · patient organisations: curated list, empty until verified · Extract and Explain not yet evaluated with a live key (metrics pending on /methods) · research navigation, not medical advice | „Limits, said out loud: one cluster, not ten thousand diseases. OMIM only indirectly. Text-mined claims are hypotheses until checked. Our organisation list is curated and empty until verified. The metrics on the methods page say pending until we measure them. Constellate is research navigation, not medical advice." |

Wortzahl Voice-over: ca. 430 Wörter, bei 145 Wörtern pro Minute 2:58. Puffer: Szene 0:25–0:55 den Quellenkatalog kürzen.

**Offenlegung im Tech-Video (Pflicht laut Checkliste):** In der Limitations-Folie oder als Untertitel am Ende: „Patient-organisation facts pre-extracted from public websites via Bright Data and OpenAI, verified by hand. Voice-over generated with ElevenLabs (Eleven v4). Code written with Claude Code."

## 4. Team-Video · 60–90 s · Osman filmt, echte Stimmen, echte Gesichter

**Ziel:** „Introduce team" (Hack-Nation-Folie). Drei Menschen, die man einer Mutter um zwei Uhr nachts zumuten würde: ruhig, konkret, kein Pitch.

**Zuschauer:** Jury, Hack-Nation-Community.

**Dramaturgie:** Je Person 20–25 s, gleicher Ort, Handy quer, Tageslicht, derselbe Hintergrund; Abschluss alle drei im Bild. Keine KI-Stimme, kein Avatar (RESOURCES Video-Pipeline). Einwilligung aller drei vorher (Recep holt sie ein).

**Fragen-Leitfaden** (jede Person antwortet in ganzen Sätzen, Frage wird nicht eingeblendet):

| Frage | Hanno Kügler · Tech Lead | Osman · Ops und Kuration | Recep · Story, Evidenz, Videos |
|---|---|---|---|
| 1. Wer bist du, was machst du hier? (ein Satz) | Name, „I built the pipeline and the app." | Name, „I verified the data by hand: patient organisations, licences, the reproduce test." | Name, „I wrote the story and checked every medical claim against its primary source." |
| 2. Dein Hintergrund in einem Satz | Studium/Beruf, kurz | Studium/Beruf, kurz | Studium/Beruf, kurz |
| 3. Warum diese Challenge? (persönlich, kein Pitch) | z. B. die Stelle im Brief, die hängen geblieben ist | z. B. was beim Prüfen der Organisationen aufgefallen ist | z. B. der Moment, als die PSAP-Geschichte klar wurde |
| 4. Eine Sache, die du heute Nacht gelernt hast (optional, 5 s) | technisch | zum Feld | zur Story |
| Abschluss, alle drei | „We're Constellate, Vienna Hub." | | |

Regeln für die Antworten: kein „revolutionary", kein „cure", keine Zahlen, keine Organisationsnamen. Wenn Frage 3 eine persönliche Geschichte berührt: nur die eigene, nie die einer anderen Familie. Länge je Person messen; bei über 30 s die Frage 4 streichen.

**Schnitt:** nur kürzen, Untertitel aus dem Schnittprogramm, Namenseinblendung (Name, Rolle) unten links, zwei Sekunden. Keine Musik.

## 5. Gemeinsame Checkliste vor dem Dreh (12:00)

1. Alle Kanten-IDs aus Abschnitt 0 im Live-Tool öffnen und den Evidenz-Eintrag lesen. Weicht eine ID ab (neuer Export), Skript und `.tts.txt` anpassen.
2. Action Card `?via=MONDO_0018868` ansehen: Welche Sätze stehen wirklich da? Voice-over an die Karte anpassen, nicht umgekehrt. Fixture-Badge „FIXTURE data, not real" darf im Video nirgends erscheinen.
3. Honest-Gap-Fall bestätigt (Hanno und Osman): `MONDO:0012720` oder Alternative; Coverage-Zahlen im Shard lesen.
4. Jede Zahl und Jahreszahl im Voice-over steht in MEDICAL-BACKGROUND mit Quelle, oder sie fliegt raus.
5. `<VERCEL_URL>` durch die Production-Domain ersetzt, nicht die Deployment-URL. Browserleiste sichtbar.
6. Upload-Format in HackOS geprüft (Osman): YouTube unlisted oder Drive. Nach dem Upload jeden Link im privaten Fenster öffnen.
7. Alle vier Links bis 13:30 im Teamboard (Bereich Links) und in `docs/STATUS.md`.
