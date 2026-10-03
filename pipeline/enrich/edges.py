"""Edge drafts (evidence format of 03_build_graph) from the normalised enrichment records in data/enrich/*.jsonl.

Edge types: studied_in (disease -> NCT), mentioned_in (disease -> PMID, level search_hit), funded_by (disease -> grant),
            in_pathway (gene -> Reactome pathway), target_score (disease -> gene, Open Targets), + gene attribute variant_count.
Edge id = e_ + sha1(source|target|type)[:12], exactly like 03_build_graph (12 hex chars since a63077d). Every evidence carries `origin`; contradicting is always [].
Not merged into the graph here: the nodes/edges/gene_attributes are drafts for the later graph build.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

from .http import now_iso

ROOT = Path(__file__).resolve().parents[2]
ENRICH_DIR = ROOT / "data" / "enrich"
LEVEL_ORDER = ["observed", "curated", "text_mined", "inferred", "search_hit"]  # best first; search_hit = keyword hit, not a fact


def load_jsonl(name: str) -> list[dict]:
    path = ENRICH_DIR / f"{name}.jsonl"
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()] if path.exists() else []


def edge_id(source: str, target: str, edge_type: str) -> str:
    return "e_" + hashlib.sha1(f"{source}|{target}|{edge_type}".encode()).hexdigest()[:12]


class Draft:
    def __init__(self) -> None:
        self.nodes: dict[str, dict] = {}
        self.edges: dict[tuple[str, str, str], dict] = {}

    def node(self, node_id: str, node_type: str, label: str, **extra) -> None:
        self.nodes.setdefault(node_id, {"id": node_id, "type": node_type, "label": label, **extra})

    def evidence(self, source: str, target: str, edge_type: str, evidence: dict) -> None:
        edge = self.edges.setdefault((source, target, edge_type), {"id": edge_id(source, target, edge_type), "source": source, "target": target,
                                                                  "type": edge_type, "evidence": [], "contradicting": []})
        edge["evidence"].append(evidence)


def _short(text: str, limit: int = 280) -> str:
    text = " ".join((text or "").split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _day(value: str | None, fallback: str) -> str:
    value = (value or "")[:10]
    return value if len(value) == 10 else (f"{value}-01" if len(value) == 7 else fallback[:10])


def add_trials(draft: Draft) -> None:
    for trial in load_jsonl("ctgov"):
        nct = trial["nct_id"]
        phase = "/".join(p.replace("PHASE", "Phase ").replace("NA", "N/A").replace("EARLY_Phase ", "Early Phase ") for p in trial["phases"]) or "phase n/a"
        interventions = ", ".join(i["name"] for i in trial["interventions"][:4] if i.get("name"))
        draft.node(nct, "trial", trial["title"] or nct, phases=trial["phases"], status=trial["status"], sponsor=trial["sponsor"],
                   interventions=[i["name"] for i in trial["interventions"] if i.get("name")], conditions=trial["conditions"],
                   start_date=trial["start_date"], completion_date=trial["completion_date"], nct_aliases=trial["nct_aliases"])
        for match in trial["diseases"]:
            draft.evidence(match["mondo_id"], nct, "studied_in", {
                "db": "ClinicalTrials.gov", "origin": "ClinicalTrials.gov", "record": nct, "url": trial["url"], "level": "curated",
                "record_aliases": trial["nct_aliases"], "date": _day(trial["last_update"], trial["retrieved"]),
                "confidence": 0.9 if "conditions" in match["matched_in"] else 0.7,
                "snippet": _short(f"{phase} · {trial['status']} · sponsor {trial['sponsor']}" + (f" · {interventions}" if interventions else "")
                                  + f" · {trial['title']}"),
                "matched_term": match["matched_term"], "matched_in": match["matched_in"], "retrieved": trial["retrieved"][:10]})


def add_papers(draft: Draft) -> None:
    for paper in load_jsonl("europepmc"):
        pmid = f"PMID:{paper['pmid']}"
        draft.node(pmid, "paper", paper["title"], year=paper["year"], journal=paper["journal"], cited_by=paper["cited_by"],
                   authors=[a["name"] for a in paper["authors"] if a.get("name")])
        for match in paper["diseases"]:
            draft.evidence(match["mondo_id"], pmid, "mentioned_in", {
                "db": "Europe PMC", "origin": "Europe PMC", "record": pmid, "url": paper["pubmed_url"], "level": "search_hit",
                "date": _day(paper["pub_date"], paper["retrieved"]), "confidence": 0.4 if "title" in match["matched_in"] else 0.25,
                "snippet": _short(f"Search hit for '{match['matched_term']}' in {' + '.join(match['matched_in'])}: {paper['title']} ({paper['journal']}, {paper['year']})"),
                "matched_term": match["matched_term"], "matched_in": match["matched_in"], "retrieved": paper["retrieved"][:10]})


def add_grants(draft: Draft) -> None:
    for grant in load_jsonl("reporter"):
        core = grant["core_project_num"]
        pi_names = [p["name"] for p in grant["pis"] if p["name"]]
        years = grant["fiscal_years"]
        draft.node(core, "grant", grant["title"] or core, organization=grant["organization"], pis=pi_names, institute=grant["institute"],
                   latest_fiscal_year=grant["latest_fiscal_year"], fiscal_years=years, total_award_fetched=grant["total_award_fetched"])
        for match in grant["diseases"]:
            draft.evidence(match["mondo_id"], core, "funded_by", {
                "db": "NIH RePORTER", "origin": "NIH RePORTER", "record": core, "url": grant["url"], "level": "curated",
                "date": _day(grant["award_notice_date"] or grant["start_date"], grant["retrieved"]),
                "confidence": 0.8 if "title" in match["matched_in"] else 0.5,
                "snippet": _short(f"{grant['title']} · PI {', '.join(pi_names[:3])} · {grant['organization']} · FY {years[0]}-{years[-1]} · "
                                  f"latest award ${grant['latest_award'] or 0:,}"),
                "matched_term": match["matched_term"], "matched_in": match["matched_in"], "retrieved": grant["retrieved"][:10]})


def add_pathways(draft: Draft) -> None:
    for gene in load_jsonl("reactome"):
        symbol = gene["symbol"]
        for pathway in gene["pathways"]:
            draft.node(symbol, "gene", symbol, uniprot=gene["uniprot"])
            draft.node(pathway["st_id"], "mechanism", pathway["name"].strip(), kind="reactome_pathway")
            draft.evidence(symbol, pathway["st_id"], "in_pathway", {
                "db": "Reactome", "origin": "Reactome", "record": pathway["st_id"], "url": pathway["url"], "level": "curated",
                "date": _day(pathway["release_date"], gene["retrieved"]), "confidence": 0.9,
                "snippet": f"{symbol} (UniProt {gene['uniprot']}) is a participant of the Reactome pathway '{pathway['name'].strip()}' (UniProt mapping, human)",
                "retrieved": gene["retrieved"][:10]})


def add_targets(draft: Draft, min_score: float, top: int) -> None:
    for row in load_jsonl("opentargets"):
        if row["score"] < min_score or row["rank"] > top:
            continue
        symbol = row["symbol"]
        draft.node(symbol, "gene", symbol, ensembl_id=row["ensembl_id"], full_name=row["gene_name"])
        datatypes = ", ".join(f"{k} {v:.2f}" for k, v in sorted(row["datatype_scores"].items(), key=lambda kv: -kv[1]))
        draft.evidence(row["mondo_id"], symbol, "target_score", {
            "db": "Open Targets", "origin": "Open Targets", "record": f"{row['ot_disease_id']}/{row['ensembl_id']}", "url": row["url"],
            "level": "curated", "date": row["retrieved"][:10], "confidence": row["score"],
            "snippet": f"overall association score {row['score']:.2f} (rank {row['rank']} of {row['total_associated']}, Open Targets {row['data_version']}, "
                       f"incl. descendant diseases) · datatypes: {datatypes}",
            "datatype_scores": row["datatype_scores"], "retrieved": row["retrieved"][:10]})


def gene_attributes() -> dict[str, dict]:
    attributes: dict[str, dict] = {}
    for row in load_jsonl("clinvar"):
        if row.get("error"):
            continue
        attributes[row["symbol"]] = {"variant_count": {
            "db": "ClinVar", "pathogenic": row["pathogenic"], "likely_pathogenic": row["likely_pathogenic"],
            "pathogenic_or_likely": row["pathogenic_or_likely"], "total_variants": row["total_variants"], "query": row["query"],
            "url": row["search_url"], "retrieved": row["retrieved"][:10]}}
    return attributes


def build(scope: str, min_score: float = 0.2, top: int = 15) -> dict:
    draft = Draft()
    add_trials(draft)
    add_papers(draft)
    add_grants(draft)
    add_pathways(draft)
    add_targets(draft, min_score, top)
    edges = list(draft.edges.values())
    for edge in edges:  # same aggregates as 03_build_graph
        edge["confidence"] = max(ev["confidence"] for ev in edge["evidence"])
        edge["independent_sources"] = sorted({ev["origin"] for ev in edge["evidence"]})
        edge["level"] = min((ev["level"] for ev in edge["evidence"]), key=LEVEL_ORDER.index)
    ids = Counter(e["id"] for e in edges)
    attributes = gene_attributes()
    return {
        "meta": {"generated": now_iso(), "scope_of_last_run": scope, "note": "drafts only, not merged into graph_base.json; level 'search_hit' is not a fact "
                 "(upgrade to text_mined only after the extract step); level order: " + " > ".join(LEVEL_ORDER),
                 "edge_counts": dict(Counter(e["type"] for e in edges)), "level_counts": dict(Counter(e["level"] for e in edges)),
                 "node_counts": dict(Counter(n["type"] for n in draft.nodes.values())), "genes_with_variant_count": len(attributes),
                 "opentargets_filter": {"min_score": min_score, "top": top},
                 "edge_id_collisions": sorted(i for i, n in ids.items() if n > 1)},
        "nodes": list(draft.nodes.values()), "edges": edges, "gene_attributes": attributes}
