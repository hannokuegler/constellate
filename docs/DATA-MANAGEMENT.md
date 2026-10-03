# Data management

How Constellate data moves from public sources into the app, what is versioned, which quality gates hold, and who owns what. Review findings: [DATA-QUALITY.md](DATA-QUALITY.md). Data contract: [app/README.md](../app/README.md). Sources and licences: [DATA-SOURCES.md](DATA-SOURCES.md), [data/MANIFEST.md](../data/MANIFEST.md).

## Flow

```
public sources (HPO, MONDO, Orphanet, CT.gov, Europe PMC, NIH RePORTER, Open Targets, Reactome, ClinVar, EMA, openFDA, NBS pages, Monarch)
  -> 01 fetch            data/raw/            bulk files, sha256 in data/MANIFEST.md
  -> 02 slice, 03 build  data/slice.json, data/graph_base.json
  -> 04 enrich           data/cache/<api>/ (one JSON per request) -> data/enrich/*.jsonl, edges_draft.json
  -> 04b enrich-extra    data/cache/extra/ -> data/enrich/extra_*  + data/curated/assets.csv
  -> 05 extract, 06 reconcile (OpenAI; reconcile reads data/curated/orgs.csv)
  -> 07 analytics        app/public/data/  (meta, index, core, disease/gene/phenotype shards)
  -> 08 trials           app/public/data/trial/
  -> app explain         app/public/data/explain/  (precomputed, optional)
  -> validate.py         gate: contract, ids, evidence, budgets, hero path
  -> app (Next.js on Vercel) reads /data/* as static files
```

## What is committed

| Path | Committed | Rebuilt by |
|---|---|---|
| `data/raw/`, `data/cache/`, `data/enrich/`, `data/slice.json`, `data/graph_base.json` | no (gitignored) | `make fetch` … `make enrich-extra` |
| `data/MANIFEST.md` | yes | `01_fetch` (data-v2 section by hand from `extra_run_log.jsonl`) |
| `data/curated/*.csv`, `*.yaml` | yes, hand-curated (orgs: Osman, hero path: Recep, assets: 04b) | people, plus 04b for `assets.csv` |
| `app/public/data/` | yes, the published dataset | `make analytics trials`, `npm run explain` |

The intermediate data lives only on the machine that ran the pipeline (today Hanno's Mac). Cloud sessions reach GitHub and npm but no data hosts, so they can change code but cannot re-export.

## Versioning

- `meta.json` → `built_at` (UTC time of the 07 run) and `version` (`<date>+<git sha of 07_analytics.py>`). Together they identify a dataset; the commit that adds `app/public/data/` pins it in git.
- Edge ids are stable (`e_` + sha1(`source|target|type`)[:12]), so links and precomputed explanations survive a re-export with the same edges.
- Each evidence record carries `retrieved` (fetch date) and `date` (source date); each source carries its release or retrieval date in `meta.sources`.
- Cache: `/data/*` is served with `Cache-Control: public, max-age=300, stale-while-revalidate=3600` (`app/next.config.ts`). File names are not versioned, so `immutable` is deliberately not used.

## Size budgets (`pipeline/validate.py`)

| Item | Budget | Today (built 2026-10-03 19:57 UTC) |
|---|---|---|
| `core.json` + `index.json` | < 3 MB | 2.92 MB |
| each disease / gene / phenotype / trial shard | < 150 KB | largest 140 KB (MONDO_0001982), MLD 133 KB |
| phenotype shard | ≤ 100 diseases listed | ok |
| data-v2 fields per disease shard (proposed) | ≤ 12 KB, caps in DATA-QUALITY §4 | not exported yet |

New node kinds (asset, drug, country, person) never go into `index.json` or `core.json`.

## Re-export procedure

1. On the data machine: `git pull --rebase`, `make enrich enrich-extra` (or `--offline` to reuse the cache).
2. `make analytics trials validate`. Validate must print `OK`. Read the size line and the hero line.
3. Spot-check per script: hero shards (Krabbe MONDO:0009499, MLD MONDO:0018868, PMD MONDO:0010714), counts against the previous export, no e-mail or phone pattern under `app/public/data/`.
4. `cd app && npm run explain -- --dry-run`, then regenerate explanations if the action-card edge sets changed. Validate again.
5. `cd app && npm ci && npx tsc --noEmit && npm run lint && npm run e2e`.
6. Commit only `app/public/data/` (prefix `data:`, one sentence), `git pull --rebase`, push, open or update the PR. Vercel deploys on merge.

## Quality gates before the freeze

- `make validate` green; hero path all `ok`.
- Every number in the product comes from a primary source (PMID, NCT, ORPHA, EMA, FDA, official page); gaps show as `UNBELEGT` or Honest Gap.
- Evidence levels are never raised: `has_asset`, `approved_therapy` and `screened_in` are `curated` only with a structured record or a verbatim official quote; regex finds in abstracts are `text_mined`; `kol_overlap` and similarity are `inferred` with a `formula`.
- `contradicting` is present on every edge.
- No personal contact data (e-mail, phone) for researchers or study staff; names, ORCID, institution and record ids only.
- Only verified rows of `orgs.csv` and `hero_path.yaml` reach the product.
- e2e green at 1280 px and 375 px.

## Ownership

| Area | Owner |
|---|---|
| Pipeline code, export, decisions | Hanno (or agents he assigns) |
| `data/curated/orgs.csv` | Osman |
| `data/curated/hero_path.yaml`, medical claims in videos | Recep |
| `data/curated/assets.csv`, `data/enrich/extra_*` | Data Chief / Data Manager session (local) |
| `app/`, data contract changes (together with `validate.py` and `app/lib/normalize.ts`) | Hanno |

## Checklist: freeze the dataset (Sunday 11:00, before the repo goes public)

- [ ] Last re-export merged; `meta.json` `built_at` and `version` noted in `docs/STATUS.md`.
- [ ] `make validate` green on `main`; size line and hero line copied into STATUS.
- [ ] `npm run e2e` green on `main`; the live site shows the same `built_at` on `/methods`.
- [ ] `meta.metrics` present or explicitly "pending" (no invented numbers).
- [ ] `meta.sources` lists every source shown in the product, with licence.
- [ ] Grep of `app/public/data/`, `data/curated/` and `docs/` for e-mail, phone, keys, local paths, server internals: 0 hits.
- [ ] `orgs.csv` and `hero_path.yaml` contain only verified rows (`verified_date` set).
- [ ] No open data branch is merged after 12:00 except P1 fixes; nothing is pushed after 14:45.
- [ ] Tag the commit (`git tag data-freeze-2026-10-04 && git push origin data-freeze-2026-10-04`) so the submitted dataset is reproducible.
