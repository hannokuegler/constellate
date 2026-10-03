# Constellate app

Next.js 15 (App Router) + TypeScript + Tailwind 4. Graph: `react-force-graph-2d` (client-only, dynamic import). Search: Fuse.js over `/data/index.json`. No login, no database: the app reads static JSON from `public/data/`, written by the pipeline.

## Start

```bash
make dev                 # from the repo root, or: cd app && npm install && npm run dev
open http://localhost:3000
```

| Command | What |
|---|---|
| `npm run dev` | dev server on :3000 |
| `npm run build` / `npm start` | production build / serve (Vercel runs `next build`) |
| `npm run lint` | ESLint (next/core-web-vitals + next/typescript) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run fixture` | dev fixture from `data/graph_base.json` + `data/slice.json` (see below) |

Node ≥ 20 (tested with 26.5). Node `^20`/`^22` on Vercel is fine.

## Environment

Copy `app/.env.example` to `app/.env.local`. Nothing is required; without keys everything works except the LLM text of `/api/explain`.

| Variable | Used by | Without it |
|---|---|---|
| `OPENAI_API_KEY` | `/api/explain` | template text, labelled "template, no LLM" |
| `OPENAI_MODEL_EXPLAIN` | `/api/explain`, model id (no default on purpose; pick from `client.models.list()`) | template text |
| `OPENAI_BASE_URL` | optional, default `https://api.openai.com/v1` (proxy or local mock) | default |

## Screens

| Route | What |
|---|---|
| `/` | one search box (disease, gene, symptom, synonym, ORPHA/OMIM/MONDO/HP id, typo-tolerant), persona lens, "Start with Krabbe disease" |
| `/d/[id]` (`MONDO_0009499`) | ego graph (genes, top phenotypes, related diseases, second-hop links) + info panel; edge style = evidence level, red = counter-evidence; collapsible action card; Honest Gap when neighbours, enrichment or orgs are missing, full Honest Gap screen when the shard is missing |
| `/d/[id]/action?via=MONDO_…` | action card as a page (print, Markdown export) |
| `/g/[symbol]` | all disease names of a gene; "One gene, N disease names" when ≥ 2 names (PSAP: MLD, Krabbe, Gaucher, combined PSAP deficiency) |
| `/p/[id]` (`HP_0002500`) | diseases with a phenotype |
| `POST /api/explain` | edges → plain language, streamed, citation post-check |

The edge panel (drawer) opens from any graph line, any "Evidence" button and every `[e_…]` citation. Its counter-evidence slot is always shown.

Persona lens (`lib/persona.ts`): Nora (Maria), Devon, Priya, Dr. Osei. It changes search ranking, panel order, number of phenotypes in the graph and wording, never the data.

## Data contract v1 (`public/data/`, owned by the pipeline)

```
meta.json                  {version, built_at, fixture, sources: [{db, version, license, url}], counts, hero: {start}}
index.json                 [{id, type: disease|gene|phenotype, label, synonyms, xrefs, in_core, degree}]
core.json                  {nodes: [{id, type, label, in_core, cluster_id?, n_genes, n_phenotypes}], edges: [edge]}
disease/<MONDO_…>.json     {node: {id, label, definition, synonyms, xrefs, parents, children, in_core},
                            genes: [edge], phenotypes: [{edge, phenotype: {id, label, ic}}],
                            neighbours: [{id, label, edge, shared_phenotypes: [{id, label, ic}], shared_genes, mechanism_differs}],
                            enrichment?: {trials, papers, grants}, coverage?: [{source, query, hits, fetched_at}], orgs?: [...]}
gene/<SYMBOL>.json         {node, diseases: [edge], pathways?: [...]}
phenotype/<HP_…>.json      {node, diseases: [...]}        (addition to v1, optional; missing shard = Honest Gap)
edge                       {id: "e_<12 hex>", source, target, type, evidence: [{db, origin, record, url, level, date, confidence, snippet}],
                            contradicting: [...], confidence, level, independent_sources, formula?, rolled_up_from?}
```

The app reads all of this through `lib/normalize.ts`, which also accepts the variants the pipeline publishes:
`parents`/`children` as ids plus `parents_labels`/`children_labels`, `is_group`, `mechanism_classes`, neighbour `mechanism_note` (used verbatim in the action card, each sentence citing the neighbour edge), `enrichment.papers_mentioning` (flat records without edge, shown as "mention", no evidence level), `enrichment.targets`, `enrichment.totals`, coverage `hits_raw`/`retrieved`, gene `pathways`/`pathways_more` as `{node, edge}`, trial `phase_label`/`phases`, phenotype shards with `{id, label, edge, confidence}` rows and `diseases_total`, nested `meta.counts`, and `core.json` edges with `evidence_omitted: true` (the edge panel then loads the full edge from the disease shard).

## /api/explain

`POST {edges: Edge[], labels?: {id: label}, audience?: string}` or `{edge_ids: string[], disease: "MONDO:…"}` (resolved from the disease shard).
Response: `application/x-ndjson`, one event per line:

```
{type: "meta", mode: "llm" | "template", model?, note}
{type: "sentence", text, edge_ids, invalid_ids}     sentence with ≥ 1 valid citation; unknown ids are stripped from the text
{type: "dropped", text, reason}                     no citation, or only unknown ids: removed, shown struck through in the UI
{type: "error", message}
{type: "done", kept, dropped}
```

Prompt: `lib/prompts/explain.ts` (only facts from the edges, every sentence ends with `[e_id]`, no ids outside the input). Post-check and template text: `lib/explain.ts`. `GET /api/explain` reports whether an LLM is configured.

## Fixture

`scripts/make_fixture.py` writes a small contract-conform set (Krabbe, MLD, Gaucher, Pelizaeus-Merzbacher, saposin deficiencies + 1-hop neighbours; GALC, ARSA, PSAP, PLP1) with `meta.fixture = true`. It writes **only** if `public/data/meta.json` is missing or says `fixture: true`, so real pipeline data is never overwritten. Its similarity is a placeholder (IC-weighted Jaccard without ontology propagation).

## Layout

```
app/                 routes (page.tsx per screen, api/explain/route.ts)
components/          views (StartView, DiseaseView, GeneView, PhenotypeView, ActionCard, HonestGap, EdgePanel, EgoGraph/ForceGraphClient, SearchBox …)
lib/                 types, data loading, normalize, search, persona, evidence styles, action-card template, explain post-check, prompts/
scripts/             make_fixture.py
public/data/         pipeline output (not edited by the app)
_screens/            local screenshots + design check (gitignored)
```
