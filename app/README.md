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
| `npm run e2e` | build, then Playwright hero-path smoke (`e2e/hero.spec.ts`, 1280 px and 375 px, dark mode, console errors); uses the preinstalled Chromium (`CHROMIUM_PATH` or `PLAYWRIGHT_BROWSERS_PATH`), screenshots to `E2E_SHOTS` (default `app/e2e-shots`); `npm run e2e:run` skips the build |
| `npm run fixture` | dev fixture from `data/graph_base.json` + `data/slice.json` (see below) |

Node ≥ 20 (tested with 26.5). Node `^20`/`^22` on Vercel is fine.

## Environment

Copy `app/.env.example` to `app/.env.local`. Nothing is required; without keys everything works except the LLM text of `/api/explain`.

| Variable | Used by | Without it |
|---|---|---|
| `OPENAI_API_KEY` | `/api/explain` | template text, labelled "template, no LLM" |
| `OPENAI_MODEL_EXPLAIN` | `/api/explain`, model id (no default on purpose; pick from `client.models.list()`) | template text |
| `OPENAI_BASE_URL` | optional, default `https://api.openai.com/v1` (proxy or local mock) | default |
| `OPENAI_MAX_OUTPUT_EXPLAIN` | optional, `max_output_tokens` per Explain call (reasoning tokens count too) | 4000 |
| `EXPLAIN_RATE_PER_MIN` | optional, requests per client IP and minute on `/api/explain` (429 above) | 10 |
| `EXPLAIN_LLM_PER_HOUR` | optional, LLM calls per server instance and hour; above it Explain answers with template text | 200 |

## Screens

| Route | What |
|---|---|
| `/` | one search box (disease, gene, symptom, synonym, ORPHA/OMIM/MONDO/HP id, typo-tolerant), persona lens, "Start with Krabbe disease" |
| `/d/[id]` (`MONDO_0009499`) | ego graph (genes, top phenotypes, related diseases, second-hop links) + info panel; edge style = evidence level, red = counter-evidence; collapsible action card; Honest Gap when neighbours, enrichment or orgs are missing, full Honest Gap screen when the shard is missing |
| `/d/[id]/action?via=MONDO_…` | action card as a page (print, Markdown export) |
| `/g/[symbol]` | all disease names of a gene; "One gene, N disease names" when ≥ 2 names (PSAP: MLD, Krabbe, Gaucher, combined PSAP deficiency) |
| `/p/[id]` (`HP_0002500`) | diseases with a phenotype |
| `/methods` | "How we know": evidence levels, counter-evidence, OpenAI uses, metrics from `meta.metrics` (pending when absent), sources and licences from `meta.json` |
| `/about` | project page for the jury: problem, one mother in two moments (composite), what the app does, Honest Gap, team, repo |
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
trial/<NCT…>.json          {id, status, last_update, retrieved, url, contact_url, source, eligibility: {min_age, max_age, sex, std_ages},
                            countries: [{country, sites, open_sites}], sites: [{facility, city, country, status}], sites_total, officials}
                           (step 08 `make trials`, only open trials; optional: missing file = the study card links to the registry;
                            never personal contact data of study staff)
edge                       {id: "e_<12 hex>", source, target, type, evidence: [{db, origin, record, url, level, date, confidence, snippet}],
                            contradicting: [...], confidence, level, independent_sources, formula?, rolled_up_from?}
