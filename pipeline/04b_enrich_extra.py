"""04b_enrich_extra — the data-v2 gaps: assets, newborn screening, approved therapies, prevalence, researcher network,
Monarch cross-check and coverage audit.

Reads data/slice.json and the 04 outputs in data/enrich/. Writes (all gitignored except data/curated/assets.csv):
  data/enrich/extra_<source>.jsonl         normalised records per source
  data/enrich/extra_graph_<source>.json    {nodes, edges} per source (merged into extra_edges.json at the end)
  data/enrich/extra_edges.json             {meta, nodes, edges} in the edges_draft.json format
  data/enrich/extra_searched.jsonl         per disease x section: what was searched, when, how many hits (honest gap)
  data/enrich/extra_kol_overlap.json       disease pairs with shared researchers (people + record ids, no e-mail)
  data/enrich/extra_metrics.json           numbers for meta.metrics (Monarch Spearman, coverage, hero sample)
  data/curated/assets.csv                  asset table (studies, registries, scales, newborn screening incl. UNBELEGT rows)
API answers are cached in data/cache/extra/<source>/; --offline fails on a cache miss instead of going to the network.

  uv run --project pipeline python pipeline/04b_enrich_extra.py --scope hero
  uv run --project pipeline python pipeline/04b_enrich_extra.py --scope core --sources assets,therapies
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from enrich import diseases, http  # noqa: E402
from enrich.edges import Draft  # noqa: E402
from enrich_extra import assets, audit, kol as people, monarch, nbs, prevalence, therapies  # noqa: E402
from enrich_extra.common import LEVEL_ORDER, finalize  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "enrich"
ASSETS_CSV = ROOT / "data" / "curated" / "assets.csv"
ALL_SOURCES = ["assets", "nbs", "therapies", "prevalence", "people", "monarch", "audit"]
HERO_SAMPLE = {"Krabbe": "MONDO:0009499", "MLD": "MONDO:0018868", "PMD": "MONDO:0010714"}


def dump_jsonl(name: str, records: list[dict]) -> None:
    (OUT / f"{name}.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n" for r in records))


def dump_json(name: str, data: object) -> None:
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + "\n")


def load_jsonl(name: str) -> list[dict]:
    path = OUT / f"{name}.jsonl"
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()] if path.exists() else []


def save_graph(source: str, draft: Draft) -> dict:
    graph = finalize(draft)
    dump_json(f"extra_graph_{source}.json", graph)
    return graph


def merge_searched(source_sections: set[str], new: list[dict]) -> None:
    keep = [s for s in load_jsonl("extra_searched") if s["section"] not in source_sections]
    rows = keep + [{k: v for k, v in s.items() if k != "queries"} | {"queries": [q.get("query") for q in s.get("queries", [])]}
                   if s.get("queries") else s for s in new]
    rows.sort(key=lambda s: (s.get("mondo_id") or "", s["section"], s["source"]))
    dump_jsonl("extra_searched", rows)


def write_assets_csv(rows: list[dict], sections: set[str]) -> None:
    """assets.csv holds B1 study/scale rows and NBS rows; a partial run replaces only its own asset types."""
    nbs_types = {"newborn_screening"}
    old = list(csv.DictReader(ASSETS_CSV.open())) if ASSETS_CSV.exists() else []
    drop = (set() if "assets" not in sections else {"natural_history_study", "registry", "outcome_scale", "biobank"}) | \
           (nbs_types if "nbs" in sections else set())
    merged = [r for r in old if r["asset_type"] not in drop] + rows
    merged.sort(key=lambda r: (r["disease_mondo"], r["asset_type"], r["asset_id"], r["source_id"]))
    with ASSETS_CSV.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=assets.CSV_FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(merged)


def prevalence_records(disease_list) -> list[dict]:
    """App shape: {mondo_id, type, class, value, unit, region, validation, references, source: {db, record, url}, retrieved}.
    Orphanet ValMoy is a mean per 100 000 (Orphanet convention), not per million."""
    out = []
    for r in prevalence.run(disease_list):
        out.append({"mondo_id": r["mondo_id"], "type": r["type"], "class": r["class"], "value": r["value_per_million"],
                    "unit": "per 100 000 (Orphanet ValMoy)" if r["value_per_million"] is not None else None,
                    "region": r["region"], "validation": r["validation"], "references": r["source"],
                    "qualification": r.get("qualification"), "ambiguous_xref": r.get("ambiguous_xref", False),
                    "source": {"db": "Orphanet", "record": r["record"], "url": r["url"]}, "retrieved": r["retrieved"],
                    "snippet": r["snippet"]})
    out.sort(key=lambda r: (r["mondo_id"], r["source"]["record"], r["snippet"]))
    return out


def merge_graphs() -> dict:
    nodes: dict[str, dict] = {}
    edges: dict[str, dict] = {}
    for path in sorted(OUT.glob("extra_graph_*.json")):
        graph = json.loads(path.read_text())
        for node in graph["nodes"]:
            nodes.setdefault(node["id"], node)
        for edge in graph["edges"]:
            edges[edge["id"]] = edge
    edge_list = [edges[k] for k in sorted(edges)]
    return {"meta": {"note": "data-v2 drafts from 04b_enrich_extra; level order " + " > ".join(LEVEL_ORDER),
                     "edge_counts": dict(sorted(Counter(e["type"] for e in edge_list).items())),
                     "level_counts": dict(sorted(Counter(e["level"] for e in edge_list).items())),
                     "node_counts": dict(sorted(Counter(n["type"] for n in nodes.values()).items()))},
            "nodes": [nodes[k] for k in sorted(nodes)], "edges": edge_list}


def metrics(core_ids: list[str]) -> dict:
    coverage = load_jsonl("coverage")
    with_hits = lambda source: {c["mondo_id"] for c in coverage if c["source"] == source and (c.get("hits_kept") or 0) > 0}  # noqa: E731
    edges = merge_graphs()["edges"]
    asset_ids = {e["source"] for e in edges if e["type"] == "has_asset"}
    orgs_path = ROOT / "data" / "curated" / "orgs.csv"
    org_ids = {r.get("mondo_id") for r in csv.DictReader(orgs_path.open())} if orgs_path.exists() else set()
    core = set(core_ids)
    monarch_path = OUT / "extra_monarch.json"
    monarch_summary = json.loads(monarch_path.read_text())["summary"] if monarch_path.exists() else None
    overlap_path = OUT / "extra_kol_overlap.json"
    overlap = json.loads(overlap_path.read_text()) if overlap_path.exists() else []
    hero = {}
    for name, mondo in HERO_SAMPLE.items():
        mine = [e for e in edges if e["source"] == mondo]
        people_ids = {p["name"] for o in overlap if mondo in (o["disease_a"], o["disease_b"]) for p in o["people"]}
        hero[name] = {"mondo_id": mondo, "assets": sum(e["type"] == "has_asset" for e in mine),
                      "therapies": sum(e["type"] == "approved_therapy" for e in mine),
                      "nbs_countries": sum(e["type"] == "screened_in" for e in mine), "kol_people": len(people_ids)}
    return {"monarch_spearman": monarch_summary,
            "coverage": {"trial": len(with_hits("ctgov") & core), "paper": len(with_hits("europepmc") & core),
                         "asset": len(asset_ids & core), "org": len(org_ids & core), "denominator": len(core)},
            "extract_precision": None, "hero_sample": hero}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sources", default=",".join(ALL_SOURCES), help=f"comma list of {ALL_SOURCES}")
    parser.add_argument("--scope", choices=["hero", "core"], default="core")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--offline", action="store_true", help="cache only; a cache miss is reported, never fetched")
    args = parser.parse_args()
    sources = [s.strip() for s in args.sources.split(",") if s.strip()]
    if set(sources) - set(ALL_SOURCES):
        raise SystemExit(f"unknown sources: {sorted(set(sources) - set(ALL_SOURCES))}")
    OUT.mkdir(parents=True, exist_ok=True)
    disease_list = diseases.select(args.scope, args.limit)
    print(f"scope {args.scope}: {len(disease_list)} diseases · sources {sources} · offline {args.offline}", flush=True)
    log = {}
    for source in sources:
        started = time.monotonic()
        counts: dict = {}
        if source == "assets":
            result = assets.run(disease_list, args.offline)
            dump_jsonl("extra_assets", result["rows"])
            dump_jsonl("extra_ctgov", result["studies"])
            write_assets_csv(result["rows"], {"assets"})
            merge_searched({"assets"}, result["searched"])
            graph = save_graph("assets", result["draft"])
            counts = {"records": len(result["rows"]), "studies": len(result["studies"])}
        elif source == "nbs":
            result = nbs.run(disease_list, args.offline)
            dump_jsonl("extra_nbs", result["rows"])
            write_assets_csv(result["rows"], {"nbs"})
            merge_searched({"screening"}, result["searched"])
            graph = save_graph("nbs", result["draft"])
            counts = {"records": len(result["rows"])}
        elif source == "therapies":
            result = therapies.run(disease_list, args.offline)
            dump_jsonl("extra_therapies", result["records"])
            merge_searched({"therapies"}, result["searched"])
            graph = save_graph("therapies", result["draft"])
            counts = {"records": len(result["records"])}
        elif source == "prevalence":
            records = prevalence_records(disease_list)
            dump_jsonl("extra_prevalence", records)
            graph = {"edges": []}
            counts = {"records": len(records), "diseases": len({r["mondo_id"] for r in records})}
        elif source == "people":
            result = people.run(disease_list, args.offline)
            dump_jsonl("extra_people", result["people"])
            dump_json("extra_kol_overlap.json", result["overlap"])
            merge_searched({"kol"}, result["searched"])
            graph = save_graph("people", result["draft"])
            counts = {"records": len(result["people"]), "overlap_pairs": len(result["overlap"]), "diagnostics": result["diagnostics"]}
        elif source == "monarch":
            result = monarch.run(ROOT, args.offline)
            dump_json("extra_monarch.json", result)
            graph = {"edges": []}
            counts = {"records": len(result["pairs"]), "summary": result["summary"]}
        elif source == "audit":
            result = audit.run(disease_list, args.offline)
            dump_jsonl("extra_coverage_audit", result)
            graph = {"edges": []}
            counts = {"records": len(result), "still_zero": sum(r["verdict"] == "gap" for r in result)}
        counts["edges"] = dict(Counter(e["type"] for e in graph["edges"]))
        counts["seconds"] = round(time.monotonic() - started, 1)
        log[source] = counts
        print(f"[{source}] {json.dumps(counts, ensure_ascii=False)[:600]}", flush=True)
    merged = merge_graphs()
    dump_json("extra_edges.json", merged)
    dump_json("extra_metrics.json", metrics(diseases.load_slice()["core"]))
    with (OUT / "extra_run_log.jsonl").open("a") as fh:
        fh.write(json.dumps({"finished": http.now_iso(), "scope": args.scope, "limit": args.limit, "offline": args.offline,
                             "sources": log}, ensure_ascii=False) + "\n")
    print(f"extra_edges.json: {merged['meta']['edge_counts']} · nodes {merged['meta']['node_counts']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
