# Data manifest

Written by `pipeline/01_fetch.py`. Raw files live in `data/raw/` (gitignored); this table makes the dataset reproducible.

| File | What | Source URL | Downloaded | Size | sha256 (prefix) |
|---|---|---|---|---|---|
| `phenotype.hpoa` | HPO disease→phenotype annotations (OMIM + ORPHA ids, frequency, evidence) | https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa | 2026-10-03 | 35.8 MB | `e89aa39c8f97bf5a…` |
| `genes_to_phenotype.txt` | HPO gene→phenotype→disease | https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/genes_to_phenotype.txt | 2026-10-03 | 20.8 MB | `507a17bff9c49e63…` |
| `hp.json` | HPO ontology (OBO Graphs JSON) | https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/hp.json | 2026-10-03 | 21.9 MB | `a7b3a012e7b4007a…` |
| `mondo.json` | MONDO disease ontology with xrefs and synonyms | https://github.com/monarch-initiative/mondo/releases/latest/download/mondo.json | 2026-10-03 | 107.6 MB | `ba19a3be2a384f21…` |
| `en_product1.xml` | Orphanet diseases, synonyms, definitions, xrefs | https://www.orphadata.com/data/xml/en_product1.xml | 2026-10-03 | 54.0 MB | `df8d562a0c6011af…` |
| `en_product4.xml` | Orphanet disease→HPO with frequency | https://www.orphadata.com/data/xml/en_product4.xml | 2026-10-03 | 47.9 MB | `4f44e8a612013999…` |
| `en_product6.xml` | Orphanet disease→gene associations | https://www.orphadata.com/data/xml/en_product6.xml | 2026-10-03 | 22.6 MB | `f1c039f78683beea…` |
| `en_product9_prev.xml` | Orphanet epidemiology / prevalence | https://www.orphadata.com/data/xml/en_product9_prev.xml | 2026-10-03 | 16.2 MB | `6b492b3cc61e5a03…` |

## data-v2 (04b_enrich_extra, nicht von 01_fetch geschrieben)

Hinweis: `01_fetch.py` schreibt diese Datei bei jedem Lauf neu; dieser Abschnitt wird dann von Hand bzw. aus `data/enrich/extra_run_log.jsonl` nachgezogen.

| File | What | Source URL | Downloaded | Size | sha256 (prefix) |
|---|---|---|---|---|---|
| `data/cache/extra/ema/<sha1>.json` (xlsx, base64) | EMA medicine data (EPAR table), human medicines | https://www.ema.europa.eu/en/documents/report/medicines-output-medicines-report_en.xlsx | 2026-10-03 | 0.9 MB | `a0d72cec7cff9270…` |

API-Abrufe (Cache `data/cache/extra/<source>/`, ein JSON je Request; Abrufdatum UTC):

| Source (cache dir) | Endpoint | Query | Abgerufen | Requests | Records im Output |
|---|---|---|---|---|---|
| `ctgov_obs` | clinicaltrials.gov/api/v2/studies | `query.cond=<term>`, `filter.advanced=AREA[StudyType]OBSERVATIONAL`, bis 4 Begriffe, bis 300 Studien je Begriff | 2026-10-03 | 781 | 135 Studien (82 natural history, 53 registry) |
| `ctgov_officials` | clinicaltrials.gov/api/v2/studies | `filter.ids=<50 NCT>`, overallOfficials | 2026-10-03 | 27 | Officials von 1.302 Studien |
| `scales`, `people` | ebi.ac.uk/europepmc/webservices/rest/search | `EXT_ID:<pmid> AND SRC:MED` (21707604 und Hero-PMIDs) | 2026-10-03 | 5 | 4 Paper |
| `screening` | 6 offizielle NBS-Seiten (siehe `pipeline/enrich_extra/nbs.py`) | Seitenabruf, Snippet-Prüfung | 2026-10-03 | 6 (+1 blockiert) | 22 NBS-Zeilen, 11 belegt |
| `ema` | ema.europa.eu (xlsx) | Download | 2026-10-03 | 1 | 2.746 Zeilen (1.572 Human, Authorised), 30 Medikamente / 36 Zuordnungen |
| `openfda_label` | api.fda.gov/drug/label.json | `indications_and_usage:("t1" … "t8")`, je 8 Krankheitsbegriffe | 2026-10-03 | 83 | 26 Medikamente / 30 Zuordnungen (NDA/BLA) |
| `drugsfda` | api.fda.gov/drug/drugsfda.json | `application_number:"<NDA/BLA>"` | 2026-10-03 | 25 | Erstzulassungsdaten |
| `fda_cber` | fda.gov/vaccines-blood-biologics/… | Produktseite je Marke ohne Drugs@FDA-Eintrag | 2026-10-03 | 3 | Lenmeldy, Skysona (Approval Letter) |
| `monarch` | api-v3.monarchinitiative.org/v3/api/semsim/compare | GET MONDO/MONDO, POST HPO-Sets | 2026-10-03 | 99 | 50 Paare |
| `audit_ctgov`, `audit_europepmc`, `audit_reporter` | wie 04 | Alternativnamen (Orphanet, OMIM, MONDO) | 2026-10-03 | 165 / 68 / 153 | 573 Null-Fälle geprüft |
| `robots` | robots.txt je Host | – | 2026-10-03 | 9 | – |
