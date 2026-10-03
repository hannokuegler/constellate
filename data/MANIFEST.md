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
