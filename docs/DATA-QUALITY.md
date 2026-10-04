# Data-Quality-Review: PR #1 (data-v2) und Datenauslieferung

Stand So 04.10.2026, ca. 00:45 Wien. Cloud-Session ohne Datenhosts: geprüft wurden Code, `data/curated/assets.csv`, Doku und der aktuelle Export in `app/public/data/` (Branch `integrate`). Die lokalen Ausgaben `data/enrich/extra_*` (gitignored, nur auf Hannos Mac) konnten **nicht** geprüft werden; was davon abhängt, steht als Skript-Check in [prompts/DATA-MANAGER.md](hackathon-log/prompts/DATA-MANAGER.md). Alle Zahlen unten kommen aus Skripten über die genannten Dateien.

## Urteil

**Mergen: ja** (Code, `assets.csv`, Doku), weil der PR nur gitignorierte Zwischendateien schreibt und das Produkt nicht ändert. Vorher den trivialen Makefile-Konflikt mit `integrate` lösen (`.PHONY`-Zeile). **Export der data-v2-Felder durch 07 erst nach den drei Blockern unten**, sonst zeigt das Produkt falsche Prävalenzzahlen und `make validate` wird rot.

## 1. Review-Kommentar (Text für PR #1, noch nicht gepostet)

### Blocker (vor dem Export nach `app/public/data`)

1. **Prävalenz: Einheit und Wert teils falsch.** `prevalence.py` setzt `value_per_million` aus `ValMoy`, sonst aus `class_to_value()` (Mittelpunkt **pro Million**: `1-9 / 1 000 000` → 5,0; `>1 / 1 000` → 5.000). `04b` schreibt beides als `value` mit `unit: "per 100 000 (Orphanet ValMoy)"`. Folge: (a) Fallback-Werte sind um Faktor 10 zu hoch und keine Orphanet-Zahl, sondern selbst gerechnet (Regel 1); (b) beim Typ `Cases/families` ist `ValMoy` eine Fallzahl, keine Rate, „per 100 000" ist dann falsch; (c) `qualification` ist immer `None` (wird nicht geparst), man kann Wert und Klasse also nicht unterscheiden. Fix in 04b: `value` nur aus `ValMoy > 0`; `unit` je Typ (Punkt-, Geburts-, Lebenszeitprävalenz, Jahresinzidenz → „per 100 000"; `Cases/families` → „cases" bzw. „families"); sonst `value: null` und nur `class`; Feld umbenennen (`valmoy`); `PrevalenceQualification` übernehmen; Unit-Test mit je einem Beispiel pro Typ.
2. **Shard-Budget reicht für die Felder im DATA-REPORT-Format nicht.** Der MLD-Shard hat heute 132,7 KB, das Budget in `validate.py` ist 150 KB. Ich habe mit `assets.csv` simuliert, was 07 einfügen würde (Knoten mit `sponsor`, `outcome_measures`, Evidenz mit `matched_*`): Allein Assets und NBS bringen MLD auf **154,6 KB** und MONDO:0019249 auf 175,5 KB, also `validate` rot. Dazu kommen noch Therapien, Prävalenz (das XML-Snippet hat bis zu 1.000 Zeichen je Eintrag) und KOL. Integrieren geht nur mit den Kappen aus Abschnitt 4 oder mit einem eigenen Lazy-Shard.
3. **KOL ohne Kappen und ohne Telefon-Check.** In `extra_kol_overlap.json` stehen je Paar alle Personen mit bis zu 12 Records, je Krankheit alle Paare (2.717 Paare) und an jeder Evidenz `person_ids` (bis zu 50). Das passt nicht in die Shards. Außerdem prüft der Test nur auf E-Mail-Adressen; bei CT.gov-Officials wird die ganze Affiliation übernommen, wenn kein Institutionsteil erkannt wird (`institution(...) or affiliation`). Telefonnummern dort sind nicht ausgeschlossen. Vor dem Export: Kappen setzen (Abschnitt 4) und das Regex-Gate für E-Mail plus Telefon über die exportierten Dateien laufen lassen (Data-Manager-Prompt, Check C5).

### Should-fix

