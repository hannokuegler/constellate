"""03_build_graph — nodes + edges + evidence from the bulk sources, restricted to data/slice.json.

Nodes: disease (MONDO), gene (HGNC symbol), phenotype (HPO)
Edges: disease -caused_by-> gene        (Orphanet product6, HPO genes_to_phenotype)   level: curated
       disease -has_phenotype-> HPO     (HPO phenotype.hpoa, Orphanet product4)      level: observed (has frequency) | curated
Every edge: evidence[] with db, record, url, level, date, confidence, snippet; contradicting[] (always present).
Output: data/graph_base.json
"""
from __future__ import annotations

import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

from lxml import etree

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
SLICE = json.loads((ROOT / "data" / "slice.json").read_text())
OUT = ROOT / "data" / "graph_base.json"

KEEP = set(SLICE["mondo"])
XREF_TO_MONDO: dict[str, str] = {}
for mondo_id, node in SLICE["mondo"].items():
    for x in node["xrefs"]:
        if x.startswith(("OMIM:", "Orphanet:")):
            XREF_TO_MONDO.setdefault(x, mondo_id)

HPO_VERSION = next(l.split(": ", 1)[1].strip() for l in (RAW / "phenotype.hpoa").open() if l.startswith("#version"))
ORPHA_VERSION = re.search(r'date="(\d{4}-\d{2}-\d{2})', (RAW / "en_product6.xml").open().read(500)).group(1)

HPO_FREQ_TO_CONF = {  # HPO frequency terms -> confidence that a given patient shows it
    "HP:0040280": 1.0,   # Obligate
    "HP:0040281": 0.9,   # Very frequent 80-99 %
    "HP:0040282": 0.6,   # Frequent 30-79 %
    "HP:0040283": 0.3,   # Occasional 5-29 %
    "HP:0040284": 0.05,  # Very rare 1-4 %
    "HP:0040285": 0.0,   # Excluded
}
ORPHA_FREQ_TO_CONF = {"Obligate (100%)": 1.0, "Very frequent (99-80%)": 0.9, "Frequent (79-30%)": 0.6,
                      "Occasional (29-5%)": 0.3, "Very rare (<4-1%)": 0.05, "Excluded (0%)": 0.0}

nodes: dict[str, dict] = {}
edges: dict[tuple[str, str, str], dict] = {}


def add_node(node_id: str, node_type: str, label: str, **extra) -> None:
    if node_id not in nodes:
        nodes[node_id] = {"id": node_id, "type": node_type, "label": label, **extra}


def add_evidence(source: str, target: str, edge_type: str, evidence: dict) -> None:
    key = (source, target, edge_type)
    stable_id = "e_" + hashlib.sha1(f"{source}|{target}|{edge_type}".encode()).hexdigest()[:8]  # stable across runs, cited by Explain
    edge = edges.setdefault(key, {"id": stable_id, "source": source, "target": target,
                                  "type": edge_type, "evidence": [], "contradicting": []})
    bucket = edge["contradicting"] if evidence.pop("negated", False) else edge["evidence"]
    bucket.append(evidence)


def hpo_labels() -> dict[str, str]:
    graph = json.loads((RAW / "hp.json").read_text())["graphs"][0]
    return {n["id"].rsplit("/", 1)[-1].replace("_", ":"): n.get("lbl", "") for n in graph["nodes"] if "HP_" in n["id"]}


def build_disease_nodes() -> None:
    for mondo_id in sorted(KEEP):
        m = SLICE["mondo"][mondo_id]
        add_node(mondo_id, "disease", m["label"], synonyms=m["synonyms"], xrefs=m["xrefs"],
                 definition=m["definition"], in_core=mondo_id in set(SLICE["core"]))


def build_from_hpoa(hp_label: dict[str, str]) -> None:
    for line in (RAW / "phenotype.hpoa").read_text().splitlines():
        if line.startswith(("#", "database_id")):
            continue
        db_id, name, qualifier, hpo_id, reference, evidence_code, onset, frequency, sex, modifier, aspect, biocuration = line.split("\t")[:12]
        mondo_id = XREF_TO_MONDO.get(db_id.replace("ORPHA:", "Orphanet:"))
        if not mondo_id or aspect != "P":
            continue
        add_node(hpo_id, "phenotype", hp_label.get(hpo_id, hpo_id))
        conf = HPO_FREQ_TO_CONF.get(frequency)
        if conf is None and "/" in frequency:  # e.g. 3/5
            a, b = frequency.split("/")
            conf = round(int(a) / int(b), 2) if int(b) else None
        if conf is None and frequency.endswith("%"):
            conf = round(float(frequency.rstrip("%")) / 100, 2)
        level = "observed" if conf is not None and reference.startswith("PMID:") else ("curated" if conf is not None else "curated")
        url = f"https://pubmed.ncbi.nlm.nih.gov/{reference[5:]}/" if reference.startswith("PMID:") else (
              f"https://omim.org/entry/{db_id[5:]}" if db_id.startswith("OMIM:") else f"https://www.orpha.net/en/disease/detail/{db_id.split(':')[1]}")
        add_evidence(mondo_id, hpo_id, "has_phenotype", {
            "db": "HPO", "origin": db_id.split(":")[0].replace("ORPHA", "Orphanet"), "record": f"{db_id} · {reference}", "url": url, "level": level,
            "date": biocuration.split("[")[-1].rstrip("]") if "[" in biocuration else HPO_VERSION,
            "confidence": conf if conf is not None else 0.5,
            "snippet": f"{name}: {hp_label.get(hpo_id, hpo_id)}" + (f" (frequency {frequency})" if frequency else "") + f" [{evidence_code}]",
            "negated": qualifier == "NOT",
        })


