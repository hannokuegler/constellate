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
- Mapping: Sektion `screening` → `newborn_screening`, `therapies` → `approved_therapies`, `kol` → `kol_overlap`; Asset-Knoten nur mit App-Feldern; Skalen-Quelle (`source_*`, `url`) und NBS-Status je Kante statt vom geteilten Knoten; NBS-Snippet = wörtliches Zitat; Skalen, deren Beleg nur ein Europe-PMC-Abstract-Treffer ist, als `text_mined` (herabgestuft, nie hochgestuft); `person_ids`, `person_key`, `matched_*`, `record_aliases` fallen weg; E-Mail- und Telefonmuster werden aus Name und Affiliation entfernt. Prävalenz nur mit explizitem Orphanet-ValMoy („x per 100 000“, bei Cases/families „N cases/families“); die Klassen-Mittelwerte, die 04b pro Million einsetzt und als pro 100 000 beschriftet, fallen weg; keine `ambiguous_xref`-Einträge. Kanten, Konfidenz und Formel unverändert, `contradicting: []` überall.
- Kappen (`meta.parameters.v2`, nach docs/DATA-QUALITY.md): assets 8 je Krankheit (WITHDRAWN nie, Hero-Krankheiten alle übrigen), kol_overlap 5 Partner nach Personenzahl plus jeder Graph-Nachbar und die Hero-Paare, 6 Personen je Paar, 2 Records je Person; prevalence 4 Einträge ohne XML-Snippet; alle v2-Felder zusammen höchstens 12 KB je Shard (07 kürzt zuerst KOL, `validate` prüft). Reicht das Shard-Budget (150 KB) nicht, kürzt `fit_shard` danach Snippets.
- `meta.sources` bekommt die neuen Quellen (EMA, FDA, NBS-Seiten, ClinicalTrials.gov-Beobachtungsstudien, Europe PMC Skalen, Forschenden-Overlap, Orphanet-Prävalenz, Monarch) mit Abrufdatum; `meta.counts.v2` zählt Felder, Items und Kappungen.
- `validate.py`: prüft Format, Edge-ID-Regel, Level (curated bzw. inferred mit Formel), Snippets (außer UNBELEGT), keine `email`/`phone`-Keys, keine Mail-Adressen oder Telefonnummern, keine WITHDRAWN-Assets, NBS-Snippet wörtlich, Abstract-Skalen nicht curated, höchstens 4 Prävalenz-Einträge ohne Snippet, v2-Felder höchstens 12 KB je Shard, keine ASSET:/DRUG:/COUNTRY:/PERSON:-Knoten im Index. Hero (nur wenn das Feld existiert, sonst Hinweis): MLD hat Libmeldy und Lenmeldy, Krabbe hat keine Zulassung, Krabbe hat mindestens ein Asset.
- `09_metrics.py` (`make metrics`): schreibt nur `meta.metrics`. Befüllbar jetzt: `monarch_spearman` (Profil-Variante als Wert, disease-disease als `secondary`), `coverage` (aus dem Export gezählt), `hero_regression` (Hero-Checks aus `validate.run`). Null bis Eingaben existieren: `extract_precision` (`data/curated/extract_review.csv` mit `pmid,claim_id,correct,reviewer`, correct = yes/no, oder `extract_check.csv`), `reconcile_accuracy` (verifizierte Orgs in `orgs.csv` mit `orpha_ids` gegen `data/reconcile/org_disease_edges.json`).
- Tests: `pipeline/tests/test_integrate_v2.py` (Mini-Export in tmp_path).

## Review-Fixes (Data Steward, So 04.10.2026, 01:16 Wien)

Checks C1–C8 aus `docs/hackathon-log/prompts/DATA-MANAGER.md` auf den lokalen `data/enrich/extra_*`, vorher und nachher. Code: `pipeline/enrich_extra/` (prevalence, nbs, assets, kol), `pipeline/04b_enrich_extra.py`, eine Regex in `pipeline/07_analytics.py`.