1. **NBS-Snippet ist nicht wörtlich.** `evidence.snippet = "[screened] …"`; das Zitat steht nur in `evidence.verbatim`. Das verletzt die Regel „Snippet wörtlich". Fix: 07 setzt `snippet = verbatim`, der Status bleibt in `node.status` bzw. `screening_status`. Der Test `test_level_rules` erwartet den Status im Snippet und muss mitgeändert werden.
2. **Status hängt am geteilten Länderknoten.** `Draft.node()` nutzt `setdefault`, also bekommt `COUNTRY:AT` den Status des ersten Treffers für **alle** Krankheiten. Heute ist das noch konsistent (eine Krankheit oder ein Status je Jurisdiktion), beim ersten weiteren Eintrag kippt es. Fix: 07 setzt `node.status` je Item aus `edge.evidence[0].screening_status`.
3. **Skalen-Knoten tragen die Quelle des ersten Fundes.** `ASSET:scale_*` hat `source_type/source_id/url` des ersten Treffers, der zu einer anderen Krankheit gehören kann. Die App zeigt `node.source_id` als Quelllink, das ergibt eine Fehlzuordnung im Edge-Panel. Fix: 07 überschreibt `source_*`/`url` je Item aus `edge.evidence[0]`.
4. **Skalen aus Abstracts sind zu hoch gestuft.** Die Zuordnung Krankheit ↔ Paper ist ein Europe-PMC-Suchtreffer (in 04 Level `search_hit`, „not a fact"), der Skalenname ist ein Regex-Fund. `has_asset` als `curated` ist bei den 28 PMID-Zeilen eine Hochstufung. Fix: für `source_type = PMID` Level `text_mined` (origin „regex", kein LLM) oder `inferred` mit Formel; CT.gov-Outcome-Measures bleiben `curated`. Stichproben zum Nachprüfen: Krabbe „Loes score" aus PMID 41604001 („High pre-HSCT Loes scores, epilepsy, and cognitive impairment…"; der Loes-Score ist X-ALD-typisch, also Zuordnung prüfen), PMD „GMFM" aus PMID 42060827 („…PEDI-CAT mobility domain and the GMF…"). `\bSARA\b` mit `re.I` trifft auch den Vornamen „Sara".
5. **Zurückgezogene Studien gelten als Asset.** 8 Zeilen mit `WITHDRAWN`, darunter im Hero-Pfad Krabbe NCT01093105 und MLD NCT00639132. Eine zurückgezogene Studie hat keine Daten und ist nicht wiederverwendbar. Fix: 07 lässt `WITHDRAWN` aus `assets.items` weg (die CSV bleibt) und sortiert so: RECRUITING / ACTIVE / ENROLLING → COMPLETED → TERMINATED / UNKNOWN.
6. **6 UNBELEGT-Zeilen ohne `retrieved`** (HRSA, 403). Ohne Versuchsdatum kann die Honest Gap kein „as of" nennen. Fix: das Datum des Abrufversuchs schreiben.
7. **RUSP-Notiz veraltet.** `RUSP_NOTE` sagt „table as of January 2023". Laut MEDICAL-BACKGROUND kam Krabbe 2024 in den RUSP (⚠️, Primärquelle HHS dort noch offen). Die Notiz steht in den `notes` der US-Zeilen. Fix: Datum streichen oder korrigieren.
8. **Hand-Check der 11 `screened_in`.** Alle haben `check = machine`. Norwegen MLD „screened" und Toskana MLD/LSD stehen nicht in MEDICAL-BACKGROUND. Vor der Demo sollen Recep oder Hanno die 11 Seiten öffnen (Regelscreening oder Forschung?) und das Ergebnis in MEDICAL-BACKGROUND eintragen. Das Evidenzdatum ist bei NBS das Abrufdatum; MN hat ein Quelldatum (Pressemitteilung 26.02.2024), das sollte in `date`.
9. **KOL-Brücken über Suchtreffer.** P(X) = Personen mit ≥ 1 Paper aus einem Europe-PMC-Suchtreffer. Ein Übersichtsartikel mit 30 Autoren, der Krabbe und MLD erwähnt, erzeugt 30 „Brücken". Fix: Formeltext ehrlich („keyword-matched records"), Ranking nach der Zahl unterschiedlicher Records je Seite, Personen mit nur einem gemeinsamen Record nachrangig. Die Hero-Brücke Krägeloh-Mann (MEDICAL-BACKGROUND: PMID 32912261 + 21707604) fehlt wegen Affiliation-Varianten, siehe Abschnitt 3.
10. **Prävalenz `ambiguous_xref`.** Einträge, deren ORPHA-Code mehreren MONDO-IDs zugeordnet ist, werden je Kandidat dupliziert. 07 exportiert nur `ambiguous_xref = false` oder zeigt den Hinweis.
11. **Monarch-Check liest den Output von 07** (`app/public/data/core.json`) in Schritt 04b. Das ist ein Zirkel, im `reproduce`-Lauf misst er den alten Export. Er gehört nach 07 (bzw. `09_metrics`). Ehrlich benennen: Monarch semsim nutzt dieselben HPO-Annotationen, das ρ validiert also die Metrik, nicht die Annotationen; nur Top-50 (eingeschränkter Wertebereich).
12. **Makefile:** `enrich-extra` fehlt in `reproduce`. Vorschlag: `reproduce: fetch slice build enrich enrich-extra extract reconcile analytics trials`.
13. **Toter Code:** `reproduce.py` (128 Zeilen) wird nicht aufgerufen; aus `people.py` (979 Zeilen, laut DATA-REPORT mit konstruierten Snippets) nutzt `kol.py` nur drei Helfer. Nach dem Freeze aufräumen.