```

The app reads all of this through `lib/normalize.ts`, which also accepts the variants the pipeline publishes:
`parents`/`children` as ids plus `parents_labels`/`children_labels`, `is_group`, `mechanism_classes`, neighbour `mechanism_note` (used verbatim in the action card, each sentence citing the neighbour edge), `enrichment.papers_mentioning` (flat records without edge, shown as "mention", no evidence level), `enrichment.targets`, `enrichment.totals`, coverage `hits_raw`/`retrieved`, gene `pathways`/`pathways_more` as `{node, edge}`, trial `phase_label`/`phases`, phenotype shards with `{id, label, edge, confidence}` rows and `diseases_total`, nested `meta.counts`, and `core.json` edges with `evidence_omitted: true` (the edge panel then loads the full edge from the disease shard).

## Upcoming fields (data-v2)

Not in the pipeline output yet. The app reads them tolerantly (`lib/normalize.ts`, `v2*` readers) and renders them in the action card (`components/ActionCardV2.tsx`). Edge types and columns follow `docs/prompts/LOCAL-DATA-SESSION.md` (branch `data-v2`); everything marked **ASSUMED** is the app's guess for what that prompt leaves open, to be confirmed by the integration into step 07.

Rule for each field: **absent** from the shard = "Data pending"; **present but empty** = Honest Gap "Not found in <sources> as of <date>"; items = rows with source link, evidence level and `[e_id]` citation. Never an empty box, never invented content.

| Shard field | Edge type (curated unless noted) | Item shape |
|---|---|---|
| `assets` | `has_asset`: disease → `ASSET:<id>` | `{node: {id, label, asset_type: natural_history_study\|registry\|outcome_scale\|biobank, country, status, source_type: NCT\|PMID\|EMA\|FDA\|URL\|ORPHA, source_id, url, check}, edge}`. Columns = `data/curated/assets.csv`; `label` = `name` |
| `approved_therapies` | `approved_therapy`: disease → `DRUG:<name>` | `{node: {id, label, authority: EMA\|FDA, approved: YYYY-MM-DD, holder?, url?}, edge}`; **ASSUMED**: approval date also in `edge.evidence[].date`, authority in `evidence[].db` |
| `newborn_screening` | `screened_in`: disease → `COUNTRY:<iso>` | `{node: {id, label, status: screened\|pilot/research\|not screened\|UNBELEGT, url?}, edge}`; status also in the evidence snippet |
| `kol_overlap` | `kol_overlap`: disease ↔ disease, `inferred`, formula in `edge.formula` or snippet | **ASSUMED** entry `{disease: {id, label}, edge, people: [{name, orcid?, affiliation?, records: [{db, record, url?}]}]}` (records = PMID/NCT behind `authored_by` / `investigator_of`). No e-mail addresses. Shown for the pair (disease, via) from either shard |
| `prevalence` | none, node attribute | **ASSUMED** `[{type, class, value, region, validation, source: {db, record, url}, retrieved}]` (from `en_product9_prev.xml`); `node.prevalence` is accepted too |

Each of `assets`, `approved_therapies`, `newborn_screening` and `kol_overlap` may be a plain array or `{items: [...], searched: [{source, retrieved, hits?}]}`. **ASSUMED**: `searched` feeds the Honest Gap sentence; without it the app names the default sources of that section (`lib/actionv2.ts`, `DEFAULT_SOURCES`) and the build date from `meta.json`. The card shows the fields of both diseases (the one opened and the one it is compared with), so "no approved therapy for Krabbe" appears next to "Libmeldy for MLD".

### meta.metrics (expected schema, written by a pipeline step; `/methods` shows "pending" until it exists)

```
meta.metrics = {
  extract_precision:  {value: 0..1, n, source},       // hand-labelled sample of extracted claims
  reconcile_accuracy: {value: 0..1, n, source},       // org -> MONDO matches vs hand check
  monarch_spearman:   {value: -1..1, n, source},      // simGIC vs Monarch semsim, top pairs
  coverage:           {trial, paper, asset, org, denominator},  // counts of core diseases with >= 1 of each; denominator = 350
  hero_regression:    {pass: boolean, checked_at: "YYYY-MM-DD"}
}
```

### Fixtures (dev only)

`app/fixtures/disease-v2.json` holds hand-made data-v2 fields for Krabbe (MONDO:0009499, no approved therapy, no `prevalence` gap on purpose absent for MLD) and MLD (MONDO:0018868). Content only restates `docs/MEDICAL-BACKGROUND.md`; every snippet starts with "FIXTURE". It lives outside `public/data/` and is overlaid onto the real shards only when the app is built or started with `NEXT_PUBLIC_USE_FIXTURES=1` (`lib/data.ts`); a normal build never bundles it. Try it: `NEXT_PUBLIC_USE_FIXTURES=1 npm run dev`, then open `/d/MONDO_0009499/action?via=MONDO_0018868`.

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

Limits (`app/api/explain/route.ts`, `lib/ratelimit.ts`): body ≤ 600 kB (413), at most 60 edges, edge ids must match `e_<hex>`, `disease` must be a MONDO id, every client-sent field is length-capped and only the fields the prompt uses are kept, labels only for ids in the edges, audience ≤ 80 characters. Rate limit per client IP and an hourly LLM budget, both in memory per server instance (best effort, not a global quota). Upstream errors are scrubbed of anything key-shaped.

Prompt: `lib/prompts/explain.ts` (only facts from the edges, every sentence ends with `[e_id]`, no ids outside the input). Post-check and template text: `lib/explain.ts`. `GET /api/explain` reports whether an LLM is configured.

## Fixture

`scripts/make_fixture.py` writes a small contract-conform set (Krabbe, MLD, Gaucher, Pelizaeus-Merzbacher, saposin deficiencies + 1-hop neighbours; GALC, ARSA, PSAP, PLP1) with `meta.fixture = true`. It writes **only** if `public/data/meta.json` is missing or says `fixture: true`, so real pipeline data is never overwritten. Its similarity is a placeholder (IC-weighted Jaccard without ontology propagation).

## Layout

```
app/                 routes (page.tsx per screen, api/explain/route.ts)
e2e/                 Playwright hero-path smoke (hero.spec.ts)
fixtures/            dev-only data-v2 overlay (NEXT_PUBLIC_USE_FIXTURES=1), never bundled otherwise
components/          views (StartView, DiseaseView, GeneView, PhenotypeView, ActionCard, HonestGap, EdgePanel, EgoGraph/ForceGraphClient, SearchBox …)
lib/                 types, data loading, normalize, search, persona, evidence styles, action-card template, explain post-check, prompts/
scripts/             make_fixture.py
next.config.ts       security headers (CSP, frame-ancestors, nosniff, referrer policy) and /data cache headers
public/data/         pipeline output (not edited by the app)
_screens/            local screenshots + design check (gitignored)
```
