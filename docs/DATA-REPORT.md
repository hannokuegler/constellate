# Daten-Report data-v2 (lokale Session, So 04.10.2026, ca. 00:30 Wien)

Ersetzt den Zwischenstand der Cloud-Session (dort war kein Datenhost erreichbar). Alle Zahlen kommen aus `data/enrich/extra_run_log.jsonl`, `extra_metrics.json` und den Ausgabedateien; nichts aus Modellwissen.

## Phase A: Reproduzierbarkeit

Lauf Sa 03.10. 23:31 bis 23:45 Wien auf Hannos Mac, API-Cache vorher geleert: `make fetch slice build enrich analytics validate`.

- fetch: 8/8 Bulk-Dateien, sha256 identisch zu `data/MANIFEST.md` vom 03.10. (Orphanet neu geladen, gleicher Inhalt). slice 350 Kern + 524 Nachbarn, build 7.582 Knoten / 42.066 Kanten, wie committed.
- enrich ohne Cache 820 s (ctgov 736 Requests, 1.055 Trials; RePORTER 351 Requests, 1.687 Grants; 0 Fehler). edges_draft: studied_in 1.998, mentioned_in 2.075, funded_by 3.012, in_pathway 418, target_score 802, 0 ID-Kollisionen.
- validate: grün (Hero-Checks alle ok).
- `git diff app/public/data` gegen den Commit: 351 Dateien, davon 350 nur `coverage[].retrieved` (neues Abrufdatum) plus `meta.json/built_at`. Inhaltlich geändert: 3 Disease-Shards (MONDO:0018937, MONDO:0015339, MONDO:0019609), jeweils ein RePORTER-Grant mit neuem Fiscal Year / PI-Liste. Erklärbar durch Quellenänderung seit 03.10. 21:00. Danach `git restore app/public/data`, nichts committet.

## Phase B: Ergebnis je Quelle (Scope core, 350 Krankheiten)

| Quelle | Records | Kanten | Laufzeit (mit Netz) |
|---|---|---|---|
| B1 Assets: ClinicalTrials.gov Beobachtungsstudien | 135 Studien (82 natural history, 53 registry) | has_asset 428 (inkl. Skalen) | 902 s, 781 Requests |
| B1 Outcome-Skalen (Outcome-Measures + Abstracts) | 98 Asset-Zeilen, 9 Skalen | in has_asset enthalten | – |
| B1 Newborn Screening (offizielle Seiten) | 22 Zeilen: 11 belegt, 11 UNBELEGT | screened_in 11 | 2 s |
| B2 Therapien EMA + FDA | 66 Zuordnungen (EMA 36 / FDA 30), 39 Medikamente | approved_therapy 45 | 72 s |
| B3 Prävalenz Orphanet | 638 Einträge für 168 Kernkrankheiten | keine (Knotenattribut) | 0,3 s |
| B4 Forschenden-Netzwerk | 15.302 Personen-Slots, 12.823 identifizierbar (ORCID / NIH-Profil / Name+Institution), 2.478 nur record-gebunden | kol_overlap 2.717 (inferred), authored_by 1.916, investigator_of 889 | 32 s |
| B5 Monarch-Cross-Check | 50 Paare | keine | 37 s |
| B6 Coverage-Audit | 573 Null-Fälle geprüft | keine | 240 s |

Offline-Zweitlauf (`--offline`, kein Netz) 27 s, alle Ausgaben byte-identisch zum Online-Lauf.

`data/curated/assets.csv`: 477 Zeilen (225 natural_history_study, 132 registry, 98 outcome_scale, 22 newborn_screening davon 11 UNBELEGT).

