# Constellate

*Five thousand points of light. One map to see the constellations.*

An evidence-graded knowledge graph for rare diseases, built in 24 h for the Hack-Nation 7th Global AI Hackathon, Challenge 05 „AI Atlas for the World's Rare Diseases" (Buffalo Initiative × OpenAI), Vienna Hub.

Constellate organizes rare diseases by **mechanism and phenotype instead of name**, and walks a patient-group leader from her diagnosis to a mechanistically related community, a reusable asset (registry, natural-history study design) and a sourced proposal she can send this week. Every edge carries its source, date, evidence level and counter-evidence. When there is no supported lead, Constellate says so and shows what was searched.

> Status (Sat 03.10.2026, 22:00): pipeline steps 1–7 and the validator are done, the dataset is exported (874 diseases, 1,066 genes, 4,717 phenotypes, hero path complete), the app v0 runs locally, live demo URL follows. Current state: [docs/STATUS.md](docs/STATUS.md) · map for every Claude session: [CLAUDE.md](CLAUDE.md) · build log: [docs/PLAN.md](docs/PLAN.md).

## Why

10,000 rare diseases, 80 % genetic, fewer than 5 % with an approved therapy. The knowledge to connect them exists in OMIM, HPO, PubMed, ClinicalTrials.gov, NIH RePORTER and hundreds of patient-group sites, but it is not linked. Patient groups rebuild registries and studies that a neighbouring community already has, because names hide mechanisms: one gene (PSAP) sits behind three disease names (Krabbe, metachromatic leukodystrophy, Gaucher).

## What you can do in the demo

1. Search one box for a disease, gene, symptom, mechanism or patient group.
2. See the ego-graph: genes, phenotypes, pathways, neighbouring diseases, trials, grants, papers, patient groups.
3. Click any edge: source record, date, evidence level (`observed` · `curated` · `text_mined` · `inferred`), confidence, counter-evidence.
4. Open the **Action Card**: what transfers, what differs, what needs expert review, each sentence citing an edge.
5. Hit a real gap: the **Honest Gap** screen lists the sources searched, the date and the next question to test.

## Architecture

Offline Python pipeline → `data/graph.json` → Next.js app on Vercel. OpenAI at exactly three points: **Extract** (abstracts → claims, Structured Outputs), **Reconcile** (names → stable IDs), **Explain** (graph path → plain language with a citation per sentence). Details and the data model: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
sources (HPO, MONDO, Orphanet, ClinVar, ClinicalTrials.gov, PubMed/Europe PMC, NIH RePORTER, Open Targets, Reactome, curated patient-org list)
   └─ pipeline/01_fetch → 02_slice → 03_build_graph → 04_enrich_apis → 05_openai_extract → 06_openai_reconcile → 07_analytics
         └─ data/graph.json · clusters.json · search_index.json
               └─ app/ (Next.js): search → ego graph → edge panel → action card · honest gap · /api/explain · /api/resolve
```

## Reproduce the dataset

```bash
cp .env.example .env.local   # add OPENAI_API_KEY
make setup
make reproduce               # fetch → slice → build → enrich → extract → reconcile → analytics
make dev                     # http://localhost:3000
```

Raw downloads are cached in `data/raw/` (gitignored) and logged with URL, date and sha256 in [data/MANIFEST.md](data/MANIFEST.md). Without an OpenAI key, `extract` and `reconcile` fall back to curated edges and fuzzy matching; the graph still builds.

## Scope

One cluster deep: 350 core diseases (MONDO subtrees lysosomal storage disease, MONDO:0002561, and leukodystrophy, MONDO:0019046) plus 524 neighbours picked by shared gene or phenotype similarity. Hero path and counter-example: [docs/SCOPE.md](docs/SCOPE.md). Medical background for the team: [docs/MEDICAL-BACKGROUND.md](docs/MEDICAL-BACKGROUND.md).

## Data sources and licenses

See [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md). HPO (free with attribution) · MONDO CC-BY 4.0 · Orphanet/Orphadata CC-BY 4.0 · ClinVar, ClinicalTrials.gov, PubMed, NIH RePORTER: US public domain · Open Targets CC0 · Reactome CC0 (reactome.org/license) · Monarch CC-BY 4.0. OMIM content enters only indirectly via HPO annotations and Orphanet cross-references. Patient organisations are hand-verified from their public websites (`data/curated/orgs.csv`, with verification date).

## Evidence model

| Level | Meaning | Typical source |
|---|---|---|
| `observed` | clinically or experimentally observed, curated with primary source | ClinVar pathogenic, HPO annotation with frequency, trial record |
| `curated` | expert-curated database statement | OMIM, Orphanet, Reactome, MONDO |
| `text_mined` | extracted by OpenAI from an abstract, with PMID and snippet | PubMed / Europe PMC |
| `inferred` | computed by us, formula and inputs shown | phenotype similarity, pathway overlap, KOL overlap, clustering |

Every edge has a `contradicting` field, which may be empty but never missing.

## Team workflow

[CLAUDE.md](CLAUDE.md) · [docs/STATUS.md](docs/STATUS.md) · [docs/DECISIONS.md](docs/DECISIONS.md) · [docs/WORKFLOW.md](docs/WORKFLOW.md) · [docs/ROLES-TASKS.md](docs/ROLES-TASKS.md) · [docs/RESOURCES.md](docs/RESOURCES.md) · bugs go to [BUGS.md](BUGS.md).

## Limitations

One cluster, not 10,000 diseases. OMIM only indirectly. Patient-organisation coverage is a curated list, not a census. Text-mined claims are hypotheses until a human checks the PMID. This is a research-navigation tool, not medical advice.

## Team

Hanno Kügler (tech lead, pipeline + app) · Osman (ops, data curation) · Recep (story, evidence, videos). Vienna, October 2026.
