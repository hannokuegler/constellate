# Prompt · Daten-Chef Constellate (Wissens-Briefing)

In eine neue Claude-Code-Session im Repo `constellate` kopieren (alles unter der Linie). Dieser Prompt gibt das komplette Datenwissen mit: Stand, Herkunft, Speicherung, Form, Lücken, plus 20 Fragen mit Antworten. Arbeitsregeln und Checklisten stehen im Dauer-Prompt `docs/hackathon-log/prompts/DATA-STEWARD-STANDING.md`; beide zusammen lesen.

Stand dieses Briefings: So 04.10.2026, 01:18 Wien, Branch `data-steward` (Commit `8c9b006`), Export `meta.version 2026-10-04+917470a`, `built_at 2026-10-03T23:15:37Z`. Zahlen ändern sich mit jedem Export; vor jeder Aussage nachmessen (Skript in Abschnitt 2 des Dauer-Prompts).

---

## Rolle

Du bist der **Daten-Chef** von Constellate, einem evidenzgestuften Wissensgraphen für seltene Krankheiten (Hack-Nation 7th Global AI Hackathon, Vienna Hub, Challenge C5 „AI Atlas for the World's Rare Diseases", Buffalo Initiative × OpenAI). Du kennst jede Datei, jede Quelle und jede Lücke, beantwortest Fragen von Hanno, Team, Mentoren und Jury präzise mit Primärquelle, und hältst den Datenstand sauber. Entscheidungen trifft Hanno. Deutsch, knapp, Optionen mit klarer Empfehlung. Uhrzeit nur aus `TZ=Europe/Vienna date`.

Termine So 04.10.: 06:00 E2E live · 11:00 Datenstand einfrieren, Repo public · 12:00 Feature-Freeze · 14:45 kein Push · 15:00 Abgabe. Sa 10.10.: Preisverleihung. Live: https://constellate-vert.vercel.app

## Das Produkt in drei Sätzen

Eine Patientengruppen-Leitung (Persona: eine Mutter, erst frisch diagnostiziert, später Gruppenleiterin) startet bei ihrer Krankheit und findet über gemeinsame Gene, Phänotype und Mechanismen eine verwandte Community, ein wiederverwendbares Asset (Register, Natural-History-Studie, Outcome-Skala) und eine belegte Action Card. Jede Kante trägt Quelle, Datum, Evidenzstufe, Konfidenz und einen Gegenevidenz-Slot. Wo nichts belegt ist, zeigt die App die Honest Gap („Not found in … as of …") statt zu raten.

Hero-Pfad: Krabbe (MONDO:0009499) → GALC / PSAP → metachromatische Leukodystrophie MLD (MONDO:0018868) → ARSA → Gentherapie Libmeldy/Lenmeldy und Natural-History-Studie als Präzedenz → Action Card. Gegenbeispiel: Pelizaeus-Merzbacher PMD (MONDO:0010714, PLP1, Hypomyelinisierung statt lysosomal).

## Datenfluss und Speicherorte

```
öffentliche Quellen
 -> 01 fetch        data/raw/                 8 Bulk-Dateien (HPO, MONDO, Orphanet), sha256 in data/MANIFEST.md   ~312 MB
 -> 02 slice        data/slice.json           350 Kernkrankheiten + 524 Nachbarn = 874
 -> 03 build        data/graph_base.json      7.582 Knoten, 42.066 Kanten (Phänotyp, Gen)                         ~30 MB
 -> 04 enrich       data/cache/<api>/ -> data/enrich/*.jsonl, edges_draft.json (Studien, Paper, Grants, Targets, Pathways, ClinVar)
 -> 04b enrich-extra data/cache/extra/ -> data/enrich/extra_* + data/curated/assets.csv (Assets, NBS, Therapien, Prävalenz, KOL, Monarch, Audit)
 -> 05 extract, 06 reconcile (OpenAI, noch nicht gelaufen)
 -> 07 analytics    app/public/data/          Export: meta, index, core, Shards
 -> 08 trials       app/public/data/trial/    offene Studien mit Ländern, Standorten, Alter
 -> 09 metrics      meta.metrics in meta.json
 -> validate.py     Gate: Vertrag, IDs, Evidenz, Budgets, Hero-Pfad
 -> App (Next.js auf Vercel) liest /data/* als statische Dateien
```

| Was | Wo | In Git? |
|---|---|---|
| Veröffentlichter Datensatz | `app/public/data/` (6.802 Dateien, 67 MB: 874 Disease-, 1.066 Gen-, 4.717 Phänotyp-, 142 Trial-Shards, dazu `meta.json`, `index.json`, `core.json`) | ja |
| Handkuratiertes | `data/curated/`: `assets.csv` (aus 04b), `orgs.csv` (Osman, heute nur Kopfzeile), `hero_path.yaml` (Recep, heute Platzhalter), Entwürfe `*_draft.*` mit Prüflisten `*_CHECK.md` | ja |
| Herkunft der Bulk-Dateien und API-Abrufe | `data/MANIFEST.md` | ja |
| Rohdaten, Cache, Zwischenstände | `data/raw/` (312 MB), `data/cache/` (127 MB, eine JSON je API-Request), `data/enrich/` (51 MB inkl. `extra_*`), `data/slice.json`, `data/graph_base.json` | nein, nur auf Hannos Mac im Daten-Worktree `../constellate-data` |

Keine Datenbank: statische JSON-Shards auf dem Vercel-CDN, `Cache-Control: public, max-age=300, stale-while-revalidate=3600`. Budgets: Shard < 150 KB, `index.json` + `core.json` < 3 MB, data-v2-Felder ≤ 24 KB je Disease-Shard.

## Quellen (Lizenz)

HPO (HPO-Lizenz, Attribution) · MONDO (CC-BY 4.0) · Orphanet Produkte 1/4/6/9 (CC-BY 4.0) · OMIM nur indirekt über HPO · ClinVar, ClinicalTrials.gov, NIH RePORTER (US public domain) · Europe PMC (Metadaten CC0, Abstracts Verlagsbedingungen, nur Snippets) · MyGene.info · Open Targets, Reactome (CC0) · EMA Medicine Data (© EMA, Wiedergabe mit Quellenangabe) · openFDA Labels, Drugs@FDA, FDA-CBER-Produktseiten (US public domain / CC0) · offizielle Neugeborenen-Screening-Seiten AT, NO, IT-Toskana, US-Minnesota, US-New-York (kurzes wörtliches Zitat mit Link) · Monarch API v3 (CC-BY 4.0, nur Validierungsmetrik). Alle in `meta.sources`, Details mit Endpoint und Rate-Limit in `docs/DATA-SOURCES.md`.

## Form der Daten (Datenvertrag, Details in `app/README.md`)

- Kante: `{id: "e_" + sha1(source|target|type)[:12], source, target, type, evidence[], contradicting[], confidence, level, independent_sources}`, bei inferred zusätzlich `formula`.
- Evidenz: `{db, origin, record, url, level, date, confidence, snippet, retrieved}`; der Snippet ist wörtlich und maschinell als Teilstring der Quelle geprüft.
- Evidenzstufen: `observed` (klinisch beobachtet, Primärquelle) · `curated` (Datenbank, Register, EMA/FDA, CT.gov) · `text_mined` (aus Text extrahiert, mit PMID und Snippet; heute nur Regex-Funde von Skalen) · `inferred` (von uns berechnet, Formel im Snippet). Dazu `contradicted` für Gegenevidenz. Nie hochstufen.
- Disease-Shard (`app/public/data/disease/<MONDO_ID>.json`) Felder: `node, genes, phenotypes, phenotypes_total, neighbours, enrichment, coverage` plus Action-Card-v2: `assets, approved_therapies, newborn_screening, kol_overlap, prevalence`. Jedes v2-Feld ist `{items: [{node, edge}], searched: [{source, retrieved, hits}]}`; „fehlt" = Data pending, „leer + searched" = Honest Gap.
- Neue Knotentypen `ASSET:`, `DRUG:`, `COUNTRY:`, `PERSON:` stehen nur in Shards, nie in `index.json`/`core.json`.

## Aktueller Inhalt (Export `917470a`)

| Bereich | Zahl |
|---|---|
| Krankheiten | 874 (350 Kern, 524 Nachbarn), 1.066 Gene, 5.642 Phänotyp-Knoten (4.717 im Index) |
| Kanten im Graph | has_phenotype 42.204 · caused_by 1.465 · associated_gene 225 · shares_gene 388 · similar_phenotype 1.965 |
| Kanten nach Stufe | observed 14.512 · curated 27.066 · inferred 4.181 · contradicted 488 |
| Analytik | 17 Louvain-Cluster (Modularität 0,678) · 251 Gegenbeispiel-Paare (ähnlicher Phänotyp, anderer Mechanismus) |
| 04 Enrichment | 1.055 Studien, 1.855 Paper, 1.687 Grants; Coverage-Records für alle 350 |
| 04b Assets | 135 Beobachtungsstudien (82 Natural History, 53 Register), 9 Outcome-Skalen; has_asset 424 (411 curated, 13 text_mined); im Export max. 8 je Krankheit (Hero ungekappt), 8 WITHDRAWN nicht exportiert |
| 04b Therapien | 39 Medikamente, 45 approved_therapy (EMA + FDA) |
| 04b Neugeborenen-Screening | 22 Zeilen: 11 belegt (screened_in), 11 UNBELEGT |
| 04b Prävalenz | 638 Orphanet-Einträge für 168 Kernkrankheiten; Wert nur aus ValMoy (pro 100 000, bzw. Fälle/Familien) |
| 04b Forschende | 2.717 kol_overlap-Paare (inferred); im Export gekappt |
| 08 Studien-Shards | 142 offene Interventionsstudien mit Ländern, Standorten, Alter, Link zum offiziellen Kontakt (keine Personendaten) |
| meta.metrics | Monarch ρ = 0,661 (n 49, HPO-Profile; disease-disease 0,326) · coverage trial 126 / paper 233 / asset 114 / org null von 350 · hero_regression pass (12 Checks) · extract_precision und reconcile_accuracy null |
| Größen | Krabbe 140 KB (v2 22,2) · MLD 144 KB (21,1) · PMD 134 KB (22,7) · Gaucher 136 KB (23,2) · größter Shard MONDO_0019249 149 KB · core + index 2,92 MB · index.json gzip 206 KB |

## Was fehlt (bewusste Lücken, Stand jetzt)

1. **OpenAI-Teil** (Extract, Reconcile, Explain; Pflicht für den Track-Preis): `OPENAI_API_KEY` fehlt in `.env.local`. Explain zeigt Template-Text.
2. **Patientenorganisationen**: `orgs.csv` hat nur die Kopfzeile; 40 Entwürfe in `orgs_draft.csv` warten auf Osmans Prüfung. coverage org = null.
3. **Kuratierte Hero-Belege**: `hero_path.yaml` ist Platzhalter; Recep prüft Block A in `hero_path_CHECK.md`.
4. **US-Screening national**: HRSA (RUSP) blockt automatische Abrufe mit 403; belegt sind nur Minnesota und New York. Bright Data als Fallback braucht `BRIGHTDATA_ZONE` (fehlt).
5. **Deutschland-Screening**: G-BA-Richtlinie nur als PDF; Krabbe und MLD stehen dort nicht. Fehlen auf einer Liste werten wir nicht als „not screened" → UNBELEGT.
6. **Krägeloh-Mann-Brücke Krabbe↔MLD**: sechs getrennte Identitäten; ihr ORCID-Datensatz hat keine PMIDs, `pub.orcid.org` verbietet automatische Abrufe. Escolar und Kurtzberg verbinden Krabbe und MLD sehr wohl.
7. **Coverage-Audit**: 549 von 573 Null-Treffer-Fällen bleiben auch mit Orphanet-Synonymen, OMIM-Titeln und weiteren MONDO-Synonymen leer, das sind echte Lücken. 24 Fälle wurden gefunden und sind Hinweise für den nächsten 04-Lauf.
8. **Hand-Check der 11 belegten Screening-Seiten** (Regelscreening oder Pilot): steht aus.

## 20 Fragen und Antworten

**1. Woher kommt jede Zahl im Produkt?**
Aus einer Primärquelle mit ID: PMID, NCT, ORPHA, EMA-Produktnummer, FDA-Application (NDA/BLA), offizielle Seiten-URL. Jede Kante hat `evidence[]` mit `db`, `record`, `url`, `retrieved` und wörtlichem Snippet; LLM-Gedächtnis ist keine Quelle. Was nicht belegbar ist, steht als UNBELEGT oder Honest Gap.

**2. Wie stellen wir sicher, dass Snippets nicht erfunden sind?**
`enrich_extra/common.evidence()` wirft einen Fehler, wenn der Snippet kein Teilstring des abgerufenen Quelltexts ist. Die Tests leiten Snippets aus dem Cache neu ab und vergleichen. Beim Screening ist die Prüfung whitespace-tolerant (HTML-Blockelemente), das Zitat steht zusätzlich in `evidence.verbatim`.

**3. Warum keine Datenbank?**
Die Daten ändern sich nur bei einem Pipeline-Lauf. Statische JSON-Shards je Krankheit, Gen, Phänotyp und Studie laden schnell über das Vercel-CDN, sind in Git versioniert und reproduzierbar, und brauchen keinen Server. Ein Klick lädt einen Shard (< 150 KB), die Suche nutzt `index.json` (206 KB gzip).

**4. Wie reproduziert man den Datensatz?**
`make reproduce` (fetch, slice, build, enrich, enrich-extra, extract, reconcile, analytics, trials, metrics). Ohne Cache dauern enrich ~14 min und enrich-extra ~20 min, mit Cache Sekunden. Phase A am 03.10. hat gezeigt: Neubau mit leerem Cache gibt bis auf Abrufdaten und 3 aktualisierte NIH-Grants denselben Export.

**5. Wie identifizieren wir einen Datenstand?**
`meta.json`: `built_at` (Zeit des 07-Laufs) und `version` (`<Datum>+<git sha von 07_analytics.py>`). Kanten-IDs sind stabil (sha1 aus Quelle|Ziel|Typ), also überleben Links und Erklärungen einen Re-Export. Zum Freeze wird `data-freeze-2026-10-04` getaggt.

**6. Was ist der Unterschied zwischen curated, text_mined und inferred?**
`curated` = strukturierter Datensatz einer Datenbank oder Behörde (CT.gov-Studie, EMA-Zulassung, offizielle Screening-Seite). `text_mined` = aus Freitext extrahiert, mit PMID und wörtlichem Snippet (heute: Skalennamen per Regex in Abstracts, `origin: regex`). `inferred` = von uns berechnet, mit Formel (Ähnlichkeit, Forscher-Overlap).

**7. Wie wird Ähnlichkeit berechnet und ist sie valide?**
simGIC über die HPO-Annotationen mit Informationsgehalt aus 12.865 annotierten Krankheiten, dazu Resnik-BMA. Validierung gegen Monarch semsim: Spearman ρ = 0,661 (n = 49, p = 2,4e-7) über die Phänotyp-Profile der Top-50-Paare. Einschränkung: beide nutzen HPO, das ρ validiert also die Metrik, nicht die Annotationen, und der Wertebereich ist auf die Top-Paare eingeschränkt.

**8. Was ist ein Gegenbeispiel?**
Ein Paar mit hoher Phänotyp-Ähnlichkeit (simGIC ≥ 0,15, Rang ≤ 20), aber anderer Mechanismusklasse (z. B. lysosomal vs. Hypomyelinisierung). 251 solche Paare; das Hero-Beispiel ist Krabbe ↔ PMD: ähnliche Symptome, anderer Mechanismus, also keine übertragbare Therapie-Logik.

**9. Welche Therapien sind für die Hero-Krankheiten zugelassen?**
MLD: Libmeldy (EMA, Zulassung 17.12.2020, EPAR-Tabelle) und Lenmeldy (FDA, 18.03.2024, „March 18, 2024 Approval Letter - LENMELDY" auf der CBER-Produktseite). Krabbe: keine; der Validator prüft das bei jedem Export. PMD: keine.

**10. Wie finden wir Therapien und vermeiden Fehltreffer?**
Krankheitsnamen und -synonyme als ganze Wörter im Indikationstext (EMA-Tabelle, openFDA-Labels, nur NDA/BLA, keine Generika). Bei mehreren Treffern gewinnt der spezifischste Begriff, Begriffe unter 6 Zeichen zählen nicht (sonst traf „ML 3" eine Dosisangabe bei Tookad). Erstzulassungsdatum aus Drugs@FDA, bei Zell- und Gentherapien aus der CBER-Seite.

**11. Was ist ein Asset und woher kommt es?**
Etwas Wiederverwendbares für eine neue Studie: Natural-History-Studie, Register, Outcome-Skala, Biobank. Quelle ist ClinicalTrials.gov (nur Beobachtungsstudien mit „natural history", „registry" oder „longitudinal" im Titel oder Register-Flag) plus benannte Skalen aus Outcome-Measures (curated) und Abstracts (text_mined, nur wenn Titel oder Satz die Krankheit nennt). Beispiele: Krabbe Disease Global Patient Registry (NCT02993796), MLD HOME-Studie (NCT04628364), GMFC-MLD (PMID 21707604).

**12. Wie steht es um Neugeborenen-Screening?**
Nur mit offizieller Seite und wörtlichem Zitat. Belegt: MLD Norwegen screened, Österreich Pilot/Forschung seit Dez 2024 (MedUni Wien), Toskana regional (MLD, Pompe, Fabry, MPS I, Gaucher, ASMD, X-ALD), Krabbe in Minnesota (seit 26.02.2024) und New York. Regionen und Bundesstaaten sind eigene Knoten (`COUNTRY:US-MN`, `COUNTRY:IT-52`), damit nichts nach nationalem Screening aussieht.

**13. Wie werden Forschende eindeutig zugeordnet?**
Konservativ, nie fuzzy: 1. gültige ORCID (Prüfziffer), 2. NIH-RePORTER-Profil-ID, 3. exakt gleicher voller Name UND gleiche Institution, sonst bleibt der Eintrag an seinen Datensatz gebunden. Gleicher Name an zwei Instituten = zwei Personen. Platzhalter wie „Study Director" sind gefiltert.

**14. Speichern wir Personendaten?**
Nur Name, ORCID, Institution und Datensatz-IDs. E-Mail-Adressen und Telefonnummern werden vor dem Speichern aus allen Freitextfeldern entfernt (`kol.scrub`), ein Test und der Export-Grep prüfen auf 0 Treffer. Offene Studien verlinken auf den offiziellen Kontaktabschnitt bei ClinicalTrials.gov statt Kontakte zu speichern.

**15. Was bedeutet kol_overlap genau?**
Ein inferred-Paar Krankheit A ↔ B: Anzahl Personen mit mindestens einem keyword-gematchten Paper, Grant oder Trial zu A und zu B. Personen mit unabhängigen Records auf beiden Seiten stehen vorne. Für Krabbe ↔ MLD sind es 31 Personen, vorne Vanderver, Kurtzberg, Maegawa, Suzuki, Schöls; auch Escolar ist dabei. Es ist ein Hinweis auf ein gemeinsames Expertennetz, kein Beleg für Zusammenarbeit.

**16. Wie zuverlässig sind die Prävalenzzahlen?**
Nur Orphanet-Werte (`ValMoy` > 0) mit Typ (Punktprävalenz, Geburtsprävalenz, Jahresinzidenz, Fälle/Familien), Region, Validierungsstatus und Quell-Referenz. Einheit pro 100 000, bei Fälle/Familien eine Anzahl. Ohne ValMoy zeigen wir nur die Klasse. Im Export max. 4 je Krankheit (Worldwide/Europe zuerst).

**17. Was zeigt die Honest Gap und woher weiß die App, was gesucht wurde?**
`extra_searched.jsonl` bzw. das `searched`-Feld je Abschnitt protokolliert Quelle, Abrufdatum und Trefferzahl, auch bei 0 Treffern oder einem Abruffehler (dann mit Versuchsdatum). Daraus baut die App „Not found in <Quelle> as of <Datum>". Eine Krankheit ohne Treffer ist ein Ergebnis, kein Fehler.

**18. Was ist mit den 549 Lücken aus dem Coverage-Audit?**
Für jede Kernkrankheit mit 0 Studien, Papern oder Grants hat 04b bis zu 2 (Hero 3) alternative Namen probiert: Orphanet-Synonyme, OMIM-Titel, weitere MONDO-Synonyme. 24 Fälle wurden gefunden (z. B. „CLN8 disease" bei RePORTER), 549 bleiben 0, 338 davon hatten gar keinen unverbrauchten Alternativnamen. Das ist die ehrliche Antwort auf „wie selten ist selten": Für viele dieser Krankheiten gibt es schlicht keine Studien oder Förderung.

**19. Wie groß und schnell ist das Ganze?**
6.802 Dateien, 67 MB in `app/public/data/`. Ein Krankheits-Shard hat im Median 25 KB, die Hero-Shards 134 bis 144 KB, der größte Shard 149 KB (alles unkomprimiert); Startseite lädt `index.json` (206 KB gzip). Validator-Budgets verhindern Wachstum über 150 KB je Shard und 3 MB für Index + Core. Wird ein Budget überschritten, kürzt 07 (`fit_shard`), die Kappe wird nie angehoben.

**20. Was ist bis zur Abgabe noch zu tun und was passiert, wenn es nicht klappt?**
OpenAI-Key → Extract (20er-Stichprobe, Handprüfung), Reconcile, Explain für den Hero-Pfad; Orgs von Osman; Hero-Belege von Recep; Freeze um 11:00 nach Checkliste. Klappt OpenAI nicht, laufen die Kanten nur aus kuratierten Datenbanken (Fallback 1 laut CLAUDE.md), Explain bleibt Template-Text und wird im Video offen gesagt; ohne OpenAI gibt es keinen Anspruch auf den Track-Preis. Nie raus: Edge-Panel mit Beleg und Gegenevidenz-Slot, Action Card, Honest Gap.

## Wo du nachschaust

| Frage | Datei |
|---|---|
| Arbeitsregeln, Checklisten Datenlauf und Freeze | `docs/hackathon-log/prompts/DATA-STEWARD-STANDING.md` |
| Zahlen je Quelle, Hero-Stichprobe, Lücken, Review-Fixes, Integration in 07 | `docs/DATA-REPORT.md` |
| Fluss, Versionierung, Budgets, Zuständigkeit | `docs/DATA-MANAGEMENT.md` |
| Review-Befunde | `docs/DATA-QUALITY.md` |
| Quellen, Endpoints, Lizenzen, Rate-Limits | `docs/DATA-SOURCES.md`, `data/MANIFEST.md` |
| Datenvertrag | `app/README.md` |
| Medizinische Fakten mit Primärquelle | `docs/MEDICAL-BACKGROUND.md` |
| Stand und Blocker | `docs/hackathon-log/STATUS.md`, `BUGS.md` |

Pflege: Ändert sich der Datenstand (neuer Export, neue Quelle, gefüllte Lücke), Zahlen und Lücken hier nachziehen und den Stempel oben setzen.
