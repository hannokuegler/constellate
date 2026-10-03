"""B5 · Cross-check of our phenotype similarity against the Monarch Initiative semantic-similarity API (validation only, no edges).

Pairs: the top 50 similar_phenotype edges of app/public/data/core.json by our simGIC (parsed from edge.formula).
Two Monarch scores per pair (metric ancestor_information_content):
  ontology  GET  /v3/api/semsim/compare/<MONDO>/<MONDO>          (the two disease classes inside MONDO)
  profile   POST /v3/api/semsim/compare {subjects: HPO set A, objects: HPO set B}   (the annotated phenotype profiles,
            HPO terms of the has_phenotype edges in data/graph_base.json; average of best matches)
Spearman rank correlation of our simGIC with each score. Reported in docs/DATA-REPORT.md and extra_metrics.json.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

from scipy.stats import spearmanr

from enrich import http

from .common import OfflineMiss, fetch_json

API = "https://api-v3.monarchinitiative.org/v3/api/semsim/compare"
TOP = 50
SIMGIC = re.compile(r"simGIC ([0-9.]+)")


def run(root: Path, offline: bool = False) -> dict:
    core = json.loads((root / "app" / "public" / "data" / "core.json").read_text())
    pairs = []
    for edge in core["edges"]:
        if edge["type"] != "similar_phenotype":
            continue
        match = SIMGIC.search(edge.get("formula", ""))
        if match:
            pairs.append((float(match.group(1)), edge["source"], edge["target"], edge["id"]))
    seen, top = set(), []
    for score, a, b, edge_id in sorted(pairs, key=lambda p: (-p[0], p[1], p[2])):
        key = tuple(sorted((a, b)))
        if key not in seen:
            seen.add(key)
            top.append((score, a, b, edge_id))
        if len(top) == TOP:
            break
    wanted = {d for _, a, b, _ in top for d in (a, b)}
    profiles: dict[str, set[str]] = defaultdict(set)
    for edge in json.loads((root / "data" / "graph_base.json").read_text())["edges"]:
        if edge["type"] == "has_phenotype" and edge["source"] in wanted:
            profiles[edge["source"]].add(edge["target"])
    rows = []
    for simgic, a, b, edge_id in top:
        row = {"a": a, "b": b, "edge_id": edge_id, "simgic": simgic, "ontology": None, "profile": None,
               "profile_terms": [len(profiles[a]), len(profiles[b])], "error": None}
        try:
            response = fetch_json("monarch", f"{API}/{a}/{b}", offline=offline)
            row["ontology"] = (response.data or {}).get("average_score")
            row["retrieved"] = response.fetched_at
            if profiles[a] and profiles[b]:
                body = {"subjects": sorted(profiles[a]), "objects": sorted(profiles[b]), "metric": "ancestor_information_content"}
                response = fetch_json("monarch", API, body=body, offline=offline)
                row["profile"] = (response.data or {}).get("average_score")
        except (http.FetchError, OfflineMiss) as exc:
            row["error"] = str(exc)[:200]
        rows.append(row)

    def spearman(key: str) -> dict:
        usable = [(r["simgic"], r[key]) for r in rows if r[key] is not None]
        if len(usable) < 3:
            return {"value": None, "n": len(usable)}
        rho, p = spearmanr([u[0] for u in usable], [u[1] for u in usable])
        return {"value": round(float(rho), 3), "p": float(f"{p:.3g}"), "n": len(usable)}

    retrieved = min((r["retrieved"][:10] for r in rows if r.get("retrieved")), default=None)
    profile, ontology = spearman("profile"), spearman("ontology")
    summary = {"value": profile["value"], "n": profile["n"], "p": profile.get("p"),
               "source": f"Monarch API v3 semsim (HPO profiles, ancestor_information_content), {retrieved}",
               "ontology_variant": {**ontology, "source": f"Monarch API v3 semsim compare/<MONDO>/<MONDO>, {retrieved}"}}
    return {"summary": summary, "pairs": rows}
