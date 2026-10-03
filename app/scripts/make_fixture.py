"""make_fixture — small, contract-conform data set for app development (data contract v1, app/README.md).

Reads data/graph_base.json + data/slice.json (and, if present, data/enrich/reactome.jsonl, coverage.jsonl,
edges_draft.json) and writes app/public/data/ for the hero cluster:
Krabbe, MLD, Gaucher, Pelizaeus-Merzbacher, the saposin deficiencies (+ subtypes and 1-hop neighbours),
genes GALC, ARSA, PSAP, PLP1 (+ every gene of a written disease).

Guard: writes only if app/public/data/meta.json is missing or says fixture: true. Real pipeline data is never touched.
The similarity here is a placeholder (IC-weighted Jaccard, no ontology propagation); pipeline/07_analytics.py replaces it.

Run:  uv run --project pipeline python app/scripts/make_fixture.py
"""
from __future__ import annotations

import hashlib
import json
import math
import shutil
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
OUT = ROOT / "app" / "public" / "data"
TODAY = date.today().isoformat()

FOCUS_ROOTS = [
    "MONDO:0009499",  # Krabbe disease
    "MONDO:0018868",  # metachromatic leukodystrophy
    "MONDO:0018150",  # Gaucher disease
    "MONDO:0010714",  # Pelizaeus-Merzbacher spectrum disorder (counter-example)
    "MONDO:0009590",  # MLD due to saposin B deficiency
    "MONDO:0012517",  # Gaucher due to saposin C deficiency
    "MONDO:0012719",  # combined PSAP deficiency
    "MONDO:0012720",  # Krabbe due to saposin A deficiency
]
FOCUS_GENES = ["GALC", "ARSA", "PSAP", "PLP1"]
TOP_PHENOTYPES = 24
MAX_CONTRADICTED_SHOWN = 3
TOP_NEIGHBOURS = 8
MAX_SHARED_PHENOTYPES = 8
MIN_SIMILARITY = 0.05
# fixture-only: keep the story's counter-example visible although the crude similarity ranks it ~40th
PINNED_NEIGHBOURS = {"MONDO:0009499": ["MONDO:0010714"], "MONDO:0018868": ["MONDO:0010714"], "MONDO:0010714": ["MONDO:0009499"]}


def guard() -> bool:
    meta_path = OUT / "meta.json"
    if not meta_path.exists():
        return True
    try:
        return json.loads(meta_path.read_text()).get("fixture") is True
    except json.JSONDecodeError:
        return False


def edge_id(source: str, target: str, edge_type: str) -> str:
    return "e_" + hashlib.sha1(f"{source}|{target}|{edge_type}".encode()).hexdigest()[:12]


def file_key(node_id: str) -> str:
    return node_id.replace(":", "_")


def read_jsonl(path: Path) -> list[dict]:
    rows = []
    if not path.exists():
        return rows
    for line in path.read_text().splitlines():
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue  # file may be mid-write by the pipeline
    return rows