Pflichtchecks B2: Libmeldy EMA 2020-12-17 (MA-Datum aus der EMA-Tabelle) und Lenmeldy FDA 2024-03-18 (CBER-Produktseite, „March 18, 2024 Approval Letter - LENMELDY") für MLD vorhanden. Für Krabbe (inkl. Subtypen) keine Zulassung. NCT-Aliase: CT.gov liefert den neuen Datensatz mit `nctIdAliases`, z. B. NCT05739643 ← NCT04693598 (7 Trials mit Alias in ctgov.jsonl; keine der Beobachtungsstudien hat einen).

## Hero-Stichprobe

| | Assets (has_asset) | Therapien | NBS | KOL |
|---|---|---|---|---|
| Krabbe MONDO:0009499 | 7: Krabbe Disease Global Patient Registry NCT02993796, Natural History of Infantile GLD NCT00983879, Myelin Disorders Biorepository NCT03047369, NCT03333200, NCT04880356, NCT01093105 (withdrawn), Loes-Score | 0 (korrekt) | 2, nur Bundesstaaten: US-MN (universal seit Feb 2024, Pressemitteilung MDH), US-NY (Wadsworth-Liste) | Krabbe↔MLD 31 Personen (e_ab9500b094c5), u. a. Kurtzberg, Escolar, Vanderver, Orchard, Gelb |
| MLD MONDO:0018868 | 10: Natural-History-Studien NCT04628364 (HOME), NCT01963650, NCT00639132, Register NCT01793168, NCT03047369, NCT04880356, Skalen GMFC-MLD (PMID 21707604 + NCT04628364), GMFM, Vineland, Mullen | 2: Libmeldy (EMA), Lenmeldy (FDA) | 3: NO screened, AT pilot/research (MedUni Wien, seit Dez 2024), IT-52 Toskana regional | 125 Personen in Overlaps |
| PMD MONDO:0010714 | 4: NCT03333200, NCT03047369, NCT04880356, GMFM | 0 | 0 | Krabbe↔PMD 2 (Vanderver, Kurtzberg) |

KOL-Stichprobe: Escolar und Kurtzberg verbinden Krabbe und MLD je als eine Identität (Escolar: „Maria Escolar · University of Pittsburgh", Kurtzberg: „Joanne Kurtzberg · Duke University"). Krägeloh-Mann verbindet sie **nicht**: 6 getrennte Identitäten, weil die Affiliation-Strings verschieden sind (z. B. „University Children's Hospital Tübingen" vs. „Department of Neuropediatrics University Children's Hospital Tübingen Germany" ohne Komma) und nur ein Paper eine ORCID trägt. Das ist die gewollte konservative Regel (exakter Name UND gleiche Institution), kein Fehler. Escolar hat zusätzlich 16 weitere getrennte Identitäten (verschiedene Pittsburgh-Schreibweisen, NIH-Profil 9044068).

## Messwerte für die Jury (Phase E, `data/enrich/extra_metrics.json`)

- `monarch_spearman`: ρ = 0,661 (n = 49, p = 2,4e-7) zwischen unserem simGIC und Monarch semsim über die HPO-Profile (ancestor_information_content, Mittel der Best Matches), Monarch API v3, 2026-10-03. Variante wie im Prompt (`compare/<MONDO>/<MONDO>`, vergleicht nur die Krankheitsklassen in MONDO): ρ = 0,326 (n = 50, p = 0,021). Für die Jury die Profil-Variante nennen, sie misst dasselbe wie simGIC. Einschränkung: nur Top-50 nach simGIC (eingeschränkter Wertebereich).
- `coverage` (von 350 Kernkrankheiten mit ≥ 1): trial 126, paper 233, asset 117, org 0 (`orgs.csv` hat noch keine verifizierten Einträge).
- `extract_precision`: null (B7 nicht gelaufen).
- `hero_sample`: siehe Tabelle oben (Krabbe 7/0/2/72, MLD 10/2/3/125, PMD 4/0/0/62; Reihenfolge Assets/Therapien/NBS-Länder/KOL-Personen).

## Bewusste Lücken

- **NBS US national:** HRSA (RUSP-Seite und newbornscreening.hrsa.gov) blockt automatische Abrufe mit 403 (Akamai). Krabbe, Pompe, MPS I/II, X-ALD stehen dort laut Recherche, sind aber nicht maschinell belegt → `UNBELEGT`. Belegt sind nur die Bundesstaaten MN und NY. Kein Proxy-Umweg (B8 nicht aktiv).
- **NBS DE:** G-BA veröffentlicht die Kinder-Richtlinie nur als PDF; Krabbe und MLD stehen nicht unter den Zielkrankheiten. Fehlen auf einer Liste wird **nicht** als „not screened" gewertet → `UNBELEGT`. Gleiches für AT/NO bei Krabbe.
- **NBS IT:** keine nationale Liste erreichbar; nur Toskana (regional, Knoten `COUNTRY:IT-52`).
- **B6 Coverage-Audit:** 549 von 573 Null-Fällen bleiben 0 auch mit Orphanet-Synonymen, OMIM-Titeln und weiteren MONDO-Synonymen (338 davon ohne einen einzigen unverbrauchten Alternativnamen) → echte Lücken. 24 Fälle gefunden (`recovered`), z. B. „CLN8 disease" (RePORTER), „Cree leukoencephalopathy" (CT.gov), „Chanarin-Dorfman syndrome" (RePORTER). Die gefundenen Records sind Hinweise für den nächsten 04-Lauf, keine Kanten.
- **B4:** 2.478 Autor-Slots ohne Affiliation oder nur mit Initialen bleiben record-gebunden und zählen nirgends mit. Platzhalter wie „Study Director" sind gefiltert, E-Mail-Adressen werden vor dem Speichern entfernt (Test prüft das).
- **B7 OpenAI / B8 Bright Data:** nicht gelaufen, `OPENAI_API_KEY` und `BRIGHTDATA_ZONE` fehlen in `.env.local` (BRIGHTDATA_API_KEY ist gesetzt, ohne Zone aber laut Prompt überspringen). Keine Annahmequote, keine Kosten, keine `orgs_extracted_draft.csv`.
- **Skalen** sind „documented" (wörtlich genannt), nicht „validiert für diese Krankheit".

## Receps Code (data-v2, 2b14b1f)

- Übernommen: `common.py` (robots.txt, Doc-Cache, `evidence()` mit Teilstring-Prüfung, `finalize()`; ergänzt um `formula` an inferred-Kanten), `prevalence.py` (Parser korrekt), aus `people.py` ORCID-Prüfziffer, Affiliation-Bereinigung und Hero-PMID-Liste.
- Korrigiert: Prävalenz `ValMoy` ist bei Orphanet „pro 100 000", nicht pro Million (Krabbe 0,327 in Klasse 1–9/1 000 000 passt nur so); Ausgabe jetzt `value` + `unit`.
- Neu geschrieben: `assets.py` (Filter auf OBSERVATIONAL, Skalen-Muster inkl. „Gross Motor Function Classification for MLD", Hero-PMIDs an Krankheiten gematcht), `nbs.py` (Seeds mit Zitat statt Regex, Bundesstaaten/Regionen als eigene Knoten), `kol.py` (statt people.py: Hero-PMIDs wurden dort keiner Krankheit zugeordnet, Snippets waren konstruiert, CT.gov-Officials fehlten). `people.py` und `reproduce.py` bleiben liegen, werden von 04b nicht aufgerufen.

## Tests

`uv run --project pipeline pytest pipeline/tests -q`: 48 passed (13 neue in `test_enrich_extra.py`: ID-Regel, Pflichtfelder, contradicting, Level-Regeln, Formel an kol_overlap, Snippets wörtlich aus Cache neu abgeleitet, Krabbe ohne Zulassung, Libmeldy/Lenmeldy, keine E-Mails, Disambiguierung gleichnamig/andere Institution, ORCID-Prüfziffer, Initialen, Determinismus zweier Offline-Läufe).
## Integrations-Anleitung für 07 (Einbau macht die Cloud-Session)

Erzeugen: `make enrich-extra` (nach `make enrich`; ohne Netz: `uv run --project pipeline python pipeline/04b_enrich_extra.py --offline`). Alle Dateien liegen in `data/enrich/` (gitignored), nur `data/curated/assets.csv` ist versioniert.

| Datei | Inhalt | Einbau in 07 |
|---|---|---|
| `extra_edges.json` | `{meta, nodes, edges}` wie `edges_draft.json`; Kanten-ID `e_` + sha1(`source|target|type`)[:12], `contradicting: []`, Evidenz mit db, origin, record, url, level, date, confidence, snippet, retrieved | Kanten mit `source` = Krankheit in den Disease-Shard der Quelle hängen; Knoten aus `nodes` per id nachschlagen |
| `extra_searched.jsonl` | je Krankheit × Abschnitt (`assets`, `screening`, `therapies`, `kol`): `{mondo_id, section, source, retrieved, hits, error?, queries?}` | als `searched` neben die Items: `{items: [...], searched: [{source, retrieved, hits}]}` |
| `extra_prevalence.jsonl` | je Orphanet-Eintrag `{mondo_id, type, class, value, unit, region, validation, references, source: {db, record, url}, retrieved, snippet}` | Liste je Krankheit als `prevalence` (Knotenattribut, keine Kante); `value` ist Orphanet-ValMoy **pro 100 000** (`unit`) |
| `extra_kol_overlap.json` | je Paar `{disease_a, label_a, disease_b, label_b, n_people, formula, edge_id, people: [{name, orcid, person_key, affiliation, records: [{db, record, url}]}]}` | für den Shard von A und von B: `{disease: {id, label}, edge, people}` |
| `extra_therapies.jsonl`, `extra_assets.jsonl`, `extra_nbs.jsonl`, `extra_ctgov.jsonl`, `extra_people.jsonl` | Rohdatensätze je Quelle (Debug, Audit) | nicht nötig |
| `extra_coverage_audit.jsonl` | B6: je (Krankheit, Quelle) mit 0 Treffern die Alternativnamen und `verdict: recovered | gap` | optional im Honest-Gap-Satz: „also searched as …" |
| `extra_metrics.json` | `monarch_spearman`, `coverage`, `extract_precision` (null), `hero_sample` | über 09_metrics nach `meta.metrics` |

Kantentypen in die Disease-Shards (Feldname = App-Feld aus `app/README.md`, Abschnitt Upcoming fields):

| Kante | Richtung | Level | Shard-Feld | Knotenfelder (sind schon im Knoten) |
|---|---|---|---|---|
| `has_asset` | Krankheit → `ASSET:<NCT>` oder `ASSET:scale_<slug>` | curated | `assets` | label, asset_type, country, status, source_type, source_id, url, check (+ sponsor, start_date, completion_date, enrollment, nct_aliases, outcome_measures bei Studien) |
| `approved_therapy` | Krankheit → `DRUG:<Name>` | curated | `approved_therapies` | label, authority, approved (früheste Zulassung), holder, url, inn, `approvals[]` (alle Behörden); Datum zusätzlich in `evidence[].date`, Behörde in `evidence[].db` |
| `screened_in` | Krankheit → `COUNTRY:<ISO>` bzw. `COUNTRY:<ISO-3166-2>` für Regionen/Bundesstaaten (`US-MN`, `US-NY`, `IT-52`) | curated | `newborn_screening` | label, status, url, jurisdiction; Status steht als `[status]` vorn im Snippet, das wörtliche Zitat in `evidence[].verbatim` |
| `kol_overlap` | Krankheit ↔ Krankheit (sortiertes Paar) | inferred | `kol_overlap` | Formel in `edge.formula` und im Snippet; Personen aus `extra_kol_overlap.json` |

Nicht in die Shards: `authored_by` (PMID → PERSON) und `investigator_of` (PERSON → NCT/Grant). Sie belegen die Personen in `kol_overlap` und sind nur für Personen in einem Overlap geschrieben.

UNBELEGT-Zeilen (NBS ohne offizielles Zitat) erzeugen **keine** Kante; sie stehen in `data/curated/assets.csv` (`check = UNBELEGT`) und als `hits: 0` in `extra_searched.jsonl`. Die App zeigt dann die Honest Gap „Not found in … as of …".

## Integration done in 07/09 (Branch integrate-v2)

- `07_analytics.py` Teil 11 (`load_extra`, `build_v2`): liest `extra_edges.json`, `extra_searched.jsonl`, `extra_prevalence.jsonl`, `extra_kol_overlap.json`, `extra_metrics.json` (nur für die Monarch-Quelle) und `extra_run_log.jsonl` (Prävalenz-Scope). Fehlt alles, bleibt der Export wie bisher. Nichts davon geht in Ähnlichkeit, Louvain, `core.json`, `index.json`, Degree oder `counts.edges`.
- Disease-Shard-Felder im App-Format (`app/README.md`, Abschnitt Data-v2 fields): `assets`, `approved_therapies`, `newborn_screening` je `{items: [{node, edge}], items_total, searched}`; `kol_overlap` `{items: [{disease, edge, people_total, people}], items_total, searched}`; `prevalence` als Array. Ein Feld steht nur dort, wo 04b die Krankheit für diesen Abschnitt durchsucht hat oder etwas fand; Prävalenz bei Scope core für alle 350.
- Mapping: Sektion `screening` → `newborn_screening`, `therapies` → `approved_therapies`, `kol` → `kol_overlap`; Asset-Knoten ohne `outcome_measures`; `person_ids` und `person_key` fallen weg; E-Mail-Muster werden aus Name und Affiliation entfernt. Prävalenz: `value` wird Anzeigetext „x per 100 000"; steht im Orphanet-Datensatz kein `ValMoy`, hatte 04b den Klassen-Mittelwert **pro Million** eingesetzt und als „per 100 000" beschriftet. Diese Werte setzt 07 auf null (`value_note`), die Klasse bleibt. Kanten, Level, Konfidenz und Formel unverändert, `contradicting: []` überall.
- Kappen (`meta.parameters.v2`): assets 25 je Krankheit, kol_overlap 10 Partner (nach Personenzahl), 5 Personen je Paar, 6 Records je Person; Krabbe, MLD und PMD behalten alle Assets und alle Hero-Paare ungekappt. Reicht das Shard-Budget (150 KB) nicht, kürzt `fit_shard` zuerst Snippets, dann Records je Person (Namen bleiben).
- `meta.sources` bekommt die neuen Quellen (EMA, FDA, NBS-Seiten, ClinicalTrials.gov-Beobachtungsstudien, Europe PMC Skalen, Forschenden-Overlap, Orphanet-Prävalenz, Monarch) mit Abrufdatum; `meta.counts.v2` zählt Felder, Items und Kappungen.
- `validate.py`: prüft Format, Edge-ID-Regel, Level (curated bzw. inferred mit Formel), Snippets (außer UNBELEGT), keine `email`/`phone`-Keys, keine Mail-Adressen, keine ASSET:/DRUG:/COUNTRY:/PERSON:-Knoten im Index. Hero (nur wenn das Feld existiert, sonst Hinweis): MLD hat Libmeldy und Lenmeldy, Krabbe hat keine Zulassung, Krabbe hat mindestens ein Asset.
- `09_metrics.py` (`make metrics`): schreibt nur `meta.metrics`. Befüllbar jetzt: `monarch_spearman` (Profil-Variante als Wert, disease-disease als `secondary`), `coverage` (aus dem Export gezählt), `hero_regression` (Hero-Checks aus `validate.run`). Null bis Eingaben existieren: `extract_precision` (`data/curated/extract_review.csv` mit `pmid,claim_id,correct,reviewer`, correct = yes/no, oder `extract_check.csv`), `reconcile_accuracy` (verifizierte Orgs in `orgs.csv` mit `orpha_ids` gegen `data/reconcile/org_disease_edges.json`).
- Tests: `pipeline/tests/test_integrate_v2.py` (Mini-Export in tmp_path).
