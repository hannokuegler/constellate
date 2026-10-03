"""04_enrich_apis — API enrichment: trials, papers, grants, gene-target scores, pathways, variant counts.

Reads data/slice.json, writes data/enrich/<source>.jsonl (normalised records), data/enrich/coverage.jsonl (one record per
disease x source for the honest-gap screen), data/enrich/edges_draft.json (edge drafts in the 03_build_graph evidence format)
and appends to data/enrich/run_log.jsonl. Raw API answers are cached in data/cache/<source>/ (a second run hits only the cache).

  uv run --project pipeline python pipeline/04_enrich_apis.py --scope hero
  uv run --project pipeline python pipeline/04_enrich_apis.py --scope core --sources ctgov,europepmc
Scopes: hero | core (default) | all.  RePORTER, mygene/Reactome and ClinVar always use core diseases/genes only.
"""
from __future__ import annotations

import argparse
import json
import sys
import threading
import time
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent))
from enrich import clinvar, ctgov, diseases, edges, europepmc, http, mygene, opentargets, reactome, reporter  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "enrich"
ALL_SOURCES = ["ctgov", "europepmc", "reporter", "opentargets", "mygene", "reactome", "clinvar"]


def write_jsonl(name: str, records: list[dict]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records))


def gene_coverage(disease_list: list[diseases.Disease], genes: dict[str, list[str]], source: str, records: dict[str, dict]) -> list[dict]:
    """Disease-level coverage for gene-based sources (reactome, clinvar)."""
    out = []
    for disease in disease_list:
        symbols = [s for s, ds in genes.items() if disease.mondo_id in ds]
        retrieved = max((records[s]["retrieved"] for s in symbols if s in records), default=http.now_iso())
        errors = [f"{s}: {records[s]['error']}" for s in symbols if s in records and records[s].get("error")]
        if source == "reactome":
            queries = [{"query": f"mygene.info symbol:{s} -> UniProt {records[s]['uniprot']} -> Reactome pathways", "url": records[s]["url"],
                        "total_hits": len(records[s]["pathways"])} for s in symbols if s in records]
            distinct = {p["st_id"] for s in symbols if s in records for p in records[s]["pathways"]}
            hits = len(distinct)
        else:
            queries = [{"query": records[s]["query"], "url": records[s]["search_url"], "total_hits": records[s].get("pathogenic_or_likely")}
                       for s in symbols if s in records and not records[s].get("error")]
            hits = sum(records[s].get("pathogenic_or_likely") or 0 for s in symbols if s in records)
        note = None if symbols else "no disease gene annotated in slice (Orphanet/HPO) - nothing to look up"
        out.append(diseases.coverage_record(disease, source, queries=queries, hits_raw=hits, hits_kept=hits, hits_discarded=0, retrieved=retrieved,
                                            note=note, error="; ".join(errors) or None, genes=symbols))
    return out


def run_source(name: str, disease_list: list[diseases.Disease], args: argparse.Namespace) -> dict:
    started = time.monotonic()
    coverage: list[dict] = []
    core_list = [d for d in disease_list if d.is_core]
    genes = diseases.gene_scope(core_list, args.limit)
    counts = {}
    if name == "ctgov":
        records, coverage = ctgov.run(disease_list)
    elif name == "europepmc":
        records, coverage = europepmc.run(disease_list)
    elif name == "reporter":
        records, coverage = reporter.run(disease_list)
    elif name == "opentargets":
        records, coverage = opentargets.run(disease_list)
    elif name == "mygene":
        records = mygene.run(list(genes))
    elif name == "reactome":
        records = reactome.run(list(genes))
        coverage = gene_coverage(core_list, genes, "reactome", {r["symbol"]: r for r in records})
    elif name == "clinvar":
        records = clinvar.run(list(genes))
        coverage = gene_coverage(core_list, genes, "clinvar", {r["symbol"]: r for r in records})
    else:
        raise ValueError(name)
    write_jsonl(name, records)
    failed = sum(1 for c in coverage if c.get("error")) if coverage else sum(1 for r in records if r.get("error"))
    stats = http.STATS[name]
    counts.update(records=len(records), failed=failed, seconds=round(time.monotonic() - started, 1), network_calls=stats["network"],
                  cache_hits=stats["cache"], retries=stats["retries"])
    print(f"[{name}] done: {counts}", flush=True)
    return {"name": name, "counts": counts, "coverage": coverage}


def merge_coverage(new: list[dict], sources: set[str]) -> None:
    path = OUT / "coverage.jsonl"
    old = [json.loads(line) for line in path.read_text().splitlines() if line.strip()] if path.exists() else []
    write_jsonl("coverage", [c for c in old if c["source"] not in sources] + new)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sources", default=",".join(ALL_SOURCES), help=f"comma list of {ALL_SOURCES}")
    parser.add_argument("--scope", choices=["hero", "core", "all"], default="core")
    parser.add_argument("--limit", type=int, default=None, help="only the first N diseases / genes (testing)")
    parser.add_argument("--refresh", action="store_true", help="ignore the disk cache and refetch")
    parser.add_argument("--no-edges", action="store_true", help="skip building edges_draft.json")
    parser.add_argument("--ot-min-score", type=float, default=0.2, help="Open Targets: min overall score for a target_score edge draft")
    parser.add_argument("--ot-top", type=int, default=15, help="Open Targets: max target_score edges per disease")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env.local")
    import os
    if os.environ.get("NCBI_API_KEY", "").strip():
        http.set_ncbi_key_present()
    http.set_refresh(args.refresh)
    sources = [s.strip() for s in args.sources.split(",") if s.strip()]
    unknown = set(sources) - set(ALL_SOURCES)
    if unknown:
        raise SystemExit(f"unknown sources: {sorted(unknown)}")

    disease_list = diseases.select(args.scope, args.limit)
    print(f"scope {args.scope}: {len(disease_list)} diseases ({sum(d.is_hero for d in disease_list)} hero, {sum(d.is_core for d in disease_list)} core) · sources {sources}", flush=True)
    started = time.monotonic()
    results: dict[str, dict] = {}
    # reactome needs the mygene answers: run them in one thread, in order; everything else runs in parallel
    chains = [[s for s in sources if s in ("mygene", "reactome")]] + [[s] for s in sources if s not in ("mygene", "reactome")]
    threads = []

    def run_chain(chain: list[str]) -> None:
        for name in chain:
            results[name] = run_source(name, disease_list, args)

    for chain in (c for c in chains if c):
        thread = threading.Thread(target=run_chain, args=(chain,))
        thread.start()
        threads.append(thread)
    for thread in threads:
        thread.join()

    merge_coverage([c for r in results.values() for c in r["coverage"]], {r["name"] for r in results.values() if r["coverage"]})
    if not args.no_edges:
        draft = edges.build(args.scope, args.ot_min_score, args.ot_top)
        (OUT / "edges_draft.json").write_text(json.dumps(draft, ensure_ascii=False, indent=0))
        print(f"edges_draft.json: edges {draft['meta']['edge_counts']} · nodes {draft['meta']['node_counts']} · variant counts {draft['meta']['genes_with_variant_count']} genes"
              f" · id collisions {len(draft['meta']['edge_id_collisions'])}")
    total_seconds = round(time.monotonic() - started, 1)
    with (OUT / "run_log.jsonl").open("a") as log:
        log.write(json.dumps({"finished": http.now_iso(), "scope": args.scope, "limit": args.limit, "refresh": args.refresh, "seconds": total_seconds,
                              "sources": {n: r["counts"] for n, r in results.items()}}) + "\n")
    print(f"total {total_seconds}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