def main() -> int:
    if not guard():
        print(f"skip: {OUT / 'meta.json'} holds real pipeline data (fixture != true) — nothing written")
        return 0

    graph = json.loads((DATA / "graph_base.json").read_text())
    slice_data = json.loads((DATA / "slice.json").read_text())
    mondo = slice_data["mondo"]
    core_ids = set(slice_data["core"])
    nodes = {n["id"]: n for n in graph["nodes"]}
    diseases = {i for i, n in nodes.items() if n["type"] == "disease"}

    children: dict[str, list[str]] = defaultdict(list)
    for mondo_id, m in mondo.items():
        for parent in m.get("parents", []):
            if parent in mondo:
                children[parent].append(mondo_id)

    gene_edges: dict[str, list[dict]] = defaultdict(list)       # disease -> gene edges
    edges_by_gene: dict[str, list[dict]] = defaultdict(list)    # gene -> disease edges
    pheno_edges: dict[str, list[dict]] = defaultdict(list)      # disease -> phenotype edges
    degree: dict[str, int] = defaultdict(int)
    for e in graph["edges"]:
        degree[e["source"]] += 1
        degree[e["target"]] += 1
        if e["type"] in ("caused_by", "associated_gene"):
            gene_edges[e["source"]].append(e)
            edges_by_gene[e["target"]].append(e)
        elif e["type"] == "has_phenotype":
            pheno_edges[e["source"]].append(e)

    # --- information content over positive annotations -------------------------------------------------
    positive_phenos: dict[str, set[str]] = {d: {e["target"] for e in pheno_edges[d] if e["evidence"]} for d in diseases}
    annotated = [d for d in diseases if positive_phenos[d]]
    pheno_count: dict[str, int] = defaultdict(int)
    for d in annotated:
        for p in positive_phenos[d]:
            pheno_count[p] += 1
    n_annotated = len(annotated)
    ic = {p: round(-math.log(c / n_annotated), 3) for p, c in pheno_count.items()}

    # effective sets: parents with few own annotations inherit their children's (one level)
    def effective_phenos(d: str) -> set[str]:
        own = positive_phenos.get(d, set())
        if len(own) >= 10:
            return own
        merged = set(own)
        for c in children.get(d, []):
            merged |= positive_phenos.get(c, set())
        return merged

    def rolled_gene_edges(d: str) -> list[dict]:
        direct = {e["target"]: e for e in gene_edges.get(d, [])}
        rolled: dict[str, dict] = {}
        for c in children.get(d, []):
            for ce in gene_edges.get(c, []):
                g = ce["target"]
                if g in direct:
                    continue
                if g not in rolled:
                    rolled[g] = {**ce, "id": edge_id(d, g, ce["type"]), "source": d, "evidence": list(ce["evidence"]),
                                 "contradicting": list(ce["contradicting"]), "rolled_up_from": [c]}
                else:
                    rolled[g]["rolled_up_from"].append(c)
                    rolled[g]["evidence"].extend(ce["evidence"])
                    rolled[g]["confidence"] = max(rolled[g]["confidence"], ce["confidence"])
                    rolled[g]["independent_sources"] = sorted(set(rolled[g]["independent_sources"]) | set(ce["independent_sources"]))
        return list(direct.values()) + list(rolled.values())

    eff_phenos = {d: effective_phenos(d) for d in diseases}
    eff_genes = {d: rolled_gene_edges(d) for d in diseases}
    causal_gene_set = {d: {e["target"] for e in eff_genes[d] if e["type"] == "caused_by" and e["evidence"]} for d in diseases}

    # --- optional pathway data (Reactome via pipeline/04_enrich) for mechanism_differs -------------------
    gene_pathways: dict[str, list[dict]] = {}
    for row in read_jsonl(DATA / "enrich" / "reactome.jsonl"):
        if row.get("error") is None and isinstance(row.get("pathways"), list):
            gene_pathways[row["symbol"]] = row["pathways"]
    reactome_row = {r["symbol"]: r for r in read_jsonl(DATA / "enrich" / "reactome.jsonl")}

    def pathway_ids(d: str) -> set[str] | None:
        genes = causal_gene_set[d]
        if not genes or any(g not in gene_pathways for g in genes):
            return None
        return {p["st_id"] for g in genes for p in gene_pathways[g]}

    def family(d: str) -> set[str]:
        fam = set(mondo.get(d, {}).get("parents", [])) | set(children.get(d, []))
        return fam

    def similarity(a: str, b: str) -> tuple[float, list[str]]:
        pa, pb = eff_phenos[a], eff_phenos[b]
        shared = pa & pb
        if not shared:
            return 0.0, []
        union_ic = sum(ic.get(p, 0) for p in pa | pb)
        score = sum(ic.get(p, 0) for p in shared) / union_ic if union_ic else 0.0
        return round(score, 3), sorted(shared, key=lambda p: -ic.get(p, 0))

    def neighbour_edge(a: str, b: str, score: float, shared: list[str], shared_genes: list[str]) -> dict:
        src, tgt = sorted([a, b])
        if score > 0:
            top = shared[0]
            formula = (f"IC-weighted Jaccard = Σ IC(shared) / Σ IC(union) = {score:.2f} over {len(shared)} shared HPO terms; "
                       f"most informative: {top} {nodes.get(top, {}).get('label', top)} (IC {ic.get(top, 0):.2f})")
            edge_type, conf = "similar_phenotype", score
            record = f"{len(shared)} shared HPO terms"
        else:
            formula = f"shared causal genes: {', '.join(shared_genes)} (from curated disease-gene edges)"
            edge_type, conf = "shares_gene", 0.9
            record = ", ".join(shared_genes)
        origins = sorted({ev["origin"] for d in (a, b) for e in pheno_edges[d] if e["target"] in set(shared[:20]) for ev in e["evidence"]}) or ["computed"]
        return {"id": edge_id(src, tgt, edge_type), "source": src, "target": tgt, "type": edge_type,
                "evidence": [{"db": "Constellate (fixture)", "origin": "computed", "record": record, "url": None,
                              "level": "inferred", "date": TODAY, "confidence": conf,
                              "snippet": formula + " · fixture placeholder, replaced by pipeline/07_analytics"}],
                "contradicting": [], "confidence": conf, "level": "inferred", "independent_sources": origins,
                "formula": formula}

    def neighbours_of(d: str, limit: int = TOP_NEIGHBOURS) -> list[dict]:
        fam = family(d)
        scored = []
        for other in diseases:
            if other == d or other in fam:
                continue
            shared_genes = sorted(causal_gene_set[d] & causal_gene_set[other])
            score, shared = similarity(d, other)
            if score < MIN_SIMILARITY and not shared_genes:
                continue
            scored.append((other, score, shared, shared_genes))
        ranked = sorted(scored, key=lambda t: -t[1])
        listed = {t[0] for t in ranked[:24]}
        # collapse subtypes whose parent is listed too (MLD juvenile/adult/... -> MLD)
        collapsed = [t for t in ranked[:24] if not (set(mondo.get(t[0], {}).get("parents", [])) & listed)]
        by_score = collapsed[:limit]
        by_gene = [t for t in collapsed if t[3] and t not in by_score][:4]
        pinned = [t for t in ranked if t[0] in PINNED_NEIGHBOURS.get(d, []) and t not in by_score + by_gene]
        result = []
        for other, score, shared, shared_genes in by_score + by_gene + pinned:
            pd, po = pathway_ids(d), pathway_ids(other)
            if shared_genes:
                mech = False
            elif pd is not None and po is not None:
                mech = len(pd & po) == 0
            else:
                mech = None
            result.append({
                "id": other, "label": nodes[other]["label"],
                "edge": neighbour_edge(d, other, score, shared, shared_genes),
                "shared_phenotypes": [{"id": p, "label": nodes.get(p, {}).get("label", p), "ic": ic.get(p, 0)} for p in shared[:MAX_SHARED_PHENOTYPES]],
                "shared_genes": [{"id": g, "label": g} for g in shared_genes],
                "mechanism_differs": mech,
            })
        return result

    # --- which diseases get a file ----------------------------------------------------------------------
    focus: set[str] = set()
    for r in FOCUS_ROOTS:
        focus.add(r)
        focus.update(children.get(r, []))
    for g in FOCUS_GENES:
        focus.update(e["source"] for e in edges_by_gene.get(g, []))
    focus &= diseases
    neighbour_cache = {d: neighbours_of(d) for d in sorted(focus)}
    written = set(focus)
    for d in sorted(focus):
        written.update(n["id"] for n in neighbour_cache[d])
    for d in sorted(written - focus):
        neighbour_cache[d] = neighbours_of(d)

    # --- optional enrichment + coverage -----------------------------------------------------------------
    enrich_by_disease: dict[str, dict[str, list]] = defaultdict(lambda: {"trials": [], "papers": [], "grants": []})
    draft_path = DATA / "enrich" / "edges_draft.json"
    pathway_edges_by_gene: dict[str, list[dict]] = defaultdict(list)
    if draft_path.exists():
        try:
            draft = json.loads(draft_path.read_text())
            draft_nodes = {n["id"]: n for n in draft["nodes"]}
            bucket = {"studied_in": "trials", "mentioned_in": "papers", "funded_by": "grants"}
            for e in draft["edges"]:
                if e["type"] in bucket and e["source"] in written and e["target"] in draft_nodes:
                    enrich_by_disease[e["source"]][bucket[e["type"]]].append({"node": draft_nodes[e["target"]], "edge": e})
                elif e["type"] == "in_pathway" and e["target"] in draft_nodes:
                    pathway_edges_by_gene[e["source"]].append({"id": e["target"], "label": draft_nodes[e["target"]]["label"].strip(), "edge": e})
        except (json.JSONDecodeError, KeyError):
            pass
    for g, row in reactome_row.items():  # genes without draft edges: build in_pathway edges from reactome.jsonl
        if g in pathway_edges_by_gene or not isinstance(row.get("pathways"), list):
            continue
        for p in row["pathways"]:
            pathway_edges_by_gene[g].append({"id": p["st_id"], "label": p["name"].strip(), "edge": {
                "id": edge_id(g, p["st_id"], "in_pathway"), "source": g, "target": p["st_id"], "type": "in_pathway",
                "evidence": [{"db": "Reactome", "origin": "Reactome", "record": p["st_id"], "url": p.get("url"), "level": "curated",
                              "date": p.get("release_date", TODAY), "confidence": 0.9,
                              "snippet": f"{g} (UniProt {row.get('uniprot')}) participates in '{p['name'].strip()}'"}],
                "contradicting": [], "confidence": 0.9, "level": "curated", "independent_sources": ["Reactome"]}})
    coverage_by_disease: dict[str, list] = defaultdict(list)
    for row in read_jsonl(DATA / "enrich" / "coverage.jsonl"):
        coverage_by_disease[row.get("mondo_id", "")].append({
            "source": row.get("source"), "query": row.get("query"), "hits": row.get("hits_raw", 0),
            "fetched_at": row.get("retrieved"), "note": row.get("note")})

    # --- write ------------------------------------------------------------------------------------------
    for sub in ("disease", "gene", "phenotype"):
        shutil.rmtree(OUT / sub, ignore_errors=True)
        (OUT / sub).mkdir(parents=True, exist_ok=True)

    def ref(i: str) -> dict:
        return {"id": i, "label": nodes.get(i, {}).get("label", mondo.get(i, {}).get("label", i))}

    phenotype_files: dict[str, dict] = {}
    for d in sorted(written):
        n = nodes[d]
        m = mondo.get(d, {})
        own = [e for e in pheno_edges[d] if e["evidence"]]
        if len(own) < 10:  # roll up children's phenotypes for sparse parents
            seen = {e["target"] for e in own}
            for c in children.get(d, []):
                for ce in pheno_edges.get(c, []):
                    if ce["evidence"] and ce["target"] not in seen:
                        seen.add(ce["target"])
                        own.append({**ce, "id": edge_id(d, ce["target"], "has_phenotype"), "source": d, "rolled_up_from": [c]})
        top = sorted(own, key=lambda e: (-(ic.get(e["target"], 0)), -e["confidence"]))[:TOP_PHENOTYPES]
        contradicted = sorted([e for e in pheno_edges[d] if e["contradicting"]], key=lambda e: (not e["evidence"], -ic.get(e["target"], 0)))
        shown = {e["id"] for e in top}
        top += [e for e in contradicted if e["id"] not in shown][:MAX_CONTRADICTED_SHOWN]
        disease_file = {
            "node": {"id": d, "label": n["label"], "definition": n.get("definition") or m.get("definition"),
                     "synonyms": [s for s in n.get("synonyms", []) if s != n["label"]], "xrefs": n.get("xrefs", []),
                     "parents": [ref(p) for p in m.get("parents", []) if p in mondo],
                     "children": [ref(c) for c in children.get(d, [])], "in_core": d in core_ids},
            "genes": eff_genes[d],
            "phenotypes": [{"edge": e, "phenotype": {"id": e["target"], "label": nodes[e["target"]]["label"], "ic": ic.get(e["target"], 0)}} for e in top],
            "neighbours": neighbour_cache[d],
        }
        enr = enrich_by_disease.get(d)
        if enr and any(enr.values()):
            disease_file["enrichment"] = {k: v[:12] for k, v in enr.items()}
        if coverage_by_disease.get(d):
            disease_file["coverage"] = coverage_by_disease[d]
        (OUT / "disease" / f"{file_key(d)}.json").write_text(json.dumps(disease_file, ensure_ascii=False))
        for item in disease_file["phenotypes"]:
            p = item["phenotype"]["id"]
            pf = phenotype_files.setdefault(p, {"node": {"id": p, "label": nodes[p]["label"], "ic": ic.get(p, 0)}, "diseases": []})
            pf["diseases"].append(item["edge"])

    genes_written = set(FOCUS_GENES)
    for d in written:
        genes_written.update(e["target"] for e in eff_genes[d])
    for g in sorted(genes_written):
        if g not in nodes:
            continue
        gene_file = {"node": {"id": g, "label": g, "full_name": nodes[g].get("full_name"), "ncbi_gene_id": nodes[g].get("ncbi_gene_id")},
                     "diseases": edges_by_gene.get(g, [])}
        if pathway_edges_by_gene.get(g) or g in reactome_row:
            gene_file["pathways"] = pathway_edges_by_gene.get(g, [])
        (OUT / "gene" / f"{g}.json").write_text(json.dumps(gene_file, ensure_ascii=False))

    for p, pf in phenotype_files.items():
        pf["diseases"].sort(key=lambda e: -e["confidence"])
        (OUT / "phenotype" / f"{file_key(p)}.json").write_text(json.dumps(pf, ensure_ascii=False))

    # index.json: every disease, gene, phenotype in graph_base
    keep_xref = ("OMIM:", "Orphanet:", "GARD:", "MESH:", "UMLS:", "ICD10CM:", "DOID:")
    index = []
    for i, n in nodes.items():
        xrefs = [x.replace("Orphanet:", "ORPHA:") for x in n.get("xrefs", []) if x.startswith(keep_xref)]
        synonyms = [s for s in n.get("synonyms", []) if s != n["label"]]
        if n["type"] == "gene" and n.get("full_name"):
            synonyms = [n["full_name"]]
        index.append({"id": i, "type": n["type"], "label": n["label"], "synonyms": synonyms, "xrefs": xrefs,
                      "in_core": i in core_ids, "degree": degree.get(i, 0)})
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")))

    # core.json: core diseases + their genes, gene edges, top disease-disease edges (no phenotype nodes)
    core_nodes, core_edges, seen_edges = [], [], set()
    core_genes: set[str] = set()
    for d in sorted(core_ids & diseases):
        core_nodes.append({"id": d, "type": "disease", "label": nodes[d]["label"], "in_core": True,
                           "n_genes": len(eff_genes[d]), "n_phenotypes": len(eff_phenos[d])})
        for e in gene_edges.get(d, []):
            core_genes.add(e["target"])
            core_edges.append(e)
        for nb in (neighbour_cache.get(d) or neighbours_of(d, limit=5))[:5]:
            if nb["edge"]["id"] not in seen_edges and nb["id"] in core_ids:
                seen_edges.add(nb["edge"]["id"])
                core_edges.append({**nb["edge"], "mechanism_differs": nb["mechanism_differs"]})
    for g in sorted(core_genes):
        core_nodes.append({"id": g, "type": "gene", "label": g, "in_core": True,
                           "n_genes": 0, "n_phenotypes": 0})
    (OUT / "core.json").write_text(json.dumps({"nodes": core_nodes, "edges": core_edges}, ensure_ascii=False, separators=(",", ":")))

    meta = {
        "version": "fixture-1", "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "fixture": True,
        "sources": [
            {"db": "HPO", "version": "see data/MANIFEST.md", "license": "HPO license (free with attribution)", "url": "https://hpo.jax.org"},
            {"db": "MONDO", "version": "see data/MANIFEST.md", "license": "CC BY 4.0", "url": "https://mondo.monarchinitiative.org"},
            {"db": "Orphanet", "version": "see data/MANIFEST.md", "license": "CC BY 4.0", "url": "https://www.orphadata.com"},
            {"db": "Reactome", "version": "ContentService", "license": "CC BY 4.0", "url": "https://reactome.org"},
            {"db": "ClinicalTrials.gov", "version": "API v2", "license": "US public domain", "url": "https://clinicaltrials.gov"},
            {"db": "NIH RePORTER", "version": "API v2", "license": "US public domain", "url": "https://reporter.nih.gov"},
            {"db": "Europe PMC", "version": "REST", "license": "open metadata", "url": "https://europepmc.org"},
        ],
        "counts": {"diseases": len(diseases), "genes": sum(1 for n in nodes.values() if n["type"] == "gene"),
                   "phenotypes": sum(1 for n in nodes.values() if n["type"] == "phenotype"), "edges": len(graph["edges"]),
                   "core_diseases": len(core_ids & diseases), "disease_files": len(written), "gene_files": len(genes_written)},
        "hero": {"start": "MONDO:0009499"},
    }
    (OUT / "meta.json").write_text(json.dumps(meta, indent=2))

    size = sum(f.stat().st_size for f in OUT.rglob("*.json")) / 1e6
    print(f"fixture → {OUT.relative_to(ROOT)}: {len(written)} disease files ({len(focus)} focus), {len(genes_written)} gene files, "
          f"{len(phenotype_files)} phenotype files, index {len(index)} entries, core {len(core_nodes)} nodes / {len(core_edges)} edges, {size:.1f} MB")
    for d in ["MONDO:0009499"]:
        print("Krabbe neighbours:", [(nb["label"], nb["edge"]["type"], nb["edge"]["confidence"], nb["mechanism_differs"]) for nb in neighbour_cache[d]])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