### Nice-to-have

- `country` ist bei allen 455 Studienzeilen leer; aus `contactsLocationsModule.locations` ableiten.
- CT.gov-Status-Enums (`RECRUITING`) in der App als Text („Recruiting") zeigen.
- FDA-`url` zeigt auf JSON von `api.fda.gov`; ein DailyMed-Link über die `set_id` ist für Menschen lesbar.
- 49 Snippets lauten `patientRegistry: true`, das ist ein Feldwert. Besser den Titel als Snippet nehmen und das Flag als Feld führen.
- Der Satz-Splitter lässt Abschnittsköpfe stehen („Results Strong correlations…").
- Der Determinismus-Test deckt `people`, `monarch` und `audit` nicht ab.
- Commit-Hygiene: `2b14b1f` „Pipeline" hat kein Präfix, `ef9b494` hat den Autor „Claude" (Regel 5). Autor-E-Mails im Git-Log werden um 11:00 öffentlich (gilt fürs ganze Repo). Für künftige Commits die GitHub-noreply-Adresse setzen.

### Was gut ist (bleibt so)

Die Kanten-ID-Regel `e_` + sha1(`source|target|type`)[:12] ist zentral über `enrich.edges.edge_id` gelöst, `finalize()` prüft Kollisionen. `contradicting: []` steht überall. `evidence()` erzwingt ein wörtliches Teilstring-Snippet und bei `inferred` eine Formel. Dazu kommen robots.txt mit fail-closed, gecachte Fehlversuche (Offline-Lauf byte-identisch) und eine konservative Identität (ORCID mit Prüfziffer, NIH-Profil, exakter Name plus Institution). UNBELEGT wird nie zu „not screened". Die Pflichtfakten passen zu MEDICAL-BACKGROUND: Libmeldy EMA 17.12.2020, Lenmeldy FDA 18.03.2024, keine Krabbe-Zulassung, AT MLD Forschungsprojekt seit 12/2024, MN 2024, NY. Die Lizenzen der neuen Quellen stehen in DATA-SOURCES.

### Geprüft per Skript (`assets.csv`, 477 Zeilen)

| Check | Ergebnis |
|---|---|
| Pflichtspalten (`asset_id, asset_type, name, disease_mondo, disease_label, source_type, source_id, url, retrieved, check`) | 6 Lücken, alle `retrieved` bei HRSA-UNBELEGT |
| URL-Format `https://…` | 0 Fehler |
| Snippet leer außer bei UNBELEGT / Snippet bei UNBELEGT | 0 / 0 |
| NCT-Format `NCT\d{8}`, NCT in URL | 0 / 0 Fehler |
| MONDO-Format | 0 Fehler |
| Duplikate (asset_id, disease, source_id) | 0; 14 (asset, disease) mit mehreren Quellen (Skalen, gewollt) |
| E-Mail-Adressen | 0 |
| Typen | 225 natural_history_study, 132 registry, 98 outcome_scale, 22 newborn_screening (11 UNBELEGT) |
| Krankheiten mit ≥ 1 Asset (ohne NBS) | 117 von 350 Kern; Spitze MONDO:0019249 32 Zeilen, MONDO:0010526 22 |
| Hero Krabbe | 7 Assets (u. a. NCT02993796 Registry, NCT00983879 Natural History, NCT01093105 **withdrawn**), NBS US-MN + US-NY belegt, AT/DE/IT/NO/US UNBELEGT |
| Hero MLD | 10 Assets (HOME NCT04628364, NCT01963650 terminated, NCT00639132 **withdrawn**, CoRDS NCT01793168, GMFC-MLD aus PMID 21707604 + NCT04628364, GMFM, Vineland, Mullen); NBS AT pilot/research, NO screened, IT-52 screened |
| Hero PMD | 4 (NCT03333200, NCT03047369, NCT04880356, GMFM) |

Tests (`uv run --project pipeline pytest pipeline/tests -q` auf `data-v2`, ohne Rohdaten): 41 passed, 8 skipped, 1 failed. Der Fehlschlag `test_openai_steps::test_extract_main_without_key_exits_zero` braucht `data/slice.json` und liegt nicht am PR. `test_enrich_extra.py`: 6 passed, 7 skipped (brauchen `data/enrich/extra_*`).

## 2. Datenmodell-Abgleich data-v2 ↔ App

Grundsatz: 07 mappt, die App bleibt. Die App-Seite ist `app/lib/types.ts`, `normalize.ts` (`v2*`) und `actionv2.ts`.

| # | Feld | data-v2 liefert | App erwartet | Anpassung |
|---|---|---|---|---|
| 1 | `prevalence[].value` | Zahl plus `unit` | `value: string`, kein `unit`; Titel = `value · class` | 07: `value = "0.33 per 100 000"` bzw. `"12 cases"`, `null` ohne ValMoy (nach Blocker 1). `references`, XML-`snippet`, `mondo_id` weglassen |
| 2 | `prevalence` Filter | inkl. `ambiguous_xref`, ohne `qualification` | – | 07: nur `ambiguous_xref = false`, höchstens 4 Einträge (Europe/Worldwide zuerst) |
| 3 | `searched` | `extra_searched.jsonl` je `mondo_id × section` (`assets, screening, therapies, kol`) mit `error`, `queries`, `people_identified` | `{items, searched: [{source, retrieved, hits}]}` je Feld | 07: section → Feld (`screening`→`newborn_screening`, `therapies`→`approved_therapies`, `kol`→`kol_overlap`); `error` in `source` einbauen („HRSA RUSP (HTTP 403)"), `queries` weglassen |
| 4 | `newborn_screening` Snippet | `"[status] Zitat"`, Zitat in `verbatim` | Snippet wörtlich, Status im Chip aus `node.status` | 07: `snippet = verbatim` (Should-fix 1) |
| 5 | `newborn_screening` Status | an geteiltem `COUNTRY:`-Knoten | `node.status` je Item | 07: je Item aus `screening_status` (Should-fix 2) |
| 6 | `assets` Skalen-Quelle | Quelle des ersten Fundes am Knoten | `node.source_*` als Quelllink | 07: je Item aus `edge.evidence[0]` (Should-fix 3) |
| 7 | `assets` Knotenfelder | plus `sponsor, start_date, completion_date, enrollment, nct_aliases, outcome_measures[≤12]` | nur `AssetNode`-Felder | 07: Zusatzfelder weglassen (Bytes), `WITHDRAWN` filtern |
| 8 | `approved_therapies` | `node.approvals[]`, `inn`; Libmeldy und Lenmeldy sind zwei Knoten | eine Behörde plus Datum je Zeile | passt (ASSUMED bestätigt: `evidence[].db` = EMA/FDA, `evidence[].date` = Zulassung). `approvals` darf bleiben |
| 9 | `kol_overlap` Form | Paarliste `{disease_a, label_a, disease_b, label_b, n_people, formula, edge_id, people}` | je Shard `{disease: {id, label}, edge, people}` | 07: für A und B je ein Eintrag mit der anderen Seite als `disease`; `edge` = volle Kante aus `extra_edges.json` per `edge_id`; `person_ids` aus der Evidenz streichen; Kappen aus Abschnitt 4 |
| 10 | `kol_overlap` Personen | `person_key`, Records bis 12 | `{name, orcid?, affiliation?, records}` | passt; Records kappen; `n_people` als `people_total` mitgeben (die App ignoriert unbekannte Felder) |
| 11 | `meta.metrics` | `extra_metrics.json`: `monarch_spearman {value, n, p, source, ontology_variant}`, `coverage {trial, paper, asset, org, denominator}`, `extract_precision: null`, `hero_sample` | Schema in app/README | passt (Obermenge; `null` zeigt „pending") |
| 12 | `meta.sources` | neue Quellen nur in DATA-SOURCES.md | `validate` verlangt `db, version, license, url` je Quelle | 07 ergänzt: EMA medicine data, openFDA label/Drugs@FDA, FDA CBER, CT.gov (observational), Orphanet product9, offizielle NBS-Seiten, Monarch |
| 13 | Index/Core | `ASSET:`, `DRUG:`, `COUNTRY:`, `PERSON:`-Knoten | `index.json` + `core.json` = 2,92 MB von 3 MB | **nicht** in `index.json`/`core.json` aufnehmen (Budget und „jeder Indexeintrag hat einen Shard") |
| 14 | `validate.py` | prüft v2-Felder nicht | – | ergänzen (Integrations-Session): `check_edge` für Items, Level je Typ, Kappen, kein E-Mail/Telefon, `unit`-Enum |

## 3. Lücken und Ergänzungen bis 12:00 (nach Demo-Nutzen pro Aufwand)

| Prio | Was | Nutzen für die Jury | Aufwand | Wer |
|---|---|---|---|---|
| 1 | **Blocker 1 bis 3 fixen, dann 07-Export mit Kappen** | Evidence integrity, Patient progress (Action Card zeigt reale Assets, Libmeldy/Lenmeldy, NBS) | 1 bis 2 h | Data Manager (04b), Integrations-Session (07) |
| 2 | **`orgs.csv` füllen** (heute nur Kopfzeile; 40 Entwürfe in `orgs_draft.csv`, keiner verifiziert) | Patient progress: ohne Orgs zeigt jede Krankheit die Org-Honest-Gap, `coverage.org = 0` | Osman, 25 Zeilen ≈ 1,5 h; zuerst Hunter's Hope, MLD Foundation, ELA, Krabbe-/MLD-/PMD-Orgs | Osman |
| 3 | **Krägeloh-Mann-Brücke über eine kuratierte Alias-Liste** `data/curated/person_aliases.csv` (`person_key` → ORCID, Quelle = ORCID-Datensatz bzw. Paper mit ORCID). Keine Fuzzy-Regel, nur handgeprüfte Zeilen | Graph quality, Hero-Story (die belegte Krabbe-MLD-Brücke aus MEDICAL-BACKGROUND erscheint im Produkt) | 30 min lokal (ORCID-Suche auf pub.orcid.org, 6 Identitäten zusammenführen) | Data Manager |
| 4 | **NBS-UNBELEGT sichtbar machen**: `searched` mit `hits: 0` je Land (AT/DE/NO/US national) in der Action Card als „also searched, no official statement" | Nora-Story „Österreich screent Krabbe nicht" ehrlich als Lücke | 07 liefert `searched` (Abschnitt 2, Nr. 3); App: eine Zeile in `actionv2.ts` | Integrations-Session |
| 5 | **US-NBS national über Bright Data (B8)**: HRSA-RUSP-Seite mit robots.txt-Prüfung | 5 Krankheiten von UNBELEGT auf belegt, darunter Krabbe | 30 min, wenn `BRIGHTDATA_ZONE` gesetzt ist | Data Manager |
| 6 | **DE: G-BA Kinder-RL als PDF** parsen (pypdf), nur positive Treffer; Krabbe und MLD fehlen dort laut DATA-REPORT, bleiben also UNBELEGT. Nutzen: belegte DE-Zeilen für Pompe, MPS I u. a. | gering für den Hero-Pfad | 45 min | später |
| 7 | **MLD-Pilot DE (Hannover)** als `pilot/research` | MEDICAL-BACKGROUND nennt ihn, Quelle ist aber ein Poster bzw. Review (PMC12641716) und keine Programmseite. Nur mit offizieller Seite, sonst weglassen | 20 min | optional |

Verteilung Assets je Kernkrankheit (`assets.csv` ohne NBS): 117 von 350 haben ≥ 1 Asset (33 %), stark konzentriert (Top 2: 32 und 22 Zeilen). Für den Coverage-Satz auf `/methods` reicht `coverage.asset = 117 / 350`.

## 4. Performance und Budgets

Gemessen mit Playwright (Chromium 1194) gegen `next build && next start` lokal. Desktop ungedrosselt; „Mobil" = 375 px, 4× CPU-Drossel, 1,6 Mbit/s, 150 ms RTT. Übertragung gzip; Vercel liefert zusätzlich Brotli, ist also eher kleiner.

| Seite | Requests gesamt / Daten | Daten übertragen | Desktop FCP / bis Netz ruhig | Mobil FCP / bis Netz ruhig |
|---|---|---|---|---|
| `/` plus Suche | 22 / 2 (`index.json`, `meta.json`) | 213 KB (`index.json` 1,23 MB roh → 211 KB gz) | 176 ms / 0,8 s; Suche bereit 0,27 s, erster Treffer „krabe" 93 ms | 588 ms / 4,0 s; `index.json` 1,2 s, Suche bereit 1,6 s, erster Treffer 1,6 s, Folgesuche 0,67 s |
| `/d/MONDO_0009499` (Krabbe) | 34 / 10 (Shard plus 8 `trial/*.json`) | 36 KB (Shard 120 KB roh → 20 KB gz) | 124 ms / 1,1 s (Graph-Canvas 1,1 s) | 476 ms / 3,4 s (Canvas 3,0 s) |
| `/d/MONDO_0009499/action?via=MONDO_0018868` | 28 / 6 (2 Disease-, 3 Gen-Shards) | 53 KB | 104 ms / 0,7 s | 520 ms / 3,0 s |
| `/d/MONDO_0018868` (MLD) | 33 / 9 | 35 KB | 220 ms / 1,2 s | 480 ms / 3,3 s |

`core.json` (1,69 MB, 162 KB gz) wird auf diesen Seiten nicht geladen. Die Suche über 6.657 Einträge bleibt dank `useDeferredValue` bedienbar, auf gedrosseltem Mobil kommt das Ergebnis aber 0,6 bis 0,7 s nach der Eingabe. Für die Demo reicht das; Verbesserung später: Präfix-Schnellpfad vor Fuse oder Phänotypen erst ab 3 Zeichen.

**Budgets heute** (`validate.py`): `core.json + index.json` = 2,92 MB von 3 MB (97 %); größter Shard 140 KB von 150 KB; 17 Disease-Shards haben weniger als 40 KB Luft, 2 weniger als 20 KB (MLD: 17 KB).

**Wachstum durch data-v2** (Simulation, Format laut DATA-REPORT): etwa 1,5 KB je Asset-Item voll, 0,9 KB schlank. MLD +21,9 KB nur Assets/NBS → 154,6 KB (rot). KOL ist der größte Treiber: 2.717 Paare, im Mittel etwa 15 Paare je Krankheit; mit Personenlisten (≈ 0,5 KB je Person) liegen Hub-Krankheiten im MB-Bereich.

**Kappen für 07 (Vorschlag):**

| Feld | Kappe | Rest |
|---|---|---|
| `assets` | 8 Items je Krankheit, schlanker Knoten (nur `AssetNode`-Felder), `WITHDRAWN` raus, Evidenz ohne `matched_*`/`record_aliases` | `assets_total` |
| `approved_therapies` | alle (≤ 5 üblich) | – |
| `newborn_screening` | alle belegten, Snippet ≤ 200 Zeichen | UNBELEGT nur als `searched` |
| `kol_overlap` | 5 Paare je Krankheit nach `n_people`, plus **immer** jedes Paar, dessen andere Seite in `neighbours` steht (sonst findet die Action Card `via` nicht); je Paar 6 Personen, je Person 2 Records; `person_ids` raus; Snippet-Namensliste weglassen (Formel bleibt) | `people_total`, `pairs_total` |
| `prevalence` | 4 Einträge, ohne XML-Snippet und `references` | – |
| v2 gesamt | **≤ 12 KB je Disease-Shard**, `validate` prüft das | – |

**Wenn MLD trotzdem nicht unter 150 KB passt:** eigener Lazy-Shard `public/data/v2/<MONDO_…>.json` mit den fünf Feldern, den nur die Action Card lädt. Das kostet in der App etwa 10 Zeilen in `lib/data.ts` (zweiter `loadJson`, Merge, fehlende Datei = Felder fehlen = „Data pending"). Der Vorteil: v2 lässt sich neu exportieren, ohne die Basis-Shards anzufassen. Die Entscheidung trifft Hanno; der umkehrbare Default sind die Kappen oben.

**Caching:** `app/next.config.ts` setzt für `/data/:path*` schon `Cache-Control: public, max-age=300, stale-while-revalidate=3600` (lokal gemessen, Header kommt an). Das passt, weil die Dateinamen nicht versioniert sind: `immutable` würde nach einem Re-Export alte Shards im Browser festhalten. Das Vercel-CDN cached `public/` ohnehin bis zum nächsten Deploy. **Keine Änderung nötig.** `immutable` erst mit versionierten Pfaden (`/data/<built_at>/…`), also nach dem Hackathon. Die Gen- und Trial-Shards unter 1 KB gehen unkomprimiert raus (Schwelle von Next), das ist unkritisch.
