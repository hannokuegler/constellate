"""02_slice — pick the disease slice: the MONDO subtree of lysosomal storage disease (MONDO:0002561)
plus 2-hop neighbours (diseases sharing a gene or an informative phenotype with the core).

Output: data/slice.json  {core: [...mondo ids], neighbours: [...], mondo: {id: {label, synonyms, xrefs, parents}}}
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "slice.json"

CORE_ROOT = "MONDO:0002561"  # lysosomal storage disease
EXTRA_ROOTS = ["MONDO:0019046"]  # leukodystrophy — phenotype-defined neighbour family (names hide mechanisms)
MAX_PHENOTYPE_FREQ = 0.02  # a phenotype annotated to >2 % of all diseases is too broad to link neighbours
TOP_PHENOTYPE_NEIGHBOURS = 5  # per core disease, ranked by summed information content of shared phenotypes


def iri_to_curie(iri: str) -> str:
    tail = iri.rsplit("/", 1)[-1]
    return tail.replace("_", ":", 1)


def load_mondo() -> tuple[dict, dict]:
    graph = json.loads((RAW / "mondo.json").read_text())["graphs"][0]
    nodes: dict[str, dict] = {}
    for node in graph["nodes"]:
        if node.get("type") != "CLASS" or "MONDO_" not in node["id"]:
            continue
        meta = node.get("meta", {})
        if any(p.get("pred", "").endswith("owl#deprecated") for p in meta.get("basicPropertyValues", [])):
            continue
        nodes[iri_to_curie(node["id"])] = {
            "label": node.get("lbl", ""),
            "synonyms": sorted({s["val"] for s in meta.get("synonyms", [])}),
            "xrefs": sorted({x["val"] for x in meta.get("xrefs", [])}),
            "definition": meta.get("definition", {}).get("val", ""),
            "parents": [],
        }
    children: dict[str, list[str]] = defaultdict(list)
    for edge in graph["edges"]:
        if edge.get("pred") == "is_a":
            child, parent = iri_to_curie(edge["sub"]), iri_to_curie(edge["obj"])
            if child in nodes and parent in nodes:
                nodes[child]["parents"].append(parent)
                children[parent].append(child)
    return nodes, children


def descendants(root: str, children: dict[str, list[str]]) -> set[str]:
    seen, stack = set(), [root]
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        seen.add(node)
        stack.extend(children.get(node, []))
    return seen


def xref_index(nodes: dict) -> dict[str, str]:
    """OMIM:123456 / Orphanet:123 -> MONDO id (first non-obsolete match)."""
    index: dict[str, str] = {}
    for mondo_id, node in nodes.items():
        for xref in node["xrefs"]:
            if xref.startswith(("OMIM:", "Orphanet:", "ORPHA:")):
                index.setdefault(xref.replace("ORPHA:", "Orphanet:"), mondo_id)
    return index


def load_hpoa(index: dict[str, str]) -> tuple[dict[str, set[str]], dict[str, set[str]]]:
    """disease(MONDO) -> phenotypes, phenotype -> diseases(MONDO). Skips negated rows."""
    disease_pheno: dict[str, set[str]] = defaultdict(set)
    for line in (RAW / "phenotype.hpoa").read_text().splitlines():
        if line.startswith("#") or line.startswith("database_id"):
            continue
        cols = line.split("\t")
        db_id, qualifier, hpo_id, aspect = cols[0], cols[2], cols[3], cols[10]
        if qualifier == "NOT" or aspect != "P":
            continue
        mondo_id = index.get(db_id.replace("ORPHA:", "Orphanet:"))
        if mondo_id:
            disease_pheno[mondo_id].add(hpo_id)
    pheno_disease: dict[str, set[str]] = defaultdict(set)
    for disease, phenos in disease_pheno.items():
        for p in phenos:
            pheno_disease[p].add(disease)
    return disease_pheno, pheno_disease


def load_genes(index: dict[str, str]) -> dict[str, set[str]]:
    """disease(MONDO) -> gene symbols from HPO genes_to_phenotype (OMIM-derived)."""
    disease_genes: dict[str, set[str]] = defaultdict(set)
    for line in (RAW / "genes_to_phenotype.txt").read_text().splitlines()[1:]:
        cols = line.split("\t")
        if len(cols) < 6:
            continue
        mondo_id = index.get(cols[5].replace("ORPHA:", "Orphanet:"))
        if mondo_id:
            disease_genes[mondo_id].add(cols[1])
    return disease_genes


def main() -> int:
    nodes, children = load_mondo()
    core = descendants(CORE_ROOT, children)
    for root in EXTRA_ROOTS:
        core |= descendants(root, children)
    # drop grouping classes without any cross-reference (they are not "a disease someone has")
    core = {m for m in core if nodes[m]["xrefs"]}

    index = xref_index(nodes)
    disease_pheno, pheno_disease = load_hpoa(index)
    disease_genes = load_genes(index)
    n_annotated = len(disease_pheno)

    gene_disease: dict[str, set[str]] = defaultdict(set)
    for disease, genes in disease_genes.items():
        for g in genes:
            gene_disease[g].add(disease)

    import math
    ic = {p: -math.log(len(ds) / n_annotated) for p, ds in pheno_disease.items()}

    neighbours: dict[str, dict] = {}
    for disease in core:
        for gene in disease_genes.get(disease, ()):
            for other in gene_disease[gene] - core:
                neighbours.setdefault(other, {"via_genes": set(), "via_phenotypes": set(), "linked_core": set()})
                neighbours[other]["via_genes"].add(gene)
                neighbours[other]["linked_core"].add(disease)
        # phenotype neighbours: rank candidates by summed IC of shared informative phenotypes, keep top-k
        scores: dict[str, float] = defaultdict(float)
        shared: dict[str, set[str]] = defaultdict(set)
        for pheno in disease_pheno.get(disease, ()):
            if len(pheno_disease[pheno]) / n_annotated > MAX_PHENOTYPE_FREQ:
                continue  # too broad (e.g. seizures) to count as a link
            for other in pheno_disease[pheno] - core:
                scores[other] += ic[pheno]
                shared[other].add(pheno)
        for other, _ in sorted(scores.items(), key=lambda kv: -kv[1])[:TOP_PHENOTYPE_NEIGHBOURS]:
            if len(shared[other]) < 3:
                continue
            neighbours.setdefault(other, {"via_genes": set(), "via_phenotypes": set(), "linked_core": set()})
            neighbours[other]["via_phenotypes"] |= shared[other]
            neighbours[other]["linked_core"].add(disease)

    keep = core | set(neighbours)
    OUT.write_text(json.dumps({
        "core_root": CORE_ROOT, "extra_roots": EXTRA_ROOTS,
        "core": sorted(core),
        "neighbours": {d: {k: sorted(v) for k, v in meta.items()} for d, meta in sorted(neighbours.items())},
        "mondo": {m: nodes[m] for m in sorted(keep)},
        "disease_genes": {m: sorted(disease_genes.get(m, ())) for m in sorted(keep)},
        "disease_phenotypes": {m: sorted(disease_pheno.get(m, ())) for m in sorted(keep)},
    }, indent=1))
    print(f"core {len(core)} diseases · neighbours {len(neighbours)} · total {len(keep)} → {OUT.relative_to(ROOT)}")
    for probe in ("Krabbe", "metachromatic", "Gaucher", "Pelizaeus"):
        hits = [m for m in keep if probe.lower() in nodes[m]["label"].lower()]
        print(f"  {probe}: {[(h, nodes[h]['label']) for h in hits[:3]]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