def build_from_genes_to_phenotype() -> None:
    seen: set[tuple[str, str]] = set()
    for line in (RAW / "genes_to_phenotype.txt").read_text().splitlines()[1:]:
        cols = line.split("\t")
        if len(cols) < 6:
            continue
        ncbi_gene_id, symbol, hpo_id, hpo_name, frequency, disease_id = cols[:6]
        mondo_id = XREF_TO_MONDO.get(disease_id.replace("ORPHA:", "Orphanet:"))
        if not mondo_id or (mondo_id, symbol) in seen:
            continue
        seen.add((mondo_id, symbol))
        add_node(symbol, "gene", symbol, ncbi_gene_id=ncbi_gene_id)
        add_evidence(mondo_id, symbol, "caused_by", {
            "db": "HPO", "origin": disease_id.split(":")[0].replace("ORPHA", "Orphanet"), "record": disease_id, "level": "curated", "date": HPO_VERSION, "confidence": 0.9,
            "url": f"https://omim.org/entry/{disease_id[5:]}" if disease_id.startswith("OMIM:") else f"https://hpo.jax.org/browse/disease/{disease_id}",
            "snippet": f"{symbol} is annotated as disease gene of {disease_id} (HPO genes_to_phenotype, {disease_id.split(':')[0].replace('ORPHA', 'Orphanet')}-derived)",
        })


def build_from_orphanet_genes() -> None:
    tree = etree.parse(str(RAW / "en_product6.xml"))
    for disorder in tree.iterfind(".//Disorder"):
        orpha = disorder.findtext("OrphaCode")
        mondo_id = XREF_TO_MONDO.get(f"Orphanet:{orpha}")
        if not mondo_id:
            continue
        for assoc in disorder.iterfind(".//DisorderGeneAssociation"):
            symbol = assoc.findtext(".//Gene/Symbol")
            assoc_type = assoc.findtext(".//DisorderGeneAssociationType/Name") or ""
            status = assoc.findtext(".//DisorderGeneAssociationStatus/Name") or ""
            if not symbol:
                continue
            gene_name = assoc.findtext(".//Gene/Name") or symbol
            add_node(symbol, "gene", symbol, full_name=gene_name)
            causal = "disease-causing" in assoc_type.lower()
            add_evidence(mondo_id, symbol, "caused_by" if causal else "associated_gene", {
                "db": "Orphanet", "origin": "Orphanet", "record": f"ORPHA:{orpha}", "level": "curated", "date": ORPHA_VERSION,
                "url": f"https://www.orpha.net/en/disease/detail/{orpha}",
                "confidence": 0.95 if status == "Assessed" and causal else 0.6,
                "snippet": f"{assoc_type} ({status}) — {gene_name}",
            })


def build_from_orphanet_phenotypes(hp_label: dict[str, str]) -> None:
    tree = etree.parse(str(RAW / "en_product4.xml"))
    for disorder in tree.iterfind(".//Disorder"):
        orpha = disorder.findtext("OrphaCode")
        mondo_id = XREF_TO_MONDO.get(f"Orphanet:{orpha}")
        if not mondo_id:
            continue
        for assoc in disorder.iterfind(".//HPODisorderAssociation"):
            hpo_id = assoc.findtext(".//HPO/HPOId")
            freq = assoc.findtext(".//HPOFrequency/Name") or ""
            if not hpo_id:
                continue
            add_node(hpo_id, "phenotype", hp_label.get(hpo_id, assoc.findtext(".//HPO/HPOTerm") or hpo_id))
            add_evidence(mondo_id, hpo_id, "has_phenotype", {
                "db": "Orphanet", "origin": "Orphanet", "record": f"ORPHA:{orpha}", "level": "curated", "date": ORPHA_VERSION,
                "url": f"https://www.orpha.net/en/disease/detail/{orpha}",
                "confidence": ORPHA_FREQ_TO_CONF.get(freq, 0.5),
                "snippet": f"{hp_label.get(hpo_id, hpo_id)} — {freq}",
                "negated": freq.startswith("Excluded"),
            })


def main() -> int:
    hp_label = hpo_labels()
    build_disease_nodes()
    build_from_hpoa(hp_label)
    build_from_genes_to_phenotype()
    build_from_orphanet_genes()
    build_from_orphanet_phenotypes(hp_label)
    edge_list = list(edges.values())
    for edge in edge_list:  # aggregate confidence: max over evidence, drop edges that only have contradicting evidence
        edge["confidence"] = max((ev["confidence"] for ev in edge["evidence"]), default=0.0)
        edge["independent_sources"] = sorted({ev["origin"] for ev in edge["evidence"]})
        edge["level"] = min((ev["level"] for ev in edge["evidence"]), key=["observed", "curated", "text_mined", "inferred"].index) if edge["evidence"] else "contradicted"
    OUT.write_text(json.dumps({"nodes": list(nodes.values()), "edges": edge_list}, indent=0))
    by_type = defaultdict(int)
    for n in nodes.values():
        by_type[n["type"]] += 1
    by_edge = defaultdict(int)
    for e in edge_list:
        by_edge[e["type"]] += 1
    print(f"nodes {len(nodes)} {dict(by_type)} · edges {len(edge_list)} {dict(by_edge)} → {OUT.relative_to(ROOT)} ({OUT.stat().st_size/1e6:.1f} MB)")
    krabbe = [e for e in edge_list if e["source"] == "MONDO:0009499" and e["type"] == "caused_by"]
    print("Krabbe caused_by:", [(e["target"], e["level"], e["confidence"], len(e["evidence"])) for e in krabbe])
    psap = [e for e in edge_list if e["target"] == "PSAP"]
    print("PSAP diseases:", [(e["source"], nodes[e["source"]]["label"]) for e in psap])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