| Check | Vorher | Nachher |
|---|---|---|
| C1 Prävalenz: `value` ohne Orphanet-ValMoy > 0 (Fallback aus der Klasse, falsche Einheit) | 100 | 0. `value` nur aus ValMoy, `unit` je Typ (`per 100 000`; `cases` 73 / `families` 3 bei Cases/families), `qualification` geparst, Snippet wird nur abgeschnitten, nie mit „..." aufgefüllt (bleibt Teilstring). 149 Einträge haben nur eine Klasse und keinen Wert |
| C1 ValMoy in Exponentialschreibweise (`4.0E-4`) | in 07 verworfen | übernommen (Regex in 07 und Test) |
| C2 Therapien mit Einschränkungs-Wörtern | 1 markiert (Cholbam, MONDO:0019609) | von Hand geprüft: echte Indikation („Adjunctive treatment of peroxisomal disorders (PDs) including Zellweger spectrum disorders …"), das Wort kam nur aus dem angehängten „Limitations of use:". Bleibt drin |
| C3 Skalen aus Abstracts | 28 Zuordnungen, alle `curated` | 22, alle `text_mined` mit `origin: regex`; nur wenn Titel oder derselbe Satz die Krankheit nennt (raus u. a. PMD ↔ GMFM aus PMID 42060827, einem allgemeinen Leukodystrophie-Paper). Krabbe ↔ Loes-Score (PMID 41604001, „Long-term neurological outcome after hematopoietic stem cell transplant in juvenile Krabbe …") bleibt: Das Paper handelt von Krabbe. SARA nur in Großbuchstaben. has_asset jetzt 411 curated + 13 text_mined |
| C4 KOL | Personen nach Record-Zahl | je Person `n_records_a`, `n_records_b`, `independent`; Sortierung: unabhängige Records auf beiden Seiten zuerst, dann die schwächere Seite. Formel: „people with >= 1 keyword-matched paper, grant or trial" |
| C5 E-Mail / Telefon in `extra_kol_overlap.json`, `extra_people.jsonl`, `extra_edges.json` | E-Mail 0; die Telefon-Regex aus C5 meldete Tausende Treffer, alles Fehlalarme (ORCIDs, Hash-IDs, Nachname „Tel", „Tel Aviv") | 0 / 0 mit der präzisen Regex (`kol.PHONE`, ORCID-sicher), die jetzt vor dem Speichern über alle Freitextfelder läuft; Test ergänzt |
| C6 NBS | 6 UNBELEGT-Zeilen ohne `retrieved`; RUSP-Notiz „as of January 2023"; MN-Evidenz mit Abrufdatum | Versuchsdatum auch bei 403 (gecacht, offline gleich); Notiz ohne Datum; MN `date = 2024-02-26` (Pressemitteilung). Hand-Check der 11 belegten Seiten (Regel- vs. Pilotscreening) steht noch aus (Recep / Hanno) |
| C7 Krägeloh-Mann | 6 getrennte Identitäten | unverändert getrennt. Der ORCID-Datensatz 0000-0003-4599-1373 (Ingeborg Krägeloh-Mann) listet 15 Werke, aber keine PMID; die Zusammenführung mit PMID 21707604 ist so nicht belegbar. `pub.orcid.org/robots.txt` verbietet automatische Abrufe, also keine weitere Abfrage. Keine `person_aliases.csv` |
| C8 Determinismus | byte-identisch | byte-identisch (zwei Offline-Läufe, alle `extra_*` außer `extra_run_log.jsonl`) |

Folgen im Export (`make analytics metrics validate`, grün): coverage asset 117 → 114 (3 Krankheiten hatten nur eine falsch zugeordnete Abstract-Skala). Hero-Shards: Krabbe 140 KB (v2 22,2 KB), MLD 144 KB (21,1), PMD 134 KB (22,7), Gaucher 136 KB (23,2); größter Shard MONDO_0019249 149 KB; `core.json` + `index.json` 2,92 MB, `index.json` gz 206 KB. Tests: `pytest pipeline/tests` 91 passed. E2E 3/3, tsc und lint grün.

## KI-Schritte mit Claude: Extract, Reconcile, Explain (Data Steward, So 04.10.2026, 02:00 Wien)

Ausgangslage: Das Team hat keine OpenAI-Credits bekommen, nur Anthropic-Credits. Die OpenAI-Pfade (05, 06, `npm run explain`) bleiben im Code und werden mit einem Key wieder aktiv. In diesem Lauf haben Claude-Code-Subagents die Modellantworten geliefert. Sie liegen im selben Cache-Format, das die Pipeline auch für OpenAI-Antworten nutzt, und die Pipeline prüft sie mit denselben deterministischen Regeln. Jede Kante nennt das tatsächlich verwendete Modell: `origin` „Claude extract“ bzw. „Claude judge“, `model` „claude-sonnet-5-5“. Es wird nirgends „OpenAI“ behauptet. Es gab keine API-Abrechnung; die Subagents haben zusammen rund 1,5 Mio. Tokens im Claude-Code-Kontingent verbraucht.

| Schritt | Eingabe | Ergebnis | Metrik |
|---|---|---|---|
| 05 Extract | 342 Hero-Abstracts (Europe PMC), Prompt `extract-7c36af1f`; 4 Subagents (Sonnet 5.5), jede Antwort ging vor dem Cache durch Schema- und Wörtlich-Check | 701 Roh-Claims → 165 bestehen das Grounding (abgelehnt: Objekt nicht im Graph 416, Subjekt nicht im Graph 267, mehrdeutig 8, Typ passt nicht 4, Selbstschleife 2) → Review-Gate → **148 Claims, 50 Kanten** (33 an bestehende Kanten angehängt, 17 neu: 4 Gen, 12 Phänotyp, 1 sonstige); Kanten mit Stufe text_mined im Export: 61 | `extract_precision` **0,897** (n = 165), unabhängiges Modell-Review (Opus 5.5, nicht der Extraktor), auf `/methods` als „not a hand review“ gekennzeichnet. Nachsichtig gewertet (Elternknoten statt Subtyp zählt als richtig) 0,982 |
| Review-Gate (neu in 05) | `data/curated/extract_model_review.csv` | 17 „wrong“ gehen nicht ins Produkt (`rejected.jsonl`, Grund `independent_review_wrong`): 15× Subtyp auf die Eltern-Krankheit gemappt (z. B. adulter Krabbe → Krabbe), 2× „causes“, wo der Text nur „associated“ / „linked“ sagt | Handprüfung: 20er-Stichprobe in `data/curated/extract_check.csv` (Rey). Sobald sie ausgefüllt ist, ersetzt 09 den Modellwert automatisch durch die Handprüfung |
| Orgs | 40 Entwürfe (`orgs_draft.csv`) | 1 Subagent hat jede Seite live abgerufen und die Zitate wörtlich abgeglichen: 31 pass, 8 korrigiert, 1 fail (LAL Solace, Seite offline). Register yes 19 → 17, NHS yes 14 → 11, Biobank yes 3 → 2; nichts auf yes hochgestuft. **39 Orgs in `orgs.csv`** mit `verified_date` 2026-10-04, Vermerk „verified by Claude agent“ in `notes`. Details: `data/curated/orgs_agent_REPORT.md` | – |
| 06 Reconcile | 89 Krankheitsnamen der 39 Orgs | Fuzzy 40; für die übrigen 49 gibt es die neue Methode `cache-judge` (Kandidaten: Fuzzy + WRatio, keine Embeddings ohne OpenAI). Der Judge (Sonnet 5.5) wählt nur aus diesen Kandidaten oder „none“, Schwelle 0,5 wie beim OpenAI-Judge: 39 zugeordnet, 10 none (u. a. „Ähnliche Krankheiten“, „Seltene Krankheiten (Dachverband)“). **78 advocated_by-Kanten**, 44 Krankheiten mit Org, coverage org 43 von 350 | `reconcile_accuracy` **0,778** (n = 72; Fuzzy 30/38, Judge 26/34). Streng: Ein Treffer zählt nur, wenn die Krankheit eine der ORPHA-IDs der Org trägt. Fast alle „Fehler“ sind Sammelbegriffe (z. B. „Leukodystrophies“ → leukodystrophy), die in der ORPHA-Liste der Org nicht vorkommen |
| Explain | 53 Action Cards (3 Hero + 50 Kern), gleicher System-Prompt, gleiche Kantenmenge, gleicher Zitat-Check wie `/api/explain` | 2 Subagents, **390 Sätze, 0 verworfen, 0 erfundene IDs**. Formal angepasst: Zitatlisten `[e_a, e_b]` werden vor dem Check in `[e_a] [e_b]` aufgeteilt, weil der Check eine ID pro Klammer liest. Hero-Karte Krabbe → MLD von Hand gegengelesen (PSAP-Satz deckt sich mit ORPHA:206436) | – |

Export `2026-10-04+36da1b9` auf Branch `claude-extract` (c24b2d1): `make validate` grün, Hero-Pfad 12 von 12, core + index 2,95 MB, größter Shard 150 KB (MONDO_0019249), 39 Org-Shards, 53 Explain-Dateien. tsc, lint und E2E 3 von 3 grün, `pytest pipeline/tests` 91 passed, E-Mail-Grep über `app/public/data/` 0 Treffer.

Offen:
- Handprüfung der 20 Claims (Rey).
- App-Texte nennen noch OpenAI: `normalize.ts` 128–129, `MethodsView` 14/28/136, `about` 100. Hanno will neutrale Beschriftung; das ist an den Orchestrator weitergegeben. Die Metrik-Beschreibung „a person confirmed …“ stimmt erst, wenn Reys Handprüfung drin ist.
- Das Ingest-Skript für Explain (`app/scripts/.explain-claude.tmp.ts`) ist nicht committet, weil `app/` der App-Session gehört. `data/extract/` und `data/reconcile/` sind Zwischenstände und bleiben unversioniert.
- Verbesserung für den nächsten Lauf: Beim Mapping eine Subtyp-Liste je Krankheit in den Extract-Prompt geben; das beseitigt die häufigste Fehlerklasse.
